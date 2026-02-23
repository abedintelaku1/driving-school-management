import type { Language } from '../types';

export const app: Record<Language, Record<string, string>> = {
  sq: {
    title: 'AutoFlex',
    subtitle: 'Sistemi i menaxhimit të Autoshkollës',
    copyright: '© 2026 AutoFlex. Të gjitha të drejtat e rezervuara.',
    adminPanel: 'Paneli i Administratorit',
    instructorPanel: 'Paneli i Instruktorit'
  },
  en: {
    title: 'AutoFlex',
    subtitle: 'Driving School Management System',
    copyright: '© 2026 AutoFlex. All rights reserved.',
    adminPanel: 'Admin Panel',
    instructorPanel: 'Instructor Panel'
  },
  sr: {
    title: 'AutoFlex',
    subtitle: 'Sistem upravljanja autoškolom',
    copyright: '© 2026 AutoFlex. Sva prava zadržana.',
    adminPanel: 'Paneli administratora',
    instructorPanel: 'Panel instruktora'
  },
};
