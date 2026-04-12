import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Next.js 15'te params/locale bir Promise haline geldi.
  let locale = await requestLocale;

  console.log(`[i18n] Loading messages for locale: ${locale}`);
  
  // Geçerli bir locale değilse varsayılana dön veya 404 ver
  if (!locale || !(routing.locales as readonly string[]).includes(locale as string)) {
    console.warn(`[i18n] Invalid or missing locale: ${locale}. Fallback to default: ${routing.defaultLocale}`);
    locale = routing.defaultLocale;
  }

  return {
    locale: locale as string,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
