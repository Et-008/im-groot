'use server'

import { randomUUID } from "node:crypto"
import { mkdir, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"

type ResearchMode = "web" | "academic" | "news"

export type ResearchDiscussion = {
    link: string
    [key: string]: unknown
}

export type ResearchImage = {
    original?: string
    source?: string
    [key: string]: unknown
}

type ResearchEntry = {
    folderName: string
    title: string
    query: string
    createdAt: string
    status: string
    files: ResearchFile[]
    youtubeVideos: string[]
    researchId: string | null
    discussions?: ResearchDiscussion[]
    images?: ResearchImage[]
}

export type ResearchFile = {
    file: string
    version: number
    name: string
    createdAt: string
}

type ResearchMetadata = {
    researchId: string | null
    title: string
    query: string
    researchMode: ResearchMode
    createdAt: string
    updatedAt: string
    status: string
    files: ResearchFile[]
    "yt-videos": string[]
    "discussions"?: ResearchDiscussion[]
    "images"?: ResearchImage[]
}

function isResearchMode(value: unknown): value is ResearchMode {
    return typeof value === "string" && ["web", "academic", "news"].includes(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null
}

function isResearchFile(value: unknown): value is ResearchFile {
    return isRecord(value) &&
        typeof value.file === "string" &&
        Number.isSafeInteger(value.version) &&
        typeof value.name === "string" &&
        typeof value.createdAt === "string"
}



function isResearchFileArray(value: unknown): value is ResearchFile[] {
    return Array.isArray(value) && value.every(isResearchFile)
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((entry): entry is string => typeof entry === "string")
}

function isResearchDiscussion(value: unknown): value is ResearchDiscussion {
    return isRecord(value) && typeof value.link === "string"
}

function isResearchImage(value: unknown): value is ResearchImage {
    return isRecord(value) &&
        (typeof value.original === "string" || typeof value.source === "string")
}

function parseResearchMetadata(value: unknown): ResearchMetadata {
    if (
        !isRecord(value) ||
        (value.researchId !== undefined &&
            value.researchId !== null &&
            typeof value.researchId !== "string") ||
        typeof value.title !== "string" ||
        typeof value.query !== "string" ||
        !isResearchMode(value.researchMode) ||
        typeof value.createdAt !== "string" ||
        typeof value.updatedAt !== "string" ||
        typeof value.status !== "string" ||
        (value.files !== undefined && !isResearchFileArray(value.files)) ||
        (value["yt-videos"] !== undefined && !isStringArray(value["yt-videos"])) ||
        (value.discussions !== undefined &&
            (!Array.isArray(value.discussions) || !value.discussions.every(isResearchDiscussion))) ||
        (value.images !== undefined &&
            (!Array.isArray(value.images) || !value.images.every(isResearchImage)))
    ) {
        throw new Error("Research metadata has an invalid format.")
    }

    return {
        researchId: typeof value.researchId === "string" ? value.researchId : null,
        title: value.title,
        query: value.query,
        researchMode: value.researchMode,
        createdAt: value.createdAt,
        updatedAt: value.updatedAt,
        status: value.status,
        files: value.files ?? [],
        "yt-videos": isStringArray(value["yt-videos"]) ? value["yt-videos"] : [],
        discussions: Array.isArray(value.discussions) && value.discussions.every(isResearchDiscussion)
            ? value.discussions
            : [],
        images: Array.isArray(value.images) && value.images.every(isResearchImage)
            ? value.images
            : [],
    }
}

function parseMetadataRawValue(frontMatter: string, key: string): string | null {
    const line = frontMatter.split(/\r?\n/).find((entry) => entry.startsWith(`${key}:`))
    if (!line) return null

    return line.slice(key.length + 1).trim() || null
}

function parseMetadataValue(frontMatter: string, key: string): string | null {
    const value = parseMetadataRawValue(frontMatter, key)
    if (!value) return null
    try {
        const parsed: unknown = JSON.parse(value)
        return typeof parsed === "string" ? parsed : null
    } catch {
        return value || null
    }
}

function parseLegacyResearchMetadata(content: string): ResearchMetadata {
    const frontMatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1]
    if (!frontMatter) throw new Error("Research metadata has an invalid format.")

    const filesValue = parseMetadataRawValue(frontMatter, "files")
    let files: unknown = []
    if (filesValue) files = JSON.parse(filesValue)
    const title = parseMetadataValue(frontMatter, "title")
    const createdAt = parseMetadataValue(frontMatter, "createdAt")

    return parseResearchMetadata({
        researchId: parseMetadataValue(frontMatter, "researchId"),
        title,
        query: parseMetadataValue(frontMatter, "query") || title,
        researchMode: parseMetadataValue(frontMatter, "researchMode"),
        createdAt,
        updatedAt: parseMetadataValue(frontMatter, "updatedAt") || createdAt,
        status: parseMetadataValue(frontMatter, "status") || "In Progress",
        files,
        "yt-videos": parseMetadataRawValue(frontMatter, "yt-videos")
            ? JSON.parse(parseMetadataRawValue(frontMatter, "yt-videos")!)
            : [],
        "discussions": parseMetadataRawValue(frontMatter, "discussions")
            ? JSON.parse(parseMetadataRawValue(frontMatter, "discussions")!)
            : [],
        "images": parseMetadataRawValue(frontMatter, "images")
            ? JSON.parse(parseMetadataRawValue(frontMatter, "images")!)
            : [],
    })
}

async function readResearchMetadata(folderPath: string): Promise<ResearchMetadata> {
    try {
        const content = await readFile(join(folderPath, "metadata.json"), "utf8")
        return parseResearchMetadata(JSON.parse(content))
    } catch (error) {
        if (
            typeof error !== "object" ||
            error === null ||
            !("code" in error) ||
            error.code !== "ENOENT"
        ) {
            throw error
        }
    }

    const legacyContent = await readFile(join(folderPath, "metadata.md"), "utf8")
    return parseLegacyResearchMetadata(legacyContent)
}

async function writeResearchMetadata(folderPath: string, metadata: ResearchMetadata): Promise<void> {
    const metadataPath = join(folderPath, "metadata.json")
    const temporaryMetadataPath = join(folderPath, `.metadata-${randomUUID()}.tmp`)

    try {
        await writeFile(temporaryMetadataPath, `${JSON.stringify(metadata, null, 2)}\n`, {
            encoding: "utf8",
            flag: "wx",
        })
        await rename(temporaryMetadataPath, metadataPath)
    } catch {
        await unlink(temporaryMetadataPath).catch(() => undefined)
        throw new Error("Could not save the research metadata.")
    }
}

export async function getResearches(): Promise<ResearchEntry[]> {
    const researchDirectory = join(homedir(), "Documents", "groot", "research")
    let directories

    try {
        directories = await readdir(researchDirectory, { withFileTypes: true })
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "ENOENT"
        ) {
            return []
        }

        throw new Error("Could not read the local research folder.")
    }

    const entries = await Promise.all(
        directories
            .filter((directory) => directory.isDirectory())
            .map(async (directory): Promise<ResearchEntry | null> => {
                try {
                    const metadata = await readResearchMetadata(join(researchDirectory, directory.name))
                    if (!metadata.title || Number.isNaN(Date.parse(metadata.createdAt))) return null

                    return {
                        folderName: directory.name,
                        title: metadata.title,
                        query: metadata.query || metadata.title,
                        createdAt: metadata.createdAt,
                        status: metadata.status || "In Progress",
                        researchId: metadata.researchId || null,
                        files: metadata.files || [],
                        youtubeVideos: metadata["yt-videos"],
                        discussions: metadata["discussions"] || [],
                        images: metadata["images"] || [],
                    }
                } catch {
                    return null
                }
            })
    )

    return entries
        .filter((entry): entry is ResearchEntry => entry !== null)
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
}

