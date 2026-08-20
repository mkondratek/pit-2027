import { describe, expect, it } from 'vitest';

import { kwotaZSuwaka, wZakresie } from './suwak';

/** Zakres jak w kalkulatorze przy rozliczeniu indywidualnym. */
const MIN = 3_000;
const MAX = 30_000;

describe('wZakresie', () => {
  it('przepuszcza kwotę z zakresu', () => {
    expect(wZakresie(12_000, MIN, MAX)).toBe(12_000);
  });

  it('domyka do obu krańców', () => {
    expect(wZakresie(1_500, MIN, MAX)).toBe(MIN);
    expect(wZakresie(66_333, MIN, MAX)).toBe(MAX);
  });
});

describe('kwotaZSuwaka', () => {
  it('przyjmuje zwykłe przeciągnięcie', () => {
    expect(kwotaZSuwaka(15_000, 12_000, MIN, MAX)).toBe(15_000);
  });

  it('domyka wartość spoza zakresu, gdy kwota mieści się w zakresie', () => {
    expect(kwotaZSuwaka(40_000, 12_000, MIN, MAX)).toBe(MAX);
  });

  /**
   * Sedno: kwota wpisana z ręki wykracza poza suwak, więc uchwyt stoi na
   * krawędzi. Zdarzenie o wartości tej krawędzi to domknięcie po zmianie `max`,
   * nie gest — a `max` zmienia się przy każdym przełączniku opcji.
   */
  it('ignoruje domknięcie do sufitu, gdy kwota jest wyższa niż sufit', () => {
    expect(kwotaZSuwaka(MAX, 66_333, MIN, MAX)).toBeNull();
  });

  it('ignoruje domknięcie do dolnego krańca, gdy kwota jest niższa', () => {
    expect(kwotaZSuwaka(MIN, 1_500, MIN, MAX)).toBeNull();
  });

  it('przepuszcza ruch z przypiętej krawędzi w głąb zakresu', () => {
    expect(kwotaZSuwaka(29_900, 66_333, MIN, MAX)).toBe(29_900);
    expect(kwotaZSuwaka(3_100, 1_500, MIN, MAX)).toBe(3_100);
  });

  it('nie milknie, gdy kwota stoi na krawędzi legalnie', () => {
    // Tu 30 000 zł jest kwotą użytkownika, a nie domknięciem: gest na krawędzi
    // ma prawo ją potwierdzić.
    expect(kwotaZSuwaka(MAX, MAX, MIN, MAX)).toBe(MAX);
  });

  /** Sufit rośnie razem z osią wykresu, więc reguła musi działać przy każdym. */
  it('trzyma kwotę przy zmianie sufitu na inny', () => {
    for (const sufit of [30_000, 40_000, 41_000, 55_000]) {
      expect(kwotaZSuwaka(sufit, 66_333, MIN, sufit)).toBeNull();
    }
  });
});
