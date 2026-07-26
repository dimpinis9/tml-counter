"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getMediaPage } from "@/features/media/data";
import type {
  DeleteMediaResult,
  MediaPageResult,
  MediaUrlPurpose,
  MediaUrlResult,
} from "@/features/media/types";
import {
  canDeleteMediaRecord,
  canIssueMediaSignedUrl,
} from "@/lib/auth/media-permissions";
import { getDownloadFilename } from "@/lib/media/gallery";
import { createClient } from "@/lib/supabase/server";
import { tripIdSchema } from "@/lib/validation/trips";

const mediaIdSchema = z.string().uuid();
const purposeSchema = z.enum(["thumbnail", "viewer", "download"]);
const URL_TTL_SECONDS = 5 * 60;

type MediaAccessRow = {
  id: string;
  trip_id: string;
  storage_path: string;
  original_filename: string;
  media_type: "photo" | "video";
  uploaded_by: string;
};

export async function loadMediaPageAction(input: {
  tripId: string;
  page: number;
  filter: string;
  sort: string;
}): Promise<MediaPageResult> {
  return getMediaPage(input);
}

export async function createMediaUrlAction(
  mediaId: string,
  purpose: MediaUrlPurpose,
): Promise<MediaUrlResult> {
  const parsedMediaId = mediaIdSchema.safeParse(mediaId);
  const parsedPurpose = purposeSchema.safeParse(purpose);
  if (!parsedMediaId.success || !parsedPurpose.success) {
    return { success: false, error: "Invalid media request." };
  }

  const authorization = await getAuthorizedMedia(parsedMediaId.data);
  if (!authorization.success) {
    return authorization;
  }

  const options =
    parsedPurpose.data === "download"
      ? { download: getDownloadFilename(authorization.media.original_filename) }
      : parsedPurpose.data === "thumbnail" &&
          authorization.media.media_type === "photo" &&
          process.env.SUPABASE_IMAGE_TRANSFORMATIONS_ENABLED === "true"
        ? {
            transform: {
              width: 640,
              height: 640,
              quality: 72,
              resize: "cover" as const,
            },
          }
        : undefined;

  const { data, error } = await authorization.supabase.storage
    .from("trip-media")
    .createSignedUrl(
      authorization.media.storage_path,
      URL_TTL_SECONDS,
      options,
    );

  if (error || !data?.signedUrl) {
    return { success: false, error: "A private media link could not be created." };
  }

  return {
    success: true,
    url: data.signedUrl,
    expiresAt: new Date(Date.now() + URL_TTL_SECONDS * 1000).toISOString(),
    filename: getDownloadFilename(authorization.media.original_filename),
  };
}

export async function deleteMediaAction(
  mediaId: string,
): Promise<DeleteMediaResult> {
  const parsedMediaId = mediaIdSchema.safeParse(mediaId);
  if (!parsedMediaId.success) {
    return { success: false, error: "Invalid media item." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Your session has expired. Sign in again." };
  }

  const { data: media } = await supabase
    .from("media")
    .select("id, trip_id, storage_path, original_filename, media_type, uploaded_by")
    .eq("id", parsedMediaId.data)
    .maybeSingle<MediaAccessRow>();

  if (
    !media ||
    !canDeleteMediaRecord({
      userId: user.id,
      uploadedBy: media.uploaded_by,
    })
  ) {
    return { success: false, error: "Only the uploader can delete this item." };
  }

  const { error: storageError } = await supabase.storage
    .from("trip-media")
    .remove([media.storage_path]);
  if (storageError) {
    return {
      success: false,
      error: "The private file could not be deleted. Nothing was changed.",
    };
  }

  const { error: databaseError } = await supabase
    .from("media")
    .delete()
    .eq("id", media.id)
    .eq("uploaded_by", user.id);
  if (databaseError) {
    return {
      success: false,
      partial: true,
      error:
        "The file was removed, but its gallery record remains. Retry deletion to finish cleanup.",
    };
  }

  revalidatePath(`/trips/${media.trip_id}`);
  return { success: true };
}

async function getAuthorizedMedia(mediaId: string) {
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

  const { data: media } = await supabase
    .from("media")
    .select("id, trip_id, storage_path, original_filename, media_type, uploaded_by")
    .eq("id", mediaId)
    .maybeSingle<MediaAccessRow>();
  if (!media) {
    return { success: false as const, error: "Media item not found." };
  }

  const parsedTripId = tripIdSchema.safeParse(media.trip_id);
  if (!parsedTripId.success) {
    return { success: false as const, error: "Invalid media item." };
  }

  const { data: membership } = await supabase
    .from("trip_members")
    .select("user_id")
    .eq("trip_id", parsedTripId.data)
    .eq("user_id", user.id)
    .maybeSingle<{ user_id: string }>();

  if (!canIssueMediaSignedUrl({ isTripMember: Boolean(membership) })) {
    return {
      success: false as const,
      error: "You do not have access to this media.",
    };
  }

  return { success: true as const, supabase, media };
}
