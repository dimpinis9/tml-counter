import { describe, expect, it } from "vitest";

import {
  canRemoveMember,
  hasMembership,
  isOwnerRole,
} from "@/lib/auth/trip-permissions";

describe("trip permissions", () => {
  it("recognizes owner authorization", () => {
    expect(isOwnerRole("owner")).toBe(true);
    expect(isOwnerRole("member")).toBe(false);
  });

  it("checks membership by user id", () => {
    const memberships = [
      { userId: "owner-id", role: "owner" as const },
      { userId: "member-id", role: "member" as const },
    ];
    expect(hasMembership(memberships, "member-id")).toBe(true);
    expect(hasMembership(memberships, "stranger-id")).toBe(false);
  });

  it("allows only owners to remove someone other than themselves", () => {
    expect(
      canRemoveMember({
        actorId: "owner-id",
        actorRole: "owner",
        targetUserId: "member-id",
      }),
    ).toBe(true);
    expect(
      canRemoveMember({
        actorId: "owner-id",
        actorRole: "owner",
        targetUserId: "owner-id",
      }),
    ).toBe(false);
    expect(
      canRemoveMember({
        actorId: "member-id",
        actorRole: "member",
        targetUserId: "owner-id",
      }),
    ).toBe(false);
  });
});
