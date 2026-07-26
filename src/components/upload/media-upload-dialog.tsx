"use client";

import {
  Check,
  CircleAlert,
  FileVideo,
  Images,
  LoaderCircle,
  Pause,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  startResumableUpload,
  type ResumableUploadHandle,
} from "@/features/media/resumable-upload";
import {
  buildStoragePath,
  validateMediaFile,
  type MediaType,
} from "@/lib/media/files";
import { extractMediaMetadata } from "@/lib/media/metadata";
import {
  buildThumbnailStoragePath,
  createPhotoThumbnail,
} from "@/lib/media/thumbnails";
import { createClient } from "@/lib/supabase/client";

type UploadStatus =
  | "queued"
  | "uploading"
  | "success"
  | "error"
  | "cancelled";

type UploadItem = {
  clientId: string;
  error?: string;
  file: File;
  mediaType: MediaType | null;
  mimeType: string | null;
  previewUrl: string | null;
  progressBytes: number;
  status: UploadStatus;
};

const acceptedFiles = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  ".heic",
  ".heif",
  ".mov",
].join(",");

export function MediaUploadDialog({
  tripId,
  userId,
  autoOpen = false,
}: {
  tripId: string;
  userId: string;
  autoOpen?: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUploads = useRef(new Map<string, ResumableUploadHandle>());
  const previewUrls = useRef(new Set<string>());
  const [dragging, setDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [open, setOpen] = useState(autoOpen);

  useEffect(() => {
    if (autoOpen) {
      router.replace(`/trips/${tripId}`, { scroll: false });
    }
  }, [autoOpen, router, tripId]);

  const validItems = items.filter((item) => item.mediaType);
  const totalBytes = validItems.reduce((total, item) => total + item.file.size, 0);
  const uploadedBytes = validItems.reduce(
    (total, item) =>
      total +
      (item.status === "success" ? item.file.size : item.progressBytes),
    0,
  );
  const overallProgress =
    totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;
  const queuedCount = items.filter(
    (item) => item.status === "queued" || item.status === "cancelled",
  ).length;
  const successCount = items.filter((item) => item.status === "success").length;
  const duplicateKeys = useMemo(
    () =>
      new Set(
        items.map(
          (item) =>
            `${item.file.name}:${item.file.size}:${item.file.lastModified}`,
        ),
      ),
    [items],
  );

  useEffect(() => {
    const urls = previewUrls.current;
    return () => {
      for (const previewUrl of urls) {
        URL.revokeObjectURL(previewUrl);
      }
      urls.clear();
    };
  }, []);

  function addFiles(files: File[]) {
    const nextItems: UploadItem[] = [];
    const knownKeys = new Set(duplicateKeys);

    for (const file of files) {
      const duplicateKey = `${file.name}:${file.size}:${file.lastModified}`;
      if (knownKeys.has(duplicateKey)) {
        toast.info(`${file.name} is already in the queue.`);
        continue;
      }
      knownKeys.add(duplicateKey);

      const validation = validateMediaFile(file);
      const previewUrl =
        validation.success && validation.data.mediaType === "photo"
          ? URL.createObjectURL(file)
          : null;
      if (previewUrl) {
        previewUrls.current.add(previewUrl);
      }

      nextItems.push({
        clientId: crypto.randomUUID(),
        error: validation.success ? undefined : validation.error,
        file,
        mediaType: validation.success ? validation.data.mediaType : null,
        mimeType: validation.success ? validation.data.mimeType : null,
        previewUrl,
        progressBytes: 0,
        status: validation.success ? "queued" : "error",
      });
    }

    setItems((current) => [...current, ...nextItems]);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  function removeItem(clientId: string) {
    setItems((current) => {
      const item = current.find((candidate) => candidate.clientId === clientId);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
        previewUrls.current.delete(item.previewUrl);
      }
      return current.filter((candidate) => candidate.clientId !== clientId);
    });
  }

  function updateItem(clientId: string, update: Partial<UploadItem>) {
    setItems((current) =>
      current.map((item) =>
        item.clientId === clientId ? { ...item, ...update } : item,
      ),
    );
  }

  async function uploadItems(clientIds: string[]) {
    if (isUploading || clientIds.length === 0) {
      return;
    }

    setIsUploading(true);
    let completed = 0;
    const supabase = createClient();

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user || user.id !== userId) {
        throw new Error("Your session changed. Refresh and try again.");
      }

      const { data: membership } = await supabase
        .from("trip_members")
        .select("user_id")
        .eq("trip_id", tripId)
        .eq("user_id", user.id)
        .maybeSingle<{ user_id: string }>();
      if (!membership) {
        throw new Error("You are not a member of this trip.");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Your session has expired. Sign in again.");
      }

      for (const clientId of clientIds) {
        const item = items.find((candidate) => candidate.clientId === clientId);
        if (!item?.mediaType || !item.mimeType) {
          continue;
        }

        updateItem(clientId, {
          status: "uploading",
          error: undefined,
          progressBytes: 0,
        });

        const mediaId = crypto.randomUUID();
        const storagePath = buildStoragePath({
          tripId,
          userId: user.id,
          mediaId,
          filename: item.file.name,
        });

        try {
          const metadata = await extractMediaMetadata(item.file, item.mediaType);
          const thumbnail =
            item.mediaType === "photo"
              ? await createPhotoThumbnail(item.file)
              : null;
          const thumbnailPath = thumbnail
            ? buildThumbnailStoragePath({
                tripId,
                userId: user.id,
                mediaId,
              })
            : null;
          const upload = startResumableUpload({
            accessToken: session.access_token,
            contentType: item.mimeType,
            file: item.file,
            objectPath: storagePath,
            onProgress(bytesUploaded) {
              updateItem(clientId, { progressBytes: bytesUploaded });
            },
          });
          activeUploads.current.set(clientId, upload);
          await upload.completion;
          activeUploads.current.delete(clientId);

          let storedThumbnailPath: string | null = null;
          if (thumbnail && thumbnailPath) {
            const { error: thumbnailError } = await supabase.storage
              .from("trip-media")
              .upload(thumbnailPath, thumbnail, {
                contentType: "image/webp",
                upsert: false,
              });
            if (thumbnailError) {
              toast.warning(
                `${item.file.name} uploaded without an optimized gallery preview.`,
              );
            } else {
              storedThumbnailPath = thumbnailPath;
            }
          }

          const { error: insertError } = await supabase.from("media").insert({
            id: mediaId,
            trip_id: tripId,
            album_id: null,
            uploaded_by: user.id,
            storage_path: storagePath,
            thumbnail_path: storedThumbnailPath,
            original_filename: item.file.name,
            mime_type: item.mimeType,
            media_type: item.mediaType,
            file_size: item.file.size,
            width: metadata.width,
            height: metadata.height,
            duration_seconds: metadata.durationSeconds,
            captured_at: metadata.capturedAt,
          });

          if (insertError) {
            const { error: cleanupError } = await supabase.storage
              .from("trip-media")
              .remove(
                storedThumbnailPath
                  ? [storagePath, storedThumbnailPath]
                  : [storagePath],
              );
            throw new Error(
              cleanupError
                ? "The file uploaded, but its record and automatic cleanup failed. Contact the trip owner."
                : "The file uploaded but its record failed. The stored file was cleaned up; retry it.",
            );
          }

          completed += 1;
          updateItem(clientId, {
            status: "success",
            progressBytes: item.file.size,
          });
        } catch (error) {
          activeUploads.current.delete(clientId);
          const message =
            error instanceof Error ? error.message : "Upload failed.";
          updateItem(clientId, {
            status: message === "Upload cancelled." ? "cancelled" : "error",
            error: message,
          });
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload could not start.";
      toast.error(message);
    } finally {
      setIsUploading(false);
      if (completed > 0) {
        toast.success(
          `${completed} ${completed === 1 ? "memory" : "memories"} added to the chapter.`,
        );
        router.refresh();
      }
    }
  }

  async function cancelUpload(clientId: string) {
    const upload = activeUploads.current.get(clientId);
    if (upload) {
      updateItem(clientId, {
        status: "cancelled",
        error: "Upload cancelled.",
        progressBytes: 0,
      });
      await upload.cancel();
      activeUploads.current.delete(clientId);
    }
  }

  function resetDialog() {
    for (const previewUrl of previewUrls.current) {
      URL.revokeObjectURL(previewUrl);
    }
    previewUrls.current.clear();
    setItems([]);
  }

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isUploading) {
          toast.info("Cancel the active upload before closing.");
          return;
        }
        setOpen(nextOpen);
        if (!nextOpen) {
          resetDialog();
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button>
          <Upload className="size-4" /> Add memories
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-h-[90dvh]">
        <DialogHeader>
          <DialogTitle>Add to the chapter</DialogTitle>
          <DialogDescription>
            Photos up to 30 MB and videos up to 1 GB. Everything stays private
            to the people in this chapter.
          </DialogDescription>
        </DialogHeader>

        <input
          accept={acceptedFiles}
          className="sr-only"
          multiple
          onChange={onFileChange}
          ref={fileInputRef}
          type="file"
        />
        <div
          className={`mt-5 rounded-[1.5rem] border-2 border-dashed p-5 text-center transition active:bg-primary/5 sm:mt-6 sm:p-8 ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-border bg-background/40"
          }`}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
        >
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10">
            <Images className="size-5 text-primary" />
          </span>
          <p className="mt-4 font-semibold">Bring your memories into the book</p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPEG, PNG, WebP, HEIC, HEIF, MP4, MOV, WebM
          </p>
          <Button
            className="mt-4"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            type="button"
            variant="outline"
          >
            Choose files
          </Button>
        </div>

        {items.length > 0 && (
          <>
            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {successCount}/{validItems.length} complete
              </span>
              <span>{overallProgress}% overall</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${overallProgress}%` }}
              />
            </div>

            <div className="mt-5 max-h-[36dvh] space-y-3 overflow-y-auto overscroll-contain pr-1 sm:max-h-72">
              {items.map((item) => (
                <UploadRow
                  item={item}
                  key={item.clientId}
                  onCancel={() => cancelUpload(item.clientId)}
                  onRemove={() => removeItem(item.clientId)}
                  onRetry={() => uploadItems([item.clientId])}
                />
              ))}
            </div>
          </>
        )}

        <div className="sticky bottom-0 -mx-4 mt-6 flex flex-col-reverse gap-2 border-t border-border bg-card/95 px-4 pb-[max(.25rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
          <Button
            className="w-full sm:w-auto"
            disabled={isUploading}
            onClick={() => {
              setOpen(false);
              resetDialog();
            }}
            type="button"
            variant="outline"
          >
            {successCount > 0 && queuedCount === 0 ? "Done" : "Close"}
          </Button>
          <Button
            className="w-full sm:w-auto"
            disabled={isUploading || queuedCount === 0}
            onClick={() =>
              uploadItems(
                items
                  .filter(
                    (item) =>
                      item.mediaType &&
                      (item.status === "queued" ||
                        item.status === "cancelled"),
                  )
                  .map((item) => item.clientId),
              )
            }
            type="button"
          >
            {isUploading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {isUploading ? "Uploading…" : `Upload ${queuedCount || ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadRow({
  item,
  onCancel,
  onRemove,
  onRetry,
}: {
  item: UploadItem;
  onCancel: () => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const progress = Math.round((item.progressBytes / item.file.size) * 100);

  return (
    <div className="rounded-2xl border border-border bg-background/60 p-3">
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
          {item.previewUrl ? (
            // Blob URLs are local, temporary previews.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="size-full object-cover"
              src={item.previewUrl}
            />
          ) : (
            <FileVideo className="size-5 text-muted-foreground" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{item.file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(item.file.size)}
            {item.status === "uploading" && ` · ${progress}%`}
          </p>
        </div>
        <StatusIcon status={item.status} />
        {item.status === "uploading" ? (
          <Button
            aria-label={`Cancel ${item.file.name}`}
            onClick={onCancel}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Pause className="size-4" />
          </Button>
        ) : item.status === "error" && item.mediaType ? (
          <Button
            aria-label={`Retry ${item.file.name}`}
            onClick={onRetry}
            size="icon"
            type="button"
            variant="ghost"
          >
            <RefreshCw className="size-4" />
          </Button>
        ) : null}
        {item.status !== "uploading" && item.status !== "success" && (
          <Button
            aria-label={`Remove ${item.file.name}`}
            onClick={onRemove}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
      {item.status === "uploading" && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {item.error && (
        <p className="mt-2 text-xs leading-5 text-destructive" role="alert">
          {item.error}
        </p>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: UploadStatus }) {
  if (status === "uploading") {
    return <LoaderCircle className="size-4 animate-spin text-primary" />;
  }
  if (status === "success") {
    return <Check className="size-4 text-primary" />;
  }
  if (status === "error") {
    return <CircleAlert className="size-4 text-destructive" />;
  }
  if (status === "cancelled") {
    return <X className="size-4 text-muted-foreground" />;
  }
  return null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
