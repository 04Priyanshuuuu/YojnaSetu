export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  bcp47: string;
}
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", bcp47: "en-IN" },
  { code: "hi", name: "Hindi", nativeName: "Hindi", bcp47: "hi-IN" },
  { code: "bn", name: "Bengali", nativeName: "Bengali", bcp47: "bn-IN" },
  { code: "te", name: "Telugu", nativeName: "Telugu", bcp47: "te-IN" },
  { code: "mr", name: "Marathi", nativeName: "Marathi", bcp47: "mr-IN" },
  { code: "ta", name: "Tamil", nativeName: "Tamil", bcp47: "ta-IN" },
  { code: "gu", name: "Gujarati", nativeName: "Gujarati", bcp47: "gu-IN" },
  { code: "kn", name: "Kannada", nativeName: "Kannada", bcp47: "kn-IN" },
  { code: "ml", name: "Malayalam", nativeName: "Malayalam", bcp47: "ml-IN" },
  { code: "pa", name: "Punjabi", nativeName: "Punjabi", bcp47: "pa-IN" },
  { code: "or", name: "Odia", nativeName: "Odia", bcp47: "or-IN" },
  { code: "as", name: "Assamese", nativeName: "Assamese", bcp47: "as-IN" },
];
export const humanizeMissingKey = (key: string) =>
  key
    .split(".")
    .pop()
    ?.replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase()) || key;
