import { put } from '@vercel/blob';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from './constants';

export interface BlobUploadResult {
  url: string;
}

export interface BlobValidationError {
  error: string;
}

/**
 * Validates a file before upload.
 * Returns an error message string if invalid, null if valid.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    return `Invalid file type. Allowed: JPG, PNG, WebP`;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const maxMB = MAX_IMAGE_SIZE_BYTES / (1024 * 1024);
    return `File too large. Maximum size: ${maxMB}MB`;
  }

  return null;
}

/**
 * Uploads a file to Vercel Blob and returns the public URL.
 * Only stores the URL — never base64 or binary in MongoDB.
 */
export async function uploadToBlob(
  file: File,
  folder = 'memories'
): Promise<BlobUploadResult> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const pathname = `${folder}/${timestamp}-${safeName}`;

  const blob = await put(pathname, file, {
    access: 'public',
    contentType: file.type,
  });

  return { url: blob.url };
}
