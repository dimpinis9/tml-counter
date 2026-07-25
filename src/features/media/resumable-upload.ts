import { Upload } from "tus-js-client";

import { getPublicSupabaseEnv } from "@/lib/supabase/env";

export type ResumableUploadHandle = {
  completion: Promise<void>;
  cancel: () => Promise<void>;
};

export function startResumableUpload({
  accessToken,
  contentType,
  file,
  objectPath,
  onProgress,
}: {
  accessToken: string;
  contentType: string;
  file: File;
  objectPath: string;
  onProgress: (bytesUploaded: number, bytesTotal: number) => void;
}): ResumableUploadHandle {
  const env = getPublicSupabaseEnv();
  const projectUrl = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
  const directStorageHost = projectUrl.hostname.endsWith(".supabase.co")
    ? projectUrl.hostname.replace(".supabase.co", ".storage.supabase.co")
    : projectUrl.hostname;
  let upload: Upload;
  let rejectCompletion: (reason: Error) => void = () => undefined;
  let settled = false;

  const completion = new Promise<void>((resolve, reject) => {
    rejectCompletion = reject;
    upload = new Upload(file, {
      endpoint: `${projectUrl.protocol}//${directStorageHost}/storage/v1/upload/resumable`,
      retryDelays: [0, 3_000, 5_000, 10_000, 20_000],
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: "trip-media",
        objectName: objectPath,
        contentType,
        cacheControl: "3600",
      },
      onProgress,
      onError(error) {
        if (!settled) {
          settled = true;
          reject(error);
        }
      },
      onSuccess() {
        if (!settled) {
          settled = true;
          resolve();
        }
      },
    });

    upload.start();
  });

  return {
    completion,
    async cancel() {
      if (!settled) {
        settled = true;
        await upload.abort(true);
        rejectCompletion(new Error("Upload cancelled."));
      }
    },
  };
}
