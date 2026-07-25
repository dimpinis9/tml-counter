import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[.22em] text-primary">
        Find your way back
      </p>
      <h1 className="mt-3 font-display text-5xl">Reset your password.</h1>
      <p className="mb-8 mt-3 text-muted-foreground">
        We will email you a secure link to choose a new one.
      </p>
      <ForgotPasswordForm />
      <Link
        className="mt-6 block text-center text-sm text-muted-foreground underline underline-offset-4"
        href="/login"
      >
        Return to sign in
      </Link>
    </>
  );
}
