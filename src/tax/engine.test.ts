import { describe, expect, it } from 'vitest';

import {
  BRUTTO_PELNA_KORZYSC,
  BRUTTO_POCZATEK_KORZYSCI,
  MAKSYMALNA_KORZYSC_ROCZNA,
  oblicz,
  podatekWgSkali,
  porownaj,
  roundPln,
} from './engine';

describe('roundPln — art. 63 §1 Ordynacji podatkowej', () => {
  it('pomija końcówki poniżej 50 gr', () => {
    expect(roundPln(100.49)).toBe(100);
  });

  it('podwyższa końcówki od 50 gr w górę (HALF_UP, nie bankers rounding)', () => {
    expect(roundPln(100.5)).toBe(101);
    expect(roundPln(101.5)).toBe(102);
  });
});

describe('podatekWgSkali', () => {
  it('odtwarza kwoty stałe progów bez wpisywania ich na sztywno', () => {
    // 120 000 × 12% = 14 400 (2026); 130 000 × 12% = 15 600 (2027)
    expect(podatekWgSkali(120_000, 2026) + 3_600).toBe(14_400);
    expect(podatekWgSkali(130_000, 2027) + 3_600).toBe(15_600);
    // 15 600 + 20 000 × 24% = 20 400
    expect(podatekWgSkali(150_000, 2027) + 3_600).toBe(20_400);
  });

  it('nie schodzi poniżej zera przy dochodzie w granicach kwoty wolnej', () => {
    expect(podatekWgSkali(30_000, 2026)).toBe(0);
    expect(podatekWgSkali(0, 2027)).toBe(0);
  });

  it('nowa skala nie jest nigdy gorsza od obecnej', () => {
    for (let dochod = 0; dochod <= 400_000; dochod += 1_000) {
      expect(podatekWgSkali(dochod, 2027)).toBeLessThanOrEqual(podatekWgSkali(dochod, 2026));
    }
  });
});

/**
 * Tabela walidacyjna z model.md (część D) — liczby opublikowane przez Bankier
 * i money.pl. Jeżeli którykolwiek z tych testów pęknie, to znaczy że zmiana
 * w silniku rozjechała się z tym, co policzyły redakcje na podstawie zapowiedzi.
 */
describe('walidacja na opublikowanych wyliczeniach', () => {
  // Brutto jest tu okrągłe, więc dochód i podatek muszą trafić co do złotówki.
  const dokladne = [
    { brutto: 12_000, dochod: 121_258, podatek2026: 11_203, podatek2027: 10_951, zyskRok: 252 },
    { brutto: 13_000, dochod: 131_612, podatek2026: 14_516, podatek2027: 12_387, zyskRok: 2_129 },
    { brutto: 15_000, dochod: 152_322, podatek2026: 21_143, podatek2027: 17_543, zyskRok: 3_600 },
  ];

  it.each(dokladne)(
    'brutto $brutto zł/mies → zysk $zyskRok zł/rok',
    ({ brutto, dochod, podatek2026, podatek2027, zyskRok }) => {
      const { przed, po, zyskRocznie } = porownaj(brutto);

      expect(przed.podstawaOpodatkowania).toBe(dochod);
      expect(przed.podatek).toBe(podatek2026);
      expect(po.podatek).toBe(podatek2027);
      expect(zyskRocznie).toBe(zyskRok);
    },
  );

  /*
   * Te dwie kwoty brutto powstały przez odwrócenie wzoru z zadanego dochodu i
   * zaokrąglenie do pełnych złotych, więc z powrotem dają dochód o kilka złotych
   * obok okrągłego progu (119 994 zamiast 120 000). Punktem tych wierszy jest
   * położenie progu, nie dokładna podstawa — asercja idzie na to, co naprawdę
   * twierdzi źródło.
   */
  it('próg opłacalności ≈ 11 878 zł brutto — poniżej zysku nie ma', () => {
    expect(porownaj(BRUTTO_POCZATEK_KORZYSCI).zyskRocznie).toBe(0);
    expect(porownaj(BRUTTO_POCZATEK_KORZYSCI).przed.podstawaOpodatkowania).toBeCloseTo(120_000, -2);
    expect(porownaj(BRUTTO_POCZATEK_KORZYSCI + 100).zyskRocznie).toBeGreaterThan(0);
  });

  it('pełna korzyść ≈ od 14 776 zł brutto', () => {
    expect(porownaj(BRUTTO_PELNA_KORZYSC).zyskRocznie).toBe(3_600);
    expect(porownaj(BRUTTO_PELNA_KORZYSC).przed.podstawaOpodatkowania).toBeCloseTo(150_000, -2);
    expect(porownaj(BRUTTO_PELNA_KORZYSC - 200).zyskRocznie).toBeLessThan(3_600);
  });

  /*
   * model.md podaje dla 20 000 zł dochód 203 748 zł i podatek 37 623 zł. Ten
   * wiersz jest wewnętrznie sprzeczny: z brutto 240 000 zł po odjęciu składek
   * (13,71%) i KUP wychodzi 204 096 zł, a z podanego przez tabelę dochodu
   * 203 748 zł wychodzi podatek 37 599 zł — czyli nie zgadza się ani z brutto,
   * ani sam ze sobą. Wiersze 12/13/15 tys. trafiają dokładnie, więc to pomyłka
   * rachunkowa w tabeli. Trzymamy tu wartości policzone, nie przepisane.
   */
  it('brutto 20 000 zł/mies → pełna korzyść (sprostowanie tabeli w model.md)', () => {
    const { przed, zyskRocznie } = porownaj(20_000);

    expect(przed.podstawaOpodatkowania).toBe(204_096);
    expect(przed.podatek).toBe(37_711);
    expect(zyskRocznie).toBe(3_600);
  });
});

