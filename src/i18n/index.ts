import ar from "./ar";
import en from "./en";
import type { Locale } from "@/lib/site";

export const dictionaries = { ar, en };
export const getDict = (locale: Locale) => dictionaries[locale];
export type { Dict } from "./ar";
