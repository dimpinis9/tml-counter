import { getStoragePathIdentity } from "@/lib/media/files";

export function canReadMediaPath({
  memberTripIds,
  path,
}: {
  memberTripIds: readonly string[];
  path: string;
}) {
  const identity = getStoragePathIdentity(path);
  return identity ? memberTripIds.includes(identity.tripId) : false;
}

export function canUploadMediaPath({
  memberTripIds,
  path,
  userId,
}: {
  memberTripIds: readonly string[];
  path: string;
  userId: string;
}) {
  const identity = getStoragePathIdentity(path);
  return Boolean(
    identity &&
      identity.userId === userId &&
      memberTripIds.includes(identity.tripId),
  );
}

export function canDeleteMediaPath({
  path,
  userId,
}: {
  path: string;
  userId: string;
}) {
  return getStoragePathIdentity(path)?.userId === userId;
}

export function canIssueMediaSignedUrl({
  isTripMember,
}: {
  isTripMember: boolean;
}) {
  return isTripMember;
}

export function canDeleteMediaRecord({
  userId,
  uploadedBy,
}: {
  userId: string;
  uploadedBy: string;
}) {
  return userId === uploadedBy;
}
