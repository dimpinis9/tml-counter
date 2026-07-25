"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createTripAction } from "@/features/trips/actions";
import {
  coverPlaceholderValues,
  tripSchema,
  type TripValues,
} from "@/lib/validation/trips";

const coverLabels: Record<TripValues["coverPlaceholder"], string> = {
  sunset: "Mainstage gold",
  sea: "Crystal garden",
  forest: "Enchanted forest",
  night: "Freedom at night",
};

export function TripForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string>();
  const form = useForm<TripValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      name: "",
      description: "",
      coverPlaceholder: "sunset",
    },
  });

  async function onSubmit(values: TripValues) {
    setFormError(undefined);
    const result = await createTripAction(values);
    if (!result.success || !result.tripId) {
      const message = result.success
        ? "The chapter could not be created."
        : result.error;
      setFormError(message);
      toast.error(message);
      return;
    }

    toast.success("Your new chapter is ready.");
    router.push(`/trips/${result.tripId}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <Field error={form.formState.errors.name?.message} label="Chapter name">
        <Input
          autoFocus
          placeholder="Tomorrowland Belgium 2026"
          {...form.register("name")}
        />
      </Field>
      <Field
        error={form.formState.errors.description?.message}
        label="Description"
      >
        <Textarea
          placeholder="The stages, the people, the songs and everything nobody should forget…"
          {...form.register("description")}
        />
      </Field>
      <fieldset>
        <legend className="mb-3 text-sm font-medium">Chapter atmosphere</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {coverPlaceholderValues.map((cover) => (
            <label className="cursor-pointer" key={cover}>
              <input
                className="peer sr-only"
                type="radio"
                value={cover}
                {...form.register("coverPlaceholder")}
              />
              <span
                className={`block h-24 rounded-2xl border-2 border-transparent p-3 text-xs font-semibold text-white shadow-sm transition peer-checked:border-foreground peer-checked:ring-2 peer-checked:ring-background ${
                  cover === "sunset"
                    ? "bg-[radial-gradient(circle_at_70%_20%,#e8c46f,transparent_18%),linear-gradient(145deg,#071a15,#7d3159)]"
                    : cover === "sea"
                      ? "bg-[radial-gradient(circle_at_25%_20%,#d8bd76,transparent_18%),linear-gradient(145deg,#09221b,#287d70)]"
                      : cover === "forest"
                        ? "bg-[radial-gradient(circle_at_70%_20%,#dfc775,transparent_16%),linear-gradient(145deg,#06130d,#315f43)]"
                        : "bg-[radial-gradient(circle_at_70%_20%,#ebca72,transparent_10%),linear-gradient(145deg,#07111d,#43254f)]"
                }`}
              >
                {coverLabels[cover]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {formError && (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      )}
      <Button
        className="w-full sm:w-auto"
        disabled={form.formState.isSubmitting}
        type="submit"
      >
        {form.formState.isSubmitting ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <ArrowRight className="size-4" />
        )}
        {form.formState.isSubmitting ? "Creating…" : "Create chapter"}
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
