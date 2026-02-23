export type Language = 'sq' | 'en' | 'sr';

export const LOCALE_MAP: Record<Language, string> = {
  sq: 'sq-AL',
  en: 'en-US',
  sr: 'sr-RS',
};

export function getLocale(language: Language): string {
  return LOCALE_MAP[language] ?? 'sq-AL';
}
