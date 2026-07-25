"use client";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  ImageOff,
  LoaderCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { formatFileSize } from "@/components/media/media-gallery";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createMediaUrlAction,
  deleteMediaAction,
} from "@/features/media/actions";
import type { MediaListItem } from "@/features/media/types";

export function MediaViewer({
  items,
  index,
  open,
  currentUserId,
  onOpenChange,
  onIndexChange,
  onDeleted,
}: {
  items: MediaListItem[];
  index: number;
  open: boolean;
  currentUserId: string;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
  onDeleted: (itemId: string) => void;
}) {
  const item = index >= 0 ? items[index] : null;
  const [urlState, setUrlState] = useState<{
    itemId: string;
    url: string | null;
    error: string | null;
  } | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDeleting] = useTransition();
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!open || !item) return;
    let active = true;
    const itemId = item.id;
    void createMediaUrlAction(itemId, "viewer").then((result) => {
      if (!active) return;
      setUrlState(
        result.success
          ? { itemId, url: result.url, error: null }
          : { itemId, url: null, error: result.error },
      );
    });
    return () => {
      active = false;
    };
  }, [item, open, retryNonce]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" && index > 0) {
        onIndexChange(index - 1);
      }
      if (event.key === "ArrowRight" && index < items.length - 1) {
        onIndexChange(index + 1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, items.length, onIndexChange, open]);

  if (!item) {
    return null;
  }
  const currentItem = item;
  const currentUrlState =
    urlState?.itemId === currentItem.id ? urlState : null;
  const mediaUrl = currentUrlState?.url ?? null;
  const loadError = currentUrlState?.error ?? null;
  const isLoading = !currentUrlState;

  async function downloadOriginal() {
    const result = await createMediaUrlAction(currentItem.id, "download");
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = result.url;
    anchor.download = result.filename;
    anchor.rel = "noopener";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }

  function deleteItem() {
    startDeleting(async () => {
      const result = await deleteMediaAction(currentItem.id);
      if (!result.success) {
        toast.error(result.error, {
          duration: result.partial ? 8000 : undefined,
        });
        return;
      }
      setDeleteOpen(false);
      toast.success("The media item was deleted.");
      onDeleted(currentItem.id);
    });
  }

  function finishSwipe(clientX: number) {
    if (touchStartX.current === null) return;
    const distance = clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < 55) return;
    if (distance > 0 && index > 0) onIndexChange(index - 1);
    if (distance < 0 && index < items.length - 1) onIndexChange(index + 1);
  }

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="h-[100dvh] max-h-none w-full overflow-hidden rounded-none border-0 bg-[#11110f] p-0 pb-0 text-white sm:h-[94dvh] sm:max-w-[96vw] sm:rounded-[2rem] sm:p-0">
          <DialogTitle className="sr-only">{item.filename}</DialogTitle>
          <DialogDescription className="sr-only">
            Private media viewer
          </DialogDescription>
          <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-1">
            <div
              className="relative flex min-h-0 touch-pan-y items-center justify-center overflow-hidden bg-black"
              onTouchEnd={(event) => finishSwipe(event.changedTouches[0]?.clientX ?? 0)}
              onTouchStart={(event) => {
                touchStartX.current = event.touches[0]?.clientX ?? null;
              }}
            >
              {isLoading && (
                <LoaderCircle className="size-8 animate-spin text-white/70" />
              )}
              {!isLoading && loadError && (
                <div className="max-w-xs px-6 text-center">
                  <ImageOff className="mx-auto size-9 text-white/50" />
                  <p className="mt-3 text-sm text-white/70">{loadError}</p>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      setUrlState(null);
                      setRetryNonce((value) => value + 1);
                    }}
                    variant="outline"
                  >
                    <RefreshCw className="size-4" /> Refresh private link
                  </Button>
                </div>
              )}
              {!isLoading &&
                !loadError &&
                mediaUrl &&
                (item.mediaType === "photo" ? (
                  // The original is fetched only for the active viewer item.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={item.filename}
                    className="max-h-full max-w-full object-contain"
                    onError={() =>
                      setUrlState({
                        itemId: currentItem.id,
                        url: null,
                        error: "The private link expired or the preview failed.",
                      })
                    }
                    src={mediaUrl}
                  />
                ) : (
                  <video
                    aria-label={item.filename}
                    autoPlay
                    className="max-h-full max-w-full"
                    controls
                    onError={() =>
                      setUrlState({
                        itemId: currentItem.id,
                        url: null,
                        error: "The private link expired or the video failed.",
                      })
                    }
                    playsInline
                    src={mediaUrl}
                  />
                ))}

              <Button
                aria-label="Previous media"
                className="absolute left-[max(.5rem,env(safe-area-inset-left))] top-1/2 -translate-y-1/2 rounded-full bg-black/55 text-white active:scale-95 hover:bg-black/75 sm:left-3"
                disabled={index <= 0}
                onClick={() => onIndexChange(index - 1)}
                size="icon"
                variant="ghost"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                aria-label="Next media"
                className="absolute right-[max(.5rem,env(safe-area-inset-right))] top-1/2 -translate-y-1/2 rounded-full bg-black/55 text-white active:scale-95 hover:bg-black/75 sm:right-3"
                disabled={index >= items.length - 1}
                onClick={() => onIndexChange(index + 1)}
                size="icon"
                variant="ghost"
              >
                <ChevronRight className="size-5" />
              </Button>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white/75 sm:bottom-3">
                {index + 1} / {items.length}
              </span>
            </div>

            <aside className="max-h-[42dvh] overflow-y-auto overscroll-contain border-t border-white/10 bg-[#171714] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 min-[390px]:p-5 lg:max-h-none lg:border-l lg:border-t-0 lg:p-7">
              <p className="font-mono text-[10px] uppercase tracking-[.22em] text-white/45">
                A page from your story
              </p>
              <h2 className="mt-3 break-words font-display text-3xl leading-tight">
                {item.filename}
              </h2>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm min-[390px]:mt-7 lg:block lg:space-y-4">
                <ViewerDetail label="Uploaded by" value={item.uploaderName} />
                <ViewerDetail
                  label="Upload date"
                  value={formatDate(item.createdAt)}
                />
                <ViewerDetail
                  label="Capture date"
                  value={item.capturedAt ? formatDate(item.capturedAt) : "Unknown"}
                />
                <ViewerDetail label="File size" value={formatFileSize(item.fileSize)} />
                <ViewerDetail
                  label="Dimensions"
                  value={
                    item.width && item.height
                      ? `${item.width} × ${item.height}`
                      : "Unknown"
                  }
                />
              </dl>
              <div className="mt-6 grid gap-2 lg:mt-8">
                <Button onClick={() => void downloadOriginal()}>
                  <Download className="size-4" /> Download original
                </Button>
                {item.uploadedBy === currentUserId && (
                  <Button
                    className="text-red-300 hover:bg-red-950/50 hover:text-red-200"
                    onClick={() => setDeleteOpen(true)}
                    variant="ghost"
                  >
                    <Trash2 className="size-4" /> Delete media
                  </Button>
                )}
              </div>
            </aside>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this memory?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the private original and its gallery record.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                deleteItem();
              }}
            >
              {isDeleting && <LoaderCircle className="size-4 animate-spin" />}
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ViewerDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-white/40">{label}</dt>
      <dd className="mt-0.5 text-white/85">{value}</dd>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
