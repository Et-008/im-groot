'use server'

import { lookup } from "node:dns/promises"
import { request as httpRequest } from "node:http"
import { isIP } from "node:net"
import { request as httpsRequest } from "node:https"
import type { LookupAddress } from "node:dns"

const MAX_PAGE_BYTES = 2 * 1024 * 1024
const MAX_REDIRECTS = 5
const REQUEST_TIMEOUT_MS = 10_000

function isPublicIp(address: string): boolean {
    const family = isIP(address)

    if (family === 4) {
        const [a, b] = address.split(".").map(Number)
        return !(
            a === 0 || a === 10 || a === 127 || a >= 224 ||
            (a === 100 && b >= 64 && b <= 127) ||
            (a === 169 && b === 254) ||
            (a === 172 && b >= 16 && b <= 31) ||
            (a === 192 && (b === 0 || b === 168)) ||
            (a === 198 && (b === 18 || b === 19 || b === 51)) ||
            (a === 203 && b === 0)
        )
    }

    if (family === 6) {
        const [first, second] = address.split(":").map((part) => parseInt(part || "0", 16))
        return first >= 0x2000 && first <= 0x3fff &&
            !(first === 0x2001 && second <= 0x1ff) &&
            !(first === 0x2001 && second === 0x0db8) &&
            first !== 0x2002 &&
            first !== 0x3fff
    }

    return false
}

async function validatePageUrl(url: URL): Promise<LookupAddress[]> {
    if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        (url.port && url.port !== (url.protocol === "https:" ? "443" : "80"))
    ) {
        throw new Error("Only public HTTP or HTTPS page URLs are allowed.")
    }

    const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase()
    if (
        hostname === "localhost" ||
        hostname.endsWith(".localhost") ||
        hostname.endsWith(".local") ||
        hostname.endsWith(".internal")
    ) {
        throw new Error("Local and internal hosts are not allowed.")
    }

    const family = isIP(hostname)
    const addresses = family
        ? [{ address: hostname, family }]
        : await lookup(hostname, { all: true, verbatim: true })

    if (addresses.length === 0 || !addresses.every(({ address }) => isPublicIp(address))) {
        throw new Error("Only publicly reachable web pages are allowed.")
    }

    return addresses
}

function requestPage(
    url: URL,
    address: LookupAddress
): Promise<{ statusCode: number; location?: string; contentType?: string; html: string }> {
    return new Promise((resolve, reject) => {
        const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(
            url,
            {
                headers: { accept: "text/html,application/xhtml+xml" },
                lookup: (_hostname, _options, callback) => {
                    callback(null, address.address, address.family)
                },
            },
            (response) => {
                const statusCode = response.statusCode ?? 0
                const location = response.headers.location
                const contentType = response.headers["content-type"]

                if (statusCode >= 300 && statusCode < 400 && location) {
                    response.resume()
                    resolve({ statusCode, location, contentType, html: "" })
                    return
                }

                if (statusCode !== 200) {
                    response.resume()
                    reject(new Error(`Page request failed with status ${statusCode}.`))
                    return
                }

                if (!contentType?.toLowerCase().includes("text/html") &&
                    !contentType?.toLowerCase().includes("application/xhtml+xml")) {
                    response.resume()
                    reject(new Error("The requested URL did not return an HTML page."))
                    return
                }

                const chunks: Buffer[] = []
                let totalBytes = 0

                response.on("data", (chunk: Buffer) => {
                    totalBytes += chunk.length
                    if (totalBytes > MAX_PAGE_BYTES) {
                        request.destroy(new Error("The page exceeds the 2 MB size limit."))
                        return
                    }
                    chunks.push(chunk)
                })
                response.on("end", () => {
                    resolve({
                        statusCode,
                        location,
                        contentType,
                        html: Buffer.concat(chunks).toString("utf8"),
                    })
                })
                response.on("error", reject)
            }
        )

        const totalTimeout = setTimeout(() => {
            request.destroy(new Error("The page request timed out."))
        }, REQUEST_TIMEOUT_MS)
        request.on("close", () => clearTimeout(totalTimeout))
        request.setTimeout(REQUEST_TIMEOUT_MS, () => {
            request.destroy(new Error("The page request timed out."))
        })
        request.on("error", reject)
        request.end()
    })
}

export async function fetchPage(input: string): Promise<string> {
    if (typeof input !== "string" || input.length > 2048) {
        throw new Error("A valid page URL under 2048 characters is required.")
    }

    let url: URL
    try {
        url = new URL(input)
    } catch {
        throw new Error("A valid page URL is required.")
    }

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
        const addresses = await validatePageUrl(url)
        const response = await requestPage(url, addresses[0])

        if (response.location) {
            if (redirectCount === MAX_REDIRECTS) {
                throw new Error("The page exceeded the redirect limit.")
            }
            url = new URL(response.location, url)
            continue
        }

        const htmlWithoutBase = response.html.replace(/<base\b[^>]*>/i, "")
        const baseTag = `<base href="${url.href}">`
        const headTag = /<head\b[^>]*>/i
        const htmlTag = /<html\b[^>]*>/i

        if (headTag.test(htmlWithoutBase)) {
            return htmlWithoutBase.replace(headTag, (head) => `${head}${baseTag}`)
        }
        if (htmlTag.test(htmlWithoutBase)) {
            return htmlWithoutBase.replace(htmlTag, (html) => `${html}${baseTag}`)
        }
        return `${baseTag}${htmlWithoutBase}`
    }

    throw new Error("Could not fetch the requested page.")
}