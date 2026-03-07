/** Curated Google Fonts for gallery captions — hand-picked for art aesthetic. */
export const GALLERY_FONTS = [
  'Inter',
  'Playfair Display',
  'Cormorant Garamond',
  'Lora',
  'Raleway',
  'Montserrat',
  'Libre Baskerville',
  'Source Serif 4',
  'DM Sans',
  'Crimson Text',
  'Josefin Sans',
  'EB Garamond',
] as const;

export type GalleryFontName = (typeof GALLERY_FONTS)[number];
