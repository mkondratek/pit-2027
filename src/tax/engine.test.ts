import { describe, expect, it } from 'vitest';

import {
  BRUTTO_PELNA_KORZYSC,
  BRUTTO_PELNA_KORZYSC_ULGA,
  BRUTTO_POCZATEK_KORZYSCI,
  BRUTTO_POCZATEK_KORZYSCI_ULGA,
  MAKSYMALNA_KORZYSC_ROCZNA,
  MAKSYMALNA_KORZYSC_WSPOLNA,
  kapZdrowotnej,
  obliczWspolnie,
  oblicz,
  podatekWgSkali,
  porownaj,
  porownajWspolnie,
  progiWspolne,
  roundPln,
} from './engine';
import {
  LIMIT_PIT_ZERO,
  PLACA_MINIMALNA,
  PPK_PRACODAWCA_PODSTAWOWY,
  PPK_PRACOWNIK_PODSTAWOWY,
  type Rok,
} from './constants';

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

/**
 * Wspólne rozliczenie małżonków.
 *
 * Nie ma dla tego opublikowanych wyliczeń, do których dałoby się przyłożyć
 * liczby, więc zamiast wpisywać własny wynik jako oczekiwany — co sprawdzałoby
 * tylko to, że kod robi to, co robi — testujemy **własności**, które muszą
 * zachodzić niezależnie od implementacji. Każda z nich jest osobnym powodem, dla
 * którego wynik mógłby być zły, i każda jest sprawdzalna z zewnątrz.
 *
 * Wszędzie tam, gdzie pojawia się tolerancja 1 zł, bierze się ona z jednego
 * miejsca: `roundPln` na podatku. Wspólne rozliczenie zaokrągla podatek raz
 * (jeden wspólny), rozliczenie osobne dwa razy (każdemu z osobna), więc te dwie
 * drogi mogą się rozjechać najwyżej o złotówkę w skali roku. Tolerancja jest
 * podana wprost jako `± 1 zł`, a nie schowana w `toBeCloseTo`, żeby było widać,
 * że jest ograniczona i skąd się bierze.
 */
