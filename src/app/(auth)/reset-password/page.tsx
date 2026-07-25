import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[.22em] text-primary">
        One last step
      </p>
      <h1 className="mt-3 font-display text-5xl">Choose a new password.</h1>
      <p className="mb-8 mt-3 text-muted-foreground">
        Use at least eight characters with upper and lowercase letters and a number.
      </p>
      <ResetPasswordForm />
      <Link
        className="mt-6 block text-center text-sm text-muted-foreground underline underline-offset-4"
        href="/trips"
      >
        Return to your chapters
      </Link>
    </>
  );
}
