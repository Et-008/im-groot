'use server'

import { randomUUID } from "node:crypto"
import { readFile, rename, unlink, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import { Ollama } from "ollama"
import { getResearchById } from "@/app/actions/research"

const MODEL = process.env.OLLAMA_MODEL || "gemma4:31b"

function getOllamaClient(): Ollama {
    const apiKey = process.env.OLLAMA_API_KEY
    if (!apiKey) {
        throw new Error("OLLAMA_API_KEY is not configured.")
    }

    return new Ollama({
        host: process.env.OLLAMA_HOST || "https://ollama.com",
        headers: { Authorization: `Bearer ${apiKey}` },
    })
}

async function generateAndSaveReport(
    researchId: string,
    filename: string,
    systemPrompt: string,
    userPrompt: (topic: string) => string,
    returnExisting = false
): Promise<string> {
    if (!researchId.trim()) {
        throw new Error("A valid research ID is required.")
    }

    const research = await getResearchById(researchId)
    if (!research) {
        throw new Error("Research folder not found.")
    }

    const folderPath = join(homedir(), "Documents", "groot", "research", research.folderName)
    const reportPath = join(folderPath, filename)
    if (returnExisting) {
        try {
            return await readFile(reportPath, "utf8")
        } catch (error) {
            if (
                typeof error !== "object" ||
                error === null ||
                !("code" in error) ||
                error.code !== "ENOENT"
            ) {
                throw new Error(`Could not read ${filename}.`)
            }
        }
    }

    const temporaryPath = join(folderPath, `.${filename}-${randomUUID()}.tmp`)

    const response = await getOllamaClient().chat({
        model: MODEL,
        stream: false,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt(research.query) },
        ],
    })

    const report = response.message.content.trim()
    if (!report) {
        throw new Error("The LLM returned an empty report.")
    }

    try {
        await writeFile(temporaryPath, `${report}\n`, { encoding: "utf8", flag: "wx" })
        await rename(temporaryPath, reportPath)
    } catch {
        await unlink(temporaryPath).catch(() => undefined)
        throw new Error(`Could not save ${filename}.`)
    }

    return report
}

export async function generatePrerequisiteKnowledge(researchId: string): Promise<string> {
    return generateAndSaveReport(
        researchId,
        "prerequisite-knowledge.md",
        "You are a careful research educator. Explain prerequisite knowledge accurately, distinguish essentials from helpful background, and avoid assuming the reader's expertise. Be concise. Output valid JSON only: no Markdown, no code fences, no introductions, explanations, or closing remarks.",
        (topic) => `For the research topic "${topic}", list the prerequisite knowledge someone needs before studying it.

        Output format:
        - Return a single JSON object and nothing else.
        - Each key is a section heading (a short string).
        - Each value is an array of short strings.
        - Max 5 items per section, max 10 words per item.
        - Omit any section that doesn't apply (do not return empty arrays).

        Example shape:
        {
        "Essential concepts and terminology": ["Variance: how spread out values are (Essential)"],
        "Suggested learning order": ["1. Basic statistics", "2. Probability"],
        "Readiness checklist": ["Can you explain what a mean is?"]
        }

        Use only these section headings:
        - "Essential concepts and terminology" (define each term in under 10 words)
        - "Foundational subjects or prior knowledge"
        - "Suggested learning order" (numbered steps, max 5)
        - "Common misconceptions or difficult ideas"
        - "Readiness checklist" (yes/no questions, max 5)

        End each item in "Essential concepts and terminology" and "Foundational subjects or prior knowledge" with (Essential) or (Helpful). Do not invent prerequisites.`,
        true,
    )
}

export async function generateActionRequirements(researchId: string): Promise<string> {
    return generateAndSaveReport(
        researchId,
        "action-requirements.json",
        "You are a careful practical-requirements analyst. Separate legally or institutionally mandatory requirements from recommendations, state uncertainty clearly, and never present guesses as requirements. Be concise. Output valid JSON only: no Markdown, no code fences, no introductions, explanations, or closing remarks.",
        (topic) => `For the research topic "${topic}", create a checklist of what someone needs to take practical action.

        Output format:
        - Return a single JSON object and nothing else.
        - Each key is a section heading (a short string).
        - Each value is an array of checklist item strings.
        - Max 5 items per section, max 10 words per item.
        - Omit any section that doesn't apply (do not return empty arrays).

        Example shape:
        {
        "Skills and experience": ["Basic data analysis (Required)", "Report writing (Optional)"],
        "Licenses and approvals": ["Varies: check local licensing authority (Required)"]
        }

        Use only these section headings:
        - "Skills and experience"
        - "Certifications or qualifications"
        - "Licenses, registrations, permits, or approvals"
        - "Equipment, facilities, or prerequisites"
        - "Likely costs or funding"
        - "Safety, legal, or professional obligations"
        - "Helpful but non-mandatory preparation"

        End each item with a <span className="text-red-500">*</span> if Required. If a requirement varies by country or region, write "Varies: check <authority>" instead of guessing. Do not invent legal rules, certification names, or costs.`,
        true
    )
}