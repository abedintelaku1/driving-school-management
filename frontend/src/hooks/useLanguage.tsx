import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, languages } from '../i18n/translations';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLanguages: typeof languages;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'app_language';

// Helper function to get nested translation value
const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path; // Return key path if not found
    }
  }
  return typeof value === 'string' ? value : path;
};

function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get language from localStorage or default to Albanian
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    // Only use stored value if it's a valid language code
    if (stored && (stored === 'sq' || stored === 'en' || stored === 'sr')) {
      return stored as Language;
    }
    // Always default to Albanian ('sq') if no valid language is stored
    // This ensures Albanian is the default language for both admin and instructor
    return 'sq';
  });

  // Save language to localStorage whenever it changes
  useEffect(() => {
    // Only save valid language codes
    if (language === 'sq' || language === 'en' || language === 'sr') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } else {
      // If somehow an invalid language is set, reset to Albanian and save it
      setLanguageState('sq');
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'sq');
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  // Translation function with parameter interpolation
  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[language];
    let text = getNestedValue(translation, key);
    
    // Replace parameters in the format {key}
    if (params) {
      Object.keys(params).forEach(paramKey => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(params[paramKey]));
      });
    }
    
    return text;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        availableLanguages: languages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Named exports for Fast Refresh compatibility
export { LanguageProvider, useLanguage };