describe('wspólne rozliczenie — własności', () => {
  const lata: Rok[] = [2026, 2027];
  const pary: [number, number][] = [
    [12_000, 0],
    [13_000, 0],
    [30_000, 0],
    [12_000, 4_806],
    [13_000, 13_000],
    [20_000, 3_000],
    [8_000, 8_000],
    [25_000, 9_000],
    [40_000, 40_000],
  ];

  /*
   * Właściwość 1 — neutralność dla równych zarobków.
   *
   * Wspólne rozliczenie ma sens tylko wtedy, gdy dochody są nierówne: przy
   * dwojgu zarabiających tyle samo połowa łącznego dochodu to dokładnie dochód
   * każdego z nich, więc nie ma czego wyrównywać. To najostrzejszy test na
   * pomyłkę w konstrukcji wzoru — każde zgubione albo doliczone dwa razy
   * ogniwo (kwota zmniejszająca, KUP, składki, dzielenie przez dwa) rozjeżdża
   * ten wynik od razu i o dużo więcej niż złotówkę.
   */
  describe('dwoje zarabiających tyle samo wychodzi na to samo, co osobno', () => {
    it.each([5_000, 8_000, 12_000, 13_000, 20_000, 30_000])(
      'po %i zł brutto każde',
      (brutto) => {
        for (const rok of lata) {
          const wspolnie = obliczWspolnie(brutto, brutto, rok);
          const osobno = oblicz(brutto, rok);

          // Dochody są całkowite, więc tu żadne zaokrąglenie nie ma prawa uciec.
          expect(wspolnie.podstawaOpodatkowania).toBe(2 * osobno.podstawaOpodatkowania);
          expect(wspolnie.skladkiSpoleczne).toBeCloseTo(2 * osobno.skladkiSpoleczne, 2);
          expect(wspolnie.skladkaZdrowotna).toBeCloseTo(2 * osobno.skladkaZdrowotna, 2);

          expect(Math.abs(wspolnie.podatek - 2 * osobno.podatek)).toBeLessThanOrEqual(1);
          expect(Math.abs(wspolnie.nettoRocznie - 2 * osobno.nettoRocznie)).toBeLessThanOrEqual(1);
        }
      },
    );

    it('zysk z reformy też jest dwukrotnością zysku jednej osoby', () => {
      for (const brutto of [12_000, 13_000, 14_000, 20_000]) {
        const wspolnie = porownajWspolnie(brutto, brutto).zyskRocznie;
        const osobno = 2 * porownaj(brutto).zyskRocznie;

        expect(Math.abs(wspolnie - osobno)).toBeLessThanOrEqual(1);
      }
    });

    /*
     * Złotówka tolerancji wyżej to nie luz „gdzieś się rozjeżdża" — daje się
     * pokazać, że bierze się wyłącznie z zaokrągleń, i że przed nimi obie drogi
     * są identyczne. Przy równych dochodach połowa łącznego dochodu to dokładnie
     * dochód jednej osoby, więc porównujemy tę samą wartość funkcji skali.
     */
    it('przed zaokrągleniem podatku obie drogi są tą samą liczbą', () => {
      for (const brutto of [12_000, 13_000, 14_000, 20_000]) {
        for (const rok of lata) {
          const dochod = oblicz(brutto, rok).podstawaOpodatkowania;
          const laczny = obliczWspolnie(brutto, brutto, rok).podstawaOpodatkowania;

          expect(2 * podatekWgSkali(laczny / 2, rok)).toBe(2 * podatekWgSkali(dochod, rok));
        }
      }
    });
  });

  /*
   * Właściwość 2 — wspólne rozliczenie nigdy nie szkodzi.
   *
   * Wynika z wypukłości skali: podatek od średniej nie jest większy od średniej
   * podatków. Gdyby dla jakiejś pary wyszło inaczej, znaczyłoby to, że gdzieś
   * mnożymy albo dzielimy nie to co trzeba. Sprawdzane najpierw na samej skali
   * (bez zaokrągleń, więc bez tolerancji), potem na całym silniku.
   */
  it('podatek od połowy łącznego dochodu, razy dwa, nie przekracza sumy podatków osobnych', () => {
    for (const rok of lata) {
      for (let d1 = 0; d1 <= 400_000; d1 += 20_000) {
        for (let d2 = 0; d2 <= 400_000; d2 += 20_000) {
          expect(2 * podatekWgSkali((d1 + d2) / 2, rok)).toBeLessThanOrEqual(
            podatekWgSkali(d1, rok) + podatekWgSkali(d2, rok),
          );
        }
      }
    }
  });

  it.each(pary)('para %i + %i zł: wspólnie nie gorzej niż osobno', (a, b) => {
    for (const rok of lata) {
      const wspolnie = obliczWspolnie(a, b, rok);
      const osobno = oblicz(a, rok).nettoRocznie + oblicz(b, rok).nettoRocznie;

      expect(wspolnie.nettoRocznie).toBeGreaterThanOrEqual(osobno - 1);
    }
  });

  /*
   * Właściwość 3 — małżonek bez dochodu.
   *
   * Najczęstszy powód, dla którego ludzie rozliczają się wspólnie, i miejsce
   * gdzie najłatwiej o cichy błąd: koszty uzyskania przychodu nieistniejącego
   * etatu i kwota zmniejszająca policzona raz zamiast dwa razy.
   */
  describe('małżonek bez dochodu', () => {
    it('nie wnosi kosztów uzyskania przychodu ani składki zdrowotnej', () => {
      const wspolnie = obliczWspolnie(13_000, 0, 2026);
      const sam = oblicz(13_000, 2026);

      // Gdyby koszty małżonka bez pracy weszły do sumy, podstawa byłaby o 3 000 zł
      // niższa — kalkulator odliczałby koszty nieistniejącego etatu.
      expect(wspolnie.podstawaOpodatkowania).toBe(sam.podstawaOpodatkowania);
      expect(wspolnie.kup).toBe(sam.kup);
      expect(wspolnie.skladkaZdrowotna).toBe(sam.skladkaZdrowotna);
      expect(wspolnie.skladkiSpoleczne).toBe(sam.skladkiSpoleczne);
      expect(wspolnie.osoby[1].dochod).toBe(0);
      expect(wspolnie.osoby[1].kup).toBe(0);
    });

    /*
     * Rozbicie w interfejsie pokazuje cztery kwoty jedna pod drugą i ktoś je
     * odejmie na kartce. Muszą się zgadzać — z dokładnością do zaokrąglenia
     * dochodu każdego z małżonków osobno, czyli dwa razy po pół złotego.
     */
    it('rozbicie się spina — brutto minus składki minus KUP to podstawa', () => {
      for (const [a, b] of pary) {
        const w = obliczWspolnie(a, b, 2026);
        const zRozbicia = w.bruttoRocznie - w.skladkiSpoleczne - w.kup;

        expect(Math.abs(w.podstawaOpodatkowania - zRozbicia)).toBeLessThanOrEqual(1);
      }
    });

    it('kwota zmniejszająca wchodzi dwukrotnie — dochód do 60 000 zł to zero podatku', () => {
      // Brutto 5 000 zł/mies → dochód 48 774 zł: samotnie podatek jest, wspólnie nie ma.
      const wspolnie = obliczWspolnie(5_000, 0, 2026);

      expect(wspolnie.podstawaOpodatkowania).toBeGreaterThan(30_000);
      expect(wspolnie.podstawaOpodatkowania).toBeLessThan(60_000);
      expect(wspolnie.podatek).toBe(0);
      expect(oblicz(5_000, 2026).podatek).toBeGreaterThan(0);
    });

    it('podatek to dokładnie dwukrotność podatku od połowy dochodu', () => {
      for (const brutto of [5_000, 13_000, 25_000, 40_000]) {
        for (const rok of lata) {
          const wspolnie = obliczWspolnie(brutto, 0, rok);

          expect(wspolnie.podatek).toBe(
            roundPln(2 * podatekWgSkali(wspolnie.podstawaOpodatkowania / 2, rok)),
          );
        }
      }
    });
  });

  /*
   * Właściwość 4 — zysk z reformy sięga dwukrotności maksimum i nigdy go nie
   * przekracza. Granice skali działają na połowę łącznego dochodu, czyli
   * faktycznie podwójnie: 2 × 3 600 zł. Para z jednym żywicielem dochodzi do
   * tego pułapu sama, bez drugiej pensji — i to jest cała stawka tego zadania.
   */
  describe('zysk gospodarstwa', () => {
    it('para z jednym żywicielem dochodzi do 7 200 zł rocznie', () => {
      expect(MAKSYMALNA_KORZYSC_WSPOLNA).toBe(2 * MAKSYMALNA_KORZYSC_ROCZNA);
      expect(porownajWspolnie(30_000, 0).zyskRocznie).toBe(MAKSYMALNA_KORZYSC_WSPOLNA);

      // …czyli dwa razy więcej, niż tej samej osobie pokazuje rozliczenie osobne.
      expect(porownaj(30_000).zyskRocznie).toBe(MAKSYMALNA_KORZYSC_ROCZNA);
    });

    it('nigdy nie jest ujemny i nigdy nie przekracza 7 200 zł', () => {
      for (let a = 0; a <= 40_000; a += 2_000) {
        for (let b = 0; b <= 40_000; b += 2_000) {
          const zysk = porownajWspolnie(a, b).zyskRocznie;

          expect(zysk).toBeGreaterThanOrEqual(0);
          expect(zysk).toBeLessThanOrEqual(MAKSYMALNA_KORZYSC_WSPOLNA);
        }
      }
    });

    it('nowa skala nie jest gorsza od obecnej także we wspólnym rozliczeniu', () => {
      for (const [a, b] of pary) {
        expect(obliczWspolnie(a, b, 2027).podatek).toBeLessThanOrEqual(
          obliczWspolnie(a, b, 2026).podatek,
        );
      }
    });

    it('rośnie monotonicznie wraz z wynagrodzeniem, przy stałych zarobkach małżonka', () => {
      for (const malzonek of [0, 6_000, 13_000]) {
        let poprzedni = -1;
        for (let brutto = 0; brutto <= 40_000; brutto += 250) {
          const zysk = porownajWspolnie(brutto, malzonek).zyskRocznie;
          expect(zysk).toBeGreaterThanOrEqual(poprzedni);
          poprzedni = zysk;
        }
      }
    });
  });

  /*
   * Właściwość 5 — rzeczy, które przy wspólnym rozliczeniu zostają
   * indywidualne. Limit 30-krotności jest własnym limitem każdego małżonka,
   * a nie limitem gospodarstwa; składka zdrowotna liczy się i odejmuje osobno.
   */
  it('limit 30-krotności obowiązuje każdego z osobna, nie parę', () => {
    // 2 × 240 000 zł rocznie: każde poniżej limitu 282 600 zł, razem grubo powyżej.
    const wspolnie = obliczWspolnie(20_000, 20_000, 2026);
    const sam = oblicz(20_000, 2026);

    expect(wspolnie.skladkiSpoleczne).toBeCloseTo(2 * sam.skladkiSpoleczne, 2);
    // Gdyby limit liczył się od sumy, składki byłyby o kilka tysięcy niższe.
    expect(wspolnie.skladkiSpoleczne).toBeGreaterThan(
      oblicz(40_000, 2026).skladkiSpoleczne,
    );
  });

  it('jest symetryczne — kolejność małżonków nie zmienia wyniku', () => {
    for (const [a, b] of pary) {
      expect(porownajWspolnie(a, b).zyskRocznie).toBe(porownajWspolnie(b, a).zyskRocznie);
      expect(obliczWspolnie(a, b, 2027).nettoRocznie).toBe(
        obliczWspolnie(b, a, 2027).nettoRocznie,
      );
    }
  });

  it('przyjmuje osobne opcje dla małżonka', () => {
    const oboje = obliczWspolnie(10_000, 10_000, 2026, { kupPodwyzszone: true });
    const tylkoJa = obliczWspolnie(10_000, 10_000, 2026, {
      kupPodwyzszone: true,
      malzonek: {},
    });

    expect(tylkoJa.podstawaOpodatkowania - oboje.podstawaOpodatkowania).toBe(600);
  });

  /*
   * Właściwość 6 — progi dla pary. Przy małżonku bez dochodu wypadają wyżej niż
   * indywidualne, bo obie granice skali działają wtedy podwójnie; im więcej
   * zarabia małżonek, tym bliżej progów indywidualnych. Wyszukiwanie połówkowe
   * w `progiWspolne` opiera się na monotoniczności zysku (sprawdzanej wyżej),
   * więc tu wystarczy sprawdzić, że trafia w krawędź co do złotówki.
   */
  describe('progiWspolne', () => {
    it.each([0, 5_000, 13_000])('dla małżonka z %i zł trafia w krawędź', (malzonek) => {
      const { poczatek, pelna } = progiWspolne(malzonek);

      expect(porownajWspolnie(poczatek - 1, malzonek).zyskRocznie).toBe(0);
      expect(porownajWspolnie(poczatek, malzonek).zyskRocznie).toBeGreaterThan(0);
      expect(porownajWspolnie(pelna - 1, malzonek).zyskRocznie).toBeLessThan(
        MAKSYMALNA_KORZYSC_WSPOLNA,
      );
      expect(porownajWspolnie(pelna, malzonek).zyskRocznie).toBe(MAKSYMALNA_KORZYSC_WSPOLNA);
    });

    it('przy małżonku bez dochodu leżą wyżej niż progi indywidualne', () => {
      const { poczatek, pelna } = progiWspolne(0);

      expect(poczatek).toBeGreaterThan(BRUTTO_POCZATEK_KORZYSCI);
      expect(pelna).toBeGreaterThan(BRUTTO_PELNA_KORZYSC);
    });

    it('opadają wraz z zarobkami małżonka', () => {
      let poprzedni = Infinity;
      for (const malzonek of [0, 3_000, 6_000, 9_000, 12_000, 15_000]) {
        const { pelna } = progiWspolne(malzonek);
        expect(pelna).toBeLessThan(poprzedni);
        poprzedni = pelna;
      }
    });
  });
});