export async function getResearchById(researchId: string): Promise<ResearchEntry | null> {
    const researches = await getResearches()
    return researches.find((entry) => entry.researchId === researchId) || null
}

export async function getResearchFile(researchId: string, filename: string): Promise<string> {
    if (!researchId.trim() || !filename.trim() || /[\\/]/.test(filename) || filename === "." || filename === "..") {
        throw new Error("A valid research ID and filename are required.")
    }

    const research = await getResearchById(researchId)
    if (!research) throw new Error("Research folder not found.")
    if (!research.files.some((file) => file.file === filename)) {
        throw new Error("Research file not found.")
    }

    const folderPath = join(homedir(), "Documents", "groot", "research", research.folderName)
    try {
        return await readFile(join(folderPath, filename), "utf8")
    } catch {
        throw new Error("Could not read the research file.")
    }
}

export async function getResearchNotes(researchId: string): Promise<string> {
    if (!researchId.trim()) {
        throw new Error("A valid research ID is required.")
    }

    const research = await getResearchById(researchId)
    if (!research) throw new Error("Research folder not found.")

    const notesPath = join(
        homedir(),
        "Documents",
        "groot",
        "research",
        research.folderName,
        "notes.txt"
    )

    try {
        return await readFile(notesPath, "utf8")
    } catch (error) {
        if (
            typeof error !== "object" ||
            error === null ||
            !("code" in error) ||
            error.code !== "ENOENT"
        ) {
            throw new Error("Could not read the research notes.")
        }
    }

    try {
        await writeFile(notesPath, "", { encoding: "utf8", flag: "wx" })
        return ""
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "EEXIST"
        ) {
            return readFile(notesPath, "utf8")
        }

        throw new Error("Could not create the research notes file.")
    }
}

