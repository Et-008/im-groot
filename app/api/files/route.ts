
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

export async function GET() {
  const linksFile = join(process.cwd(), "data", "links.json")
  let savedLinks: unknown

  try {
    savedLinks = JSON.parse(await readFile(linksFile, "utf8"))
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return Response.json({ links: [] })
    }

    return Response.json({ error: "Could not read saved links" }, { status: 500 })
  }

  if (!Array.isArray(savedLinks) || !savedLinks.every((link) => typeof link === "string")) {
    return Response.json({ error: "Saved links file has an invalid format" }, { status: 500 })
  }

  const links = savedLinks.map((url: string) => {
    try {
      const parsedUrl = new URL(url)
      const name = parsedUrl.pathname.split("/").filter(Boolean).pop() ?? parsedUrl.hostname

      return { url, name, tags: [] as string[] }
    } catch {
      return { url, name: url, tags: [] as string[] }
    }
  })

  return Response.json({ links })
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 })
  }

  if (
    !Array.isArray(body) ||
    !body.every((link): link is string => {
      if (typeof link !== "string") return false

      try {
        const url = new URL(link)
        return url.protocol === "http:" || url.protocol === "https:"
      } catch {
        return false
      }
    })
  ) {
    return Response.json(
      { error: "Request body must be an array of HTTP or HTTPS links" },
      { status: 400 }
    )
  }

  const dataDirectory = join(process.cwd(), "data")
  await mkdir(dataDirectory, { recursive: true })
  await writeFile(
    join(dataDirectory, "links.json"),
    `${JSON.stringify(body, null, 2)}\n`,
    "utf8"
  )

  return Response.json({ saved: body.length }, { status: 201 })
}
