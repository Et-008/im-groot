'use client'

import { CalendarDays, ChevronRight, ExpandIcon, Plus, Trash2, X } from "lucide-react"
import { use, useEffect, useState, useRef, useCallback, type MouseEvent } from "react"
import Link from "next/link"
import { getResearchById, getResearchFile, ResearchFile } from "@/app/actions/research"
import { generateActionRequirements, generatePrerequisiteKnowledge } from "@/app/actions/getRequirements"
import {
    deleteRelatedDiscussion,
    deleteRelatedImage,
    deleteRelatedVideo,
    fetchRelatedVideos,
    fetchRelatedNews,
} from "@/app/actions/related-videos"
import { fetchPage } from "@/app/actions/fetch-page"
import { useMarkdownStream } from '@/app/hooks/useMarkdownStream'
import Markdown from '@/components/functional/MarkDown'
import ResearchNotesSheet from "@/components/functional/ResearchNotesSheet"
import PrerequisiteKnowledge from "@/components/functional/PrerequisiteKnowledge"
import ActionRequirements from "@/components/functional/ActionRequirements"
import AdSenseSlot from "@/components/functional/AdSenseSlot"

let timer: ReturnType<typeof setTimeout> | null = null

function RenderFile({ researchId, file }: { researchId: string; file: ResearchFile }) {
    const [content, setContent] = useState<string>('')
    const [focus, setFocus] = useState<boolean>(false)

    useEffect(() => {
        const fetchFileContent = async () => {
            try {
                setContent(await getResearchFile(researchId, file.file))
            } catch (error) {
                console.error('Error fetching file content:', error)
            }
        }

        fetchFileContent()
    }, [researchId, file.file, file.version])

    return (
        <RenderMarkdown
            onClick={() => {
                debugger
                setFocus((focus) => !focus)
            }}
            content={content}
            preview={!focus}
        />
    )
}

function RenderMarkdown({ content, preview = false, onClick }: { content: string; preview?: boolean; onClick?: () => void }) {

    return (
        <div
            aria-label="Research sources"
            className={`${preview ? 'preview' : ''} cursor-pointer mt-7 rounded-lg border border-brand-line bg-brand-paper px-5 py-6 shadow-sm sm:px-8 sm:py-8' `}
            onClick={onClick}
        >
            <Markdown text={content} />
        </div>)
}

function RenderFiles({ researchId, files }: { researchId: string; files: ResearchFile[] }) {

    if (!files || files.length === 0) {
        return null
        return (
            <div className="mt-7 border-y border-brand-line py-14 text-center">
                <h2 className="text-lg font-medium">No files saved yet</h2>
                <p className="mt-2 text-sm text-brand-muted">Files you save from your research will show up here.</p>
                <Link
                    href={`/research/${researchId}/new`}
                    className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-accent px-4 text-sm font-medium text-brand-forest transition-colors hover:bg-brand-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-moss-strong"
                >
                    <Plus size={16} aria-hidden="true" />
                    Start research
                </Link>
            </div>
        )
    }

    return files.map((file, index) => (<RenderFile key={index} researchId={researchId} file={file} />))
}

function DeleteRelatedButton({
    label,
    onDelete,
}: {
    label: string
    onDelete: () => Promise<void>
}) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleDelete(event: MouseEvent<HTMLButtonElement>) {
        event.preventDefault()
        event.stopPropagation()
        setIsDeleting(true)
        setError(null)

        try {
            await onDelete()
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : `Could not delete ${label}.`)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <>
            <button
                type="button"
                aria-label={`Delete ${label}`}
                title={error ?? `Delete ${label}`}
                disabled={isDeleting}
                onClick={handleDelete}
                className="absolute -right-12 top-2/5 z-10 rounded-full bg-black/70 p-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
                <Trash2 size={20} aria-hidden="true" />
            </button>
            {error && <span role="alert" className="sr-only">{error}</span>}
        </>
    )
}

