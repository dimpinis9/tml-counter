"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      closeButton
      position="bottom-center"
      richColors
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      toastOptions={{
        classNames: {
          toast:
            "mb-[env(safe-area-inset-bottom)] font-sans rounded-xl border-border bg-card text-foreground sm:mb-0",
        },
      }}
    />
  );
}