describe('progi korzyści', () => {
  it('poniżej progu opłacalności zmiana wynosi dokładnie zero', () => {
    for (const brutto of [3_000, 6_000, 9_000, 11_000, BRUTTO_POCZATEK_KORZYSCI]) {
      expect(porownaj(brutto).zyskRocznie).toBe(0);
    }
  });

  it('powyżej progu pełnej korzyści zysk zatrzymuje się na 3 600 zł/rok', () => {
    for (const brutto of [BRUTTO_PELNA_KORZYSC, 18_000, 30_000, 100_000]) {
      expect(porownaj(brutto).zyskRocznie).toBe(MAKSYMALNA_KORZYSC_ROCZNA);
    }
  });

  it('zysk rośnie monotonicznie między progami', () => {
    let poprzedni = -1;
    for (let brutto = 11_800; brutto <= 14_900; brutto += 100) {
      const zysk = porownaj(brutto).zyskRocznie;
      expect(zysk).toBeGreaterThanOrEqual(poprzedni);
      poprzedni = zysk;
    }
  });
});

describe('limit 30-krotności', () => {
  it('zatrzymuje składki emerytalną i rentową, ale nie chorobową', () => {
    // 30 000 zł/mies = 360 000 zł/rok, powyżej limitu 282 600 zł (2026)
    const { skladkiSpoleczne } = oblicz(30_000, 2026);
    const emerRent = 282_600 * (0.0976 + 0.015);
    const chorobowa = 360_000 * 0.0245;

    expect(skladkiSpoleczne).toBeCloseTo(emerRent + chorobowa, 2);
  });
});

describe('opcje', () => {
  it('podwyższone KUP zmniejszają podstawę o 600 zł rocznie', () => {
    const bez = oblicz(10_000, 2026);
    const z = oblicz(10_000, 2026, { kupPodwyzszone: true });

    expect(bez.podstawaOpodatkowania - z.podstawaOpodatkowania).toBe(600);
  });

  it('PPK pracownika jest potrącane z netto', () => {
    const bez = oblicz(10_000, 2026);
    const z = oblicz(10_000, 2026, { ppkPracownik: 0.02 });

    expect(bez.nettoRocznie - z.nettoRocznie).toBeCloseTo(120_000 * 0.02, 2);
  });
});
