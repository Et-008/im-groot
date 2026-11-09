import Link from "next/link"
import { ArrowDown, ArrowUpRight } from "lucide-react"

export default function Home() {
  const randomId = Math.random().toString(36).substring(2, 10);
  return (
    <main className="min-h-screen bg-brand-canvas text-brand-forest">
      <section
        aria-labelledby="welcome-title"
        className="home-hero relative isolate flex min-h-[68svh] items-center overflow-hidden bg-brand-deep px-6 py-14 text-white sm:px-10 lg:px-16"
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="max-w-4xl">
            <p className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-brand-accent sm:text-sm">
              <span className="h-px w-9 bg-brand-accent" />
              A space for curious minds
            </p>
            <h1
              id="welcome-title"
              className="max-w-4xl text-6xl leading-[0.98] font-medium sm:text-7xl lg:text-8xl"
            >
              Welcome to
              <br />
              your next big idea.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
              Keep the questions, discoveries, and sparks of inspiration that are worth coming back to.
            </p>
            <Link
              href={`/research/${randomId}/new`}
              className="group mt-9 inline-flex min-h-14 items-center gap-5 rounded-full bg-brand-accent px-7 text-base font-semibold text-brand-deep transition-colors hover:bg-brand-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Start a research
              <ArrowUpRight
                size={19}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>
          <div className="absolute right-8 bottom-7 hidden items-center gap-2 text-xs text-white/75 md:flex lg:right-16">
            <ArrowDown size={15} aria-hidden="true" />
            Keep following your curiosity
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-6 px-6 py-10 sm:px-10 md:grid-cols-[1fr_auto] md:items-end lg:px-16 lg:py-14">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand-moss">Make room for wonder</p>
          <h2 className="mt-3 max-w-2xl text-2xl leading-snug font-medium sm:text-3xl">
            Every great discovery begins with a little curiosity.
          </h2>
        </div>
        <span className="hidden text-sm text-brand-muted md:block">Your ideas, ready when you are.</span>
      </section>
    </main>
  );
}
