'use client'

import { Button } from "@/components/ui/button"
import { ArrowDownRight, ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, Compass, Globe2, GraduationCap, Newspaper, Search } from "lucide-react"
import { type FormEvent, useEffect, useState } from "react"
import { createResearchFolder } from "@/app/actions/research"
import { getPopularTopics } from "@/app/actions/popular-topics"

const researchModes = {
    web: {
        label: "Draft",
        // label: "Explore the web",
        description: "Get a broad first look",
        icon: Globe2,
        action: "https://www.google.com/search",
    },
    academic: {
        label: "Casual research",
        // label: "Find academic work",
        description: "Search papers and citations",
        icon: GraduationCap,
        action: "https://scholar.google.com/scholar",
    },
    news: {
        label: "In-depth research",
        // label: "Follow the latest",
        description: "See recent reporting",
        icon: Newspaper,
        action: "https://news.google.com/search",
    },
} as const

type ResearchMode = keyof typeof researchModes
type PopularTopicsResponse = {
    topics: string[]
    page: number
    pageSize: number
    total: number
    hasNext: boolean
}

const topicsPageSize = 6

// const popularTopics = [
//     "AI in education",
//     "Climate-resilient cities",
//     "The future of sleep",
//     "Ocean biodiversity",
//     "Battery recycling",
//     "How habits are formed",
// ]

const researchGuides = [
    {
        title: "Plan your research",
        description: "A practical overview of the research process.",
        href: "https://owl.purdue.edu/owl/research_and_citation/conducting_research/index.html",
    },
    {
        title: "Search scholarly literature",
        description: "Tips for finding papers with Google Scholar.",
        href: "https://scholar.google.com/intl/en/scholar/help.html",
    },
    {
        title: "Evaluate your sources",
        description: "Check credibility, evidence, and context.",
        href: "https://owl.purdue.edu/owl/research_and_citation/conducting_research/evaluating_sources_of_information/index.html",
    },
]

