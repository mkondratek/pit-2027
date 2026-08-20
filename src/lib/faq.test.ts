import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { FAQ } from './faq';

/**
 * Dane strukturalne dla wyszukiwarek niosą skróconą wersję odpowiedzi — bez
 * odsyłaczy, których schema.org nie chce. Rozjazd *treści* jest więc zamierzony,
 * ale rozjazd *pytań* nie: gdyby ktoś dopisał pytanie na stronie i zapomniał
 * o `faq.ts`, Google dostałby niepełną listę i nikt by tego nie zauważył.
 */
describe('FAQ w danych strukturalnych', () => {
  const app = readFileSync(new URL('../App.svelte', import.meta.url), 'utf8');
  const naStronie = [...app.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) =>
    m[1].replace(/\s+/g, ' ').trim(),
  );

  it('pokrywa dokładnie te pytania, które widać na stronie', () => {
    expect(FAQ.map((p) => p.pytanie)).toEqual(naStronie);
  });

  it('nie zostawia pustej odpowiedzi', () => {
    for (const { pytanie, odpowiedz } of FAQ) {
      expect(odpowiedz.length, pytanie).toBeGreaterThan(80);
    }
  });
});
