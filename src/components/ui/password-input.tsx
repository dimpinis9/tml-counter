"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type InputHTMLAttributes } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const PasswordInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function PasswordInput({ className, ...props }, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        className={cn("pr-12", className)}
        ref={ref}
        type={visible ? "text" : "password"}
        {...props}
      />
      <Button
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-0.5 top-0.5 size-11"
        onClick={() => setVisible((current) => !current)}
        size="icon"
        type="button"
        variant="ghost"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
});
