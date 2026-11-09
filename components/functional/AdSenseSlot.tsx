"use client"

import { useEffect, useRef } from "react"

declare global {
    interface Window {
        adsbygoogle?: Array<Record<string, unknown>>
    }
}

export default function AdSenseSlot() {
    const initialized = useRef(false)

    useEffect(() => {
        if (initialized.current) return

        initialized.current = true
        window.adsbygoogle = window.adsbygoogle || []
        window.adsbygoogle.push({})
    }, [])

    return (
        <ins
            className="adsbygoogle block h-150 w-full"
            style={{ display: "block" }}
            data-ad-client="ca-pub-7733239272768551"
            data-ad-slot="8287708539"
            data-ad-format="auto"
            data-full-width-responsive="true"
        />
    )
}
