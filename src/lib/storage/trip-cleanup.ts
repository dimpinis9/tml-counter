import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const REMOVE_BATCH_SIZE = 100;

export async function cleanupTripStorage(storagePaths: readonly string[]) {
  if (storagePaths.length === 0) {
    return { success: true as const };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      success: false as const,
      error:
        "Storage cleanup is not configured. Add the server-only service role key before deleting chapters with media.",
    };
  }

  for (let index = 0; index < storagePaths.length; index += REMOVE_BATCH_SIZE) {
    const batch = storagePaths.slice(index, index + REMOVE_BATCH_SIZE);
    const { error } = await admin.storage.from("trip-media").remove([...batch]);
    if (error) {
      return {
        success: false as const,
        error: "The chapter files could not be removed. Nothing was deleted.",
      };
    }
  }

  return { success: true as const };
}