/**
 * Ulga dla młodych — PIT-0 do 26. roku życia (model.md B.6 + kap z B.5).
 *
 * Nikt nie opublikował wyliczeń dla młodego pracownika przy nowej skali, więc —
 * tak jak przy wspólnym rozliczeniu — zamiast wpisywać własny wynik jako
 * oczekiwany testujemy **własności**. Każda z nich to osobny sposób, w jaki
 * kalkulator ulgi dla młodych bywa w internecie zrobiony źle:
 *
 * 1. limit dotyczy **przychodu**, nie dochodu, i wynosi 85 528 zł (nie 120 000
 *    zł, nie kwoty wolnej);
 * 2. powyżej limitu opodatkowana jest **wyłącznie nadwyżka**, a nie całość;
 * 3. składki społeczne i zdrowotna naliczają się od **całości** przychodu —
 *    zwolnienie jest podatkowe, nie składkowe;
 * 4. …ale zdrowotna podlega kapowi z art. 83, więc przy przychodzie w całości
 *    zwolnionym spada do **zera** (to jest ten najczęściej pomijany fragment);
 * 5. KUP przysługują tylko od części opodatkowanej;
 * 6. ulga nigdy nie może pogorszyć netto;
 * 7. wyłączona ulga nie zmienia niczego.
 */
