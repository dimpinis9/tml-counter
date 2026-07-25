export const MEDIA_PAGE_SIZE = 24;
export const BULK_DOWNLOAD_COUNT_WARNING = 8;
export const BULK_DOWNLOAD_SIZE_WARNING = 500 * 1024 * 1024;

export type MediaFilter = "all" | "photo" | "video";
export type MediaSort = "newest" | "oldest";

export function normalizeMediaFilter(value: string): MediaFilter {
  return value === "photo" || value === "video" ? value : "all";
}

export function normalizeMediaSort(value: string): MediaSort {
  return value === "oldest" ? "oldest" : "newest";
}

export function getPaginationRange(page: number, pageSize = MEDIA_PAGE_SIZE) {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isInteger(pageSize) && pageSize > 0 ? pageSize : MEDIA_PAGE_SIZE;

  return {
    from: (safePage - 1) * safePageSize,
    to: safePage * safePageSize - 1,
  };
}

export function matchesMediaFilter(
  mediaType: "photo" | "video",
  filter: MediaFilter,
) {
  return filter === "all" || mediaType === filter;
}

export function getDownloadFilename(filename: string) {
  const basename = filename.replaceAll("\\", "/").split("/").at(-1) ?? "";
  const cleaned = basename
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[<>:"|?*]/g, "-")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 180);

  return cleaned || "keepsake-download";
}

export function shouldWarnForBulkDownload(
  items: ReadonlyArray<{ fileSize: number }>,
) {
  return (
    items.length >= BULK_DOWNLOAD_COUNT_WARNING ||
    items.reduce((total, item) => total + item.fileSize, 0) >=
      BULK_DOWNLOAD_SIZE_WARNING
  );
}
