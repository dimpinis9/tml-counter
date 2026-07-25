import { Eye } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:py-5">
      <Link className="group flex items-center gap-2.5 font-display text-xl" href="/">
        <span className="festival-emblem grid size-10 place-items-center rounded-full border border-primary/40 bg-card shadow-[0_0_25px_-8px_var(--primary)] transition group-hover:rotate-12">
          <Eye className="size-4 text-primary" />
        </span>
        <span>Tomorrowland <em className="font-normal text-primary">Memories</em></span>
      </Link>
      <nav className="flex items-center gap-1" aria-label="Main navigation">
        <ThemeToggle />
        <Button asChild className="hidden sm:inline-flex" size="sm" variant="ghost">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild className="px-3 sm:px-4" size="sm">
          <Link href="/signup">Enter the story</Link>
        </Button>
      </nav>
    </header>
  );
}
