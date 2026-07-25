import type { MediaType } from "@/lib/media/files";

export type ExtractedMediaMetadata = {
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  capturedAt: string | null;
};

const emptyMetadata: ExtractedMediaMetadata = {
  width: null,
  height: null,
  durationSeconds: null,
  capturedAt: null,
};

export async function extractMediaMetadata(
  file: File,
  mediaType: MediaType,
): Promise<ExtractedMediaMetadata> {
  try {
    return mediaType === "photo"
      ? await extractImageDimensions(file)
      : await extractVideoMetadata(file);
  } catch {
    return emptyMetadata;
  }
}

async function extractImageDimensions(
  file: File,
): Promise<ExtractedMediaMetadata> {
  const bitmap = await createImageBitmap(file);
  const metadata = {
    ...emptyMetadata,
    width: bitmap.width || null,
    height: bitmap.height || null,
  };
  bitmap.close();
  return metadata;
}

async function extractVideoMetadata(
  file: File,
): Promise<ExtractedMediaMetadata> {
  const objectUrl = URL.createObjectURL(file);

  try {
    return await new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const timeout = window.setTimeout(
        () => reject(new Error("Metadata timed out.")),
        10_000,
      );

      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.clearTimeout(timeout);
        resolve({
          ...emptyMetadata,
          width: video.videoWidth || null,
          height: video.videoHeight || null,
          durationSeconds: Number.isFinite(video.duration)
            ? video.duration
            : null,
        });
      };
      video.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error("Video metadata unavailable."));
      };
      video.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
