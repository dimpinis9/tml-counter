"use server";

import type { OwnerArchiveManifestResult } from "@/features/media/types";
import { canDownloadTripArchive } from "@/lib/auth/trip-permissions";
import {
  getArchiveEntryName,
  getTripArchiveFilename,
} from "@/lib/media/archive";
import { createClient } from "@/lib/supabase/server";
import { tripIdSchema } from "@/lib/validation/trips";

const ARCHIVE_URL_TTL_SECONDS = 60 * 60;

type ArchiveMediaRow = {
  storage_path: string;
  original_filename: string;
  media_type: "photo" | "video";
  file_size: number;
};

export async function createOwnerArchiveManifestAction(
  tripId: string,
): Promise<OwnerArchiveManifestResult> {
  const parsedTripId = tripIdSchema.safeParse(tripId);
  if (!parsedTripId.success) {
    return { success: false, error: "Invalid chapter." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Your session has expired. Sign in again." };
  }

  const [{ data: membership }, { data: trip }, { data: media, error: mediaError }] =
    await Promise.all([
      supabase
        .from("trip_members")
        .select("role")
        .eq("trip_id", parsedTripId.data)
        .eq("user_id", user.id)
        .maybeSingle<{ role: "owner" | "member" }>(),
      supabase
        .from("trips")
        .select("name")
        .eq("id", parsedTripId.data)
        .maybeSingle<{ name: string }>(),
      supabase
        .from("media")
        .select("storage_path, original_filename, media_type, file_size")
        .eq("trip_id", parsedTripId.data)
        .order("created_at", { ascending: true })
        .returns<ArchiveMediaRow[]>(),
    ]);

  if (!canDownloadTripArchive(membership?.role)) {
    return {
      success: false,
      error: "Only the chapter owner can download the complete archive.",
    };
  }
  if (!trip || mediaError) {
    return { success: false, error: "The chapter archive could not be prepared." };
  }
  if (!media?.length) {
    return { success: false, error: "There are no memories to download yet." };
  }

  const { data: signedFiles, error: signedUrlError } = await supabase.storage
    .from("trip-media")
    .createSignedUrls(
      media.map((item) => item.storage_path),
      ARCHIVE_URL_TTL_SECONDS,
    );

  if (
    signedUrlError ||
    !signedFiles ||
    signedFiles.length !== media.length ||
    signedFiles.some((item) => !item.signedUrl)
  ) {
    return {
      success: false,
      error: "Secure links for the complete archive could not be created.",
    };
  }

  return {
    success: true,
    filename: getTripArchiveFilename(trip.name),
    totalBytes: media.reduce((total, item) => total + item.file_size, 0),
    expiresAt: new Date(
      Date.now() + ARCHIVE_URL_TTL_SECONDS * 1000,
    ).toISOString(),
    items: media.map((item, index) => ({
      url: signedFiles[index].signedUrl as string,
      archiveName: getArchiveEntryName({
        index,
        mediaType: item.media_type,
        filename: item.original_filename,
      }),
      fileSize: item.file_size,
    })),
  };
}
