import {
  canIssueMediaSignedUrl,
} from "@/lib/auth/media-permissions";
import {
  getPaginationRange,
  MEDIA_PAGE_SIZE,
  normalizeMediaFilter,
  normalizeMediaSort,
  type MediaFilter,
  type MediaSort,
} from "@/lib/media/gallery";
import { createClient } from "@/lib/supabase/server";
import { tripIdSchema } from "@/lib/validation/trips";
import type { MediaPageResult } from "@/features/media/types";

const THUMBNAIL_TTL_SECONDS = 5 * 60;

type MediaRow = {
  id: string;
  original_filename: string;
  media_type: "photo" | "video";
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  captured_at: string | null;
  created_at: string;
  uploaded_by: string;
  storage_path: string;
  profiles: { display_name: string } | null;
};

export async function getMediaPage({
  tripId,
  page = 1,
  filter = "all",
  sort = "newest",
}: {
  tripId: string;
  page?: number;
  filter?: MediaFilter | string;
  sort?: MediaSort | string;
}): Promise<MediaPageResult> {
  const parsedTripId = tripIdSchema.safeParse(tripId);
  if (!parsedTripId.success) {
    return { success: false, error: "Invalid trip." };
  }

  const normalizedFilter = normalizeMediaFilter(filter);
  const normalizedSort = normalizeMediaSort(sort);
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Your session has expired. Sign in again." };
  }

  const { data: membership } = await supabase
    .from("trip_members")
    .select("user_id")
    .eq("trip_id", parsedTripId.data)
    .eq("user_id", user.id)
    .maybeSingle<{ user_id: string }>();

  if (!canIssueMediaSignedUrl({ isTripMember: Boolean(membership) })) {
    return { success: false, error: "You do not have access to this trip." };
  }

  const { from, to } = getPaginationRange(safePage);
  let query = supabase
    .from("media")
    .select(
      "id, original_filename, media_type, mime_type, file_size, width, height, duration_seconds, captured_at, created_at, uploaded_by, storage_path, profiles!media_uploaded_by_fkey(display_name)",
      { count: "exact" },
    )
    .eq("trip_id", parsedTripId.data);

  if (normalizedFilter !== "all") {
    query = query.eq("media_type", normalizedFilter);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: normalizedSort === "oldest" })
    .order("id", { ascending: normalizedSort === "oldest" })
    .range(from, to)
    .returns<MediaRow[]>();

  if (error) {
    return { success: false, error: "The gallery could not be loaded." };
  }

  const rows = data ?? [];
  const thumbnailUrls = await createThumbnailUrls(
    supabase,
    rows.filter((item) => item.media_type === "photo"),
  );
  const expiresAt = new Date(
    Date.now() + THUMBNAIL_TTL_SECONDS * 1000,
  ).toISOString();
  const total = count ?? 0;

  return {
    success: true,
    data: {
      items: rows.map((item) => ({
        id: item.id,
        filename: item.original_filename,
        mediaType: item.media_type,
        mimeType: item.mime_type,
        fileSize: Number(item.file_size),
        width: item.width,
        height: item.height,
        durationSeconds:
          item.duration_seconds === null
            ? null
            : Number(item.duration_seconds),
        capturedAt: item.captured_at,
        createdAt: item.created_at,
        uploadedBy: item.uploaded_by,
        uploaderName: item.profiles?.display_name ?? "Trip member",
        thumbnailUrl: thumbnailUrls.get(item.storage_path) ?? null,
        thumbnailExpiresAt: thumbnailUrls.has(item.storage_path)
          ? expiresAt
          : null,
      })),
      page: safePage,
      pageSize: MEDIA_PAGE_SIZE,
      total,
      hasMore: to + 1 < total,
      filter: normalizedFilter,
      sort: normalizedSort,
    },
  };
}

async function createThumbnailUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: Array<Pick<MediaRow, "storage_path">>,
) {
  const result = new Map<string, string>();

  if (
    process.env.SUPABASE_IMAGE_TRANSFORMATIONS_ENABLED !== "true" ||
    rows.length === 0
  ) {
    return result;
  }

  await Promise.all(
    rows.map(async (item) => {
      const { data } = await supabase.storage
        .from("trip-media")
        .createSignedUrl(item.storage_path, THUMBNAIL_TTL_SECONDS, {
          transform: {
            width: 640,
            height: 640,
            quality: 72,
            resize: "cover",
          },
        });
      if (data?.signedUrl) {
        result.set(item.storage_path, data.signedUrl);
      }
    }),
  );

  return result;
}
