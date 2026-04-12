import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
  console.log(`[i18n] Loading messages for locale: ${locale}`);
  
  // Geçerli bir locale değilse 404
  if (!(routing.locales as readonly string[]).includes(locale as string)) {
    console.error(`[i18n] Invalid locale requested: ${locale}`);
    notFound();
  }

  return {
    locale: locale as string,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
