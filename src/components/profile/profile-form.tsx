"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  profileUpdateSchema,
  type ProfileUpdateValues,
} from "@/lib/validation/auth";

export function ProfileForm({
  avatarUrl,
  displayName,
  userId,
}: {
  avatarUrl: string | null;
  displayName: string;
  userId: string;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<
    { tone: "error" | "success"; message: string } | undefined
  >();
  const form = useForm<ProfileUpdateValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      displayName,
      avatarUrl: avatarUrl ?? "",
    },
  });

  async function onSubmit(values: ProfileUpdateValues) {
    setFeedback(undefined);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: values.displayName,
          avatar_url: values.avatarUrl || null,
        })
        .eq("id", userId);

      if (error) {
        setFeedback({ tone: "error", message: error.message });
        return;
      }

      setFeedback({ tone: "success", message: "Profile updated." });
      router.refresh();
    } catch {
      setFeedback({
        tone: "error",
        message: "Supabase is not configured. Check your environment.",
      });
    }
  }

  return (
    <form
      className="mt-8 space-y-5"
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Field error={form.formState.errors.displayName?.message} label="Display name">
        <Input autoComplete="name" {...form.register("displayName")} />
      </Field>
      <Field error={form.formState.errors.avatarUrl?.message} label="Avatar URL">
        <Input
          placeholder="https://example.com/avatar.jpg"
          type="url"
          {...form.register("avatarUrl")}
        />
      </Field>
      {feedback && (
        <div
          className={
            feedback.tone === "error"
              ? "text-sm text-destructive"
              : "text-sm text-foreground"
          }
          role={feedback.tone === "error" ? "alert" : "status"}
        >
          {feedback.tone === "success" && (
            <CheckCircle2 className="mr-2 inline size-4 text-primary" />
          )}
          {feedback.message}
        </div>
      )}
      <Button disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        {form.formState.isSubmitting ? "Saving…" : "Save profile"}
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
