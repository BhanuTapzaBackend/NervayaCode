export function validateReturnUrl(value: string | null | undefined): string | null {
  if (value == null || typeof value !== 'string') return null;
  const path = value.trim();
  if (path === '') return null;
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) return null;
  return path;
}
