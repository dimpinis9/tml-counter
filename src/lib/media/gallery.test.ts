import { describe, expect, it } from "vitest";

import {
  getDownloadFilename,
  getPaginationRange,
  matchesMediaFilter,
  normalizeMediaFilter,
  normalizeMediaSort,
  shouldWarnForBulkDownload,
} from "@/lib/media/gallery";

describe("media gallery helpers", () => {
  it("normalizes filters and sorting", () => {
    expect(normalizeMediaFilter("photo")).toBe("photo");
    expect(normalizeMediaFilter("unexpected")).toBe("all");
    expect(normalizeMediaSort("oldest")).toBe("oldest");
    expect(normalizeMediaSort("unexpected")).toBe("newest");
  });

  it("matches the selected media filter", () => {
    expect(matchesMediaFilter("photo", "all")).toBe(true);
    expect(matchesMediaFilter("photo", "photo")).toBe(true);
    expect(matchesMediaFilter("video", "photo")).toBe(false);
  });

  it("builds bounded pagination ranges", () => {
    expect(getPaginationRange(1, 24)).toEqual({ from: 0, to: 23 });
    expect(getPaginationRange(3, 24)).toEqual({ from: 48, to: 71 });
    expect(getPaginationRange(-2, 0)).toEqual({ from: 0, to: 23 });
  });

  it("creates safe download filenames", () => {
    expect(getDownloadFilename("../../summer:trip?.jpg")).toBe(
      "summer-trip-.jpg",
    );
    expect(getDownloadFilename("\u0000...")).toBe("keepsake-download");
  });

  it("warns for large download batches", () => {
    expect(
      shouldWarnForBulkDownload(
        Array.from({ length: 8 }, () => ({ fileSize: 1 })),
      ),
    ).toBe(true);
    expect(
      shouldWarnForBulkDownload([{ fileSize: 500 * 1024 * 1024 }]),
    ).toBe(true);
    expect(shouldWarnForBulkDownload([{ fileSize: 1024 }])).toBe(false);
  });
});
