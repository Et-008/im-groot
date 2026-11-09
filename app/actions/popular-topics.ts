'use server'

import { getJson } from "serpapi"
import { unstable_cache } from "next/cache"

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

const getCachedPopularTopics = unstable_cache(
    async (apiKey: string): Promise<string[]> => {
        const response = await getJson({
            engine: "google_trends_trending_now",
            geo: "US",
            api_key: apiKey,
        })

        const trendingSearches: unknown = response.trending_searches
        if (!Array.isArray(trendingSearches)) return []

        return trendingSearches.flatMap((trend: unknown) =>
            isRecord(trend) && typeof trend.query === "string" ? [trend.query] : []
        )
    },
    ["google-trends-trending-now-us"],
    { revalidate: 60 * 60 * 24, tags: ["popular-topics"] }
)

export async function getPopularTopics(page = 1, pageSize = 6) {
    if (!Number.isSafeInteger(page) || page < 1) {
        throw new Error("Page must be a positive integer")
    }

    if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 50) {
        throw new Error("Page size must be an integer between 1 and 50")
    }

    const apiKey = process.env.SERPAPI_API_KEY
    if (!apiKey) {
        throw new Error("SERPAPI_API_KEY is not configured")
    }

    const allTopics = await getCachedPopularTopics(apiKey)
    const start = (page - 1) * pageSize
    const total = allTopics.length

    return {
        topics: allTopics.slice(start, start + pageSize),
        page,
        pageSize,
        total,
        hasNext: start + pageSize < total,
    }
}