const THUMBNAIL_MAX_EDGE = 640;
const THUMBNAIL_QUALITY = 0.76;

export async function createPhotoThumbnail(file: File) {
  if (!canCreateThumbnail(file)) {
    return null;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      THUMBNAIL_MAX_EDGE / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });

    if (!context) {
      bitmap.close();
      return null;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", THUMBNAIL_QUALITY);
    });
  } catch {
    return null;
  }
}

export function buildThumbnailStoragePath({
  tripId,
  userId,
  mediaId,
}: {
  tripId: string;
  userId: string;
  mediaId: string;
}) {
  return `trips/${tripId}/${userId}/${mediaId}/thumbnail.webp`;
}

function canCreateThumbnail(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(
    file.type.toLowerCase(),
  );
}
