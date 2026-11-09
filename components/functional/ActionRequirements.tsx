"use client"

import { generateActionRequirements } from "@/app/actions/getRequirements"
import { parseRequirementReport, type RequirementReportSections } from "@/lib/requirement-report"
import { useEffect, useState } from "react"

export default function ActionRequirements({ researchId }: { researchId: string }) {
    const [sections, setSections] = useState<RequirementReportSections | null>(null)
    const [checkedItems, setCheckedItems] = useState<Set<string>>(() => new Set())
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const totalItems = sections
        ? Object.values(sections).reduce((total, items) => total + items.length, 0)
        : 0

    useEffect(() => {
        let isCurrent = true
        setSections(null)
        setCheckedItems(new Set())
        setError(null)
        setIsLoading(true)

        generateActionRequirements(researchId)
            .then((report) => {
                if (isCurrent) {
                    setSections(parseRequirementReport(report))
                    setCheckedItems(new Set())
                }
            })
            .catch((cause: unknown) => {
                if (isCurrent) {
                    setError(cause instanceof Error ? cause.message : "Could not load action requirements.")
                }
            })
            .finally(() => {
                if (isCurrent) setIsLoading(false)
            })

        return () => {
            isCurrent = false
        }
    }, [researchId])

    function toggleItem(itemId: string) {
        setCheckedItems((checked) => {
            const updated = new Set(checked)
            if (updated.has(itemId)) {
                updated.delete(itemId)
            } else {
                updated.add(itemId)
            }
            return updated
        })
    }

    return (
        <section aria-labelledby="action-requirements-title" className="mt-7 rounded-lg border border-brand-line bg-brand-paper px-5 py-6 shadow-sm sm:px-8 sm:py-8">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="action-requirements-title" className="text-xl font-semibold">
                    Action Requirements
                </h2>
                {!isLoading && !error && sections && (
                    <span className="text-sm text-brand-muted" aria-live="polite">
                        {checkedItems.size}/{totalItems} completed
                    </span>
                )}
            </div>
            {error ? (
                <p role="alert" className="text-sm text-red-700">{error}</p>
            ) : isLoading ? (
                <p role="status" className="text-sm text-brand-muted">Loading action requirements...</p>
            ) : sections && Object.keys(sections).length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {Object.entries(sections).map(([heading, items]) => (
                        <section key={heading}>
                            <h3 className="font-semibold">{heading}</h3>
                            <ul className="mt-2 space-y-2 text-sm leading-6">
                                {items.map((item, index) => {
                                    const itemId = `${heading}-${index}`
                                    return (
                                        <li key={itemId}>
                                            <label className="flex cursor-pointer items-start gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={checkedItems.has(itemId)}
                                                    onChange={() => toggleItem(itemId)}
                                                    className="mt-1 size-4 shrink-0 accent-brand-moss-strong"
                                                />
                                                <span dangerouslySetInnerHTML={{ __html: item }} />
                                            </label>
                                        </li>
                                    )
                                })}
                            </ul>
                        </section>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-brand-muted">No action requirements were returned.</p>
            )}
        </section>
    )
}
