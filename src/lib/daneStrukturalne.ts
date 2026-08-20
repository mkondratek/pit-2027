/**
 * JSON-LD dla wyszukiwarek. Buduje się z `FAQ` — skróconej wersji odpowiedzi
 * ze strony, bez odsyłaczy, których schema.org nie przyjmuje. Google traktuje
 * rozjazd między danymi strukturalnymi a stroną jako powód do zignorowania
 * całego znacznika, więc zgodność listy pytań pilnuje `faq.test.ts`.
 */
import { FAQ } from './faq';

const STRONA = 'https://pit.kondratek.pl/';

export function daneStrukturalne(): string {
  return JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Kalkulator zmiany PIT od 2027 r.',
      url: STRONA,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      inLanguage: 'pl-PL',
      description:
        'Porównanie wynagrodzenia netto przed i po zapowiadanej zmianie skali podatkowej: ' +
        'próg 130 000 zł i nowa stawka 24%. Liczy w przeglądarce, bez wysyłania danych.',
      // Strona jest darmowa i taka zostanie — bez tego Google pyta o cenę.
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN' },
      author: { '@type': 'Person', name: 'Mikołaj Kondratek' },
      isAccessibleForFree: true,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(({ pytanie, odpowiedz }) => ({
        '@type': 'Question',
        name: pytanie,
        acceptedAnswer: { '@type': 'Answer', text: odpowiedz },
      })),
    },
  ]);
}
