import { CalendarDays, FolderClosed, FolderOpen, Plus } from "lucide-react"
import Link from "next/link"
import { getResearches } from "@/app/actions/research"

export const dynamic = "force-dynamic"

export default async function MyResearches() {
    const randomId = Math.random().toString(36).substring(2, 10);
    const researches = await getResearches()

    return (
        <main className="min-h-screen bg-brand-canvas text-brand-forest">
            <div className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14 lg:px-12">
                <div className="flex flex-col gap-5 border-b border-brand-line pb-7 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand-moss">Your workspace</p>
                        <h1 className="text-4xl font-medium sm:text-5xl">My research</h1>
                        <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-muted sm:text-base">
                            Your saved research topics, gathered in one place.
                        </p>
                    </div>
                    <Link
                        href={`/research/${randomId}/new`}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-brand-accent px-4 text-sm font-medium text-brand-forest transition-colors hover:bg-brand-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-moss-strong"
                    >
                        <Plus size={16} aria-hidden="true" />
                        Start research
                    </Link>
                </div>

                <div className="mt-7 flex items-center justify-between text-sm">
                    <span className="font-medium">Research topics</span>
                    <span className="text-brand-muted">{researches.length} {researches.length === 1 ? "topic" : "topics"}</span>
                </div>

                {researches.length === 0 ? (
                    <div className="mt-5 border-y border-brand-line py-14 text-center">
                        <FolderOpen className="mx-auto text-brand-moss" size={28} aria-hidden="true" />
                        <h2 className="mt-4 text-lg font-medium">No research saved yet</h2>
                        <p className="mt-2 text-sm text-brand-muted">Start with a question and your research will show up here.</p>
                    </div>
                ) : (
                    <ul className="mt-3 divide-y divide-brand-line border-y border-brand-line">
                        {researches.map((research) => (
                            <li key={research.folderName} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 items-start gap-3">
                                    <FolderClosed className="mt-1 shrink-0 text-brand-moss" size={18} aria-hidden="true" />
                                    <div className="min-w-0" role="button">
                                        <Link href={`/research/${research.researchId ?? randomId}/edit`} aria-label={`Edit research: ${research.title}`} >
                                            <h2 className="truncate text-base font-medium">{research.title}</h2>
                                        </Link>
                                        <p className="mt-1 truncate font-mono text-xs text-brand-muted-soft">{research.folderName}</p>
                                    </div>
                                </div>
                                <time
                                    dateTime={research.createdAt}
                                    className="flex items-center gap-2 pl-8 text-sm text-brand-muted sm:pl-0"
                                >
                                    <CalendarDays size={15} aria-hidden="true" />
                                    {new Intl.DateTimeFormat(undefined, {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    }).format(new Date(research.createdAt))}
                                </time>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    )
}