export async function saveResearchNotes(researchId: string, content: string): Promise<void> {
    if (!researchId.trim() || typeof content !== "string") {
        throw new Error("A valid research ID and notes content are required.")
    }

    const research = await getResearchById(researchId)
    if (!research) throw new Error("Research folder not found.")

    const folderPath = join(homedir(), "Documents", "groot", "research", research.folderName)
    const notesPath = join(folderPath, "notes.txt")
    const temporaryNotesPath = join(folderPath, `.notes-${randomUUID()}.tmp`)

    try {
        await writeFile(temporaryNotesPath, content, { encoding: "utf8", flag: "wx" })
        await rename(temporaryNotesPath, notesPath)
    } catch {
        await unlink(temporaryNotesPath).catch(() => undefined)
        throw new Error("Could not save the research notes.")
    }
}

export async function saveResearchProperties(
    researchId: string,
    propertyObject: Partial<ResearchMetadata>
): Promise<void> {
    if (!researchId.trim()) {
        throw new Error("A valid research ID and value list are required.")
    }

    if (!!propertyObject && Object.getPrototypeOf(propertyObject) !== Object.prototype) {
        throw new Error("Property values must be arrays of strings.")
    }

    const research = await getResearchById(researchId)
    if (!research) throw new Error("Research folder not found.")

    const folderPath = join(homedir(), "Documents", "groot", "research", research.folderName)
    const metadata = await readResearchMetadata(folderPath)

    await writeResearchMetadata(folderPath, {
        ...metadata,
        updatedAt: new Date().toISOString(),
        ...propertyObject
    })
}