describe('ulga dla młodych (PIT-0)', () => {
  const lata: Rok[] = [2026, 2027];
  const U = { ulgaDlaMlodych: true } as const;

  it('jest domyślnie wyłączona — bez niej wynik jest identyczny co do grosza', () => {
    for (const rok of lata) {
      for (const brutto of [0, 1_000, 4_806, 10_000, 13_000, 30_000]) {
        expect(oblicz(brutto, rok, { ulgaDlaMlodych: false })).toEqual(oblicz(brutto, rok));
      }
    }
  });

  it('zwalnia przychód (nie dochód) do 85 528 zł i ani grosza więcej', () => {
    expect(oblicz(5_000, 2026, U).przychodZwolniony).toBe(60_000);
    // 7 127 zł/mies = 85 524 zł/rok — jeszcze poniżej limitu, więc całość.
    expect(oblicz(7_127, 2026, U).przychodZwolniony).toBe(85_524);
    // Powyżej limitu zwolnienie zatrzymuje się na nim, niezależnie od zarobków.
    expect(oblicz(10_000, 2026, U).przychodZwolniony).toBe(LIMIT_PIT_ZERO);
    expect(oblicz(50_000, 2026, U).przychodZwolniony).toBe(LIMIT_PIT_ZERO);
  });

  it('rozbicie się spina: zwolniony + opodatkowany = brutto', () => {
    for (const brutto of [3_000, 7_127, 10_000, 30_000]) {
      const w = oblicz(brutto, 2026, U);
      expect(w.przychodZwolniony + w.przychodOpodatkowany).toBe(w.bruttoRocznie);
    }
  });

  /*
   * Właściwość 1 — poniżej limitu podatek zero i zdrowotna zero.
   *
   * Podatek zero jest oczywisty; zdrowotna zero już nie i to jest sedno kapu
   * z art. 83: składka 9% liczy się od całego przychodu, ale nie może
   * przekroczyć hipotetycznej zaliczki „wg stanu na 31.12.2021", a ta przy
   * przychodzie w całości zwolnionym wynosi zero. Kalkulator, który tego nie
   * ma, zaniża młodemu pracownikowi netto o ~7% brutto — przy 5 000 zł/mies
   * to blisko 4 700 zł rocznie.
   */
  it('przychód w całości zwolniony ⇒ zero podatku i zero składki zdrowotnej', () => {
    for (const rok of lata) {
      for (const brutto of [1_500, 3_000, 4_806, 5_000, 7_000, 7_127]) {
        const w = oblicz(brutto, rok, U);

        expect(w.przychodZwolniony).toBe(w.bruttoRocznie);
        expect(w.podstawaOpodatkowania).toBe(0);
        expect(w.podatek).toBe(0);
        expect(w.skladkaZdrowotna).toBe(0);
      }
    }
  });

  it('składki społeczne naliczają się od całości — zwolnienie jest podatkowe, nie składkowe', () => {
    for (const brutto of [3_000, 7_000, 10_000, 30_000]) {
      expect(oblicz(brutto, 2026, U).skladkiSpoleczne).toBe(
        oblicz(brutto, 2026).skladkiSpoleczne,
      );
    }
  });

  /*
   * Właściwość 2 — tuż powyżej limitu opodatkowana jest wyłącznie nadwyżka.
   *
   * Sprawdzane od strony kwoty, nie tylko znaku: dochód musi być dokładnie tym,
   * co zostaje z nadwyżki po składkach (liczonych od całości) i KUP. Test na
   * samym „podatek > 0" przepuściłby implementację opodatkowującą całość.
   */
  it('powyżej limitu opodatkowana jest tylko nadwyżka ponad 85 528 zł', () => {
    const brutto = 10_000;
    const w = oblicz(brutto, 2026, U);
    const bez = oblicz(brutto, 2026);

    expect(w.przychodOpodatkowany).toBe(120_000 - LIMIT_PIT_ZERO);
    expect(w.podstawaOpodatkowania).toBe(
      roundPln(w.przychodOpodatkowany - bez.skladkiSpoleczne - w.kup),
    );
    // Podstawa niższa dokładnie o zwolniony przychód (KUP takie same — mieszczą
    // się w części opodatkowanej).
    expect(bez.podstawaOpodatkowania - w.podstawaOpodatkowania).toBe(LIMIT_PIT_ZERO);
  });

  it('KUP przysługują tylko od części opodatkowanej', () => {
    // Całość zwolniona ⇒ nie ma od czego ich odliczyć.
    expect(oblicz(5_000, 2026, U).kup).toBe(0);
    // Nadwyżka ponad limit z zapasem większa niż 3 000 zł ⇒ pełne KUP.
    expect(oblicz(30_000, 2026, U).kup).toBe(3_000);
    expect(oblicz(30_000, 2026, { ...U, kupPodwyzszone: true }).kup).toBe(3_600);
  });

  /*
   * Właściwość 3 — ulga nigdy nie pogarsza netto.
   *
   * Warunek konieczny każdego zwolnienia: podatek i zdrowotna mogą tylko spaść.
   * Przemiata cały realny zakres, bo błędy w rodzaju „KUP odliczone od zwolnionej
   * części" albo „kap policzony od złej podstawy" potrafią wychodzić na plus
   * tylko lokalnie.
   */
  it('nigdy nie pogarsza netto ani nie podnosi obciążeń', () => {
    for (const rok of lata) {
      for (let brutto = 0; brutto <= 40_000; brutto += 250) {
        const z = oblicz(brutto, rok, U);
        const bez = oblicz(brutto, rok);

        expect(z.nettoRocznie).toBeGreaterThanOrEqual(bez.nettoRocznie);
        expect(z.podatek).toBeLessThanOrEqual(bez.podatek);
        expect(z.skladkaZdrowotna).toBeLessThanOrEqual(bez.skladkaZdrowotna);
      }
    }
  });

  it('powyżej limitu z dużym zapasem zdrowotna wraca do pełnych 9%', () => {
    // Kap wiąże tylko wtedy, gdy hipotetyczna zaliczka 17% jest niższa od 9%
    // składki. Przy 20 000 zł/mies nadwyżka ponad limit jest na tyle duża, że
    // przestaje wiązać — składka jest taka sama jak bez ulgi.
    expect(oblicz(20_000, 2026, U).skladkaZdrowotna).toBe(oblicz(20_000, 2026).skladkaZdrowotna);
  });

  /*
   * Właściwość 4 — próg opłacalności reformy dla osoby z ulgą.
   *
   * Zwolnienie zabiera 85 528 zł z góry, więc granica I przedziału (120 000 zł
   * dochodu) przesuwa się o tyle w prawo. Stała `BRUTTO_POCZATEK_KORZYSCI_ULGA`
   * jest sprawdzana co do złotówki na krawędzi — tak samo jak jej odpowiednik
   * bez ulgi — żeby nie została w kodzie kwotą przepisaną z niczego.
   */
  it('zysk z reformy pojawia się dopiero od 20 139 zł/mies brutto', () => {
    expect(porownaj(BRUTTO_POCZATEK_KORZYSCI_ULGA - 1, U).zyskRocznie).toBe(0);
    expect(porownaj(BRUTTO_POCZATEK_KORZYSCI_ULGA, U).zyskRocznie).toBeGreaterThan(0);

    // …czyli o 8 261 zł/mies wyżej niż bez ulgi. Osoba poniżej tego progu nie
    // zyskuje na reformie nic — ale kalkulator i tak musi jej pokazać właściwe
    // netto, dużo wyższe niż bez uwzględnienia zwolnienia.
    expect(BRUTTO_POCZATEK_KORZYSCI_ULGA).toBeGreaterThan(BRUTTO_POCZATEK_KORZYSCI);
    expect(porownaj(13_000, U).zyskRocznie).toBe(0);
    expect(porownaj(13_000, U).po.nettoRocznie).toBeGreaterThan(porownaj(13_000).po.nettoRocznie);
  });

  it('pełna korzyść 3 600 zł/rok dopiero od 23 036 zł/mies brutto', () => {
    expect(porownaj(BRUTTO_PELNA_KORZYSC_ULGA - 1, U).zyskRocznie).toBeLessThan(
      MAKSYMALNA_KORZYSC_ROCZNA,
    );
    expect(porownaj(BRUTTO_PELNA_KORZYSC_ULGA, U).zyskRocznie).toBe(MAKSYMALNA_KORZYSC_ROCZNA);
  });

  it('nigdy nie daje więcej niż maksymalna korzyść ze zmiany skali', () => {
    for (let brutto = 0; brutto <= 60_000; brutto += 500) {
      const zysk = porownaj(brutto, U).zyskRocznie;
      expect(zysk).toBeGreaterThanOrEqual(0);
      expect(zysk).toBeLessThanOrEqual(MAKSYMALNA_KORZYSC_ROCZNA);
    }
  });

  /*
   * Kap z art. 83 osobno, jako funkcja — łatwiej tu pokazać, że to hipotetyczna
   * zaliczka z 2021 r. (17% minus 12 × 43,76 zł), a nie bieżąca skala.
   */
  describe('kapZdrowotnej — art. 83 ustawy zdrowotnej', () => {
    it('zeruje się dla podstawy mieszczącej się w kwocie zmniejszającej z 2021 r.', () => {
      expect(kapZdrowotnej(0)).toBe(0);
      expect(kapZdrowotnej(3_000)).toBe(0); // 3 000 × 17% = 510 < 525,12
    });

    it('powyżej tego jest 17% podstawy minus 525,12 zł rocznie', () => {
      expect(kapZdrowotnej(10_000)).toBeCloseTo(10_000 * 0.17 - 12 * 43.76, 2);
    });

    /*
     * Świadome ograniczenie: bez ulgi silnik kapu nie stosuje. W prawie
     * obowiązuje zawsze, ale bez zwolnienia wiązałby dopiero poniżej ~1 250 zł
     * miesięcznie brutto — czwarta część płacy minimalnej, więc poza zakresem
     * pytania, na które ten kalkulator odpowiada. Zostawione tak, żeby włączenie
     * ulgi było jedyną rzeczą zmieniającą dotychczasowe, zwalidowane wyniki.
     * Ten test pilnuje granicy tego ograniczenia, żeby nie rozlało się wyżej.
     */
    it('bez ulgi wiązałby dopiero poniżej ~1 250 zł/mies brutto (świadomie niestosowany)', () => {
      const wiazalby = (brutto: number) => {
        const w = oblicz(brutto, 2026);
        return kapZdrowotnej(w.podstawaOpodatkowania) < w.skladkaZdrowotna;
      };

      expect(wiazalby(1_200)).toBe(true);
      expect(wiazalby(1_300)).toBe(false);
      // …a przy płacy minimalnej i wyżej nie ma o czym mówić.
      expect(wiazalby(PLACA_MINIMALNA)).toBe(false);
    });
  });

  /*
   * Właściwość 5 — ulga we wspólnym rozliczeniu jest cechą osoby.
   *
   * Limit PIT-0 przysługuje każdemu małżonkowi osobno, a wiek jednego nie mówi
   * nic o wieku drugiego. Najważniejszy test to ten o niedziedziczeniu: bez
   * niego `{ ulgaDlaMlodych: true }` po cichu zwalniałoby oboje.
   */
  describe('we wspólnym rozliczeniu', () => {
    it('nie dziedziczy się na małżonka, gdy nie podano jego opcji', () => {
      const tylkoJa = obliczWspolnie(10_000, 10_000, 2026, U);
      const oboje = obliczWspolnie(10_000, 10_000, 2026, { ...U, malzonek: { ...U } });

      expect(tylkoJa.przychodZwolniony).toBe(LIMIT_PIT_ZERO);
      expect(oboje.przychodZwolniony).toBe(2 * LIMIT_PIT_ZERO);
      expect(oboje.nettoRocznie).toBeGreaterThan(tylkoJa.nettoRocznie);
    });

    it('pozostałe opcje dziedziczą się jak dotąd', () => {
      const oboje = obliczWspolnie(10_000, 10_000, 2026, { kupPodwyzszone: true, ...U });

      expect(oboje.kup).toBe(2 * 3_600);
      expect(oboje.osoby[1].przychodZwolniony).toBe(0);
    });

    it('daje się włączyć osobno każdemu z małżonków', () => {
      const mojaUlga = obliczWspolnie(10_000, 10_000, 2026, U);
      const jegoUlga = obliczWspolnie(10_000, 10_000, 2026, { malzonek: { ...U } });

      expect(mojaUlga.osoby[0].przychodZwolniony).toBe(LIMIT_PIT_ZERO);
      expect(mojaUlga.osoby[1].przychodZwolniony).toBe(0);
      expect(jegoUlga.osoby[0].przychodZwolniony).toBe(0);
      expect(jegoUlga.osoby[1].przychodZwolniony).toBe(LIMIT_PIT_ZERO);
      // Przy równych zarobkach to musi wyjść na to samo.
      expect(jegoUlga.nettoRocznie).toBe(mojaUlga.nettoRocznie);
    });

    it('limit przysługuje każdemu osobno, a nie parze', () => {
      const oboje = obliczWspolnie(20_000, 20_000, 2026, { ...U, malzonek: { ...U } });

      expect(oboje.osoby[0].przychodZwolniony).toBe(LIMIT_PIT_ZERO);
      expect(oboje.osoby[1].przychodZwolniony).toBe(LIMIT_PIT_ZERO);
      expect(oboje.przychodZwolniony).toBe(2 * LIMIT_PIT_ZERO);
    });

    it('nie pogarsza netto gospodarstwa', () => {
      for (const [a, b] of [
        [0, 0],
        [4_806, 0],
        [10_000, 4_806],
        [13_000, 13_000],
        [30_000, 0],
      ]) {
        for (const rok of lata) {
          expect(obliczWspolnie(a, b, rok, U).nettoRocznie).toBeGreaterThanOrEqual(
            obliczWspolnie(a, b, rok).nettoRocznie,
          );
        }
      }
    });

    it('dla pary dwojga młodych o równych zarobkach to dwa razy rozliczenie osobne (± 1 zł)', () => {
      for (const brutto of [5_000, 10_000, 20_000]) {
        const para = obliczWspolnie(brutto, brutto, 2027, { ...U, malzonek: { ...U } });
        const sam = oblicz(brutto, 2027, U);

        expect(Math.abs(para.nettoRocznie - 2 * sam.nettoRocznie)).toBeLessThanOrEqual(1);
      }
    });

    it('wyłączona nie zmienia wyniku wspólnego rozliczenia', () => {
      for (const [a, b] of [
        [12_000, 0],
        [13_000, 7_000],
        [30_000, 4_806],
      ]) {
        expect(obliczWspolnie(a, b, 2027, { ulgaDlaMlodych: false })).toEqual(
          obliczWspolnie(a, b, 2027),
        );
      }
    });
  });
});

