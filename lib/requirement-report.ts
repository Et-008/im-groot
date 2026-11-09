export type RequirementReportSections = Record<string, string[]>

function isRequirementReportSections(value: unknown): value is RequirementReportSections {
    return typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        Object.entries(value).every(([heading, items]) =>
            heading.trim().length > 0 &&
            Array.isArray(items) &&
            items.every((item) => typeof item === "string")
        )
}

export function parseRequirementReport(report: string): RequirementReportSections {
    let parsed: unknown
    try {
        parsed = JSON.parse(report)
    } catch {
        throw new Error("The saved report is not valid JSON.")
    }

    if (!isRequirementReportSections(parsed)) {
        throw new Error("The saved report has an invalid JSON structure.")
    }

    return parsed
}
