import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const signupHref = next
    ? `/signup?next=${encodeURIComponent(next)}`
    : "/signup";
  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[.22em] text-primary">The gates are open</p>
      <h1 className="mt-3 font-display text-5xl">Return to your story.</h1>
      <p className="mb-8 mt-3 text-muted-foreground">Sign in to enter your private festival archive.</p>
      <LoginForm initialError={error} next={next} />
      <Link
        className="mt-4 block text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        href="/forgot-password"
      >
        Forgot your password?
      </Link>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link className="font-semibold text-foreground underline underline-offset-4" href={signupHref}>Create an account</Link>
      </p>
    </>
  );
}
