'use server'

import { randomUUID } from "node:crypto"
import { readFile, rename, unlink, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import { getJson } from "serpapi"
import {
    getResearchById,
    ResearchDiscussion,
    ResearchImage,
    saveResearchProperty,
    saveResearchProperties,
} from "./research"

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isResearchDiscussion(value: unknown): value is ResearchDiscussion {
    return isRecord(value) && typeof value.link === "string" && value.link.trim().length > 0
}

function isResearchImage(value: unknown): value is ResearchImage {
    return isRecord(value) &&
        typeof value.source === "string" &&
        value.source.trim().length > 0
}

export async function fetchRelatedNews(
    researchId: string
): Promise<{ discussions: ResearchDiscussion[]; images: ResearchImage[] }> {
    if (!researchId.trim()) {
        throw new Error("A research ID is required.")
    }

    const research = await getResearchById(researchId)
    if (!research) {
        throw new Error("Research folder not found.")
    }

    const apiKey = process.env.SERPAPI_API_KEY
    if (!apiKey) {
        throw new Error("SERPAPI_API_KEY is not configured")
    }

    const response = await getJson({
        q: research.query,
        location: "Austin, TX, Texas, United States",
        hl: "en",
        gl: "us",
        device: "mobile",
        api_key: apiKey
    });

    if (!isRecord(response)) {
        throw new Error("Google search returned an invalid response.")
    }

    if (typeof response.error === "string") {
        throw new Error(`Google search failed: ${response.error}`)
    }

    const discussionsAndForums = response.discussions_and_forums || []
    const inlineImages = response.inline_images || []

    if (!Array.isArray(discussionsAndForums) || !Array.isArray(inlineImages)) {
        throw new Error("Google search returned an invalid discussions and forums list.")
    }

    const discussions = discussionsAndForums.flatMap((discussion: unknown) =>
        isResearchDiscussion(discussion)
            ? [discussion]
            : []
    )

    const images = inlineImages.flatMap((image: unknown) =>
        isResearchImage(image)
            ? [image]
            : []
    )

    await saveResearchProperties(researchId, { discussions, images })
    return { discussions, images }
}

export async function fetchRelatedVideos(researchId: string): Promise<string[]> {
    if (!researchId.trim()) {
        throw new Error("A research ID is required.")
    }

    const research = await getResearchById(researchId)
    if (!research) {
        throw new Error("Research folder not found.")
    }

    const apiKey = process.env.SERPAPI_API_KEY
    if (!apiKey) {
        throw new Error("SERPAPI_API_KEY is not configured")
    }

    const response = await getJson({
        engine: "youtube",
        search_query: research.query,
        api_key: apiKey,
    })

    if (!isRecord(response)) {
        throw new Error("YouTube search returned an invalid response.")
    }
    if (typeof response.error === "string") {
        throw new Error(`YouTube search failed: ${response.error}`)
    }
    if (!Array.isArray(response.video_results)) {
        throw new Error("YouTube search returned an invalid video list.")
    }

    const videos = response.video_results.flatMap((video: unknown) =>
        isRecord(video) && typeof video.video_id === "string" && video.video_id.trim()
            ? [video.video_id]
            : []
    )

    await saveResearchProperty(researchId, "yt-videos", videos)
    return videos
}

async function deleteRelatedItem(
    researchId: string,
    type: "video" | "discussion" | "image",
    identifier: string
): Promise<void> {
    if (!researchId.trim() || !identifier.trim()) {
        throw new Error("A research ID and item identifier are required.")
    }

    const research = await getResearchById(researchId)
    if (!research) {
        throw new Error("Research folder not found.")
    }

    let property: "yt-videos" | "discussions" | "images"
    let items: unknown

    switch (type) {
        case "video":
            property = "yt-videos"
            items = research.youtubeVideos
            break
        case "discussion":
            property = "discussions"
            items = research.discussions
            break
        case "image":
            property = "images"
            items = research.images
            break
        default:
            throw new Error("Choose a valid related item type.")
    }

    if (!Array.isArray(items)) {
        throw new Error("The research metadata has an invalid related items list.")
    }

    const matchesIdentifier = (item: unknown) => {
        if (type === "video") {
            return item === identifier
        }

        if (!isRecord(item)) return false

        if (type === "discussion") {
            return item.link === identifier
        }

        return item.original === identifier || item.source === identifier
    }

    const deletedItems = items.filter(matchesIdentifier)

    if (deletedItems.length === 0) {
        throw new Error("Related item not found.")
    }

    const folderPath = join(homedir(), "Documents", "groot", "research", research.folderName)
    const archivePath = join(folderPath, "deletedItems.json")
    let archivedItems: unknown[] = []

    try {
        const archiveContent = await readFile(archivePath, "utf8")
        const parsedArchive: unknown = JSON.parse(archiveContent)
        if (!Array.isArray(parsedArchive)) {
            throw new Error("Deleted items archive has an invalid format.")
        }
        archivedItems = parsedArchive
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

    const updatedArchive = [
        ...archivedItems,
        ...deletedItems.map((item) => ({
            type,
            identifier,
            deletedAt: new Date().toISOString(),
            item,
        })),
    ]
    const temporaryArchivePath = join(folderPath, `.deletedItems-${randomUUID()}.tmp`)

    try {
        await writeFile(temporaryArchivePath, `${JSON.stringify(updatedArchive, null, 2)}\n`, {
            encoding: "utf8",
            flag: "wx",
        })
        await rename(temporaryArchivePath, archivePath)
    } catch {
        await unlink(temporaryArchivePath).catch(() => undefined)
        throw new Error("Could not archive the deleted research item.")
    }

    const remainingItems = items.filter((item: unknown) => !matchesIdentifier(item))
    await saveResearchProperty(researchId, property, remainingItems)
}

export async function deleteRelatedVideo(researchId: string, videoId: string): Promise<void> {
    await deleteRelatedItem(researchId, "video", videoId)
}

export async function deleteRelatedDiscussion(researchId: string, discussionLink: string): Promise<void> {
    await deleteRelatedItem(researchId, "discussion", discussionLink)
}

export async function deleteRelatedImage(researchId: string, imageUrl: string): Promise<void> {
    await deleteRelatedItem(researchId, "image", imageUrl)
}
