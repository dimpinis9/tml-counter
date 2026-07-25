"use client";

import { Check, Copy, LoaderCircle, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createInvitationAction } from "@/features/invitations/actions";
import { invitationEmailSchema } from "@/lib/validation/invitations";

export function InviteMemberForm({ tripId }: { tripId: string }) {
  const [email, setEmail] = useState("");
  const [invitationUrl, setInvitationUrl] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  async function createInvitation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = invitationEmailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message);
      return;
    }

    setIsPending(true);
    const result = await createInvitationAction(tripId, parsed.data);
    setIsPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setInvitationUrl(result.invitationUrl);
    toast.success("Private invitation created.");
  }

  async function copyInvitation() {
    if (!invitationUrl) return;
    try {
      await navigator.clipboard.writeText(invitationUrl);
      toast.success("Invitation link copied.");
    } catch {
      toast.error("Copy failed. Select and copy the link manually.");
    }
  }

  return (
    <form className="mt-6 space-y-3" onSubmit={createInvitation}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          autoComplete="email"
          onChange={(event) => {
            setEmail(event.target.value);
            setInvitationUrl(undefined);
          }}
          placeholder="friend@example.com"
          type="email"
          value={email}
        />
        <Button className="shrink-0" disabled={isPending} type="submit">
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <UserPlus className="size-4" />
          )}
          Create invite
        </Button>
      </div>
      {invitationUrl && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 p-2">
          <Check className="size-4 shrink-0 text-primary" />
          <input
            aria-label="Invitation link"
            className="min-w-0 flex-1 bg-transparent text-xs outline-none"
            readOnly
            value={invitationUrl}
          />
          <Button
            aria-label="Copy invitation link"
            onClick={() => void copyInvitation()}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Copy className="size-4" />
          </Button>
        </div>
      )}
      <p className="text-xs leading-5 text-muted-foreground">
        The link expires after 7 days and only works for this email address.
      </p>
    </form>
  );
}