/**
 * PPK — pracownicze plany kapitałowe (model.md B.7).
 *
 * Dwie wpłaty o **przeciwnym** działaniu i to jest cała trudność tej części:
 *
 * - wpłata **pracownika** (domyślnie 2%) idzie z netto, po podatku — obniża
 *   wypłatę dokładnie o swoją wartość i nie dotyka niczego po drodze;
 * - wpłata **pracodawcy** (domyślnie 1,5%) nie jest z wypłaty potrącana, ale
 *   jest **przychodem podatkowym** pracownika — podnosi podstawę i podatek,
 *   nie wchodząc przy tym do podstawy składek: ani społecznych, ani zdrowotnej.
 *
 * Pominięcie tej drugiej to najkosztowniejszy możliwy błąd w tę stronę:
 * kalkulator pokazywałby podatek niższy niż rzeczywisty, czyli liczbę
 * ładniejszą i nieprawdziwą. Stąd osobne testy na każde z trzech miejsc, gdzie
 * ta wpłata pojawić się NIE może (składki, zdrowotna, potrącenie z netto),
 * a nie tylko na to, że podatek urósł.
 */
describe('PPK (model.md B.7)', () => {
  const lata: Rok[] = [2026, 2027];
  const PRAC = { ppkPracownik: PPK_PRACOWNIK_PODSTAWOWY } as const;
  const FIRMA = { ppkPracodawca: PPK_PRACODAWCA_PODSTAWOWY } as const;

  // Wielokrotności 50 zł — wtedy brutto_rok × 1,5% jest pełnymi złotymi, więc
  // wpływ na podstawę da się sprawdzić co do złotówki, bez tolerancji na
  // zaokrągleniu do pełnych złotych.
  const brutta = [5_000, 10_000, 13_000, 20_000, 30_000];

  it('domyślne stawki to 2% pracownik i 1,5% pracodawca', () => {
    expect(PPK_PRACOWNIK_PODSTAWOWY).toBe(0.02);
    expect(PPK_PRACODAWCA_PODSTAWOWY).toBe(0.015);
  });

  /*
   * Właściwość 0 — przy obu wpłatach wyłączonych nie zmienia się nic.
   *
   * Test na `toEqual` całego wyniku, nie na wybranych polach: gdyby wpłata
   * pracodawcy przeciekła do wzoru z domyślną stawką zamiast zera, rozjechałaby
   * podatek wszystkim, także tym bez PPK — czyli dokładnie tym liczbom,
   * które w części D zgadzają się z wyliczeniami redakcji.
   */
  it('jest domyślnie wyłączone — bez niego wynik jest identyczny co do grosza', () => {
    for (const rok of lata) {
      for (const brutto of [0, 1_000, 4_806, 10_000, 12_345, 13_000, 30_000]) {
        const wylaczone = { ppkPracownik: 0, ppkPracodawca: 0 };

        expect(oblicz(brutto, rok, wylaczone)).toEqual(oblicz(brutto, rok));
        expect(oblicz(brutto, rok, { ...wylaczone, ulgaDlaMlodych: true })).toEqual(
          oblicz(brutto, rok, { ulgaDlaMlodych: true }),
        );
        expect(oblicz(brutto, rok, { ...wylaczone, kupPodwyzszone: true })).toEqual(
          oblicz(brutto, rok, { kupPodwyzszone: true }),
        );
      }
    }
  });

  it('brak PPK nie rusza wyniku także przy groszowym brutto', () => {
    // Osobno, bo doliczenie wpłaty pracodawcy wprowadza do wzoru dodawanie na
    // liczbach zmiennoprzecinkowych — przy zerowej stawce nie może zostać po nim
    // nawet grosz różnicy.
    for (const brutto of [4_806.33, 7_127.07, 9_999.99, 12_345.67]) {
      expect(oblicz(brutto, 2027, { ppkPracodawca: 0 })).toEqual(oblicz(brutto, 2027));
    }
  });

  describe('wpłata pracownika — z netto, po podatku', () => {
    it('obniża netto dokładnie o swoją wartość', () => {
      for (const rok of lata) {
        for (const brutto of brutta) {
          const bez = oblicz(brutto, rok);
          const z = oblicz(brutto, rok, PRAC);

          expect(z.ppk).toBeCloseTo(brutto * 12 * 0.02, 2);
          expect(bez.nettoRocznie - z.nettoRocznie).toBeCloseTo(z.ppk, 2);
        }
      }
    });

    it('nie rusza ani podatku, ani składek, ani podstawy', () => {
      for (const rok of lata) {
        for (const brutto of brutta) {
          const bez = oblicz(brutto, rok);
          const z = oblicz(brutto, rok, PRAC);

          expect(z.podstawaOpodatkowania).toBe(bez.podstawaOpodatkowania);
          expect(z.podatek).toBe(bez.podatek);
          expect(z.skladkiSpoleczne).toBe(bez.skladkiSpoleczne);
          expect(z.skladkaZdrowotna).toBe(bez.skladkaZdrowotna);
        }
      }
    });
  });

  describe('wpłata pracodawcy — przychód podatkowy, nieoskładkowany', () => {
    it('jest wystawiona w wyniku i nie miesza się z wpłatą pracownika', () => {
      const w = oblicz(10_000, 2026, { ...PRAC, ...FIRMA });

      expect(w.ppkPracodawcy).toBe(120_000 * 0.015);
      expect(w.ppk).toBe(120_000 * 0.02);
    });

    it('podnosi przychód podatkowy i podstawę dokładnie o swoją wartość', () => {
      for (const rok of lata) {
        for (const brutto of brutta) {
          const bez = oblicz(brutto, rok);
          const z = oblicz(brutto, rok, FIRMA);

          expect(z.przychodPodatkowy - z.bruttoRocznie).toBeCloseTo(z.ppkPracodawcy, 2);
          expect(z.podstawaOpodatkowania - bez.podstawaOpodatkowania).toBe(z.ppkPracodawcy);
        }
      }
    });

    it('podnosi podatek — i to jest sedno: bez tego kalkulator by go zaniżał', () => {
      for (const rok of lata) {
        for (const brutto of brutta) {
          const bez = oblicz(brutto, rok);
          const z = oblicz(brutto, rok, FIRMA);
          const wzrost = z.podatek - bez.podatek;

          // Dodatkowy podatek to stawka krańcowa od wpłaty — dodatni, ale nigdy
          // większy niż najwyższa stawka skali. Górne ograniczenie łapie wpłatę
          // policzoną dwa razy albo potraktowaną jak dochód bez KUP.
          expect(wzrost).toBeGreaterThan(0);
          expect(wzrost).toBeLessThanOrEqual(0.32 * z.ppkPracodawcy + 1);
        }
      }
    });

    it('NIE wchodzi do podstawy składek — ani społecznych, ani zdrowotnej', () => {
      for (const rok of lata) {
        for (const brutto of brutta) {
          const bez = oblicz(brutto, rok);
          const z = oblicz(brutto, rok, FIRMA);

          expect(z.skladkiSpoleczne).toBe(bez.skladkiSpoleczne);
          expect(z.skladkaZdrowotna).toBe(bez.skladkaZdrowotna);
        }
      }
    });

    it('NIE jest potrącana z netto — netto spada wyłącznie o podatek od niej', () => {
      for (const rok of lata) {
        for (const brutto of brutta) {
          const bez = oblicz(brutto, rok);
          const z = oblicz(brutto, rok, FIRMA);

          expect(bez.nettoRocznie - z.nettoRocznie).toBeCloseTo(z.podatek - bez.podatek, 2);
          // Gdyby kwotę odjęto od wypłaty, różnica byłaby o rząd wielkości większa.
          expect(bez.nettoRocznie - z.nettoRocznie).toBeLessThan(z.ppkPracodawcy);
        }
      }
    });
  });

  it('obie wpłaty razem: netto spada o wpłatę pracownika plus podatek od wpłaty firmy', () => {
    for (const rok of lata) {
      for (const brutto of brutta) {
        const bez = oblicz(brutto, rok);
        const z = oblicz(brutto, rok, { ...PRAC, ...FIRMA });

        expect(bez.nettoRocznie - z.nettoRocznie).toBeCloseTo(
          z.ppk + (z.podatek - bez.podatek),
          2,
        );
      }
    }
  });

  it('rozbicie się spina: zwolniony + opodatkowany = brutto + wpłata pracodawcy', () => {
    for (const opcje of [FIRMA, { ...FIRMA, ulgaDlaMlodych: true }]) {
      for (const brutto of brutta) {
        const w = oblicz(brutto, 2026, opcje);

        expect(w.przychodZwolniony + w.przychodOpodatkowany).toBeCloseTo(w.przychodPodatkowy, 2);
        expect(w.przychodPodatkowy).toBeCloseTo(w.bruttoRocznie + w.ppkPracodawcy, 2);
      }
    }
  });

  /*
   * Styk z ulgą dla młodych.
   *
   * Wpłata pracodawcy jest przychodem ze stosunku pracy, a takie przychody
   * obejmuje zwolnienie PIT-0 (model.md B.6) — więc silnik traktuje ją jako
   * objętą ulgą i zużywającą wspólny limit 85 528 zł. Model.md nie przesądza
   * tego wprost; rozstrzygnięcie jest odnotowane w części E. Praktyczny skutek
   * jest wąski: dotyczy wyłącznie osób z ulgą i tylko wokół limitu.
   */
  describe('styk z ulgą dla młodych', () => {
    const U = { ulgaDlaMlodych: true } as const;

    it('poniżej limitu wpłata pracodawcy nie tworzy podatku — jest zwolniona jak reszta przychodu', () => {
      for (const rok of lata) {
        // 5 000 zł/mies + 1,5% = 60 900 zł, wciąż poniżej 85 528 zł.
        const w = oblicz(5_000, rok, { ...U, ...FIRMA });

        expect(w.przychodZwolniony).toBe(w.przychodPodatkowy);
        expect(w.podatek).toBe(0);
        expect(w.podstawaOpodatkowania).toBe(0);
        // Kap z art. 83 nadal ściąga zdrowotną do zera.
        expect(w.skladkaZdrowotna).toBe(0);
      }
    });

    it('zużywa limit PIT-0 na równi z wynagrodzeniem', () => {
      // Brutto samo w sobie poniżej limitu, ale razem z wpłatą pracodawcy powyżej:
      // 7 000 × 12 = 84 000 zł, +1,5% = 85 260 zł — nadal poniżej.
      expect(oblicz(7_000, 2026, { ...U, ...FIRMA }).przychodZwolniony).toBe(85_260);
      // 7 100 × 12 = 85 200 zł, +1,5% = 86 478 zł — limit przekroczony przez
      // samą wpłatę, choć wynagrodzenie jeszcze się w nim mieści.
      const naKrawedzi = oblicz(7_100, 2026, { ...U, ...FIRMA });
      expect(naKrawedzi.bruttoRocznie).toBeLessThan(LIMIT_PIT_ZERO);
      expect(naKrawedzi.przychodZwolniony).toBe(LIMIT_PIT_ZERO);
      expect(naKrawedzi.przychodOpodatkowany).toBeCloseTo(86_478 - LIMIT_PIT_ZERO, 2);
    });

    it('powyżej limitu wpłata pracodawcy jest opodatkowana normalnie', () => {
      const bez = oblicz(13_000, 2027, U);
      const z = oblicz(13_000, 2027, { ...U, ...FIRMA });

      expect(z.podstawaOpodatkowania - bez.podstawaOpodatkowania).toBe(z.ppkPracodawcy);
      expect(z.podatek).toBeGreaterThan(bez.podatek);
      expect(z.skladkiSpoleczne).toBe(bez.skladkiSpoleczne);
    });
  });

  /*
   * Wspólne rozliczenie: wpłaty PPK są indywidualne, tak jak składki.
   * Sprawdzane od strony, z której widać pomyłkę — czy stawka jednego małżonka
   * nie nalicza się od zarobków obojga.
   */
  describe('wspólne rozliczenie', () => {
    it('liczy wpłaty każdemu od jego własnego wynagrodzenia', () => {
      const w = obliczWspolnie(13_000, 5_000, 2027, { ...PRAC, ...FIRMA });

      expect(w.osoby[0].ppkPracodawcy).toBe(13_000 * 12 * 0.015);
      expect(w.osoby[1].ppkPracodawcy).toBe(5_000 * 12 * 0.015);
      expect(w.ppkPracodawcy).toBe(w.osoby[0].ppkPracodawcy + w.osoby[1].ppkPracodawcy);
      expect(w.ppk).toBe(18_000 * 12 * 0.02);
    });

    it('pozwala małżonkom na różne stawki', () => {
      const w = obliczWspolnie(10_000, 10_000, 2027, {
        ...FIRMA,
        malzonek: { ppkPracodawca: 0 },
      });

      expect(w.osoby[0].ppkPracodawcy).toBe(120_000 * 0.015);
      expect(w.osoby[1].ppkPracodawcy).toBe(0);
    });

    it('u pary o równych zarobkach kosztuje tyle, co dwa razy osobno (± 1 zł)', () => {
      const opcje = { ...PRAC, ...FIRMA, malzonek: { ...PRAC, ...FIRMA } };

      for (const brutto of [5_000, 10_000, 20_000]) {
        const para = obliczWspolnie(brutto, brutto, 2027, opcje);
        const sam = oblicz(brutto, 2027, { ...PRAC, ...FIRMA });

        expect(Math.abs(para.nettoRocznie - 2 * sam.nettoRocznie)).toBeLessThanOrEqual(1);
      }
    });

    it('wyłączone nie zmienia wyniku wspólnego rozliczenia', () => {
      for (const [a, b] of [
        [12_000, 0],
        [13_000, 7_000],
        [30_000, 4_806],
      ]) {
        expect(obliczWspolnie(a, b, 2027, { ppkPracownik: 0, ppkPracodawca: 0 })).toEqual(
          obliczWspolnie(a, b, 2027),
        );
      }
    });
  });
});
