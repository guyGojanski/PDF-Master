export const FILENAME_TRUNCATE_LIMIT = 20;

export function truncateFilename(
  filename: string,
  limit: number = FILENAME_TRUNCATE_LIMIT
): string {
  if (filename.length > limit) {
    return filename.substring(0, limit - 3) + '...';
  }
  return filename;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function calculateRotation(currentAngle: number): number {
  return (currentAngle - 90) % 360;
}
