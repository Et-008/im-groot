import { NextResponse } from 'next/server';
import { Ollama } from 'ollama';
import { getResearchById, saveResearchResponse } from '@/app/actions/research';

const ollama = new Ollama({
    host: "https://ollama.com",
    headers: {
        Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
    },
})

export async function POST(request: Request) {
    try {
        const body: unknown = await request.json();
        if (typeof body !== 'object' || body === null || Array.isArray(body)) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const { messages, model = 'gemma4:31b', researchId } = body as {
            messages?: unknown;
            model?: unknown;
            researchId?: unknown;
        };

        if (
            !Array.isArray(messages) ||
            !messages.every((message) =>
                typeof message === 'object' &&
                message !== null &&
                'role' in message && typeof message.role === 'string' &&
                'content' in message && typeof message.content === 'string'
            )
        ) {
            return NextResponse.json(
                { error: 'Missing or invalid messages array' },
                { status: 400 }
            );
        }

        if (typeof researchId !== 'string' || !researchId.trim()) {
            return NextResponse.json({ error: 'Missing or invalid researchId' }, { status: 400 });
        }

        if (typeof model !== 'string' || !model.trim()) {
            return NextResponse.json({ error: 'Missing or invalid model' }, { status: 400 });
        }

        const research = await getResearchById(researchId);
        if (!research) {
            return NextResponse.json({ error: 'Research folder not found' }, { status: 404 });
        }

        const responseStream = await ollama.chat({
            model,
            messages: messages as { role: string; content: string }[],
            stream: true,
        });

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    let completeResponse = '';
                    for await (const chunk of responseStream) {
                        const text = chunk.message?.content || '';
                        completeResponse += text;
                        controller.enqueue(new TextEncoder().encode(text));
                    }
                    await saveResearchResponse(researchId, completeResponse);
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            },
        });



        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('Ollama integration error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
