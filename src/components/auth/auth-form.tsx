"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/client";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  type ForgotPasswordValues,
  type LoginValues,
  type ResetPasswordValues,
  type SignupValues,
} from "@/lib/validation/auth";

type Feedback = { tone: "error" | "success"; message: string } | null;

export function LoginForm({
  initialError,
  next,
}: {
  initialError?: string;
  next?: string;
}) {
  const [feedback, setFeedback] = useState<Feedback>(
    initialError ? { tone: "error", message: initialError } : null,
  );
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setFeedback(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) {
        setFeedback({ tone: "error", message: error.message });
        return;
      }
      window.location.replace(getSafeRedirectPath(next ?? null));
    } catch {
      setFeedback({
        tone: "error",
        message: "Authentication is not configured. Check your environment.",
      });
    }
  }

  return (
    <AuthFormShell
      feedback={feedback}
      isSubmitting={form.formState.isSubmitting}
      onSubmit={form.handleSubmit(onSubmit)}
      submitLabel="Continue"
    >
      <Field error={form.formState.errors.email?.message} label="Email">
        <Input autoComplete="email" type="email" {...form.register("email")} />
      </Field>
      <Field error={form.formState.errors.password?.message} label="Password">
        <PasswordInput
          autoComplete="current-password"
          {...form.register("password")}
        />
      </Field>
    </AuthFormShell>
  );
}

export function SignupForm({ next }: { next?: string }) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignupValues) {
    setFeedback(null);
    try {
      const supabase = createClient();
      const destination = getSafeRedirectPath(next ?? null);
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { display_name: values.displayName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`,
        },
      });
      if (error) {
        setFeedback({ tone: "error", message: error.message });
        return;
      }
      if (data.session) {
        window.location.replace(destination);
        return;
      }
      setFeedback({
        tone: "success",
        message: "Check your inbox to confirm your email, then sign in.",
      });
      form.reset();
    } catch {
      setFeedback({
        tone: "error",
        message: "Authentication is not configured. Check your environment.",
      });
    }
  }

  return (
    <AuthFormShell
      feedback={feedback}
      isSubmitting={form.formState.isSubmitting}
      onSubmit={form.handleSubmit(onSubmit)}
      submitLabel="Create your account"
    >
      <Field error={form.formState.errors.displayName?.message} label="Your name">
        <Input autoComplete="name" {...form.register("displayName")} />
      </Field>
      <Field error={form.formState.errors.email?.message} label="Email">
        <Input autoComplete="email" type="email" {...form.register("email")} />
      </Field>
      <Field error={form.formState.errors.password?.message} label="Password">
        <PasswordInput autoComplete="new-password" {...form.register("password")} />
      </Field>
      <Field
        error={form.formState.errors.confirmPassword?.message}
        label="Confirm password"
      >
        <PasswordInput
          autoComplete="new-password"
          {...form.register("confirmPassword")}
        />
      </Field>
    </AuthFormShell>
  );
}

export function ForgotPasswordForm() {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setFeedback(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) {
        setFeedback({ tone: "error", message: error.message });
        return;
      }
      setFeedback({
        tone: "success",
        message: "If that account exists, a reset link is on its way.",
      });
    } catch {
      setFeedback({
        tone: "error",
        message: "Authentication is not configured. Check your environment.",
      });
    }
  }

  return (
    <AuthFormShell
      feedback={feedback}
      isSubmitting={form.formState.isSubmitting}
      onSubmit={form.handleSubmit(onSubmit)}
      submitLabel="Send reset link"
    >
      <Field error={form.formState.errors.email?.message} label="Email">
        <Input autoComplete="email" type="email" {...form.register("email")} />
      </Field>
    </AuthFormShell>
  );
}

export function ResetPasswordForm() {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordValues) {
    setFeedback(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });
      if (error) {
        setFeedback({ tone: "error", message: error.message });
        return;
      }
      setFeedback({
        tone: "success",
        message: "Password updated. You can now return to your chapters.",
      });
      form.reset();
    } catch {
      setFeedback({
        tone: "error",
        message: "Open a fresh password-reset link and try again.",
      });
    }
  }

  return (
    <AuthFormShell
      feedback={feedback}
      isSubmitting={form.formState.isSubmitting}
      onSubmit={form.handleSubmit(onSubmit)}
      submitLabel="Update password"
    >
      <Field error={form.formState.errors.password?.message} label="New password">
        <PasswordInput autoComplete="new-password" {...form.register("password")} />
      </Field>
      <Field
        error={form.formState.errors.confirmPassword?.message}
        label="Confirm password"
      >
        <PasswordInput
          autoComplete="new-password"
          {...form.register("confirmPassword")}
        />
      </Field>
    </AuthFormShell>
  );
}

function AuthFormShell({
  children,
  feedback,
  isSubmitting,
  onSubmit,
  submitLabel,
}: {
  children: React.ReactNode;
  feedback: Feedback;
  isSubmitting: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  submitLabel: string;
}) {
  return (
    <form className="space-y-4" noValidate onSubmit={onSubmit}>
      {children}
      {feedback && (
        <div
          className={
            feedback.tone === "error"
              ? "rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
              : "rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm"
          }
          role={feedback.tone === "error" ? "alert" : "status"}
        >
          {feedback.tone === "success" && (
            <CheckCircle2 className="mr-2 inline size-4 text-primary" />
          )}
          {feedback.message}
        </div>
      )}
      <Button className="mt-2 w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <ArrowRight className="size-4" />
        )}
        {isSubmitting ? "Please wait…" : submitLabel}
      </Button>
    </form>
  );
}

function Field({
  children,
  error,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error && (
        <span className="block text-xs text-destructive" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
