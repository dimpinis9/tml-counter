import { describe, expect, it } from "vitest";

import { buildThumbnailStoragePath } from "@/lib/media/thumbnails";

describe("thumbnail storage paths", () => {
  it("keeps the thumbnail private beside its original media object", () => {
    expect(
      buildThumbnailStoragePath({
        tripId: "123e4567-e89b-42d3-a456-426614174000",
        userId: "123e4567-e89b-42d3-a456-426614174001",
        mediaId: "123e4567-e89b-42d3-a456-426614174002",
      }),
    ).toBe(
      "trips/123e4567-e89b-42d3-a456-426614174000/123e4567-e89b-42d3-a456-426614174001/123e4567-e89b-42d3-a456-426614174002/thumbnail.webp",
    );
  });
});
