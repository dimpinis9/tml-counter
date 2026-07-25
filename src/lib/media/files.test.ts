import { describe, expect, it } from "vitest";

import {
  PHOTO_MAX_BYTES,
  VIDEO_MAX_BYTES,
  buildStoragePath,
  sanitizeFilename,
  validateMediaFile,
} from "@/lib/media/files";

const tripId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const mediaId = "33333333-3333-4333-8333-333333333333";

describe("media file validation", () => {
  it("accepts every supported family", () => {
    expect(
      validateMediaFile({ name: "photo.heic", type: "", size: 1024 }),
    ).toEqual({
      success: true,
      data: { mediaType: "photo", mimeType: "image/heic" },
    });
    expect(
      validateMediaFile({
        name: "clip.mov",
        type: "video/quicktime",
        size: 1024,
      }).success,
    ).toBe(true);
  });

  it("rejects unsupported types", () => {
    expect(
      validateMediaFile({
        name: "document.pdf",
        type: "application/pdf",
        size: 1024,
      }).success,
    ).toBe(false);
  });

  it("enforces different photo and video limits", () => {
    expect(
      validateMediaFile({
        name: "large.jpg",
        type: "image/jpeg",
        size: PHOTO_MAX_BYTES + 1,
      }).success,
    ).toBe(false);
    expect(
      validateMediaFile({
        name: "large.mp4",
        type: "video/mp4",
        size: VIDEO_MAX_BYTES + 1,
      }).success,
    ).toBe(false);
  });
});

describe("storage path helpers", () => {
  it("sanitizes traversal and unsafe filename characters", () => {
    expect(sanitizeFilename("../../Καλοκαίρι 2026 (final)!!.JPG")).toBe(
      "2026_final.jpg",
    );
  });

  it("builds the required immutable UUID path", () => {
    expect(
      buildStoragePath({
        tripId,
        userId,
        mediaId,
        filename: "My sunset.JPG",
      }),
    ).toBe(
      `trips/${tripId}/${userId}/${mediaId}/My_sunset.jpg`,
    );
  });

  it("rejects non-UUID path identifiers", () => {
    expect(() =>
      buildStoragePath({
        tripId: "../another-trip",
        userId,
        mediaId,
        filename: "photo.jpg",
      }),
    ).toThrow("valid UUID");
  });
});
