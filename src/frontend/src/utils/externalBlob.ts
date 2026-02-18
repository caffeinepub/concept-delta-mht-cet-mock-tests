import { ExternalBlob } from '../backend';

/**
 * Convert a browser File object to an ExternalBlob for backend storage
 * @param file - The File object from an input element
 * @param onProgress - Optional callback to track upload progress (0-100)
 * @returns Promise resolving to an ExternalBlob instance
 */
export async function fileToExternalBlob(
  file: File,
  onProgress?: (percentage: number) => void
): Promise<ExternalBlob> {
  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Create ExternalBlob from bytes
  let blob = ExternalBlob.fromBytes(uint8Array);
  
  // Attach progress handler if provided
  if (onProgress) {
    blob = blob.withUploadProgress(onProgress);
  }
  
  return blob;
}

/**
 * Get a display URL for an ExternalBlob (for img src, etc.)
 * @param blob - The ExternalBlob instance
 * @returns Direct URL string for display
 */
export function getBlobDisplayURL(blob: ExternalBlob): string {
  return blob.getDirectURL();
}

/**
 * Validate image file type and size
 * @param file - The File object to validate
 * @param maxSizeMB - Maximum file size in megabytes (default: 5MB)
 * @returns Error message if invalid, null if valid
 */
export function validateImageFile(file: File, maxSizeMB: number = 5): string | null {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!validTypes.includes(file.type)) {
    return 'Please select a valid image file (JPEG, PNG, or WebP)';
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `Image size must be less than ${maxSizeMB}MB`;
  }
  
  return null;
}
