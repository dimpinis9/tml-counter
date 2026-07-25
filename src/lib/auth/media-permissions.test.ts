import { describe, expect, it } from "vitest";

import {
  canDeleteMediaRecord,
  canDeleteMediaPath,
  canIssueMediaSignedUrl,
  canReadMediaPath,
  canUploadMediaPath,
} from "@/lib/auth/media-permissions";

const tripId = "11111111-1111-4111-8111-111111111111";
const otherTripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const userId = "22222222-2222-4222-8222-222222222222";
const otherUserId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const mediaId = "33333333-3333-4333-8333-333333333333";
const path = `trips/${tripId}/${userId}/${mediaId}/photo.jpg`;

describe("media path permissions", () => {
  it("issues signed URLs only after membership authorization", () => {
    expect(canIssueMediaSignedUrl({ isTripMember: true })).toBe(true);
    expect(canIssueMediaSignedUrl({ isTripMember: false })).toBe(false);
  });

  it("allows only the uploader to delete a media record", () => {
    expect(canDeleteMediaRecord({ userId, uploadedBy: userId })).toBe(true);
    expect(canDeleteMediaRecord({ userId: otherUserId, uploadedBy: userId })).toBe(
      false,
    );
  });

  it("allows reads only for trip members", () => {
    expect(canReadMediaPath({ memberTripIds: [tripId], path })).toBe(true);
    expect(canReadMediaPath({ memberTripIds: [otherTripId], path })).toBe(false);
  });

  it("requires membership and the caller-owned upload folder", () => {
    expect(
      canUploadMediaPath({ memberTripIds: [tripId], path, userId }),
    ).toBe(true);
    expect(
      canUploadMediaPath({
        memberTripIds: [tripId],
        path,
        userId: otherUserId,
      }),
    ).toBe(false);
  });

  it("allows deletion only from the uploader path", () => {
    expect(canDeleteMediaPath({ path, userId })).toBe(true);
    expect(canDeleteMediaPath({ path, userId: otherUserId })).toBe(false);
    expect(canDeleteMediaPath({ path: "../escape.jpg", userId })).toBe(false);
  });
});
