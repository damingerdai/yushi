import { zh } from "./zh";

export type Locale = "en" | "zh-CN";
export const LOCALE_COOKIE = "yushi-locale";
export function normalizeLocale(value?: string): Locale {
  return value === "zh-CN" ? "zh-CN" : "en";
}

/** Translate application messages only, at render time, so active errors switch too. */
export function translate(
  locale: Locale,
  message: string,
  values: Record<string, string | number> = {},
) {
  let template = message;
  let parameters = values;
  const http =
    /^Unexpected server response \(HTTP (\d+)\)\. Please try again later or check the server logs\.$/.exec(
      message,
    );
  const size =
    /^The GitHub response exceeds the (\d+)-byte limit\. Please split the changes\.$/.exec(
      message,
    );
  if (http) {
    template =
      "Unexpected server response (HTTP {status}). Please try again later or check the server logs.";
    parameters = { status: http[1]! };
  } else if (size) {
    template =
      "The GitHub response exceeds the {limit}-byte limit. Please split the changes.";
    parameters = { limit: size[1]! };
  }
  const localized =
    locale === "zh-CN" && Object.hasOwn(zh, template)
      ? zh[template]!
      : template;
  return localized.replace(/\{(\w+)\}/g, (match, key: string) =>
    String(parameters[key] ?? match),
  );
}
