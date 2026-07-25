"use server";

import { revalidatePath } from "next/cache";

import { executeCreateTrip } from "@/features/trips/create-trip";
import { canRemoveMember } from "@/lib/auth/trip-permissions";
import { cleanupTripStorage } from "@/lib/storage/trip-cleanup";
import { createClient } from "@/lib/supabase/server";
import {
  tripIdSchema,
  tripSchema,
  type TripValues,
} from "@/lib/validation/trips";

export type TripActionResult =
  | { success: true; tripId?: string }
  | { success: false; error: string };

export async function createTripAction(
  input: TripValues,
): Promise<TripActionResult> {
  const parsed = tripSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid trip." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Your session has expired. Sign in again." };
  }

  const result = await executeCreateTrip(parsed.data, async (args) => {
    const { data, error } = await supabase.rpc("create_trip", args);
    return { data: typeof data === "string" ? data : null, error };
  });

  if (!result.success) {
    return result;
  }

  revalidatePath("/trips");
  return { success: true, tripId: result.tripId };
}

export async function updateTripAction(
  tripId: string,
  input: TripValues,
): Promise<TripActionResult> {
  const parsedId = tripIdSchema.safeParse(tripId);
  const parsed = tripSchema.safeParse(input);
  if (!parsedId.success || !parsed.success) {
    return { success: false, error: "Invalid trip settings." };
  }

  const authorization = await getOwnerAuthorization(parsedId.data);
  if (!authorization.success) {
    return authorization;
  }

  const { error } = await authorization.supabase
    .from("trips")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      cover_path: parsed.data.coverPlaceholder,
    })
    .eq("id", parsedId.data);

  if (error) {
    return { success: false, error: "The trip settings could not be saved." };
  }

  revalidatePath("/trips");
  revalidatePath(`/trips/${parsedId.data}`);
  revalidatePath(`/trips/${parsedId.data}/settings`);
  return { success: true, tripId: parsedId.data };
}

export async function removeMemberAction(
  tripId: string,
  targetUserId: string,
): Promise<TripActionResult> {
  const parsedId = tripIdSchema.safeParse(tripId);
  const parsedTarget = tripIdSchema.safeParse(targetUserId);
  if (!parsedId.success || !parsedTarget.success) {
    return { success: false, error: "Invalid membership." };
  }

  const authorization = await getOwnerAuthorization(parsedId.data);
  if (!authorization.success) {
    return authorization;
  }

  if (
    !canRemoveMember({
      actorId: authorization.userId,
      actorRole: "owner",
      targetUserId: parsedTarget.data,
    })
  ) {
    return { success: false, error: "You cannot remove yourself from your trip." };
  }

  const { error } = await authorization.supabase
    .from("trip_members")
    .delete()
    .eq("trip_id", parsedId.data)
    .eq("user_id", parsedTarget.data);

  if (error) {
    return { success: false, error: "The member could not be removed." };
  }

  revalidatePath(`/trips/${parsedId.data}`);
  revalidatePath(`/trips/${parsedId.data}/settings`);
  return { success: true, tripId: parsedId.data };
}

export async function deleteTripAction(
  tripId: string,
): Promise<TripActionResult> {
  const parsedId = tripIdSchema.safeParse(tripId);
  if (!parsedId.success) {
    return { success: false, error: "Invalid trip." };
  }

  const authorization = await getOwnerAuthorization(parsedId.data);
  if (!authorization.success) {
    return authorization;
  }

  const { data: mediaRows, error: mediaError } = await authorization.supabase
    .from("media")
    .select("storage_path")
    .eq("trip_id", parsedId.data)
    .returns<Array<{ storage_path: string }>>();
  if (mediaError) {
    return { success: false, error: "The chapter files could not be checked." };
  }

  const cleanup = await cleanupTripStorage(
    (mediaRows ?? []).map((item) => item.storage_path),
  );
  if (!cleanup.success) {
    return cleanup;
  }

  const { error } = await authorization.supabase
    .from("trips")
    .delete()
    .eq("id", parsedId.data);

  if (error) {
    return {
      success: false,
      error:
        mediaRows && mediaRows.length > 0
          ? "The files were removed, but the chapter record could not be deleted. Retry."
          : "The trip could not be deleted.",
    };
  }

  revalidatePath("/trips");
  return { success: true };
}

async function getOwnerAuthorization(tripId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false as const,
      error: "Your session has expired. Sign in again.",
    };
  }

  const { data } = await supabase
    .from("trip_members")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .maybeSingle<{ role: "owner" | "member" }>();

  if (data?.role !== "owner") {
    return {
      success: false as const,
      error: "Only the trip owner can perform this action.",
    };
  }

  return { success: true as const, supabase, userId: user.id };
}
