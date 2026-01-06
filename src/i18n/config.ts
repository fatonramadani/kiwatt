export const locales = ["fr", "de", "it", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export const localeNames: Record<Locale, string> = {
  fr: "Francais",
  de: "Deutsch",
  it: "Italiano",
  en: "English",
};
