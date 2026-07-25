import type { Metadata } from "next";
import Link from "next/link";

import { SignupForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const loginHref = next
    ? `/login?next=${encodeURIComponent(next)}`
    : "/login";

  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[.22em] text-primary">Your Book of Memories</p>
      <h1 className="mt-3 font-display text-5xl">Begin the first chapter.</h1>
      <p className="mb-8 mt-3 text-muted-foreground">Create a private archive for the people who shared the magic.</p>
      <SignupForm next={next} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link className="font-semibold text-foreground underline underline-offset-4" href={loginHref}>Sign in</Link>
      </p>
    </>
  );
}
