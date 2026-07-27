"use client";

import { Archive, Download, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { createOwnerArchiveManifestAction } from "@/features/media/archive-actions";
import { LARGE_ARCHIVE_WARNING_BYTES } from "@/lib/media/archive";

export function OwnerArchiveDownload({
  tripId,
  mediaCount,
}: {
  tripId: string;
  mediaCount: number;
}) {
  const [isWorking, setIsWorking] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(mediaCount);
  const abortRef = useRef<AbortController | null>(null);

  async function downloadArchive() {
    setIsWorking(true);
    setCompleted(0);
    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const manifest = await createOwnerArchiveManifestAction(tripId);
      if (!manifest.success) {
        throw new Error(manifest.error);
      }

      setTotal(manifest.items.length);
      if (
        manifest.totalBytes >= LARGE_ARCHIVE_WARNING_BYTES &&
        !window.confirm(
          `This archive contains ${formatFileSize(manifest.totalBytes)} of originals. Your browser must finish building the ZIP before saving it. Continue?`,
        )
      ) {
        return;
      }

      const { downloadZip } = await import("client-zip");
      const items = manifest.items;
      async function* originalFiles() {
        for (let index = 0; index < items.length; index += 1) {
          abortController.signal.throwIfAborted();
          const item = items[index];
          const response = await fetch(item.url, {
            signal: abortController.signal,
          });
          if (!response.ok) {
            throw new Error(`Could not download ${item.archiveName}.`);
          }

          yield {
            input: response,
            name: item.archiveName,
            size: item.fileSize,
          };
          setCompleted(index + 1);
        }
      }

      const zipResponse = downloadZip(originalFiles());
      const blob = await zipResponse.blob();
      if (blob.size <= 22) {
        throw new Error(
          "The browser produced an empty archive. No file was saved.",
        );
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = manifest.filename;
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);

      setCompleted(items.length);
      toast.success("The complete original archive is ready.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        toast.info("Archive download cancelled.");
      } else {
        toast.error(
          error instanceof Error
            ? error.message
            : "The complete archive could not be downloaded.",
        );
      }
    } finally {
      abortRef.current = null;
      setIsWorking(false);
    }
  }

  if (isWorking) {
    return (
      <Button
        className="min-w-48 border-primary/30 bg-primary/10"
        onClick={() => abortRef.current?.abort()}
        type="button"
        variant="outline"
      >
        <X className="size-4" />
        Cancel {completed}/{total}
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={mediaCount === 0} type="button" variant="outline">
          <Archive className="size-4 text-primary" />
          Download all (.zip)
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-3 flex size-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
            <Download className="size-5" />
          </div>
          <AlertDialogTitle>Take the whole chapter.</AlertDialogTitle>
          <AlertDialogDescription>
            All {mediaCount} original photos and videos will be placed in one
            ZIP, separated into Photos and Videos. This private owner action
            may take several minutes and should stay open until it finishes.
          </AlertDialogDescription>
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-background/50 p-3 text-xs leading-5 text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            Temporary secure links are created only after the server confirms
            your owner role. Files travel directly from private storage to this
            device.
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Not now</AlertDialogCancel>
          <AlertDialogAction
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => void downloadArchive()}
          >
            <LoaderCircle className="hidden size-4 animate-spin" />
            Build archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
