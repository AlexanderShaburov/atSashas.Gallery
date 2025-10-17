export const LANG_CODES = ['en', 'ru', 'it', 'es', 'pt'] as const;
export type LangCode = (typeof LANG_CODES)[number];

export type Localized = Partial<Record<LangCode, string>>;
