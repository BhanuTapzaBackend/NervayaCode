const CLOUDINARY_UPLOAD_MARKER = '/image/upload/';
const TRIM = 'e_trim';

/**
 * Amazon recommends a 2000px longest edge for gallery zoom (1600px is the
 * minimum that enables it at all), so the magnifier asks for that rendition.
 *
 * `c_limit` is load-bearing: without it Cloudinary happily upscales a small
 * source to 2000px, producing a multi-megabyte file with no extra detail in it
 * (a 419px trimmed photo came back as a 4.3MB 2000x4387 PNG). `f_auto,q_auto`
 * then lets Cloudinary negotiate format and quality, since the zoom panel is a
 * CSS background and never passes through next/image's optimizer.
 */
const ZOOM_TRANSFORM = 'f_auto,q_auto,c_limit,w_2000';

/**
 * Injects a transformation segment into a Cloudinary delivery URL.
 * Non-Cloudinary URLs (e.g. the local fallback asset) are returned untouched.
 */
function withCloudinaryTransform(url: string, transform: string): string {
  if (!url || !url.includes(CLOUDINARY_UPLOAD_MARKER)) return url;

  const [base, rest] = url.split(CLOUDINARY_UPLOAD_MARKER);
  if (rest.startsWith(`${transform}/`)) return url;

  // Drop an existing trim so callers can pass either a raw or an already-trimmed URL.
  const raw = rest.startsWith(`${TRIM}/`) ? rest.slice(TRIM.length + 1) : rest;

  return `${base}${CLOUDINARY_UPLOAD_MARKER}${transform}/${raw}`;
}

/**
 * Product photos are uploaded on oversized canvases with ~20% baked-in white
 * padding, which leaves the product looking small and letterboxed in a fixed
 * aspect-ratio box. `e_trim` crops the uniform border away at delivery time so
 * the product itself fills the frame.
 *
 * Requires a flat background — a gradient or vignette gives `e_trim` no uniform
 * border to detect and the crop silently becomes a no-op.
 */
export function trimProductImage(url: string): string {
  return withCloudinaryTransform(url, TRIM);
}

/** Trimmed, resolution-capped rendition backing the hover magnifier. */
export function productImageZoomUrl(url: string): string {
  return withCloudinaryTransform(url, `${TRIM}/${ZOOM_TRANSFORM}`);
}
