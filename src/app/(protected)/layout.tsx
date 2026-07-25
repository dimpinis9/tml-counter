import { Eye, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:py-6">
        <Link className="flex items-center gap-2 font-display text-xl" href="/trips">
          <span className="festival-emblem grid size-9 place-items-center rounded-full border border-primary/35">
            <Eye className="size-4 text-primary" />
          </span>
          <span className="hidden min-[360px]:inline">Tomorrowland Memories</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild aria-label="Your profile" size="icon" variant="ghost">
            <Link href="/profile"><UserRound className="size-4" /></Link>
          </Button>
          <LogoutButton />
        </div>
      </header>
      {children}
    </main>
  );
}
