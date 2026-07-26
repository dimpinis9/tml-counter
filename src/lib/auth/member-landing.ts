type Membership = {
  trip_id: string;
  role: "owner" | "member";
};

export function getMemberLandingPath(memberships: Membership[]) {
  if (memberships.some((membership) => membership.role === "owner")) {
    return null;
  }

  const chapter = memberships.find(
    (membership) => membership.role === "member",
  );
  return chapter ? `/trips/${chapter.trip_id}?upload=1` : null;
}
