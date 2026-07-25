import type { Metadata } from "next";
import { Mail, UserRound } from "lucide-react";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/profile-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your profile" };

type ProfileRow = {
  display_name: string;
  avatar_url: string | null;
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single<ProfileRow>();

  return (
    <section className="mx-auto max-w-3xl px-4 pb-[max(3.5rem,env(safe-area-inset-bottom))] pt-8 sm:px-8 sm:py-14">
      <p className="font-mono text-xs uppercase tracking-[.22em] text-primary">
        Festival identity
      </p>
      <h1 className="mt-2 break-words font-display text-[clamp(3.25rem,16vw,4.5rem)] leading-[.92]">
        Your festival profile
      </h1>
      <div className="mt-8 grid gap-7 rounded-[1.75rem] border border-border bg-card p-5 sm:mt-10 sm:grid-cols-[10rem_1fr] sm:rounded-[2rem] sm:p-10">
        <div className="flex min-w-0 items-center gap-4 sm:block">
          <span className="grid size-20 shrink-0 place-items-center rounded-full bg-primary/10 sm:size-28">
            <UserRound className="size-10 text-primary" />
          </span>
          <p className="flex min-w-0 items-center gap-2 break-all text-xs text-muted-foreground sm:mt-5">
            <Mail className="size-3.5 shrink-0" /> {user.email}
          </p>
        </div>
        <div>
          {error || !profile ? (
            <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              Profile unavailable. Apply the database migration, then create a
              new account.
            </p>
          ) : (
            <>
              <h2 className="font-display text-3xl">How your people see you</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep your name familiar across every shared chapter.
              </p>
              <ProfileForm
                avatarUrl={profile.avatar_url}
                displayName={profile.display_name}
                userId={user.id}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
