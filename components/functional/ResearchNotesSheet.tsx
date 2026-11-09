"use client"

import { getResearchNotes, saveResearchNotes } from "@/app/actions/research"
import { NotebookPen, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Props = {
    researchId: string
}

export default function ResearchNotesSheet({ researchId }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [notes, setNotes] = useState("")
    const [loadedResearchId, setLoadedResearchId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDirty, setIsDirty] = useState(false)
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved")
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [loadAttempt, setLoadAttempt] = useState(0)
    const [saveAttempt, setSaveAttempt] = useState(0)
    const latestNotes = useRef("")
    const saveQueue = useRef<Promise<void>>(Promise.resolve())

    useEffect(() => {
        let isCurrent = true
        setIsLoading(true)
        setErrorMessage(null)
        setLoadedResearchId(null)
        setIsDirty(false)

        getResearchNotes(researchId)
            .then((content) => {
                if (!isCurrent) return
                latestNotes.current = content
                setNotes(content)
                setLoadedResearchId(researchId)
                setSaveStatus("saved")
            })
            .catch((error: unknown) => {
                if (!isCurrent) return
                setErrorMessage(error instanceof Error ? error.message : "Could not load notes.")
            })
            .finally(() => {
                if (isCurrent) setIsLoading(false)
            })

        return () => {
            isCurrent = false
        }
    }, [researchId, loadAttempt])

    useEffect(() => {
        if (!isOpen) return

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") setIsOpen(false)
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen])

    useEffect(() => {
        if (!isDirty || loadedResearchId !== researchId) return

        const timer = setTimeout(() => {
            const contentToSave = notes
            setSaveStatus("saving")
            setErrorMessage(null)
            saveQueue.current = saveQueue.current
                .catch(() => undefined)
                .then(() => saveResearchNotes(researchId, contentToSave))
                .then(() => {
                    if (latestNotes.current === contentToSave) {
                        setIsDirty(false)
                        setSaveStatus("saved")
                    }
                })
                .catch((error: unknown) => {
                    if (latestNotes.current === contentToSave) {
                        setErrorMessage(error instanceof Error ? error.message : "Could not save notes.")
                        setSaveStatus("error")
                    }
                })
        }, 600)

        return () => clearTimeout(timer)
    }, [isDirty, loadedResearchId, notes, researchId, saveAttempt])

    function updateNotes(value: string) {
        latestNotes.current = value
        setNotes(value)
        setIsDirty(true)
        setSaveStatus("saving")
        setErrorMessage(null)
    }

    return (
        <>
            <button
                type="button"
                aria-controls="research-notes-sheet"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
                className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-lg border border-r-0 border-brand-line bg-brand-paper px-3 py-4 text-brand-forest shadow-lg hover:bg-brand-soft"
            >
                <span className="flex items-center gap-2 [writing-mode:vertical-rl]">
                    <NotebookPen size={18} aria-hidden="true" />
                    Notes
                </span>
            </button>

            {isOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close notes"
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-40 cursor-default bg-black/30"
                    />
                    <aside
                        id="research-notes-sheet"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="research-notes-title"
                        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-brand-line bg-brand-paper shadow-2xl"
                    >
                        <header className="flex items-center justify-between border-b border-brand-line px-5 py-4">
                            <div>
                                <h2 id="research-notes-title" className="text-lg font-semibold text-brand-forest">
                                    Research notes
                                </h2>
                                <p className="mt-1 text-xs text-brand-muted">Saved to notes.txt</p>
                            </div>
                            <button
                                type="button"
                                aria-label="Close notes"
                                onClick={() => setIsOpen(false)}
                                className="rounded-md p-2 text-brand-muted hover:bg-brand-soft hover:text-brand-forest"
                            >
                                <X size={20} aria-hidden="true" />
                            </button>
                        </header>

                        <div className="flex min-h-0 flex-1 flex-col p-4">
                            {isLoading ? (
                                <p role="status" className="text-sm text-brand-muted">Loading notes...</p>
                            ) : errorMessage && loadedResearchId !== researchId ? (
                                <div role="alert" className="space-y-3 text-sm text-red-700">
                                    <p>{errorMessage}</p>
                                    <button
                                        type="button"
                                        onClick={() => setLoadAttempt((attempt) => attempt + 1)}
                                        className="rounded-md border border-brand-line px-3 py-2 text-brand-forest hover:bg-brand-soft"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <textarea
                                        aria-label="Research notes"
                                        value={notes}
                                        onChange={(event) => updateNotes(event.target.value)}
                                        placeholder="Write your notes..."
                                        className="min-h-0 flex-1 resize-none rounded-md border border-brand-line bg-white p-3 text-sm leading-6 text-brand-forest outline-none focus-visible:ring-2 focus-visible:ring-brand-moss-strong"
                                    />
                                    <div className="flex min-h-8 items-center justify-between pt-2 text-xs">
                                        {errorMessage ? (
                                            <p role="alert" className="text-red-700">{errorMessage}</p>
                                        ) : (
                                            <span aria-live="polite" className="text-brand-muted">
                                                {saveStatus === "saving" ? "Saving..." : "All changes saved"}
                                            </span>
                                        )}
                                        {saveStatus === "error" && (
                                            <button
                                                type="button"
                                                onClick={() => setSaveAttempt((attempt) => attempt + 1)}
                                                className="font-medium text-brand-forest underline underline-offset-2"
                                            >
                                                Retry save
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </aside>
                </>
            )}
        </>
    )
}
