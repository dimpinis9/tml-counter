import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !publishableKey || !serviceRoleKey) {
  throw new Error("Supabase smoke test environment is incomplete.");
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const runId = `${Date.now()}-${randomBytes(4).toString("hex")}`;
const password = `Smoke-${randomBytes(18).toString("base64url")}A1!`;
const users = [
  { label: "owner", email: `smoke-owner-${runId}@example.test` },
  { label: "member", email: `smoke-member-${runId}@example.test` },
  { label: "outsider", email: `smoke-outsider-${runId}@example.test` },
];
const createdUserIds = [];
let tripId;
let storagePath;
let mediaId;

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS ${message}`);
}

function userClient() {
  return createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

try {
  for (const user of users) {
    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: { display_name: `Smoke ${user.label}` },
    });
    if (error || !data.user) throw error ?? new Error("User creation failed.");
    user.id = data.user.id;
    createdUserIds.push(data.user.id);
  }
  check(createdUserIds.length === 3, "disposable verified users created");

  for (const user of users) {
    user.client = userClient();
    const { error } = await user.client.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (error) throw error;
  }
  check(users.every((user) => user.client), "users authenticated with public key");

  const owner = users[0];
  const member = users[1];
  const outsider = users[2];
  const { data: createdTripId, error: createTripError } = await owner.client.rpc(
    "create_trip",
    {
      p_name: `Production smoke ${runId}`,
      p_description: "Disposable end-to-end verification",
      p_cover_path: "night",
    },
  );
  if (createTripError || typeof createdTripId !== "string") {
    throw createTripError ?? new Error("Trip RPC failed.");
  }
  tripId = createdTripId;
  check(Boolean(tripId), "trip and owner membership created atomically");

  const { data: outsiderTrip } = await outsider.client
    .from("trips")
    .select("id")
    .eq("id", tripId)
    .maybeSingle();
  check(!outsiderTrip, "RLS hides trip from non-members");

  const rawToken = randomBytes(32).toString("base64url");
  const tokenDigest = createHash("sha256").update(rawToken).digest("hex");
  const { error: inviteError } = await owner.client
    .from("trip_invitations")
    .insert({
      trip_id: tripId,
      invited_email: member.email,
      token: tokenDigest,
      invited_by: owner.id,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  if (inviteError) throw inviteError;
  const { data: acceptedTripId, error: acceptError } = await member.client.rpc(
    "accept_trip_invitation",
    { p_token: rawToken },
  );
  if (acceptError) throw acceptError;
  check(acceptedTripId === tripId, "email-bound invitation accepted");

  const { data: memberTrip } = await member.client
    .from("trips")
    .select("id")
    .eq("id", tripId)
    .maybeSingle();
  check(memberTrip?.id === tripId, "new member can read group after acceptance");

  mediaId = randomUUID();
  storagePath = `trips/${tripId}/${owner.id}/${mediaId}/mainstage-smoke.jpg`;
  const file = await readFile(
    new URL("../images/mainstage-3.jpg", import.meta.url),
  );
  const { error: uploadError } = await owner.client.storage
    .from("trip-media")
    .upload(storagePath, file, {
      contentType: "image/jpeg",
      upsert: false,
    });
  if (uploadError) throw uploadError;
  check(true, "member uploaded private photo through Storage RLS");

  const { error: mediaInsertError } = await owner.client.from("media").insert({
    id: mediaId,
    trip_id: tripId,
    album_id: null,
    uploaded_by: owner.id,
    storage_path: storagePath,
    original_filename: "mainstage-smoke.jpg",
    mime_type: "image/jpeg",
    media_type: "photo",
    file_size: file.length,
    width: 2048,
    height: 1536,
    duration_seconds: null,
    captured_at: null,
  });
  if (mediaInsertError) throw mediaInsertError;
  check(true, "media metadata inserted with matching immutable path");

  const { data: signed, error: signedError } = await member.client.storage
    .from("trip-media")
    .createSignedUrl(storagePath, 60, { download: "mainstage-smoke.jpg" });
  if (signedError || !signed?.signedUrl) {
    throw signedError ?? new Error("Signed URL failed.");
  }
  const download = await fetch(signed.signedUrl);
  const downloadedBytes = Buffer.from(await download.arrayBuffer());
  check(
    download.ok && downloadedBytes.equals(file),
    "member downloaded byte-identical private original",
  );

  const { data: outsiderSigned } = await outsider.client.storage
    .from("trip-media")
    .createSignedUrl(storagePath, 60);
  check(!outsiderSigned?.signedUrl, "non-member cannot create a private media URL");

  await member.client.storage
    .from("trip-media")
    .remove([storagePath]);
  const { data: ownerVerification, error: ownerVerificationError } =
    await owner.client.storage.from("trip-media").createSignedUrl(storagePath, 60);
  if (ownerVerificationError || !ownerVerification?.signedUrl) {
    throw ownerVerificationError ?? new Error("Owner verification URL failed.");
  }
  const stillStored = await fetch(ownerVerification.signedUrl);
  check(
    stillStored.ok,
    "non-uploader cannot delete another member's file",
  );

  const { error: storageDeleteError } = await owner.client.storage
    .from("trip-media")
    .remove([storagePath]);
  if (storageDeleteError) throw storageDeleteError;
  storagePath = undefined;
  const { error: mediaDeleteError } = await owner.client
    .from("media")
    .delete()
    .eq("id", mediaId);
  if (mediaDeleteError) throw mediaDeleteError;
  mediaId = undefined;
  check(true, "uploader deleted Storage object and media record");

  const { error: tripDeleteError } = await owner.client
    .from("trips")
    .delete()
    .eq("id", tripId);
  if (tripDeleteError) throw tripDeleteError;
  tripId = undefined;
  check(true, "owner deleted group and dependent records");
} finally {
  if (storagePath) {
    await admin.storage.from("trip-media").remove([storagePath]);
  }
  if (tripId) {
    await admin.from("trips").delete().eq("id", tripId);
  }
  for (const userId of createdUserIds) {
    await admin.auth.admin.deleteUser(userId);
  }
  console.log("CLEANUP disposable smoke-test data removed");
}
