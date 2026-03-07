/**
 * Caption color palette derived from site CSS variables (index.css).
 * Used in the color picker alongside a free color input.
 */
export const SITE_COLOR_PALETTE = [
    { label: 'Text', value: '#1e1e1c' },
    { label: 'Muted', value: '#555555' },
    { label: 'Accent', value: '#3a5f8a' },
    { label: 'White', value: '#ffffff' },
    { label: 'Light gray', value: '#f8f7f5' },
    { label: 'Border', value: '#dcdad6' },
    { label: 'Dark', value: '#121212' },
    { label: 'Warm black', value: '#1e1e1c' },
    { label: 'Subtle', value: '#b6b6c6' },
] as const;

export type SiteColor = (typeof SITE_COLOR_PALETTE)[number];
