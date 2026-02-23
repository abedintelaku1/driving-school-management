import type { Language } from '../types';

export const login: Record<Language, Record<string, string>> = {
  sq: {
    title: 'Hyni në llogarinë tuaj',
    email: 'Email',
    emailPlaceholder: 'Vendosni emailin tuaj',
    password: 'Fjalëkalimi',
    passwordPlaceholder: 'Vendosni fjalëkalimin',
    submit: 'Hyni',
    error: 'Ndodhi një gabim. Kontrolloni nëse serveri është duke punuar.',
    invalidCredentials: 'Email ose fjalëkalim i pavlefshëm. Ju lutem kontrolloni kredencialet tuaja.'
  },
  en: {
    title: 'Sign in to your account',
    email: 'Email address',
    emailPlaceholder: 'Enter your email',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    submit: 'Sign in',
    error: 'An error occurred. Please check if the server is running.',
    invalidCredentials: 'Invalid email or password. Please check your credentials.'
  },
  sr: {
    title: 'Prijavite se na svoj nalog',
    email: 'Email adresa',
    emailPlaceholder: 'Unesite vaš email',
    password: 'Lozinka',
    passwordPlaceholder: 'Unesite vašu lozinku',
    submit: 'Prijavi se',
    error: 'Došlo je do greške. Proverite da li server radi.',
    invalidCredentials: 'Nevažeći email ili lozinka. Molimo proverite vaše podatke.'
  },
};