export async function saveResearchProperty(
    researchId: string,
    property: "yt-videos" | "discussions" | "images",
    values: unknown[]
): Promise<void> {
    const isValidValues = property === "yt-videos"
        ? isStringArray(values)
        : property === "discussions"
            ? values.every(isResearchDiscussion)
            : values.every(isResearchImage)

    if (!researchId.trim() || !isValidValues) {
        throw new Error("A valid research ID and value list are required.")
    }

    const research = await getResearchById(researchId)
    if (!research) throw new Error("Research folder not found.")

    const folderPath = join(homedir(), "Documents", "groot", "research", research.folderName)
    const metadata = await readResearchMetadata(folderPath)

    const updatedAt = new Date().toISOString()
    if (property === "yt-videos" && isStringArray(values)) {
        await writeResearchMetadata(folderPath, { ...metadata, updatedAt, "yt-videos": values })
    } else if (property === "discussions" && values.every(isResearchDiscussion)) {
        await writeResearchMetadata(folderPath, { ...metadata, updatedAt, discussions: values })
    } else if (property === "images" && values.every(isResearchImage)) {
        await writeResearchMetadata(folderPath, { ...metadata, updatedAt, images: values })
    }
}

export async function saveResearchResponse(researchId: string, content: string): Promise<ResearchFile> {
    if (!researchId.trim() || !content.trim() || Buffer.byteLength(content, "utf8") > 5 * 1024 * 1024) {
        throw new Error("A research ID and non-empty response under 5 MB are required.")
    }

    const research = await getResearchById(researchId)
    if (!research) throw new Error("Research folder not found.")

    const folderPath = join(homedir(), "Documents", "groot", "research", research.folderName)
    const metadata = await readResearchMetadata(folderPath)

    const name = "Research overview"
    const version = Math.max(0, ...metadata.files
        .filter((entry: ResearchFile) => entry.name === name)
        .map((entry: ResearchFile) => entry.version)) + 1
    const createdAt = new Date().toISOString()
    const fileEntry: ResearchFile = {
        file: `research-overview-v${version}.md`,
        version,
        name,
        createdAt,
    }
    const responsePath = join(folderPath, fileEntry.file)

    await writeFile(responsePath, `${content.trimEnd()}\n`, { encoding: "utf8", flag: "wx" })

    const latestMetadata = await readResearchMetadata(folderPath)

    const updatedMetadata = {
        ...latestMetadata,
        updatedAt: createdAt,
        files: [...latestMetadata.files, fileEntry],
    }

    console.log("updatedMetadata", updatedMetadata, metadata, "metadata", latestMetadata, "latestMetadata")

    try {
        await writeResearchMetadata(folderPath, updatedMetadata)
    } catch {
        await unlink(responsePath).catch(() => undefined)
        throw new Error("Could not save the research response metadata.")
    }

    return fileEntry
}

export async function createResearchFolder(query: string, researchMode: ResearchMode) {
    const title = query.trim()
    const folderName = title.replace(/[\\/\u0000]/g, "-")
    const randomId = Math.random().toString(36).substring(2, 10);

    if (
        !title ||
        title.length > 200 ||
        /[\u0000-\u001f\u007f]/.test(title) ||
        Buffer.byteLength(folderName, "utf8") > 200
    ) {
        throw new Error("Research topics must be between 1 and 200 characters.")
    }

    if (folderName === "." || folderName === "..") {
        throw new Error("This topic cannot be used as a folder name.")
    }

    if (!["web", "academic", "news"].includes(researchMode)) {
        throw new Error("Choose a valid research type.")
    }

    const researchRoot = join(homedir(), "Documents", "groot", "research")
    const folderPath = join(researchRoot, folderName)
    const createdAt = new Date().toISOString()

    await mkdir(researchRoot, { recursive: true })
    try {
        await mkdir(folderPath)
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "EEXIST"
        ) {
            throw new Error("A research folder for this topic already exists.")
        }

        throw new Error("Could not create the research folder.")
    }

    const metadata: ResearchMetadata = {
        researchId: randomId,
        title: title.slice(0, 50),
        query: title,
        researchMode,
        createdAt,
        updatedAt: createdAt,
        status: "In-Progress",
        files: [],
        "yt-videos": [],
    }

    try {
        await writeFile(join(folderPath, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`, {
            encoding: "utf8",
            flag: "wx",
        })
    } catch {
        throw new Error("Could not write the research metadata file.")
    }

    return { folderName, createdAt, researchId: randomId }
}