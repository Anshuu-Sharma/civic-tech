// ============================================================
// apps/api/src/services/storage.service.ts
// Supabase Storage integration for media uploads.
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../lib/logger';

const log = logger.scope('Storage');

const BUCKET_NAME = 'grievance-media';

let supabase: SupabaseClient;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

/**
 * Ensures the storage bucket exists. Call once on server startup.
 */
export async function initStorageBucket(): Promise<void> {
  const sb = getSupabase();

  const { data: buckets } = await sb.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET_NAME);

  if (!exists) {
    const { error } = await sb.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10 MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    });

    if (error) {
      log.error('Failed to create bucket:', error.message);
    } else {
      log.info(`Created bucket "${BUCKET_NAME}"`);
    }
  }
}

/**
 * Upload a file buffer to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  grievanceId?: string
): Promise<string> {
  const sb = getSupabase();

  const extension = originalName.split('.').pop() || 'jpg';
  const folder = grievanceId ?? 'temp';
  const fileName = `${folder}/${uuidv4()}.${extension}`;

  const { error } = await sb.storage
    .from(BUCKET_NAME)
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = sb.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Upload a file from a URL (download then re-upload).
 */
export async function uploadFromUrl(
  sourceUrl: string,
  grievanceId?: string
): Promise<string> {
  const response = await fetch(sourceUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  const mimeType = response.headers.get('content-type') || 'image/jpeg';
  const fileName = sourceUrl.split('/').pop() || 'image.jpg';

  return uploadFile(buffer, fileName, mimeType, grievanceId);
}

/**
 * Generate a signed upload URL for client-side direct upload.
 * The frontend can PUT a file directly to this URL.
 */
export async function createSignedUploadUrl(
  fileName: string
): Promise<{ signedUrl: string; path: string }> {
  const sb = getSupabase();
  const path = `uploads/${uuidv4()}/${fileName}`;

  const { data, error } = await sb.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(`Failed to create signed URL: ${error?.message}`);
  }

  return {
    signedUrl: data.signedUrl,
    path,
  };
}

/**
 * Get the public URL for a file already in storage.
 */
export function getPublicUrl(path: string): string {
  const sb = getSupabase();
  const { data } = sb.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}
