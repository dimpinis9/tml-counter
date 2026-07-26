import { describe, expect, it } from "vitest";

import { getMemberLandingPath } from "@/lib/auth/member-landing";

describe("member landing", () => {
  it("opens the shared chapter upload flow for a member", () => {
    expect(
      getMemberLandingPath([
        {
          trip_id: "123e4567-e89b-42d3-a456-426614174000",
          role: "member",
        },
      ]),
    ).toBe(
      "/trips/123e4567-e89b-42d3-a456-426614174000?upload=1",
    );
  });

  it("keeps owners on the chapter dashboard", () => {
    expect(
      getMemberLandingPath([
        {
          trip_id: "123e4567-e89b-42d3-a456-426614174000",
          role: "owner",
        },
      ]),
    ).toBeNull();
  });

  it("does not redirect a user without a membership", () => {
    expect(getMemberLandingPath([])).toBeNull();
  });
});
