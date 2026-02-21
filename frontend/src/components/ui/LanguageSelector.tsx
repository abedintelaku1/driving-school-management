import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

type LanguageSelectorProps = {
  variant?: 'dropdown' | 'button';
  className?: string;
};

export function LanguageSelector({ variant = 'dropdown', className = '' }: LanguageSelectorProps) {
  const { language, setLanguage, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentLanguage = availableLanguages.find((lang) => lang.code === language) || availableLanguages[0];
  
  // Get language name based on current language
  const getLanguageName = (lang: typeof availableLanguages[0]): string => {
    if ('nameSq' in lang && 'nameEn' in lang && 'nameSr' in lang) {
      switch (language) {
        case 'sq': return (lang as any).nameSq || lang.name;
        case 'en': return (lang as any).nameEn || lang.name;
        case 'sr': return (lang as any).nameSr || lang.name;
        default: return lang.name;
      }
    }
    return lang.name;
  };

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as 'sq' | 'en' | 'sr');
    setIsOpen(false);
  };

  if (variant === 'button') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span className="text-lg">{currentLanguage.flag}</span>
          <span className="hidden sm:inline">{getLanguageName(currentLanguage)}</span>
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="py-1">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                    language === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="flex-1">{getLanguageName(lang)}</span>
                  {language === lang.code && <CheckIcon className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Dropdown variant (for Login/Register pages)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentLanguage.flag}</span>
          <span>{getLanguageName(currentLanguage)}</span>
        </div>
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${
                  language === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1">{lang.name}</span>
                {language === lang.code && <CheckIcon className="w-4 h-4 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}




