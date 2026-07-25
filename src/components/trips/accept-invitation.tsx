"use client";

import { LoaderCircle, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { acceptInvitationAction } from "@/features/invitations/actions";

export function AcceptInvitation({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  async function accept() {
    setError(undefined);
    setIsPending(true);
    const result = await acceptInvitationAction(token);
    if (!result.success) {
      setError(result.error);
      setIsPending(false);
      return;
    }
    router.replace(`/trips/${result.tripId}`);
    router.refresh();
  }

  return (
    <div>
      <Button className="w-full" disabled={isPending} onClick={() => void accept()}>
        {isPending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Users className="size-4" />
        )}
        Join private chapter
      </Button>
      {error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
