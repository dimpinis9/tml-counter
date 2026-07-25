"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  invitationEmailSchema,
  invitationTokenSchema,
} from "@/lib/validation/invitations";
import { tripIdSchema } from "@/lib/validation/trips";

export type InvitationActionResult =
  | { success: true; invitationUrl: string }
  | { success: false; error: string };

export async function createInvitationAction(
  tripId: string,
  email: string,
): Promise<InvitationActionResult> {
  const parsedTripId = tripIdSchema.safeParse(tripId);
  const parsedEmail = invitationEmailSchema.safeParse(email);
  if (!parsedTripId.success || !parsedEmail.success) {
    return {
      success: false,
      error: parsedEmail.error?.issues[0]?.message ?? "Invalid invitation.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Your session has expired. Sign in again." };
  }

  const { data: membership } = await supabase
    .from("trip_members")
    .select("role")
    .eq("trip_id", parsedTripId.data)
    .eq("user_id", user.id)
    .maybeSingle<{ role: "owner" | "member" }>();
  if (membership?.role !== "owner") {
    return { success: false, error: "Only the owner can invite members." };
  }

  const token = randomBytes(32).toString("base64url");
  const tokenDigest = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await supabase
    .from("trip_invitations")
    .delete()
    .eq("trip_id", parsedTripId.data)
    .eq("invited_email", parsedEmail.data)
    .is("accepted_at", null);

  const { error } = await supabase.from("trip_invitations").insert({
    trip_id: parsedTripId.data,
    invited_email: parsedEmail.data,
    token: tokenDigest,
    invited_by: user.id,
    expires_at: expiresAt,
  });
  if (error) {
    return { success: false, error: "The invitation could not be created." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (!appUrl) {
    return { success: false, error: "NEXT_PUBLIC_APP_URL is not configured." };
  }

  revalidatePath(`/trips/${parsedTripId.data}/settings`);
  return {
    success: true,
    invitationUrl: `${appUrl}/invite/${encodeURIComponent(token)}`,
  };
}

export async function acceptInvitationAction(token: string) {
  const parsedToken = invitationTokenSchema.safeParse(token);
  if (!parsedToken.success) {
    return { success: false as const, error: "This invitation link is invalid." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false as const, error: "Sign in to accept this invitation." };
  }

  const { data, error } = await supabase.rpc("accept_trip_invitation", {
    p_token: parsedToken.data,
  });
  if (error || typeof data !== "string") {
    return {
      success: false as const,
      error:
        error?.message === "This invitation belongs to another email address"
          ? error.message
          : "The invitation is invalid, expired, or already used.",
    };
  }

  revalidatePath("/trips");
  return { success: true as const, tripId: data };
}
