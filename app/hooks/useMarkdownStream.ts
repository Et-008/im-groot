import { useRef, useState } from 'react'

type StreamCallback = (chunk: string) => void

type StreamPayload = {
    researchId: string;
    messages: {
        role: string;
        content: string;
    }[];
}

type StreamOptions = {
    onComplete?: () => void
    onError?: (error: Error) => void
}

/**
 * Hook for streaming markdown content from the server.
 * @param options - Optional configuration for completion/error callbacks and delay
 * @returns Object with stream, abort functions and inProgress state
 */
export function useMarkdownStream(options: StreamOptions = {}) {
    const { onComplete, onError } = options
    const controllerRef = useRef<AbortController | null>(null)
    const [inProgress, setInProgress] = useState(false)

    const stream = (onChunk: StreamCallback, payload: StreamPayload) => {
        // Abort any existing stream before starting a new one
        controllerRef.current?.abort()

        const controller = new AbortController()
        controllerRef.current = controller
        setInProgress(true)
            ; (async () => {
                try {
                    const response = await fetch(`/api/chat`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                        signal: controller.signal,
                    })
                    if (!response.ok) {
                        throw new Error(`Failed to fetch: ${response.status}`)
                    }

                    const reader = response.body?.getReader()
                    if (!reader) {
                        throw new Error('No readable stream available')
                    }

                    const decoder = new TextDecoder()

                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break
                        const text = decoder.decode(value, { stream: true })
                        onChunk(text)
                    }

                    onComplete?.()
                } catch (error) {
                    if ((error as Error).name !== 'AbortError') {
                        console.error('Stream error:', error)
                        onError?.(error as Error)
                    }
                } finally {
                    controllerRef.current = null
                    setInProgress(false)
                }
            })()
    }

    const abort = () => {
        controllerRef.current?.abort()
        controllerRef.current = null
        setInProgress(false)
    }

    return { stream, abort, inProgress }
}
