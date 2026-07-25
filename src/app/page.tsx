import { ArrowRight, Images, LockKeyhole, Music2, Sparkles } from "lucide-react";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { StagePortal } from "@/components/tomorrowland/stage-portal";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <SiteHeader />
      <section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:pt-20">
        <div className="relative z-10">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.26em] text-primary">
            Boom, Belgium · An unofficial private fan archive
          </p>
          <h1 className="max-w-3xl font-display text-[clamp(4.2rem,10vw,8.5rem)] leading-[0.78] tracking-[-0.055em]">
            The music fades.
            <span className="block italic text-primary">The magic stays.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground">
            Your group&apos;s private Book of Memories for every stage, sunrise,
            friendship and impossible-to-explain moment from Tomorrowland Belgium.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/signup">Open your chapter <ArrowRight className="size-4" /></Link>
            </Button>
            <Button asChild variant="outline"><Link href="/trips">Enter the archive</Link></Button>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><LockKeyhole className="size-4 text-primary" /> Your people only</span>
            <span className="flex items-center gap-2"><Images className="size-4 text-primary" /> Original quality</span>
            <span className="flex items-center gap-2"><Music2 className="size-4 text-primary" /> One shared story</span>
          </div>
        </div>
        <div className="relative mx-auto h-[31rem] w-full max-w-lg" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/25" />
          <div className="absolute left-8 top-5 h-80 w-64 -rotate-6 rounded-sm border border-primary/40 bg-sky p-3 shadow-2xl shadow-black/30 transition hover:rotate-[-3deg]">
            <div className="h-full rounded-sm border border-white/20 bg-[radial-gradient(circle_at_50%_25%,#e6bd6a_0,transparent_12%),linear-gradient(160deg,#071a15,#176b5d_50%,#7e3158)]" />
          </div>
          <div className="absolute bottom-8 right-1 h-80 w-64 rotate-6 rounded-sm border border-primary/35 bg-card p-3 shadow-2xl shadow-black/30 transition hover:rotate-3">
            <div className="grid h-[15rem] place-items-center rounded-sm bg-[radial-gradient(circle_at_50%_38%,#e2ba68_0,transparent_10%),radial-gradient(circle_at_50%_60%,#9b3c6c,transparent_42%),linear-gradient(160deg,#0d2b23,#06120f)]">
              <span className="festival-emblem grid size-24 place-items-center rounded-full border border-[#e2ba68]/50 font-display text-5xl italic text-[#f6e8c2]">
                <Sparkles className="size-9" />
              </span>
            </div>
            <p className="mt-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">Boom, Belgium · 02:14</p>
          </div>
          <div className="absolute right-2 top-0 grid size-28 rotate-12 place-items-center rounded-full border border-primary/40 bg-background/50 text-center font-mono text-[10px] uppercase tracking-widest text-primary backdrop-blur">people of tomorrow</div>
        </div>
      </section>
      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-8">
        <StagePortal />
      </section>
    </main>
  );
}
