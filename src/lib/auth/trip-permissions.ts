export type TripRole = "owner" | "member";

export type MembershipIdentity = {
  userId: string;
  role: TripRole;
};

export function isOwnerRole(
  role: TripRole | null | undefined,
): role is "owner" {
  return role === "owner";
}

export function hasMembership(
  memberships: readonly MembershipIdentity[],
  userId: string,
) {
  return memberships.some((membership) => membership.userId === userId);
}

export function canRemoveMember({
  actorId,
  actorRole,
  targetUserId,
}: {
  actorId: string;
  actorRole: TripRole;
  targetUserId: string;
}) {
  return isOwnerRole(actorRole) && actorId !== targetUserId;
}
