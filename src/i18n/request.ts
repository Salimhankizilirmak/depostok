import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Desteklenen diller
const locales = ['tr', 'en', 'zh', 'ar'];

export default getRequestConfig(async ({ locale }) => {
  // Geçerli bir locale değilse 404
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
