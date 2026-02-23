import type { Language } from '../types';

export const calendar: Record<Language, Record<string, string | string[]>> = {
  sq: {
    title: 'Kalendari',
    subtitle: 'Shikoni dhe menaxhoni orarin tuaj.',
    today: 'Sot',
    selectDay: 'Zgjidhni një ditë',
    noAppointmentsThisDay: 'Nuk ka takime këtë ditë',
    clickDayToView: 'Klikoni mbi një ditë për të parë takimet',
    completed: 'Përfunduar',
    scheduled: 'E planifikuar',
    cancelled: 'Anuluar',
    days: ['Dië', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht'],
    months: ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor']
  },
  en: {
    title: 'Calendar',
    subtitle: 'View and manage your schedule.',
    today: 'Today',
    selectDay: 'Select a day',
    noAppointmentsThisDay: 'No appointments this day',
    clickDayToView: 'Click on a day to view appointments',
    completed: 'Completed',
    scheduled: 'Scheduled',
    cancelled: 'Cancelled',
    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  },
  sr: {
    title: 'Kalendar',
    subtitle: 'Pogledajte i upravljajte vašim rasporedom.',
    today: 'Danas',
    selectDay: 'Izaberite dan',
    noAppointmentsThisDay: 'Nema termina ovog dana',
    clickDayToView: 'Kliknite na dan da vidite termine',
    completed: 'Završeno',
    scheduled: 'Zakazano',
    cancelled: 'Otkazano',
    days: ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'],
    months: ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar']
  },
};
