const loadedFonts = new Set<string>();

/**
 * Dynamically loads a Google Font by injecting a <link> tag.
 * Safe to call multiple times — each font loaded only once.
 */
export function loadGoogleFont(family: string): void {
  if (loadedFonts.has(family)) return;
  loadedFonts.add(family);

  const encoded = family.replace(/ /g, '+');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;700&display=swap`;
  document.head.appendChild(link);
}
