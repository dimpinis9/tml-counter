import { getDownloadFilename } from "@/lib/media/gallery";

export const LARGE_ARCHIVE_WARNING_BYTES = 500 * 1024 * 1024;

export function getArchiveEntryName({
  index,
  mediaType,
  filename,
}: {
  index: number;
  mediaType: "photo" | "video";
  filename: string;
}) {
  const folder = mediaType === "photo" ? "Photos" : "Videos";
  const position = String(Math.max(1, index + 1)).padStart(4, "0");

  return `${folder}/${position}-${getDownloadFilename(filename)}`;
}

export function getTripArchiveFilename(tripName: string, date = new Date()) {
  const safeName = getDownloadFilename(tripName)
    .replace(/\.[a-z0-9]{1,8}$/i, "")
    .replace(/\s+/g, "-");
  const datePart = date.toISOString().slice(0, 10);

  return `${safeName || "chapter"}-originals-${datePart}.zip`;
}

