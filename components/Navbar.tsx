import Link from "next/link"
import { ArrowUpRight, BookOpen, Leaf } from "lucide-react"

export default function Navbar() {
    return (
        <>
            <header className="sticky top-0 z-50 border-b border-brand-line bg-brand-canvas/95 backdrop-blur md:hidden">
                <nav className="mx-auto flex h-16 max-w-360 items-center justify-between px-5">
                    <Link href="/" aria-label="Groot home" className="flex items-center gap-2.5">
                        <span className="flex size-9 items-center justify-center rounded-full bg-brand-accent text-brand-forest">
                            <Leaf size={17} strokeWidth={1.8} aria-hidden="true" />
                        </span>
                        <span className="text-xs font-semibold tracking-[0.12em]">GROOT</span>
                    </Link>
                    <Link
                        href="/research"
                        aria-label="Research library"
                        title="Research library"
                        className="flex size-10 items-center justify-center rounded-full text-brand-forest transition-colors hover:bg-brand-soft-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-moss-strong"
                    >
                        <BookOpen size={19} aria-hidden="true" />
                    </Link>
                </nav>
            </header>

            <header className="sticky top-0 z-50 hidden border-b border-brand-line bg-brand-canvas/95 backdrop-blur md:block">
                <nav className="mx-auto flex h-20 max-w-360 items-center justify-between px-6 sm:px-10 lg:px-16">
                    <Link href="/" aria-label="Groot home" className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-full bg-brand-accent text-brand-forest">
                            <Leaf size={19} strokeWidth={1.8} aria-hidden="true" />
                        </span>
                        <span className="text-sm font-semibold tracking-[0.12em]">GROOT</span>
                    </Link>
                    <Link
                        href="/research"
                        className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-brand-moss-strong focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-moss-strong"
                    >
                        Research library
                        <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                </nav>
            </header>
        </>
    )
}