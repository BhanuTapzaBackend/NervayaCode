/**
 * Supplements carry a legacy single `image` plus a newer `images` gallery. Live
 * products fill only the gallery and leave `image` as an empty string, so the
 * gallery wins and `image` is the fallback for older records.
 */
export interface SupplementImageSource {
  image?: string | null;
  images?: string[] | null;
}

export function supplementImage(supplement: SupplementImageSource | null | undefined): string {
  if (!supplement) return '';
  return supplement.images?.find((url) => Boolean(url?.trim())) || supplement.image || '';
}
