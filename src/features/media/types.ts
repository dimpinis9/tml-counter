import type { MediaFilter, MediaSort } from "@/lib/media/gallery";

export type MediaListItem = {
  id: string;
  filename: string;
  mediaType: "photo" | "video";
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  capturedAt: string | null;
  createdAt: string;
  uploadedBy: string;
  uploaderName: string;
  thumbnailUrl: string | null;
  thumbnailExpiresAt: string | null;
};

export type MediaPage = {
  items: MediaListItem[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  filter: MediaFilter;
  sort: MediaSort;
};

export type MediaPageResult =
  | { success: true; data: MediaPage }
  | { success: false; error: string };

export type MediaUrlPurpose = "thumbnail" | "viewer" | "download";

export type MediaUrlResult =
  | {
      success: true;
      url: string;
      expiresAt: string;
      filename: string;
    }
  | { success: false; error: string };

export type DeleteMediaResult =
  | { success: true }
  | { success: false; error: string; partial?: boolean };

export type OwnerArchiveManifestResult =
  | {
      success: true;
      filename: string;
      totalBytes: number;
      expiresAt: string;
      items: Array<{
        url: string;
        archiveName: string;
        fileSize: number;
      }>;
    }
  | { success: false; error: string };
