import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import vi from './locales/vi.json';

const LANGUAGE_KEY = '@looply_language';

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: {
        translation: en,
      },
      vi: {
        translation: vi,
      },
    },
    lng: 'vi', // Default language
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// Load saved language from AsyncStorage on app start
AsyncStorage.getItem(LANGUAGE_KEY)
  .then((savedLanguage) => {
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'vi')) {
      i18n.changeLanguage(savedLanguage);
    }
  })
  .catch(() => {
    // Handle error silently, use default language
  });

// Save language preference when changed
i18n.on('languageChanged', (lng) => {
  AsyncStorage.setItem(LANGUAGE_KEY, lng).catch(() => {
    // Handle error silently
  });
});

export default i18n;

