import i18n from "i18next";
import * as SecureStore from "expo-secure-store";
import { initReactI18next } from "react-i18next";

const localeResources = {
  en: { translation: require("./locales/en.json") },
  hi: { translation: require("./locales/hi.json") },
  bn: { translation: require("./locales/bn.json") },
  te: { translation: require("./locales/te.json") },
  mr: { translation: require("./locales/mr.json") },
  ta: { translation: require("./locales/ta.json") },
  gu: { translation: require("./locales/gu.json") },
  kn: { translation: require("./locales/kn.json") },
  ml: { translation: require("./locales/ml.json") },
  pa: { translation: require("./locales/pa.json") },
  or: { translation: require("./locales/or.json") },
  as: { translation: require("./locales/as.json") },
};

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  bcp47: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", bcp47: "en-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", bcp47: "hi-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", bcp47: "bn-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", bcp47: "te-IN" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", bcp47: "mr-IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", bcp47: "ta-IN" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", bcp47: "gu-IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", bcp47: "kn-IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", bcp47: "ml-IN" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", bcp47: "pa-IN" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", bcp47: "or-IN" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", bcp47: "as-IN" },
];

const LANGUAGE_STORAGE_KEY = "yojnasetu_language";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: localeResources,
    lng: "en",
    fallbackLng: "en",
    returnNull: false,
    interpolation: {
      escapeValue: false,
    },
  });
}

const restoreSavedLanguage = async () => {
  try {
    const savedLanguage = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);

    if (
      savedLanguage &&
      SUPPORTED_LANGUAGES.some((language) => language.code === savedLanguage)
    ) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.warn("Failed to restore saved language:", error);
  }
};

void restoreSavedLanguage();

i18n.on("languageChanged", (language) => {
  void SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, language);
});

export const humanizeMissingKey = (key: string) =>
  key
    .split(".")
    .pop()
    ?.replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase()) || key;

export default i18n;
