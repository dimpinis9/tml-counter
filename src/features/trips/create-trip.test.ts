import { describe, expect, it, vi } from "vitest";

import { executeCreateTrip } from "@/features/trips/create-trip";

const values = {
  name: "Island weekend",
  description: "Three days by the sea.",
  coverPlaceholder: "sea" as const,
};

describe("executeCreateTrip", () => {
  it("calls the atomic RPC and returns the new id", async () => {
    const invokeRpc = vi
      .fn()
      .mockResolvedValue({ data: "trip-id", error: null });

    const result = await executeCreateTrip(values, invokeRpc);

    expect(invokeRpc).toHaveBeenCalledWith({
      p_name: "Island weekend",
      p_description: "Three days by the sea.",
      p_cover_path: "sea",
    });
    expect(result).toEqual({ success: true, tripId: "trip-id" });
  });

  it("returns a safe failure when the RPC fails", async () => {
    const result = await executeCreateTrip(values, async () => ({
      data: null,
      error: { message: "Database unavailable" },
    }));

    expect(result).toEqual({
      success: false,
      error: "The chapter could not be created. Please try again.",
    });
  });
});
