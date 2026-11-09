"use client"

import { generatePrerequisiteKnowledge } from "@/app/actions/getRequirements"
import { parseRequirementReport, type RequirementReportSections } from "@/lib/requirement-report"
import { useEffect, useState } from "react"

export default function PrerequisiteKnowledge({ researchId }: { researchId: string }) {
    const [sections, setSections] = useState<RequirementReportSections | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let isCurrent = true
        setSections(null)
        setError(null)
        setIsLoading(true)

        generatePrerequisiteKnowledge(researchId)
            .then((report) => {
                if (isCurrent) setSections(parseRequirementReport(report))
            })
            .catch((cause: unknown) => {
                if (isCurrent) {
                    setError(cause instanceof Error ? cause.message : "Could not load prerequisite knowledge.")
                }
            })
            .finally(() => {
                if (isCurrent) setIsLoading(false)
            })

        return () => {
            isCurrent = false
        }
    }, [researchId])

    return (
        <section aria-labelledby="prerequisite-knowledge-title" className="mt-7 rounded-lg border border-brand-line bg-brand-paper px-5 py-6 shadow-sm sm:px-8 sm:py-8">
            <h2 id="prerequisite-knowledge-title" className="mb-4 text-xl font-semibold">
                Prerequisite Knowledge
            </h2>
            {error ? (
                <p role="alert" className="text-sm text-red-700">{error}</p>
            ) : isLoading ? (
                <p role="status" className="text-sm text-brand-muted">Loading prerequisite knowledge...</p>
            ) : sections && Object.keys(sections).length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {Object.entries(sections).map(([heading, items]) => (
                        <section key={heading}>
                            <h3 className="font-semibold">{heading}</h3>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
                                {items.map((item, index) => <li key={`${heading}-${index}`}>{item}</li>)}
                            </ul>
                        </section>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-brand-muted">No prerequisite knowledge was returned.</p>
            )}
        </section>
    )
}
