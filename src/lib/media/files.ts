export const PHOTO_MAX_BYTES = 30 * 1024 * 1024;
export const VIDEO_MAX_MB = getConfiguredVideoMaxMb();
export const VIDEO_MAX_BYTES = VIDEO_MAX_MB * 1024 * 1024;

const photoTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const videoTypes = new Set(["video/mp4", "video/quicktime", "video/webm"]);

const extensionMimeTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

export type MediaType = "photo" | "video";

export type FileLike = {
  name: string;
  size: number;
  type: string;
};

export type ValidatedMediaFile = {
  mediaType: MediaType;
  mimeType: string;
};

export type FileValidationResult =
  | { success: true; data: ValidatedMediaFile }
  | { success: false; error: string };

export function validateMediaFile(file: FileLike): FileValidationResult {
  const extension = getFileExtension(file.name);
  const inferredMime = extensionMimeTypes[extension];
  const mimeType = file.type.toLowerCase() || inferredMime;

  if (!mimeType || (!photoTypes.has(mimeType) && !videoTypes.has(mimeType))) {
    return {
      success: false,
      error: "Unsupported file. Choose JPEG, PNG, WebP, HEIC, MP4, MOV, or WebM.",
    };
  }

  const mediaType: MediaType = photoTypes.has(mimeType) ? "photo" : "video";
  const limit = mediaType === "photo" ? PHOTO_MAX_BYTES : VIDEO_MAX_BYTES;

  if (file.size <= 0) {
    return { success: false, error: "This file is empty." };
  }

  if (file.size > limit) {
    return {
      success: false,
      error:
        mediaType === "photo"
          ? "Photos must be 30 MB or smaller."
          : `Videos must be ${VIDEO_MAX_MB} MB or smaller.`,
    };
  }

  return { success: true, data: { mediaType, mimeType } };
}

export function sanitizeFilename(filename: string) {
  const leafName = filename.split(/[/\\]/).pop() ?? "file";
  const lastDot = leafName.lastIndexOf(".");
  const rawBase = lastDot > 0 ? leafName.slice(0, lastDot) : leafName;
  const rawExtension = lastDot > 0 ? leafName.slice(lastDot + 1) : "";
  const base = rawBase
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[-_.]+|[-_.]+$/g, "")
    .slice(0, 100);
  const extension = rawExtension
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10);

  return `${base || "media"}${extension ? `.${extension}` : ""}`;
}

export function buildStoragePath({
  filename,
  mediaId,
  tripId,
  userId,
}: {
  filename: string;
  mediaId: string;
  tripId: string;
  userId: string;
}) {
  if (![tripId, userId, mediaId].every(isUuid)) {
    throw new Error("Storage paths require valid UUID identifiers.");
  }

  return `trips/${tripId}/${userId}/${mediaId}/${sanitizeFilename(filename)}`;
}

export function getStoragePathIdentity(path: string) {
  const parts = path.split("/");
  if (
    parts.length !== 5 ||
    parts[0] !== "trips" ||
    !isUuid(parts[1] ?? "") ||
    !isUuid(parts[2] ?? "") ||
    !isUuid(parts[3] ?? "") ||
    !parts[4] ||
    parts[4].includes("..") ||
    parts[4].includes("/") ||
    parts[4].includes("\\")
  ) {
    return null;
  }

  return {
    tripId: parts[1] as string,
    userId: parts[2] as string,
    mediaId: parts[3] as string,
    filename: parts[4] as string,
  };
}

export function getFileExtension(filename: string) {
  const extension = filename.split(".").pop();
  return extension && extension !== filename ? extension.toLowerCase() : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getConfiguredVideoMaxMb() {
  const configured = Number(process.env.NEXT_PUBLIC_VIDEO_MAX_MB ?? "50");
  return Number.isInteger(configured) && configured >= 1 && configured <= 1024
    ? configured
    : 50;
}
