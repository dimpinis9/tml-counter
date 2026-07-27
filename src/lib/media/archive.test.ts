import { describe, expect, it } from "vitest";

import {
  getArchiveEntryName,
  getTripArchiveFilename,
} from "@/lib/media/archive";

describe("media archive helpers", () => {
  it("creates stable folders and unique ordered filenames", () => {
    expect(
      getArchiveEntryName({
        index: 4,
        mediaType: "photo",
        filename: "../../Mainstage:night?.jpg",
      }),
    ).toBe("Photos/0005-Mainstage-night-.jpg");
  });

  it("separates video originals", () => {
    expect(
      getArchiveEntryName({
        index: 0,
        mediaType: "video",
        filename: "after movie.mov",
      }),
    ).toBe("Videos/0001-after movie.mov");
  });

  it("builds a filesystem-safe dated zip filename", () => {
    expect(
      getTripArchiveFilename("Tomorrowland 2026", new Date("2026-07-27T12:00:00Z")),
    ).toBe("Tomorrowland-2026-originals-2026-07-27.zip");
  });
});

