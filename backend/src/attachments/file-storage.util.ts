import { randomUUID } from 'crypto';

/** Strips path separators and unsafe characters, keeping the file reasonably readable. */
export function sanitizeFileName(originalName: string): string {
  const base = originalName
    .normalize('NFKD')
    .replace(/[/\\]/g, '_')
    .replace(/[^\w.-]+/g, '_')
    .replace(/_{2,}/g, '_');
  const trimmed = base.slice(-150) || 'file';
  return trimmed;
}

export function buildStoredFileName(originalName: string): string {
  return `${randomUUID()}-${sanitizeFileName(originalName)}`;
}
