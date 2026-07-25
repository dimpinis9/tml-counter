import { describe, expect, it } from "vitest";

import {
  invitationEmailSchema,
  invitationTokenSchema,
} from "@/lib/validation/invitations";

describe("invitation validation", () => {
  it("normalizes invited email addresses", () => {
    expect(invitationEmailSchema.parse("  Friend@Example.COM ")).toBe(
      "friend@example.com",
    );
  });

  it("rejects invalid email addresses", () => {
    expect(invitationEmailSchema.safeParse("not-an-email").success).toBe(false);
  });

  it("accepts URL-safe high-entropy tokens", () => {
    expect(
      invitationTokenSchema.safeParse(
        "czVua2h4QmVqX2VzR3dOaUVaQjRrOHg5VWZtbV9ua0M",
      ).success,
    ).toBe(true);
  });

  it("rejects short or URL-unsafe tokens", () => {
    expect(invitationTokenSchema.safeParse("short").success).toBe(false);
    expect(
      invitationTokenSchema.safeParse(
        "this-token-is-long-enough-but-has-a-slash/value",
      ).success,
    ).toBe(false);
  });
});
