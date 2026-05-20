/**
 * Decodes common HTML entities that appear in plain-text fields
 * (e.g. titles pasted from rich-text editors).
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Strips HTML tags and entities from rich-text content,
 * returning a plain-text excerpt capped at `maxLength` characters.
 */
export function getPlainExcerpt(content: string, maxLength: number = 150): string {
  const plain = content
    .replace(/<[^>]{0,10000}>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > maxLength ? `${plain.substring(0, maxLength)}...` : plain;
}
