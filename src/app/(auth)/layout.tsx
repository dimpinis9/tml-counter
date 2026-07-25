import { Eye, Sparkles } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[.85fr_1.15fr]">
      <section className="flex min-h-screen flex-col px-5 py-5 sm:px-10">
        <header className="flex items-center justify-between">
          <Link className="flex items-center gap-2 font-display text-xl" href="/">
            <span className="festival-emblem grid size-9 place-items-center rounded-full border border-primary/35">
              <Eye className="size-4 text-primary" />
            </span>
            Tomorrowland Memories
          </Link>
          <ThemeToggle />
        </header>
        <div className="m-auto w-full max-w-md py-16">{children}</div>
      </section>
      <aside className="relative hidden overflow-hidden bg-[#061510] text-[#f7edcf] lg:block">
        <div className="absolute inset-0 opacity-90 bg-[radial-gradient(circle_at_65%_28%,#a23f70,transparent_22rem),radial-gradient(circle_at_28%_76%,#167565,transparent_25rem),linear-gradient(150deg,#061510,#102c24)]" />
        <div className="absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d8ad5b]/25" />
        <div className="absolute left-1/2 top-1/2 size-[24rem] -translate-x-1/2 -translate-y-1/2 rotate-45 border border-[#d8ad5b]/15" />
        <div className="relative flex h-full flex-col justify-end p-14">
          <Sparkles className="mb-8 size-8 text-[#d8ad5b]" />
          <p className="max-w-xl font-display text-6xl leading-[.95]">
            Live today. Love tomorrow. Keep every chapter.
          </p>
          <p className="mt-6 font-mono text-xs uppercase tracking-[.2em] text-[#d8ad5b]">
            Boom, Belgium · Private fan archive
          </p>
        </div>
      </aside>
    </main>
  );
}
