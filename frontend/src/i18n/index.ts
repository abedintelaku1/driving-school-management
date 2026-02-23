import type { Language } from './types';
import { languages } from './languages';
import { login } from './namespaces/login';
import { common } from './namespaces/common';
import { header } from './namespaces/header';
import { sidebar } from './namespaces/sidebar';
import { app } from './namespaces/app';
import { dashboard } from './namespaces/dashboard';
import { candidates } from './namespaces/candidates';
import { cars } from './namespaces/cars';
import { instructors } from './namespaces/instructors';
import { payments } from './namespaces/payments';
import { packages } from './namespaces/packages';
import { reports } from './namespaces/reports';
import { documents } from './namespaces/documents';
import { instructorDashboard } from './namespaces/instructorDashboard';
import { calendar } from './namespaces/calendar';
import { myReports } from './namespaces/myReports';
import { myCandidates } from './namespaces/myCandidates';
import { appointments } from './namespaces/appointments';

const namespaces = {
  login,
  common,
  header,
  sidebar,
  app,
  dashboard,
  candidates,
  cars,
  instructors,
  payments,
  packages,
  reports,
  documents,
  instructorDashboard,
  calendar,
  myReports,
  myCandidates,
  appointments,
};

function mergeTranslations(): Record<Language, Record<string, unknown>> {
  const result: Record<Language, Record<string, unknown>> = {
    sq: {},
    en: {},
    sr: {},
  };
  for (const [nsName, ns] of Object.entries(namespaces)) {
    const langObj = ns as Record<Language, Record<string, unknown>>;
    for (const lang of ['sq', 'en', 'sr'] as const) {
      result[lang][nsName] = langObj[lang];
    }
  }
  return result;
}

export const translations = mergeTranslations();
export { languages };
export type { Language } from './types';
export type TranslationKey = keyof (typeof translations)['sq'];
export { getLocale } from './types';
