import { redirect } from "next/navigation";

import { AcceptInvitation } from "@/components/trips/accept-invitation";
import { createClient } from "@/lib/supabase/server";
import { invitationTokenSchema } from "@/lib/validation/invitations";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const parsed = invitationTokenSchema.safeParse(token);
  if (!parsed.success) {
    redirect("/trips");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${parsed.data}`)}`);
  }

  return (
    <section className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-xl place-items-center px-4 py-12">
      <div className="w-full rounded-[2rem] border border-border bg-card p-6 text-center shadow-2xl sm:p-10">
        <p className="font-mono text-xs uppercase tracking-[.22em] text-primary">
          A private invitation
        </p>
        <h1 className="mt-3 font-display text-5xl leading-none">
          Join the story.
        </h1>
        <p className="mx-auto mb-7 mt-4 max-w-md text-sm leading-6 text-muted-foreground">
          Accept to become a member of this private chapter and share its
          photos and videos.
        </p>
        <AcceptInvitation token={parsed.data} />
      </div>
    </section>
  );
}
