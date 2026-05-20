export function parseCommaSeparated(value: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseTestimonials(value: string): Array<{ name: string; message: string; clientSince?: string }> {
  if (!value) return [];

  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Array<{ name: string; message: string; clientSince?: string }>>((acc, line) => {
      const parts = line.split('|').map((part) => part.trim());
      const name = parts[0] || '';
      const clientSince = parts[1] || '';
      const messageParts = parts.slice(2);

      const message = messageParts.join(' | ').trim() || (parts.length === 2 ? clientSince : '');
      const actualClientSince = parts.length > 2 ? clientSince : undefined;

      if (name && (message || clientSince)) {
        acc.push({
          name,
          message: message || clientSince, // Handle missing clientSince
          clientSince: actualClientSince,
        });
      }
      return acc;
    }, []);
}
