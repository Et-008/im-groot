import { parseRichText, RICH_TEXT_RULES } from '@/lib/markdown-parser'

interface MarkdownProps {
    text: string
}

const Markdown = ({ text }: MarkdownProps) => {
    const result = parseRichText(text, RICH_TEXT_RULES)
    return <div
        className="markdown"
        dangerouslySetInnerHTML={{
            __html: result
        }} ></div>
}

export default Markdown