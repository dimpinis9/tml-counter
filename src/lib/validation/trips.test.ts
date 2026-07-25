import { describe, expect, it } from "vitest";

import { tripSchema } from "@/lib/validation/trips";

describe("tripSchema", () => {
  it("accepts and trims a valid trip", () => {
    const result = tripSchema.parse({
      name: "  Island weekend  ",
      description: "  Three slow days by the sea.  ",
      coverPlaceholder: "sea",
    });

    expect(result).toEqual({
      name: "Island weekend",
      description: "Three slow days by the sea.",
      coverPlaceholder: "sea",
    });
  });

  it("rejects empty and oversized values", () => {
    expect(
      tripSchema.safeParse({
        name: " ",
        description: "x".repeat(1001),
        coverPlaceholder: "sunset",
      }).success,
    ).toBe(false);
  });
});