function RenderYoutubeVideos({
    videos,
    onDelete,
}: {
    videos: string[]
    onDelete: (videoId: string) => Promise<void>
}) {
    const [isHovered, setIsHovered] = useState(false)
    const [activeVideo, setActiveVideo] = useState<string | null>(null)

    useEffect(() => {
        if (!activeVideo) return

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") setActiveVideo(null)
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [activeVideo])

    if (!videos || videos.length === 0) {
        return null
    }

    return (
        <>
            <div
                className="relative mt-7 w-100 h-50"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {videos.map((video, index) => (
                    <div
                        key={video}
                        style={{ left: `${index * (isHovered ? 100 : 10)}px`, top: `${index * 10}px`, transition: 'all 0.3s ease' }}
                        className="absolute aspect-video w-full overflow-hidden rounded-lg border border-brand-line bg-brand-paper shadow-sm"
                    >
                        <iframe
                            src={`https://www.youtube.com/embed/${video}`}
                            title={`YouTube video ${index + 1}`}
                            allowFullScreen
                            tabIndex={-1}
                            aria-hidden="true"
                            className="pointer-events-none h-full w-full"
                        />
                        <button
                            type="button"
                            aria-label={`Open YouTube video ${index + 1}`}
                            onClick={() => setActiveVideo(video)}
                            className="absolute inset-0 z-0 cursor-pointer"
                        />
                    </div>
                ))}
            </div>
            {activeVideo && (
                <div
                    className="fixed inset-0 z-10 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setActiveVideo(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Related YouTube video"
                        className="relative aspect-video w-full max-w-5xl rounded-lg bg-black shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <DeleteRelatedButton
                            label={`video ${activeVideo}`}
                            onDelete={async () => {
                                await onDelete(activeVideo)
                                setActiveVideo(null)
                            }}
                        />
                        <button
                            type="button"
                            aria-label="Close video"
                            onClick={() => setActiveVideo(null)}
                            className="absolute -right-12 top-1/2 z-10 rounded-full bg-black/70 p-2 text-white transition-colors hover:bg-black"
                        >
                            <X size={20} aria-hidden="true" />
                        </button>
                        <iframe
                            src={`https://www.youtube.com/embed/${activeVideo}`}
                            title="Related YouTube video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="h-full w-full"
                        />
                    </div>
                </div>
            )}
        </>
    )
}

function RenderDiscussion({
    discussion,
    onDelete,
}: {
    discussion?: any
    onDelete: (link: string) => Promise<void>
}) {
    const [discussionData, setDiscussionData] = useState<any | null>(null)

    // useEffect(() => {
    //     if (!discussion) return

    //     const fetchDiscussionData = async () => {
    //         try {
    //             const response = await fetchPage(discussion.link)
    //             console.log('Fetched discussion data:', response)
    //             setDiscussionData(response)
    //         } catch (error) {
    //             console.error('Error fetching discussion data:', error)
    //         }
    //     }

    //     fetchDiscussionData()
    // }, [discussion])

    if (!discussion) {
        return null
    }

    return (
        <li className="relative flex items-center justify-between gap-3 pr-10">
            <a href={discussion.link} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">
                {discussion.title || discussion.link}
            </a>
            <DeleteRelatedButton
                label="discussion"
                onDelete={() => onDelete(discussion.link)}
            />
            {/* {discussionData && (
                <p className="mt-1 text-sm text-brand-muted">

            )} */}
        </li>
    )
}

function RenderDiscussions({
    discussions,
    onDelete,
}: {
    discussions?: any[]
    onDelete: (link: string) => Promise<void>
}) {
    if (!discussions || discussions.length === 0) {
        return null
    }

    return (
        <div className="mt-7">
            <h2 className="mb-3 text-lg font-medium">Related Discussions</h2>
            <ul className="list-disc pl-5">
                {discussions.map((discussion, index) => {
                    return (
                        <RenderDiscussion key={discussion.link ?? index} discussion={discussion} onDelete={onDelete} />
                    )
                })}
            </ul>
        </div>
    )
}

function RenderImages({
    images,
    onDelete,
}: {
    images?: any[]
    onDelete: (url: string) => Promise<void>
}) {
    const [isHovered, setIsHovered] = useState(false)
    const [activeImage, setActiveImage] = useState<any>(null)
    const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set())

    useEffect(() => {
        if (!activeImage) return

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") setActiveImage(null)
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [activeImage])

    if (!images || images.length === 0) {
        return null
    }

    const visibleImages = images.filter((image) =>
        typeof image.original === "string" && !failedImages.has(image.original)
    )
    if (visibleImages.length === 0) {
        return null
    }

    function handleImageError(url: string) {
        setFailedImages((failed) => new Set(failed).add(url))
    }

    return (
        <div
            className="relative mt-7 w-100 h-50 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}>
            {visibleImages.map((image, index) => (
                <div
                    key={image.original}
                    style={{ left: `${index * (isHovered ? 100 : 10)}px`, top: `${index * 10}px`, transition: 'all 0.3s ease' }}
                    className="absolute aspect-video w-full overflow-hidden rounded-lg border border-brand-line bg-brand-paper shadow-sm"
                >
                    <img
                        src={image.original}
                        alt={image.title || 'Related image'}
                        onError={() => handleImageError(image.original)}
                        className="h-full w-full object-cover"
                    />

                    <button
                        type="button"
                        aria-label={`Open image ${index + 1}`}
                        onClick={() => setActiveImage(image)}
                        className="absolute inset-0 z-0 cursor-pointer"
                    />
                    <DeleteRelatedButton
                        label={`image ${index + 1}`}
                        onDelete={() => onDelete(image.original || image.source)}
                    />
                </div>
            ))}

            {activeImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setActiveImage(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Related image"
                        className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-lg bg-black shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            aria-label="Close image"
                            onClick={() => setActiveImage(null)}
                            className="absolute right-3 top-3 z-10 rounded-full bg-black/70 p-2 text-white transition-colors hover:bg-black"
                        >
                            <X size={20} aria-hidden="true" />
                        </button>
                        <img
                            src={activeImage.original}
                            alt={activeImage.title || 'Related image'}
                            onError={() => handleImageError(activeImage.original)}
                            className="h-full w-full object-cover"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default function ResearchBoard({ params }: { params: Promise<{ id: string }> }) {
    const { id: researchId } = use(params)
    const [researchFolder, setResearchFolder] = useState<Awaited<ReturnType<typeof getResearchById>>>(null)
    const [isLoadingResearch, setIsLoadingResearch] = useState(true)
    const [researchError, setResearchError] = useState(false)

    const [fullScreen, setFullScreen] = useState(false)


    const { stream, abort, inProgress } = useMarkdownStream({
        onComplete: () => { },
        onError: (error) => { },
    })

    const contentRef = useRef<HTMLElement | null>(null)
    const [content, setContent] = useState<string>('')
    const [chunks, setChunks] = useState<string[]>([])
    const [isTyping, setIsTyping] = useState<boolean>(false)

    async function handleDeleteVideo(videoId: string) {
        await deleteRelatedVideo(researchId, videoId)
        setResearchFolder((research) =>
            research
                ? { ...research, youtubeVideos: research.youtubeVideos.filter((video) => video !== videoId) }
                : research
        )
    }

    async function handleDeleteDiscussion(link: string) {
        await deleteRelatedDiscussion(researchId, link)
        setResearchFolder((research) =>
            research
                ? { ...research, discussions: research.discussions?.filter((discussion) => discussion.link !== link) }
                : research
        )
    }

    async function handleDeleteImage(url: string) {
        await deleteRelatedImage(researchId, url)
        setResearchFolder((research) =>
            research
                ? {
                    ...research,
                    images: research.images?.filter(
                        (image) => image.original !== url && image.source !== url
                    ),
                }
                : research
        )
    }

    const type = useCallback(function recursiveTyping(chunk: string) {
        if (chunk.length === 0) {
            setIsTyping(false)
            return
        }
        const charsToType = 2;
        const chars = chunk.slice(0, charsToType)
        const rest = chunk.slice(charsToType);
        setContent(content => content + chars);
        if (rest.length) {
            requestAnimationFrame(() => recursiveTyping(rest))
        } else {
            setIsTyping(false)
        }
        contentRef.current?.scrollTo({
            top: contentRef.current?.scrollHeight,
            behavior: 'smooth'
        })
    }, [])

    function handleSend(topic: string, researchId: string) {
        setChunks([])

        const payload = {
            researchId,
            messages: [
                {
                    role: 'system',
                    content: "You are a careful research assistant. Be practical and evidence-aware. Do not invent studies or citations, and do not imply that you searched live sources. Clearly distinguish well-established findings from uncertainty.",
                },
                {
                    role: 'user',
                    content: `Give me a practical overview of existing research on: ${topic}. Organize it into a brief overview, major themes and findings, common research methods, open questions or disagreements, and useful next search terms.`,
                },
            ]
        };

        stream((chunk) => {
            setChunks((prev) => [...prev, chunk])
        }, payload)

        void fetchRelatedVideos(researchId)
            .then((youtubeVideos) => {
                setResearchFolder((research) =>
                    research ? { ...research, youtubeVideos } : research
                )
            })
            .catch((error) => {
                console.error('Error fetching related videos:', error)
            })

        void fetchRelatedNews(researchId)
            .then(({ discussions, images }) => {
                setResearchFolder((research) =>
                    research ? { ...research, discussions, images } : research
                )
            })
            .catch((error) => {
                console.error('Error fetching related news:', error)
            })
    }

    useEffect(() => {
        if (!isTyping && chunks.length > 0) {
            const [nextChunk, ...rest] = chunks
            setChunks(rest);
            type(nextChunk);
            setIsTyping(true);
        }
    }, [isTyping, chunks, type])

    useEffect(() => {
        let isCurrent = true

        getResearchById(researchId)
            .then((research) => {
                if (isCurrent) {
                    setResearchFolder(research)
                    setResearchError(!research)
                    if (research?.query) {
                        if (!research.files?.length) {
                            if (timer) clearTimeout(timer)
                            timer = setTimeout(() => {
                                handleSend(research.query, researchId)
                            }, 1000)
                        }
                    }
                }
            })
            .catch(() => {
                if (isCurrent) setResearchError(true)
            })
            .finally(() => {
                if (isCurrent) setIsLoadingResearch(false)
            })

        return () => {
            isCurrent = false
            if (timer) clearTimeout(timer)
        }
    }, [researchId])


    return (
        <main className="min-h-screen bg-brand-canvas text-brand-forest relative">
            <aside
                aria-label="Advertisement"
                className="absolute left-[calc(50%-44rem)] top-8 hidden w-40 2xl:block"
            >
                <p className="mb-2 text-center text-xs uppercase tracking-wide text-brand-muted">Ad</p>
                <AdSenseSlot />
            </aside>
            <div className="mx-auto max-w-5xl px-5 pb-12 pt-8 sm:px-8 sm:pt-12 lg:px-12">
                <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2 text-sm text-brand-muted">
                    <Link href="/research" className="transition-colors hover:text-brand-forest">Research</Link>
                    <ChevronRight size={15} aria-hidden="true" />
                    <span className="max-w-[65vw] truncate text-brand-forest" aria-current="page">
                        {researchFolder?.title ?? (isLoadingResearch ? "Loading research" : "Research not found")}
                    </span>
                </nav>

                {isLoadingResearch ? (
                    <p className="py-10 text-sm text-brand-muted" role="status">Loading research...</p>
                ) : researchError || !researchFolder ? (
                    <div className="border-y border-brand-line py-12">
                        <h1 className="text-2xl font-medium">Research not found</h1>
                        <p className="mt-2 text-sm text-brand-muted">This research folder may have been moved or removed.</p>
                    </div>
                ) : (
                    <>
                        <header className="border-b border-brand-line pb-7">
                            {/* <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-moss">Research question</p> */}
                            <h1 className="mt-3 max-w-3xl text-3xl leading-tight font-medium sm:text-4xl">
                                {researchFolder.query}
                            </h1>
                            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-brand-muted">
                                <span className="inline-flex items-center gap-2">
                                    <CalendarDays size={16} aria-hidden="true" />
                                    <span>Created</span>
                                    <time dateTime={researchFolder.createdAt}>
                                        {new Intl.DateTimeFormat(undefined, {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        }).format(new Date(researchFolder.createdAt))}
                                    </time>
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-forest">
                                    <span className="size-1.5 rounded-full bg-brand-moss-strong" aria-hidden="true" />
                                    {researchFolder.status.replaceAll("-", " ")}
                                </span>
                            </div>
                        </header>

                        <PrerequisiteKnowledge researchId={researchId} />
                        <ActionRequirements researchId={researchId} />

                        {content && <RenderMarkdown content={content} />}
                        <div className={`${fullScreen ? "bg-white fixed w-screen h-screen top-0 left-0 right-0 bottom-0 z-50 overflow-scroll p-10 pb-20" : "relative"} flex flex-wrap gap-6`}>
                            <RenderFiles researchId={researchFolder?.researchId || ""} files={researchFolder.files} />
                            <div className="flex grow flex-col gap-6">
                                <RenderYoutubeVideos
                                    videos={researchFolder.youtubeVideos}
                                    onDelete={handleDeleteVideo}
                                />
                                <RenderImages
                                    images={researchFolder.images}
                                    onDelete={handleDeleteImage}
                                />
                            </div>
                            <RenderDiscussions
                                discussions={researchFolder.discussions}
                                onDelete={handleDeleteDiscussion}
                            />
                            <ExpandIcon className="absolute top-0 right-0 cursor-pointer" onClick={() => setFullScreen(!fullScreen)} />
                        </div>
                        <ResearchNotesSheet researchId={researchId} />
                    </>
                )}
            </div>
        </main>
    )
}