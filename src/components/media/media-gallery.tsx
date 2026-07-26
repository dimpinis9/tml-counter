"use client";

import {
  Check,
  CheckCircle2,
  Download,
  FileVideo2,
  ImageIcon,
  LoaderCircle,
  RefreshCw,
  Video,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { MediaViewer } from "@/components/media/media-viewer";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  createMediaUrlAction,
  loadMediaPageAction,
} from "@/features/media/actions";
import type { MediaListItem, MediaPage } from "@/features/media/types";
import {
  shouldWarnForBulkDownload,
  type MediaFilter,
  type MediaSort,
} from "@/lib/media/gallery";
import { cn } from "@/lib/utils";

const filterOptions: Array<{ value: MediaFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "photo", label: "Photos" },
  { value: "video", label: "Videos" },
];

export function MediaGallery({
  initialPage,
  tripId,
  currentUserId,
  simple = false,
}: {
  initialPage: MediaPage;
  tripId: string;
  currentUserId: string;
  simple?: boolean;
}) {
  const [items, setItems] = useState(initialPage.items);
  const [total, setTotal] = useState(initialPage.total);
  const [page, setPage] = useState(initialPage.page);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [filter, setFilter] = useState<MediaFilter>(initialPage.filter);
  const [sort, setSort] = useState<MediaSort>(initialPage.sort);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bulkConfirmationOpen, setBulkConfirmationOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDownloading, setIsDownloading] = useState(false);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds],
  );
  const viewerIndex = viewerId
    ? items.findIndex((item) => item.id === viewerId)
    : -1;

  const loadPage = useCallback(
    (
      nextPage: number,
      nextFilter: MediaFilter,
      nextSort: MediaSort,
      append: boolean,
    ) => {
      setLoadError(null);
      startTransition(async () => {
        const result = await loadMediaPageAction({
          tripId,
          page: nextPage,
          filter: nextFilter,
          sort: nextSort,
        });
        if (!result.success) {
          setLoadError(result.error);
          toast.error(result.error);
          return;
        }

        setItems((current) =>
          append
            ? [
                ...current,
                ...result.data.items.filter(
                  (incoming) =>
                    !current.some((existing) => existing.id === incoming.id),
                ),
              ]
            : result.data.items,
        );
        setPage(result.data.page);
        setTotal(result.data.total);
        setHasMore(result.data.hasMore);
        if (!append) {
          setSelectedIds(new Set());
          setSelectionMode(false);
        }
      });
    },
    [tripId],
  );

  function changeFilter(nextFilter: MediaFilter) {
    setFilter(nextFilter);
    loadPage(1, nextFilter, sort, false);
  }

  function changeSort(nextSort: MediaSort) {
    setSort(nextSort);
    loadPage(1, filter, nextSort, false);
  }

  function toggleSelection(itemId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  async function downloadItems(downloadItems: MediaListItem[]) {
    if (downloadItems.length === 0) {
      return;
    }

    setIsDownloading(true);
    let failures = 0;
    for (const item of downloadItems) {
      const result = await createMediaUrlAction(item.id, "download");
      if (!result.success) {
        failures += 1;
        continue;
      }
      const anchor = document.createElement("a");
      anchor.href = result.url;
      anchor.download = result.filename;
      anchor.rel = "noopener";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      await new Promise((resolve) => window.setTimeout(resolve, 450));
    }
    setIsDownloading(false);
    setBulkConfirmationOpen(false);

    if (failures > 0) {
      toast.error(
        `${failures} ${failures === 1 ? "download" : "downloads"} could not start.`,
      );
    } else {
      toast.success(
        `${downloadItems.length} ${
          downloadItems.length === 1 ? "download" : "downloads"
        } started.`,
      );
    }
  }

  function requestSelectedDownload() {
    if (shouldWarnForBulkDownload(selectedItems)) {
      setBulkConfirmationOpen(true);
      return;
    }
    void downloadItems(selectedItems);
  }

  function handleDeleted(itemId: string) {
    setItems((current) => current.filter((item) => item.id !== itemId));
    setTotal((current) => Math.max(0, current - 1));
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(itemId);
      return next;
    });
    setViewerId(null);
  }

  return (
    <div>
      <div
        className={cn(
          "mb-4 rounded-2xl border border-border/70 bg-card/80 p-2.5 sm:mb-5 sm:p-3",
          simple
            ? "flex items-center justify-between gap-3"
            : "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        )}
      >
        {!simple && (
        <div className="-mx-0.5 flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-muted p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filterOptions.map((option) => (
            <button
              className={cn(
                "min-h-11 shrink-0 rounded-lg px-4 py-2 text-sm transition active:scale-[.97] sm:min-h-0 sm:px-3",
                filter === option.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              disabled={isPending}
              key={option.value}
              onClick={() => changeFilter(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        )}
        <div
          className={cn(
            "items-center gap-2",
            simple
              ? "flex w-full justify-between"
              : "grid grid-cols-[1fr_auto] min-[390px]:grid-cols-[auto_1fr_auto] sm:flex sm:flex-wrap",
          )}
        >
          <span className="col-span-2 text-sm text-muted-foreground min-[390px]:col-span-1 sm:mr-2">
            {total} {total === 1 ? "memory" : "memories"}
          </span>
          {!simple && (
          <select
            aria-label="Sort gallery"
            className="h-11 min-w-0 rounded-xl border border-input bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:h-10 sm:text-sm"
            disabled={isPending}
            onChange={(event) => changeSort(event.target.value as MediaSort)}
            value={sort}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          )}
          <Button
            onClick={() => {
              setSelectionMode((current) => !current);
              setSelectedIds(new Set());
            }}
            size="sm"
            variant={selectionMode ? "default" : "outline"}
          >
            {selectionMode ? <X className="size-4" /> : <Check className="size-4" />}
            {selectionMode ? "Done" : simple ? "Download" : "Select"}
          </Button>
        </div>
      </div>

      {selectionMode && (
        <div className="sticky bottom-[max(.75rem,env(safe-area-inset-bottom))] z-20 mb-4 flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-background/95 px-3 py-3 shadow-lg backdrop-blur sm:bottom-auto sm:top-4 sm:px-4">
          <p className="min-w-0 text-sm font-medium">
            {selectedIds.size} {selectedIds.size === 1 ? "item" : "items"} selected
          </p>
          <Button
            disabled={selectedIds.size === 0 || isDownloading}
            onClick={requestSelectedDownload}
            size="sm"
          >
            {isDownloading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Download selected
          </Button>
        </div>
      )}

      {items.length === 0 && !isPending ? (
        <GalleryEmptyState filter={filter} />
      ) : (
        <div className="grid grid-cols-2 gap-2 min-[390px]:gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, index) => (
            <MediaTile
              index={index}
              item={item}
              key={item.id}
              onOpen={() => setViewerId(item.id)}
              onSelect={() => toggleSelection(item.id)}
              selected={selectedIds.has(item.id)}
              selectionMode={selectionMode}
            />
          ))}
          {isPending &&
            Array.from({ length: 8 }, (_, index) => (
              <Skeleton
                className="aspect-[4/5] rounded-2xl"
                key={`gallery-skeleton-${index}`}
              />
            ))}
        </div>
      )}

      {loadError && (
        <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-destructive/25 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button
            onClick={() => loadPage(page + 1, filter, sort, page > 0)}
            size="sm"
            variant="outline"
          >
            <RefreshCw className="size-4" /> Retry
          </Button>
        </div>
      )}

      {hasMore && !loadError && (
        <div className="mt-8 text-center">
          <Button
            disabled={isPending}
            onClick={() => loadPage(page + 1, filter, sort, true)}
            variant="outline"
          >
            {isPending && <LoaderCircle className="size-4 animate-spin" />}
            Reveal more memories
          </Button>
        </div>
      )}

      <MediaViewer
        currentUserId={currentUserId}
        index={viewerIndex}
        items={items}
        onDeleted={handleDeleted}
        onIndexChange={(nextIndex) => setViewerId(items[nextIndex]?.id ?? null)}
        onOpenChange={(open) => {
          if (!open) setViewerId(null);
        }}
        open={viewerIndex >= 0}
      />

      <AlertDialog
        onOpenChange={setBulkConfirmationOpen}
        open={bulkConfirmationOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start several downloads?</AlertDialogTitle>
            <AlertDialogDescription>
              You selected {selectedItems.length} original files (
              {formatFileSize(
                selectedItems.reduce((totalSize, item) => totalSize + item.fileSize, 0),
              )}
              ). Your browser may ask you to allow multiple downloads.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDownloading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDownloading}
              onClick={(event) => {
                event.preventDefault();
                void downloadItems(selectedItems);
              }}
            >
              {isDownloading && <LoaderCircle className="size-4 animate-spin" />}
              Start downloads
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MediaTile({
  item,
  index,
  selectionMode,
  selected,
  onSelect,
  onOpen,
}: {
  item: MediaListItem;
  index: number;
  selectionMode: boolean;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const [thumbnailUrl, setThumbnailUrl] = useState(item.thumbnailUrl);
  const [failed, setFailed] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();

  function refreshThumbnail(event: React.MouseEvent) {
    event.stopPropagation();
    startRefresh(async () => {
      const result = await createMediaUrlAction(item.id, "thumbnail");
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setThumbnailUrl(result.url);
      setFailed(false);
    });
  }

  return (
    <button
      aria-label={
        selectionMode
          ? `${selected ? "Deselect" : "Select"} ${item.filename}`
          : `Open ${item.filename}`
      }
      className={cn(
        "group relative overflow-hidden rounded-xl bg-muted text-left outline-none ring-offset-background transition active:scale-[.985] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-[390px]:rounded-2xl",
        index % 11 === 0 ? "col-span-2 aspect-[4/3]" : "aspect-[4/5]",
        selected && "ring-4 ring-primary ring-offset-2",
      )}
      onClick={selectionMode ? onSelect : onOpen}
      type="button"
    >
      {item.mediaType === "photo" && thumbnailUrl && !failed ? (
        // Private, short-lived URLs are issued only after a server membership check.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          onError={() => setFailed(true)}
          src={thumbnailUrl}
        />
      ) : (
        <span className="grid size-full place-items-center bg-[radial-gradient(circle_at_top_left,hsl(var(--muted)),transparent_65%)] text-muted-foreground">
          {item.mediaType === "video" ? (
            <FileVideo2 className="size-9" />
          ) : (
            <ImageIcon className="size-9" />
          )}
        </span>
      )}

      {failed && (
        <span
          className="absolute inset-0 grid place-items-center bg-background/85 p-4 text-center"
          role="status"
        >
          <span>
            <span className="block text-xs text-muted-foreground">
              Preview expired or failed
            </span>
            <Button
              className="mt-2"
              disabled={isRefreshing}
              onClick={refreshThumbnail}
              size="sm"
              type="button"
              variant="outline"
            >
              <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
              Retry
            </Button>
          </span>
        </span>
      )}

        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-2.5 pb-2.5 pt-12 text-white min-[390px]:px-3 min-[390px]:pb-3">
        <span className="block truncate text-sm font-medium">{item.filename}</span>
        <span className="mt-1 block truncate text-[11px] text-white/75">
          {item.uploaderName} · {formatShortDate(item.createdAt)}
        </span>
      </span>

      {item.mediaType === "video" && (
        <span className="absolute right-2 top-2 inline-flex min-h-7 items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white">
          <Video className="size-3" /> Video
        </span>
      )}
      {selectionMode && (
        <span
          className={cn(
            "absolute left-2 top-2 grid size-9 place-items-center rounded-full border-2 sm:size-8",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-white bg-black/30 text-transparent",
          )}
        >
          <CheckCircle2 className="size-4" />
        </span>
      )}
    </button>
  );
}

function GalleryEmptyState({ filter }: { filter: MediaFilter }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-border px-6 py-16 text-center">
      {filter === "video" ? (
        <FileVideo2 className="mx-auto size-8 text-muted-foreground" />
      ) : (
        <ImageIcon className="mx-auto size-8 text-muted-foreground" />
      )}
      <h3 className="mt-4 font-display text-3xl">No memories in this chapter.</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Try another filter or add something new to the story.
      </p>
    </div>
  );
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${unit}`;
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
