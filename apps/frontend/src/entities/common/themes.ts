export const THEME_TYPES = ["light", "dark", "system"] as const;
export type Theme_Types = (typeof THEME_TYPES)[number];
