import type { Language } from './types';

export const languages: {
  code: Language;
  name: string;
  nameSq: string;
  nameEn: string;
  nameSr: string;
  flag: string;
}[] = [
  { code: 'sq', name: 'Shqip', nameSq: 'Shqip', nameEn: 'Albanian', nameSr: 'Albanski', flag: '🇦🇱' },
  { code: 'en', name: 'English', nameSq: 'Anglisht', nameEn: 'English', nameSr: 'Engleski', flag: '🇬🇧' },
  { code: 'sr', name: 'Serbian', nameSq: 'Serbisht', nameEn: 'Serbian', nameSr: 'Srpski', flag: '🇷🇸' },
];
