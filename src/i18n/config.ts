import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pl from './locales/pl.json';
import en from './locales/en.json';

// Detect browser language on first run
const getBrowserLanguage = (): string => {
    const browserLang = navigator.language.split('-')[0]; // "en-US" -> "en"
    return browserLang === 'pl' || browserLang === 'en' ? browserLang : 'pl';
};

const savedLanguage = localStorage.getItem('language');
const initialLanguage = savedLanguage || getBrowserLanguage();

// Save to localStorage if it was auto-detected
if (!savedLanguage) {
    localStorage.setItem('language', initialLanguage);
}

i18n
    .use(initReactI18next)
    .init({
        resources: {
            pl: { translation: pl },
            en: { translation: en },
        },
        lng: initialLanguage,
        fallbackLng: 'pl',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
