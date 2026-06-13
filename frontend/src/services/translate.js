import en from '../locales/en.json';
import hi from '../locales/hi.json';
import te from '../locales/te.json';

const translations = {
  en,
  hi,
  te
};

export const translate = (key, lang = 'en') => {
  const code = (lang || 'en').split('-')[0].toLowerCase();
  const langDict = translations[code] || translations.en;
  
  // Return translation or fallback to English, then literal key
  if (langDict[key] !== undefined) {
    return langDict[key];
  }
  
  return translations.en[key] || key;
};
