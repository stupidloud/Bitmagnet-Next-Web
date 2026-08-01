import { getRequestConfig } from "next-intl/server";
import { headers, cookies } from "next/headers";

import { defaultLocale } from "./config";

function mergeMessages(
  base: Record<string, any>,
  override: Record<string, any>,
): Record<string, any> {
  const merged = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      merged[key] &&
      typeof merged[key] === "object" &&
      !Array.isArray(merged[key])
    ) {
      merged[key] = mergeMessages(merged[key], value);
    } else {
      merged[key] = value;
    }
  }

  return merged;
}

export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.
  const requestHeaders = await headers();
  const requestCookies = await cookies();

  const browserLocale = (() => {
    let locale = requestHeaders.get("accept-language") ?? "";

    locale = locale?.split(",")[0];

    if (!locale.startsWith("zh")) {
      locale = locale.split("-")[0];
    }

    return locale;
  })();

  const cookieLocale = (() => {
    const locale = requestCookies.get("NEXT_LOCALE")?.value;

    return locale;
  })();

  const locale = cookieLocale || browserLocale || defaultLocale;

  const defaultLocaleFile = (await import(`./locales/${defaultLocale}.json`))
    .default;

  if (!defaultLocaleFile) {
    throw new Error("Default locale file not found");
  }

  try {
    const localeFile = (await import(`./locales/${locale}.json`)).default;

    const localeMessages = mergeMessages(defaultLocaleFile, localeFile);

    return {
      locale,
      messages: localeMessages,
    };
  } catch (error) {
    return {
      locale: defaultLocale,
      messages: defaultLocaleFile,
    };
  }
});