export default function NewResearch() {
    const [popularTopicsResponse, setPopularTopicsResponse] = useState<PopularTopicsResponse>({
        topics: [],
        page: 1,
        pageSize: topicsPageSize,
        total: 0,
        hasNext: false,
    })
    const [topicPage, setTopicPage] = useState(1)
    const [isLoadingTopics, setIsLoadingTopics] = useState(true)
    const [topicsError, setTopicsError] = useState(false)
    const [query, setQuery] = useState("")
    const [mode, setMode] = useState<ResearchMode>("web")
    const [isCreatingResearch, setIsCreatingResearch] = useState(false)
    const [createResearchError, setCreateResearchError] = useState<string | null>(null)
    const selectedMode = researchModes[mode]

    async function handleStartResearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const title = query.trim()
        if (!title) return

        setIsCreatingResearch(true)
        setCreateResearchError(null)

        try {
            const { researchId } = await createResearchFolder(title, mode)

            window.location.assign(`/research/${researchId}/edit`)
        } catch (error) {
            setCreateResearchError(
                error instanceof Error ? error.message : "Could not create the research folder."
            )
        } finally {
            setIsCreatingResearch(false)
        }
    }

    useEffect(() => {
        let isCurrent = true

        setIsLoadingTopics(true)
        setTopicsError(false)

        getPopularTopics(topicPage, topicsPageSize)
            .then((response) => {
                if (isCurrent) setPopularTopicsResponse(response)
            })
            .catch(() => {
                if (isCurrent) setTopicsError(true)
            })
            .finally(() => {
                if (isCurrent) setIsLoadingTopics(false)
            })

        return () => {
            isCurrent = false
        }
    }, [topicPage])

    return (
        <main className="min-h-screen bg-brand-canvas text-brand-forest">

            <div className="mx-auto grid max-w-[1440px] gap-12 px-5 pb-16 pt-9 sm:px-8 md:pt-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16 lg:px-12 lg:pb-20">
                <section aria-labelledby="page-title" className="min-w-0 scroll-auto">
                    <p className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-brand-moss">
                        <Compass size={15} aria-hidden="true" />
                        Start with a question
                    </p>
                    <h1 id="page-title" className="max-w-3xl text-4xl leading-[1.05] font-medium sm:text-5xl lg:text-6xl">
                        What are you curious about?
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-brand-muted sm:text-lg">
                        Follow a hunch, explore a new field, or get to the bottom of something you have always wondered about.
                    </p>

                    {/* <fieldset className="mt-9">
                        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-brand-muted">
                            Mode
                        </legend>
                        <div className="grid gap-2 sm:grid-cols-3">
                            {(Object.keys(researchModes) as ResearchMode[]).map((modeKey) => {
                                const option = researchModes[modeKey]
                                const Icon = option.icon
                                const isSelected = mode === modeKey

                                return (
                                    <button
                                        key={modeKey}
                                        type="button"
                                        role="radio"
                                        aria-checked={isSelected}
                                        onClick={() => setMode(modeKey)}
                                        className={`flex min-h-[76px] items-start gap-3 border-b-2 px-3 py-3 text-left transition-colors ${isSelected
                                            ? "border-brand-moss-strong bg-brand-soft"
                                            : "border-transparent hover:bg-brand-soft-hover"
                                            }`}
                                    >
                                        <Icon className="mt-0.5 shrink-0 text-brand-moss" size={18} aria-hidden="true" />
                                        <span className="min-w-0">
                                            <span className="block text-sm font-semibold">{option.label}</span>
                                            <span className="mt-1 block text-xs text-brand-muted-soft">{option.description}</span>
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </fieldset> */}

                    <form onSubmit={handleStartResearch} className="mt-8">
                        <label htmlFor="research-query" className="sr-only">Your research question or topic</label>
                        <div className="flex min-h-14 flex-col gap-2 rounded-xl border border-brand-line bg-brand-paper p-2 shadow-sm sm:flex-row sm:items-center">
                            <Search className="ml-3 hidden shrink-0 text-brand-muted sm:block" size={19} aria-hidden="true" />
                            <input
                                id="research-query"
                                name="q"
                                maxLength={200}
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Ask a question or enter a topic..."
                                required
                                className="h-11 min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-brand-faint sm:px-1"
                            />
                            <Button
                                type="submit"
                                disabled={!query.trim() || isCreatingResearch}
                                className="h-11 shrink-0 gap-2 rounded-lg bg-brand-accent px-5 text-brand-forest hover:bg-brand-accent-hover disabled:opacity-50"
                            >
                                {isCreatingResearch ? "Creating folder..." : "Start research"}
                                <ArrowUpRight size={16} aria-hidden="true" />
                            </Button>
                        </div>
                    </form>
                    {createResearchError && (
                        <p className="mt-3 text-sm text-destructive" role="alert">
                            {createResearchError}
                        </p>
                    )}

                    <section aria-labelledby="topics-title" className="mt-10 border-t border-brand-line pt-6">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-moss">Need a first spark?</p>
                                <h2 id="topics-title" className="mt-2 text-xl font-medium sm:text-2xl">Popular topics to explore</h2>
                            </div>
                            <ArrowDownRight className="mb-1 hidden text-brand-moss-strong sm:block" size={21} aria-hidden="true" />
                        </div>
                        {isLoadingTopics ? (
                            <p className="mt-5 text-sm text-brand-muted" role="status">Finding current topics...</p>
                        ) : topicsError ? (
                            <p className="mt-5 text-sm text-brand-muted" role="status">Popular topics are unavailable right now.</p>
                        ) : (
                            <div className="mt-5 flex flex-wrap gap-2.5">
                                {popularTopicsResponse.topics.map((topic) => (
                                    <button
                                        key={topic}
                                        type="button"
                                        aria-pressed={query === topic}
                                        onClick={() => setQuery(topic)}
                                        className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm transition-colors ${query === topic
                                            ? "border-brand-moss-strong bg-brand-selected text-brand-forest"
                                            : "border-brand-line bg-brand-paper/70 text-brand-forest hover:border-brand-moss hover:bg-brand-paper"
                                            }`}
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        )}
                        {!isLoadingTopics && !topicsError && popularTopicsResponse.total > topicsPageSize && (
                            <div className="mt-5 flex items-center justify-between">
                                <span className="text-xs text-brand-muted" aria-live="polite">
                                    Page {popularTopicsResponse.page} of {Math.ceil(popularTopicsResponse.total / popularTopicsResponse.pageSize)}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Previous topics page"
                                        title="Previous topics page"
                                        disabled={isLoadingTopics || popularTopicsResponse.page <= 1}
                                        onClick={() => setTopicPage((page) => page - 1)}
                                    >
                                        <ChevronLeft />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Next topics page"
                                        title="Next topics page"
                                        disabled={isLoadingTopics || !popularTopicsResponse.hasNext}
                                        onClick={() => setTopicPage((page) => page + 1)}
                                    >
                                        <ChevronRight />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </section>
                </section>

                <aside className="border-t border-brand-line pt-7 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-1">
                    <div className="flex items-center gap-2 text-brand-moss">
                        <BookOpen size={17} aria-hidden="true" />
                        <p className="text-xs font-semibold uppercase tracking-[0.16em]">A field guide</p>
                    </div>
                    <h2 className="mt-4 text-2xl leading-tight font-medium">Good research is a practice.</h2>
                    <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                        Start focused, follow the evidence, and keep track of where each idea came from.
                    </p>

                    <ol className="mt-7 space-y-5">
                        <li className="flex gap-3">
                            <span className="pt-0.5 font-mono text-xs text-brand-moss">01</span>
                            <span className="text-sm leading-relaxed"><strong className="font-semibold">Ask a focused question.</strong> Narrow a broad subject into something you can investigate.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="pt-0.5 font-mono text-xs text-brand-moss">02</span>
                            <span className="text-sm leading-relaxed"><strong className="font-semibold">Compare perspectives.</strong> Look for independent sources and points of disagreement.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="pt-0.5 font-mono text-xs text-brand-moss">03</span>
                            <span className="text-sm leading-relaxed"><strong className="font-semibold">Keep the trail.</strong> Save useful sources and note what makes them trustworthy.</span>
                        </li>
                    </ol>

                    <div className="mt-8 border-t border-brand-line pt-5">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-brand-moss">Helpful reading</p>
                        <ul className="divide-y divide-brand-line">
                            {researchGuides.map((guide) => (
                                <li key={guide.href}>
                                    <a
                                        href={guide.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="group flex items-start justify-between gap-3 py-3"
                                    >
                                        <span>
                                            <span className="block text-sm font-medium group-hover:underline">{guide.title}</span>
                                            <span className="mt-1 block text-xs leading-relaxed text-brand-muted-soft">{guide.description}</span>
                                        </span>
                                        <ArrowUpRight className="mt-0.5 shrink-0 text-brand-moss-strong" size={15} aria-hidden="true" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>
            </div>
        </main>
    )
}