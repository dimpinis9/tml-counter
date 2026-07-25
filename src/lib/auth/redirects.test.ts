import { describe, expect, it } from "vitest";

import { getSafeRedirectPath } from "@/lib/auth/redirects";

describe("getSafeRedirectPath", () => {
  it("accepts internal paths", () => {
    expect(getSafeRedirectPath("/profile")).toBe("/profile");
  });

  it("rejects external and protocol-relative redirects", () => {
    expect(getSafeRedirectPath("https://example.com")).toBe("/trips");
    expect(getSafeRedirectPath("//example.com")).toBe("/trips");
  });
});
