import { describe, expect, it } from 'vitest';

import {
  BRUTTO_PELNA_KORZYSC,
  BRUTTO_PELNA_KORZYSC_ULGA,
  BRUTTO_PELNA_KORZYSC_ZLECENIE,
  BRUTTO_POCZATEK_KORZYSCI,
  BRUTTO_POCZATEK_KORZYSCI_ULGA,
  BRUTTO_POCZATEK_KORZYSCI_ZLECENIE,
  MAKSYMALNA_KORZYSC_ROCZNA,
  MAKSYMALNA_KORZYSC_WSPOLNA,
  kapZdrowotnej,
  obliczWspolnie,
  oblicz,
  podatekWgSkali,
  porownaj,
  porownajWspolnie,
  progiIndywidualne,
  progiWspolne,
  round2,
  roundPln,
} from './engine';
import {
  KUP_ZLECENIE_STAWKA,
  KWOTA_ZMNIEJSZAJACA_ROK,
  LIMIT_30X,
  LIMIT_CHOROBOWEJ_DOBROWOLNEJ_MIES,
  LIMIT_PIT_ZERO,
  PLACA_MINIMALNA,
  PPK_PRACODAWCA_PODSTAWOWY,
  PPK_PRACOWNIK_PODSTAWOWY,
  RATE_CHOROBOWA,
  RATE_ZDROWOTNA,
  SKALA,
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
 * 4. …i zdrowotna przy przychodzie w całości zwolnionym **nie spada do zera**:
 *    kap z art. 83 ust. 2a liczy się od podstawy sprzed zwolnienia, „którą
 *    płatnik obliczyłby, gdyby przychód nie był zwolniony" (to jest ten
 *    najczęściej mylony fragment — patrz `nie zeruje składki zdrowotnej`);
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
   * Właściwość 1 — poniżej limitu podatek zero, ale zdrowotna NIE zero.
   *
   * Podatek zero jest oczywisty. Zdrowotna zero byłaby błędem i to jest sedno
   * art. 83 ust. 2a: składka 9% liczy się od całego przychodu i owszem, nie
   * może przekroczyć hipotetycznej zaliczki „wg stanu na 31.12.2021" — ale tej,
   * „**którą płatnik obliczyłby, gdyby przychód ubezpieczonego nie był
   * zwolniony** od podatku dochodowego na podstawie tego przepisu". Zwolnienia
   * w tym rachunku się nie uwzględnia, więc kap wychodzi taki sam jak u osoby
   * bez ulgi i przy realnych wynagrodzeniach w ogóle nie wiąże.
   *
   * Kalkulator, który zeruje tu składkę, zawyża młodemu pracownikowi netto
   * o ~7% brutto — przy 5 000 zł/mies o 4 659,66 zł rocznie, czyli 388 zł
   * miesięcznie. Dlatego kwoty są tu przypięte co do grosza, a nie tylko
   * porównane ze sobą.
   */
  it('przychód w całości zwolniony ⇒ zero podatku, ale zdrowotna zostaje', () => {
    for (const rok of lata) {
      for (const brutto of [1_500, 3_000, 4_806, 5_000, 7_000, 7_127]) {
        const w = oblicz(brutto, rok, U);

        expect(w.przychodZwolniony).toBe(w.bruttoRocznie);
        expect(w.podstawaOpodatkowania).toBe(0);
        expect(w.podatek).toBe(0);
        expect(w.skladkaZdrowotna).toBeGreaterThan(0);
      }
    }
  });

  /*
   * Regresja art. 83 ust. 2a, przypięta kwotowo.
   *
   * Do 2026-08-20 silnik podawał tu zero (kap liczony od podstawy PO
   * zwolnieniu). Te trzy liczby są tym, co się wtedy psuło, więc stoją tu
   * wprost — property test „nie pogarsza netto" takiego błędu nie łapie, bo
   * zaniżona składka wygląda dla podatnika korzystnie.
   */
  it('nie zeruje składki zdrowotnej — kap liczy się od podstawy sprzed zwolnienia', () => {
    for (const rok of lata) {
      // 9% od (brutto − społeczne), co do grosza — kap nie wiąże.
      expect(oblicz(3_000, rok, U).skladkaZdrowotna).toBe(2_795.8);
      expect(oblicz(5_000, rok, U).skladkaZdrowotna).toBe(4_659.66);
      expect(oblicz(8_000, rok, U).skladkaZdrowotna).toBe(7_455.46);
    }
  });

  /*
   * …i to samo od strony właściwości: skoro zwolnienia w hipotetycznej zaliczce
   * się nie uwzględnia, to składka z ulgą musi być identyczna jak bez niej
   * wszędzie tam, gdzie kap nie wiązałby również osobie bez ulgi (czyli powyżej
   * ~1 250 zł/mies brutto — patrz test kapu niżej).
   */
  it('składka zdrowotna jest taka sama jak bez ulgi', () => {
    for (const rok of lata) {
      for (let brutto = 1_300; brutto <= 40_000; brutto += 100) {
        expect(oblicz(brutto, rok, U).skladkaZdrowotna).toBe(
          oblicz(brutto, rok).skladkaZdrowotna,
        );
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

  it('powyżej limitu zdrowotna też jest pełne 9%', () => {
    // Kap wiąże tylko wtedy, gdy hipotetyczna zaliczka 17% jest niższa od 9%
    // składki — a liczy się ją od całego przychodu, więc przy 20 000 zł/mies
    // nie ma o czym mówić. Zostawione osobno od sweepa wyżej, bo to najczęściej
    // spotykany przypadek „ulga + zarobki powyżej limitu PIT-0".
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
     * Sedno ust. 2a: podstawą kapu jest kwota, „którą płatnik obliczyłby, gdyby
     * przychód ubezpieczonego nie był zwolniony od podatku dochodowego". Osoba
     * z ulgą i osoba bez ulgi o tym samym wynagrodzeniu mają więc ten sam kap,
     * choć podstawa opodatkowania jednej z nich wynosi zero.
     */
    it('u osoby z ulgą jest ten sam co bez ulgi — zwolnienia się nie uwzględnia', () => {
      for (const brutto of [3_000, 5_000, 8_000]) {
        const z = oblicz(brutto, 2026, U);
        const bez = oblicz(brutto, 2026);

        expect(z.podstawaOpodatkowania).toBe(0); // całość zwolniona…
        // …a mimo to kap jest liczony od podstawy takiej jak bez ulgi i wychodzi
        // wyżej niż składka 9%, więc jej nie rusza.
        expect(kapZdrowotnej(bez.podstawaOpodatkowania)).toBeGreaterThan(z.skladkaZdrowotna);
        expect(z.skladkaZdrowotna).toBe(bez.skladkaZdrowotna);
      }
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
        // Kap z art. 83 ust. 2a liczy się od podstawy sprzed zwolnienia, więc
        // zdrowotnej nie rusza — i wpłata pracodawcy jej nie zmienia, bo nie
        // wchodzi do podstawy składek (B.7).
        expect(w.skladkaZdrowotna).toBe(oblicz(5_000, rok).skladkaZdrowotna);
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

/**
 * Umowa zlecenia (model.md, część F).
 *
 * Zapowiadana zmiana dotyczy całej skali podatkowej (art. 27 ust. 1), więc
 * obejmuje i zleceniobiorców — a kalkulator liczył dotąd wyłącznie etat.
 * Zlecenie różni się od umowy o pracę w trzech miejscach i **tylko** w trzech:
 *
 * 1. **koszty uzyskania przychodu** — 20% przychodu *pomniejszonego o składki*
 *    (art. 22 ust. 9 pkt 4), a nie 250 zł miesięcznie; bez limitu rocznego,
 *    bo art. 22 ust. 9a dotyczy wyłącznie kosztów 50%;
 * 2. **składka chorobowa** jest dobrowolna, a jej podstawa ma własny limit
 *    (250% przeciętnego wynagrodzenia miesięcznie);
 * 3. **student do 26 lat** nie podlega z tego tytułu żadnym ubezpieczeniom —
 *    ani społecznym, ani zdrowotnemu.
 *
 * Wszystko inne — skala, kwota zmniejszająca, 9% zdrowotnej, 30-krotność,
 * ulga dla młodych, wspólne rozliczenie — jest wspólne. Testy niżej sprawdzają
 * jedno i drugie: że różnice są tam, gdzie mają być, i że nie ma ich nigdzie
 * indziej.
 */
describe('umowa zlecenia (model.md część F)', () => {
  const lata: Rok[] = [2026, 2027];
  const Z = { forma: 'zlecenie' } as const;
  const U = { ulgaDlaMlodych: true } as const;
  const STUDENT = { ...Z, studentDo26: true } as const;
  const brutta = [3_000, 5_000, 8_000, 13_000, 20_000, 30_000];

  /**
   * Podatek wg skali **bez** kwoty zmniejszającej — druga, niezależna
   * implementacja przejścia po przedziałach.
   *
   * Celowo napisana tu od nowa, a nie zaimportowana: służy do sprawdzania
   * silnika, więc nie może dzielić z nim kodu. Kwota zmniejszająca jest z niej
   * wyjęta, bo w miesięcznej liście płac odejmuje się ją po 1/12 na miesiąc
   * (krok 7 z B.2), a nie raz od całości.
   */
  function skalaBrutto(dochod: number, rok: Rok): number {
    let podatek = 0;
    let dolna = 0;

    for (const prog of SKALA[rok]) {
      if (dochod <= dolna) break;
      podatek += (Math.min(dochod, prog.do) - dolna) * prog.stawka;
      dolna = prog.do;
    }

    return podatek;
  }

  /*
   * Właściwość 0 — domyślnie nic się nie zmienia.
   *
   * Cała wartość tego kalkulatora bierze się z tego, że jego liczby zgadzają
   * się co do złotówki z wyliczeniami redakcji (część D model.md). Dołożenie
   * drugiej formy zatrudnienia nie może ruszyć ani grosza po stronie etatu —
   * i to jest sprawdzane na całym wyniku przez `toEqual`, a nie na wybranych
   * polach, bo przeciek mógłby siedzieć w dowolnym z nich.
   */
  describe('umowa o pracę pozostaje domyślna i nietknięta', () => {
    it('jawne "umowaOPrace" to dokładnie to samo co brak opcji', () => {
      for (const rok of lata) {
        for (const brutto of [0, 1_000, 4_806, 8_000, 12_345.67, 13_000, 30_000]) {
          expect(oblicz(brutto, rok, { forma: 'umowaOPrace' })).toEqual(oblicz(brutto, rok));
        }
      }
    });

    it('opcje zlecenia nie działają na etacie', () => {
      // Obie potrafiłyby przy zleceniu podnieść netto o tysiące złotych; przy
      // etacie muszą być martwe, bo tam chorobowa jest obowiązkowa, a status
      // studenta nie zwalnia z niczego.
      for (const rok of lata) {
        for (const brutto of brutta) {
          expect(oblicz(brutto, rok, { chorobowaDobrowolna: false })).toEqual(oblicz(brutto, rok));
          expect(oblicz(brutto, rok, { studentDo26: true })).toEqual(oblicz(brutto, rok));
          expect(oblicz(brutto, rok, { studentDo26: true, chorobowaDobrowolna: false })).toEqual(
            oblicz(brutto, rok),
          );
        }
      }
    });

    it('nie rusza też wspólnego rozliczenia ani opcji, które już były', () => {
      for (const [a, b] of [
        [12_000, 0],
        [13_000, 7_000],
        [30_000, 4_806],
      ]) {
        expect(obliczWspolnie(a, b, 2027, { forma: 'umowaOPrace' })).toEqual(
          obliczWspolnie(a, b, 2027),
        );
        expect(obliczWspolnie(a, b, 2027, { studentDo26: true })).toEqual(
          obliczWspolnie(a, b, 2027),
        );
      }

      expect(oblicz(10_000, 2026, { forma: 'umowaOPrace', kupPodwyzszone: true })).toEqual(
        oblicz(10_000, 2026, { kupPodwyzszone: true }),
      );
      expect(oblicz(10_000, 2026, { forma: 'umowaOPrace', ...U })).toEqual(oblicz(10_000, 2026, U));
    });

    it('wynik mówi, co policzył', () => {
      expect(oblicz(8_000, 2026).forma).toBe('umowaOPrace');
      expect(oblicz(8_000, 2026, Z).forma).toBe('zlecenie');
      expect(obliczWspolnie(8_000, 8_000, 2026, Z).osoby[1].forma).toBe('zlecenie');
    });
  });

  /*
   * Właściwość 1 — koszty uzyskania przychodu.
   *
   * Najczęstszy błąd w internetowych kalkulatorach zlecenia: 20% liczone od
   * całego brutto zamiast od brutto po składkach. Przy 5 000 zł/mies daje to
   * koszty 1 000 zł zamiast 862,90 zł, czyli zaniżony podatek. Dlatego test
   * idzie na dokładną kwotę, a nie na „koszty są większe niż etatowe".
   */
  describe('koszty uzyskania przychodu — 20% przychodu PO składkach', () => {
    it('są dokładnie jedną piątą podstawy po składkach', () => {
      for (const rok of lata) {
        for (const brutto of brutta) {
          const w = oblicz(brutto, rok, Z);
          const poSkladkach = w.przychodOpodatkowany - w.skladkiSpoleczne;

          expect(w.kup).toBeCloseTo(KUP_ZLECENIE_STAWKA * poSkladkach, 2);
          // …czyli NIE jedną piątą samego brutto. Przy 5 000 zł/mies różnica
          // to 1 645 zł kosztów rocznie, a więc ~200 zł podatku.
          expect(w.kup).toBeLessThan(KUP_ZLECENIE_STAWKA * w.bruttoRocznie);
        }
      }
    });

    it('dochód to równe 80% podstawy po składkach', () => {
      for (const brutto of brutta) {
        const w = oblicz(brutto, 2026, Z);

        expect(w.podstawaOpodatkowania).toBe(
          roundPln(0.8 * (w.przychodOpodatkowany - w.skladkiSpoleczne)),
        );
      }
    });

    it('nie mają limitu rocznego — rosną wraz z wynagrodzeniem bez końca', () => {
      // Limit z art. 22 ust. 9a dotyczy wyłącznie kosztów 50% (ust. 9 pkt 1–3).
      // Gdyby ktoś przez pomyłkę podpiął go pod 20%, koszty spłaszczyłyby się
      // na 120 000 zł — a tu przy 100 000 zł/mies są grubo powyżej.
      let poprzednie = -1;
      for (const brutto of [1_000, 5_000, 20_000, 50_000, 100_000]) {
        const kup = oblicz(brutto, 2026, Z).kup;
        expect(kup).toBeGreaterThan(poprzednie);
        poprzednie = kup;
      }
      expect(oblicz(100_000, 2026, Z).kup).toBeGreaterThan(120_000);
    });

    it('przewyższają koszty pracownicze dopiero od 1 449 zł/mies brutto', () => {
      // 0,2 × 0,8629 × brutto_rok = 3 000 ⇒ brutto_rok = 17 383 zł. Poniżej tej
      // granicy zleceniobiorca ma koszty NIŻSZE niż etatowiec — o czym łatwo
      // zapomnieć, patrząc na „20% to dużo więcej niż 250 zł".
      expect(oblicz(1_448, 2026, Z).kup).toBeLessThan(oblicz(1_448, 2026).kup);
      expect(oblicz(1_449, 2026, Z).kup).toBeGreaterThan(oblicz(1_449, 2026).kup);
    });

    it('podwyższone KUP są przy zleceniu ignorowane — nie ma tam takiego wariantu', () => {
      for (const brutto of brutta) {
        expect(oblicz(brutto, 2026, { ...Z, kupPodwyzszone: true })).toEqual(
          oblicz(brutto, 2026, Z),
        );
      }
    });
  });

  /*
   * Właściwość 2 — składki.
   *
   * Przy chorobowej opłacanej zestaw składek jest identyczny jak na etacie
   * (wypadkową finansuje zleceniodawca, więc netto nie dotyka). To ważne dla
   * uczciwości porównania: różnica w netto między etatem a zleceniem ma
   * pochodzić z kosztów, a nie z po cichu pominiętej składki.
   */
  describe('składki', () => {
    it('przy opłacanej chorobowej są co do grosza takie jak na etacie', () => {
      for (const rok of lata) {
        for (const brutto of [3_000, 5_000, 8_000, 13_000, 20_000]) {
          const z = oblicz(brutto, rok, Z);
          const etat = oblicz(brutto, rok);

          expect(z.skladkiSpoleczne).toBe(etat.skladkiSpoleczne);
          expect(z.skladkaZdrowotna).toBe(etat.skladkaZdrowotna);
        }
      }
    });

    it('rezygnacja z chorobowej zdejmuje dokładnie 2,45% brutto', () => {
      for (const brutto of [3_000, 8_000, 20_000]) {
        const z = oblicz(brutto, 2026, Z);
        const bez = oblicz(brutto, 2026, { ...Z, chorobowaDobrowolna: false });

        expect(z.skladkiSpoleczne - bez.skladkiSpoleczne).toBeCloseTo(
          brutto * 12 * RATE_CHOROBOWA,
          2,
        );
        // Mniej składek to wyższa podstawa zdrowotnej i wyższy podatek, ale
        // netto i tak rośnie — składka chorobowa jest kosztem netto.
        expect(bez.nettoRocznie).toBeGreaterThan(z.nettoRocznie);
      }
    });

    it('podstawa dobrowolnej chorobowej ma własny limit: 12 × 250% = 30-krotność', () => {
      // Tożsamość, na której opiera się model roczny — gdyby prognoza
      // przeciętnego wynagrodzenia trafiła kiedyś tylko do jednej z tych
      // stałych, ten test pęknie, zamiast po cichu przesunąć składki wysoko
      // zarabiającym.
      for (const rok of lata) {
        expect(12 * LIMIT_CHOROBOWEJ_DOBROWOLNEJ_MIES[rok]).toBe(LIMIT_30X[rok]);
      }
    });

    it('powyżej 30-krotności zleceniobiorca płaci MNIEJ niż etatowiec', () => {
      // Etatowa chorobowa nie zna limitu, dobrowolna — zna. Przy 30 000 zł/mies
      // (360 000 zł rocznie, limit 282 600 zł) różnica to 2,45% od nadwyżki.
      const z = oblicz(30_000, 2026, Z);
      const etat = oblicz(30_000, 2026);

      expect(etat.skladkiSpoleczne - z.skladkiSpoleczne).toBeCloseTo(
        (360_000 - LIMIT_30X[2026]) * RATE_CHOROBOWA,
        2,
      );
    });

    it('zdrowotna to nadal 9% podstawy po składkach społecznych', () => {
      for (const brutto of brutta) {
        for (const opcje of [Z, { ...Z, chorobowaDobrowolna: false }]) {
          const w = oblicz(brutto, 2026, opcje);

          expect(w.skladkaZdrowotna).toBeCloseTo(
            (w.bruttoRocznie - w.skladkiSpoleczne) * RATE_ZDROWOTNA,
            2,
          );
        }
      }
    });
  });

  /*
   * Właściwość 3 — porównanie przy tej samej kwocie brutto.
   *
   * To jest liczba, po którą przyjdzie użytkownik: „mam 8 000 zł na zleceniu,
   * ile mi zostanie i czy to więcej niż na etacie". Zleceniobiorca z tą samą
   * kwotą brutto ma **wyższe** netto, bo ma wyższe koszty — cała różnica
   * siedzi w podatku, a nie w składkach.
   */
  describe('zlecenie kontra etat przy tej samej kwocie brutto', () => {
    it('netto nigdy nie jest niższe, a różnica to wyłącznie podatek', () => {
      for (const rok of lata) {
        for (let brutto = 1_500; brutto <= 40_000; brutto += 250) {
          const z = oblicz(brutto, rok, Z);
          const etat = oblicz(brutto, rok);

          expect(z.nettoRocznie).toBeGreaterThanOrEqual(etat.nettoRocznie);
          expect(z.podatek).toBeLessThanOrEqual(etat.podatek);
        }
      }
    });

    it('poniżej granicy kosztów jest odwrotnie — i to też musi się zgadzać', () => {
      // Przy 1 200 zł/mies koszty zlecenia (20% po składkach) są niższe niż
      // pracownicze 250 zł/mies, więc podstawa wyższa. Podatku i tak nie ma
      // (dochód poniżej kwoty wolnej), ale podstawa opodatkowania różnicę widzi.
      expect(oblicz(1_200, 2026, Z).podstawaOpodatkowania).toBeGreaterThan(
        oblicz(1_200, 2026).podstawaOpodatkowania,
      );
    });

    it('składki i zdrowotna są takie same — różnicy nie robi ZUS', () => {
      for (const brutto of [5_000, 8_000, 13_000]) {
        const z = oblicz(brutto, 2026, Z);
        const etat = oblicz(brutto, 2026);

        expect(z.nettoRocznie - etat.nettoRocznie).toBeCloseTo(etat.podatek - z.podatek, 2);
      }
    });
  });

  /*
   * Właściwość 4 — model roczny kontra dwanaście zaliczek.
   *
   * Dla zlecenia nie ma opublikowanych wyliczeń, którym dałoby się zaufać:
   * kalkulatory internetowe różnią się między sobą o ponad 180 zł miesięcznie
   * przy 5 000 zł brutto, bo jedne zakładają chorobową i PIT-2, inne nie
   * (model.md F.8). Zamiast przepisywać którąkolwiek z tych liczb, liczymy tu
   * **niezależną drogą** — pętlą dwunastu zaliczek z kroków B.2 model.md,
   * z zaokrągleniami miesięcznymi — i sprawdzamy, że model roczny się z nią
   * spina z dokładnością, którą część C model.md sama zapowiada.
   *
   * Ta pętla jest jedynym miejscem w testach, gdzie cała droga od brutto do
   * netto jest policzona drugi raz, od zera i inaczej.
   */
  describe('zgodność z listą płac (dwanaście zaliczek)', () => {
    /** Roczne netto policzone miesiąc po miesiącu — model.md B.2, wariant zlecenia. */
    function nettoZListyPlac(bruttoMiesiecznie: number, rok: Rok): number {
      let netto = 0;
      let dochodNarastajaco = 0;
      let naliczoneNarastajaco = 0;
      let podstawaErNarastajaco = 0;

      // Limity są z 2026 r. po obu stronach porównania — silnik trzyma je stałe
      // celowo, żeby nie mieszać efektu reformy z waloryzacją ZUS (patrz
      // `Opcje.limit30x`). Pętla musi robić to samo, inaczej porównywałaby
      // dwa różne światy zamiast dwóch dróg liczenia.
      for (let miesiac = 0; miesiac < 12; miesiac++) {
        const doLimitu = Math.max(0, LIMIT_30X[2026] - podstawaErNarastajaco);
        const podstawaEr = Math.min(bruttoMiesiecznie, doLimitu);
        podstawaErNarastajaco += podstawaEr;

        const podstawaChorobowej = Math.min(
          bruttoMiesiecznie,
          LIMIT_CHOROBOWEJ_DOBROWOLNEJ_MIES[2026],
        );
        const spoleczne =
          round2(podstawaEr * 0.0976) +
          round2(podstawaEr * 0.015) +
          round2(podstawaChorobowej * RATE_CHOROBOWA);

        const zdrowotna = round2((bruttoMiesiecznie - spoleczne) * RATE_ZDROWOTNA);
        const kup = round2(KUP_ZLECENIE_STAWKA * (bruttoMiesiecznie - spoleczne));

        // Kroki 6–8 z B.2: podatek liczy się narastająco od początku roku, ale
        // kwota zmniejszająca schodzi po 1/12 w każdym miesiącu (PIT-2).
        dochodNarastajaco += roundPln(bruttoMiesiecznie - spoleczne - kup);
        const naleznyDotad = skalaBrutto(dochodNarastajaco, rok);
        const zaliczkaBrutto = naleznyDotad - naliczoneNarastajaco;
        naliczoneNarastajaco = naleznyDotad;
        const zaliczka = roundPln(Math.max(0, zaliczkaBrutto - KWOTA_ZMNIEJSZAJACA_ROK / 12));

        netto = round2(netto + (bruttoMiesiecznie - spoleczne - zdrowotna - zaliczka));
      }

      return netto;
    }

    it.each([3_000, 5_000, 8_000, 13_000, 20_000, 30_000])(
      'przy %i zł/mies obie drogi schodzą się na kilka złotych rocznie',
      (brutto) => {
        for (const rok of lata) {
          const roczny = oblicz(brutto, rok, Z).nettoRocznie;
          const zListy = nettoZListyPlac(brutto, rok);

          // Model.md (część C) zapowiada „kilka–kilkanaście złotych" różnicy
          // z samych zaokrągleń. Trzymamy 30 zł na cały rok jako granicę tego,
          // co jeszcze jest zaokrągleniem, a nie błędem w konstrukcji.
          expect(Math.abs(roczny - zListy)).toBeLessThanOrEqual(30);
        }
      },
    );

    it('dla 5 000 zł/mies lista płac daje 3 812,19 zł netto miesięcznie', () => {
      // Punkt kontrolny policzony ręcznie z przepisów: składki 685,50 zł
      // (488,00 + 75,00 + 122,50), koszty 20% × 4 314,50 = 862,90 zł, podstawa
      // 3 452 zł, zaliczka 12% − 300 zł = 114 zł, zdrowotna 9% × 4 314,50 =
      // 388,31 zł. Zostaje 3 812,19 zł.
      expect(nettoZListyPlac(5_000, 2026)).toBeCloseTo(12 * 3_812.19, 2);
    });
  });

  /*
   * Właściwość 5 — student do 26 lat.
   *
   * Największa pojedyncza różnica w całym silniku i osobny, bardzo częsty
   * przypadek. Zwolnienie jest **składkowe** (art. 6 ust. 4 ustawy o systemie
   * ubezpieczeń społecznych), a nie podatkowe — i to jest tu sedno: bez ulgi
   * dla młodych podatek nadal jest, mimo zerowego ZUS-u. Typowy student ma
   * jedno i drugie, ale kalkulator musi umieć rozdzielić te dwie rzeczy,
   * bo 30-letni student i 24-letni absolwent mają po jednej z nich.
   */
  describe('student do 26 lat', () => {
    it('nie płaci żadnych składek — ani społecznych, ani zdrowotnej', () => {
      for (const rok of lata) {
        for (const brutto of brutta) {
          const w = oblicz(brutto, rok, STUDENT);

          expect(w.skladkiSpoleczne).toBe(0);
          expect(w.skladkaZdrowotna).toBe(0);
        }
      }
    });

    it('koszty liczą się wtedy od pełnego przychodu — nie ma czego odejmować', () => {
      for (const brutto of brutta) {
        const w = oblicz(brutto, 2026, STUDENT);

        expect(w.kup).toBeCloseTo(KUP_ZLECENIE_STAWKA * w.bruttoRocznie, 2);
      }
    });

    it('zwolnienie jest składkowe, nie podatkowe — podatek zostaje', () => {
      // 8 000 zł/mies, student bez ulgi dla młodych (np. 30-letni): ZUS zero,
      // ale dochód 76 800 zł i podatek jak najbardziej jest.
      const w = oblicz(8_000, 2026, STUDENT);

      expect(w.podatek).toBeGreaterThan(0);
      expect(w.nettoRocznie).toBe(round2(w.bruttoRocznie - w.podatek));
    });

    it('z ulgą dla młodych netto potrafi być równe brutto co do grosza', () => {
      // Nie ma składek, a to, co zostaje ponad limit 85 528 zł, mieści się po
      // kosztach w kwocie wolnej. Przy 8 000 zł/mies zostaje całe 96 000 zł.
      for (const rok of lata) {
        const w = oblicz(8_000, rok, { ...STUDENT, ...U });

        expect(w.przychodZwolniony).toBe(LIMIT_PIT_ZERO);
        expect(w.podatek).toBe(0);
        expect(w.nettoRocznie).toBe(w.bruttoRocznie);
      }
    });

    it('dwie niezależne opcje: składki i podatek znikają osobno', () => {
      const samStudent = oblicz(10_000, 2026, STUDENT);
      const samaUlga = oblicz(10_000, 2026, { ...Z, ...U });
      const oba = oblicz(10_000, 2026, { ...STUDENT, ...U });

      expect(samStudent.skladkiSpoleczne).toBe(0);
      expect(samStudent.podatek).toBeGreaterThan(0);
      expect(samaUlga.skladkiSpoleczne).toBeGreaterThan(0);
      expect(samaUlga.podatek).toBe(0);
      expect(oba.skladkiSpoleczne).toBe(0);
      expect(oba.podatek).toBe(0);
    });

    it('nie przystępuje do PPK, nawet gdy podano stawki', () => {
      // Bez obowiązkowych składek emerytalno-rentowych nie ma „osoby
      // zatrudnionej" w rozumieniu ustawy o PPK. Gdyby wpłata pracownika
      // przeciekła, kalkulator zabrałby studentowi 2% brutto, których nikt
      // z jego wypłaty nie potrąca.
      const w = oblicz(10_000, 2026, {
        ...STUDENT,
        ppkPracownik: PPK_PRACOWNIK_PODSTAWOWY,
        ppkPracodawca: PPK_PRACODAWCA_PODSTAWOWY,
      });

      expect(w.ppk).toBe(0);
      expect(w.ppkPracodawcy).toBe(0);
      expect(w).toEqual(oblicz(10_000, 2026, STUDENT));
    });

    it('chorobowa przy zerowym ZUS-ie nie ma czego zmieniać', () => {
      for (const brutto of brutta) {
        expect(oblicz(brutto, 2026, { ...STUDENT, chorobowaDobrowolna: true })).toEqual(
          oblicz(brutto, 2026, { ...STUDENT, chorobowaDobrowolna: false }),
        );
      }
    });

    it('ma najwyższe netto ze wszystkich wariantów przy tym samym brutto', () => {
      for (let brutto = 1_000; brutto <= 30_000; brutto += 500) {
        const student = oblicz(brutto, 2026, STUDENT).nettoRocznie;

        expect(student).toBeGreaterThanOrEqual(oblicz(brutto, 2026, Z).nettoRocznie);
        expect(student).toBeGreaterThanOrEqual(oblicz(brutto, 2026).nettoRocznie);
      }
    });
  });

  /*
   * Właściwość 6 — ulga dla młodych obejmuje zlecenie.
   *
   * Art. 21 ust. 1 pkt 148 wymienia „umowy zlecenia, o których mowa w art. 13
   * pkt 8" obok stosunku pracy, i dzieli z nimi jeden limit 85 528 zł. Reguły
   * są te same co przy etacie — sprawdzamy więc, że rzeczywiście te same,
   * a nie napisane drugi raz nieco inaczej.
   */
  describe('ulga dla młodych na zleceniu', () => {
    it('zwalnia przychód do 85 528 zł, tak samo jak na etacie', () => {
      for (const brutto of [5_000, 8_000, 20_000]) {
        expect(oblicz(brutto, 2026, { ...Z, ...U }).przychodZwolniony).toBe(
          oblicz(brutto, 2026, U).przychodZwolniony,
        );
      }
    });

    it('koszty przysługują tylko od części opodatkowanej', () => {
      // podatki.gov.pl wprost: „od przychodów objętych ulgą nie obliczasz 20%
      // kosztów uzyskania przychodów".
      expect(oblicz(5_000, 2026, { ...Z, ...U }).kup).toBe(0);

      const w = oblicz(20_000, 2026, { ...Z, ...U });
      expect(w.kup).toBeCloseTo(
        KUP_ZLECENIE_STAWKA * (w.przychodOpodatkowany - w.skladkiSpoleczne),
        2,
      );
    });

    it('składki nalicza się od całości — zwolnienie jest podatkowe', () => {
      for (const brutto of brutta) {
        expect(oblicz(brutto, 2026, { ...Z, ...U }).skladkiSpoleczne).toBe(
          oblicz(brutto, 2026, Z).skladkiSpoleczne,
        );
      }
    });

    /*
     * Zdrowotna przy pełnym zwolnieniu — tak samo jak na etacie: podatek zero,
     * ale składka **zostaje**. Kap z art. 83 ust. 2a liczy się od podstawy
     * sprzed zwolnienia, więc wychodzi tyle, ile osobie bez ulgi. Przy zleceniu
     * jest to jeszcze mocniejsze niż przy etacie: kap nie wiąże tam przy żadnej
     * kwocie brutto (test niżej), więc składka jest zawsze pełne 9%.
     */
    it('przy przychodzie w całości zwolnionym zdrowotna zostaje w pełnej wysokości', () => {
      for (const rok of lata) {
        for (const brutto of [3_000, 5_000, 7_127]) {
          const w = oblicz(brutto, rok, { ...Z, ...U });

          expect(w.podatek).toBe(0);
          expect(w.podstawaOpodatkowania).toBe(0);
          expect(w.skladkaZdrowotna).toBe(oblicz(brutto, rok, Z).skladkaZdrowotna);
          expect(w.skladkaZdrowotna).toBeGreaterThan(0);
        }
      }
    });

    it('składka zdrowotna z ulgą jest identyczna jak bez niej, przy każdej kwocie', () => {
      // Na etacie ta równość zaczyna się dopiero od ~1 250 zł/mies, bo niżej kap
      // wiąże także osobie bez ulgi. Przy zleceniu nie ma takiej granicy.
      for (const rok of lata) {
        for (let brutto = 100; brutto <= 40_000; brutto += 100) {
          expect(oblicz(brutto, rok, { ...Z, ...U }).skladkaZdrowotna).toBe(
            oblicz(brutto, rok, Z).skladkaZdrowotna,
          );
        }
      }
    });

    it('nigdy nie pogarsza netto', () => {
      for (const rok of lata) {
        for (let brutto = 0; brutto <= 40_000; brutto += 500) {
          expect(oblicz(brutto, rok, { ...Z, ...U }).nettoRocznie).toBeGreaterThanOrEqual(
            oblicz(brutto, rok, Z).nettoRocznie,
          );
        }
      }
    });

    it('kap zdrowotnej dla zlecenia liczy się bez kwoty zmniejszającej z 2021 r.', () => {
      // PIT-2 przysługiwał w 2021 r. wyłącznie pracownikom, a hipotetyczna
      // zaliczka jest „wg stanu na 31.12.2021" — więc przy zleceniu nie ma
      // z czego odjąć 12 × 43,76 zł.
      expect(kapZdrowotnej(10_000, false)).toBeCloseTo(10_000 * 0.17, 2);
      expect(kapZdrowotnej(10_000, false) - kapZdrowotnej(10_000)).toBeCloseTo(12 * 43.76, 2);
      // Domyślnie wariant pracowniczy — dotychczasowe wywołania bez zmian.
      expect(kapZdrowotnej(10_000, true)).toBe(kapZdrowotnej(10_000));
    });

    it('kap przy zleceniu nie wiąże przy żadnej kwocie brutto', () => {
      // 17% od 80% podstawy to 13,6% — zawsze więcej niż 9% składki. Dlatego
      // pominięcie kapu poza ulgą (świadome uproszczenie odziedziczone po
      // etacie) przy zleceniu nic nie kosztuje, a z ulgą kap i tak przepuszcza
      // pełną składkę. Sprawdzane od dołu skali, gdzie na etacie kap wiąże.
      for (const brutto of [500, 1_000, 1_200, 3_000, PLACA_MINIMALNA, 20_000]) {
        const w = oblicz(brutto, 2026, Z);

        expect(kapZdrowotnej(w.podstawaOpodatkowania, false)).toBeGreaterThanOrEqual(
          w.skladkaZdrowotna,
        );
      }
      // …a na etacie przy 1 200 zł/mies wiąże — czyli to nie jest własność
      // samego kapu, tylko kosztów 20%.
      const etat = oblicz(1_200, 2026);
      expect(kapZdrowotnej(etat.podstawaOpodatkowania)).toBeLessThan(etat.skladkaZdrowotna);
    });
  });

  /*
   * Właściwość 7 — zysk z reformy.
   *
   * Skala jest ta sama, więc maksymalna korzyść też: 3 600 zł rocznie, ani
   * grosza więcej. Przesuwają się natomiast progi, bo koszty 20% odsuwają
   * granice przedziałów w prawo — dokładnie jak zwolnienie przy uldze dla
   * młodych, tylko proporcjonalnie zamiast kwotowo.
   */
  describe('zysk ze zmiany skali', () => {
    it('nowa skala nigdy nie jest gorsza od obecnej', () => {
      for (const opcje of [Z, { ...Z, ...U }, STUDENT, { ...Z, chorobowaDobrowolna: false }]) {
        for (let brutto = 0; brutto <= 60_000; brutto += 500) {
          const { przed, po, zyskRocznie } = porownaj(brutto, opcje);

          expect(po.podatek).toBeLessThanOrEqual(przed.podatek);
          expect(zyskRocznie).toBeGreaterThanOrEqual(0);
          expect(zyskRocznie).toBeLessThanOrEqual(MAKSYMALNA_KORZYSC_ROCZNA);
        }
      }
    });

    it('progi zlecenia trafiają w krawędź co do złotówki', () => {
      expect(porownaj(BRUTTO_POCZATEK_KORZYSCI_ZLECENIE - 1, Z).zyskRocznie).toBe(0);
      expect(porownaj(BRUTTO_POCZATEK_KORZYSCI_ZLECENIE, Z).zyskRocznie).toBeGreaterThan(0);
      expect(porownaj(BRUTTO_PELNA_KORZYSC_ZLECENIE - 1, Z).zyskRocznie).toBeLessThan(
        MAKSYMALNA_KORZYSC_ROCZNA,
      );
      expect(porownaj(BRUTTO_PELNA_KORZYSC_ZLECENIE, Z).zyskRocznie).toBe(
        MAKSYMALNA_KORZYSC_ROCZNA,
      );
    });

    it('leżą wyżej niż etatowe — koszty 20% odsuwają granice przedziałów', () => {
      expect(BRUTTO_POCZATEK_KORZYSCI_ZLECENIE).toBeGreaterThan(BRUTTO_POCZATEK_KORZYSCI);
      expect(BRUTTO_PELNA_KORZYSC_ZLECENIE).toBeGreaterThan(BRUTTO_PELNA_KORZYSC);
      // …ale niżej niż przy uldze dla młodych, która zdejmuje 85 528 zł z góry.
      expect(BRUTTO_POCZATEK_KORZYSCI_ZLECENIE).toBeLessThan(BRUTTO_POCZATEK_KORZYSCI_ULGA);
    });

    it('rośnie monotonicznie', () => {
      let poprzedni = -1;
      for (let brutto = 14_000; brutto <= 19_000; brutto += 50) {
        const zysk = porownaj(brutto, Z).zyskRocznie;
        expect(zysk).toBeGreaterThanOrEqual(poprzedni);
        poprzedni = zysk;
      }
    });
  });

  /*
   * Właściwość 8 — `progiIndywidualne` wyprowadza to, co stałe mają wpisane.
   *
   * Stałe są w kodzie liczbami; ta funkcja liczy je z modelu. Zgodność jednego
   * z drugim jest jedynym powodem, dla którego stałym można wierzyć — a przy
   * kombinacjach opcji, dla których stałych nie ma (student, brak chorobowej),
   * funkcja jest jedynym źródłem.
   */
  describe('progiIndywidualne', () => {
    it('odtwarza stałe dla zlecenia i dla ulgi dla młodych', () => {
      expect(progiIndywidualne(Z)).toEqual({
        poczatek: BRUTTO_POCZATEK_KORZYSCI_ZLECENIE,
        pelna: BRUTTO_PELNA_KORZYSC_ZLECENIE,
      });
      expect(progiIndywidualne(U)).toEqual({
        poczatek: BRUTTO_POCZATEK_KORZYSCI_ULGA,
        pelna: BRUTTO_PELNA_KORZYSC_ULGA,
      });
    });

    it('dla etatu zgadza się z opublikowanymi progami', () => {
      const { poczatek, pelna } = progiIndywidualne();

      expect(pelna).toBe(BRUTTO_PELNA_KORZYSC);
      // `BRUTTO_POCZATEK_KORZYSCI` to zaokrąglona liczba z prasy („≈ 11 880 zł"),
      // przy której zysku jeszcze NIE ma — pierwsza złotówka zysku jest o złoty
      // wyżej. Ta różnica jest opisana przy stałej i w model.md, część D.
      expect(poczatek).toBe(BRUTTO_POCZATEK_KORZYSCI + 1);
      expect(porownaj(poczatek - 1).zyskRocznie).toBe(0);
    });

    it('trafia w krawędź także tam, gdzie stałych nie ma', () => {
      for (const opcje of [STUDENT, { ...Z, chorobowaDobrowolna: false }, { ...Z, ...U }]) {
        const { poczatek, pelna } = progiIndywidualne(opcje);

        expect(porownaj(poczatek - 1, opcje).zyskRocznie).toBe(0);
        expect(porownaj(poczatek, opcje).zyskRocznie).toBeGreaterThan(0);
        expect(porownaj(pelna, opcje).zyskRocznie).toBe(MAKSYMALNA_KORZYSC_ROCZNA);
      }
    });
  });

  /*
   * Właściwość 9 — kwota zmniejszająca podatek.
   *
   * Przy zleceniu PIT-2 działa inaczej niż na etacie (zleceniobiorca może go
   * złożyć dopiero od 2023 r., a wcześniej nie mógł wcale), ale to jest
   * wyłącznie sprawa **zaliczek**: w rozliczeniu rocznym kwota zmniejszająca
   * przysługuje tak czy inaczej. Model jest roczny, więc PIT-2 nie jest jego
   * parametrem — i ten test pilnuje, żeby ktoś kiedyś nie „naprawił" tego,
   * dodając zleceniobiorcy podatek, którego on w zeznaniu nie zapłaci.
   */
  it('kwota zmniejszająca przysługuje przy zleceniu tak samo jak przy etacie', () => {
    for (const rok of lata) {
      for (const brutto of [3_000, 8_000, 13_000]) {
        const w = oblicz(brutto, rok, Z);

        expect(w.podatek).toBe(roundPln(podatekWgSkali(w.podstawaOpodatkowania, rok)));
        // Gdyby jej zabrakło, zleceniobiorca zapłaciłby o 3 600 zł więcej.
        expect(roundPln(skalaBrutto(w.podstawaOpodatkowania, rok)) - w.podatek).toBe(
          brutto === 3_000
            ? // Przy 3 000 zł/mies dochód mieści się w kwocie wolnej, więc
              // zmniejszenie zjada cały podatek i nie ma z czego odjąć reszty.
              roundPln(skalaBrutto(w.podstawaOpodatkowania, rok))
            : KWOTA_ZMNIEJSZAJACA_ROK,
        );
      }
    }
  });

  /*
   * Właściwość 10 — wspólne rozliczenie.
   *
   * Forma zatrudnienia dziedziczy się na małżonka (jak KUP i PPK), bo para na
   * dwóch zleceniach to sytuacja realna, a pomyłka kosztuje najwyżej inne
   * koszty uzyskania przychodu. Zwolnienie studenckie — nie, bo zdjęłoby
   * małżonkowi cały ZUS.
   */
  describe('wspólne rozliczenie', () => {
    it('forma dziedziczy się na małżonka, a zwolnienie studenckie nie', () => {
      const oboje = obliczWspolnie(8_000, 8_000, 2026, { ...Z, studentDo26: true });

      expect(oboje.osoby[0].forma).toBe('zlecenie');
      expect(oboje.osoby[1].forma).toBe('zlecenie');
      expect(oboje.osoby[0].skladkiSpoleczne).toBe(0);
      expect(oboje.osoby[1].skladkiSpoleczne).toBeGreaterThan(0);
    });

    it('pozwala każdemu małżonkowi na inną formę', () => {
      const mieszane = obliczWspolnie(8_000, 8_000, 2026, {
        ...Z,
        malzonek: { forma: 'umowaOPrace' },
      });

      expect(mieszane.osoby[0].kup).toBe(oblicz(8_000, 2026, Z).kup);
      expect(mieszane.osoby[1].kup).toBe(3_000);
      expect(mieszane.kup).toBe(mieszane.osoby[0].kup + mieszane.osoby[1].kup);
    });

    it('dwoje zleceniobiorców o równych zarobkach to dwa razy rozliczenie osobne (± 1 zł)', () => {
      for (const brutto of [5_000, 8_000, 20_000]) {
        for (const rok of lata) {
          const para = obliczWspolnie(brutto, brutto, rok, Z);
          const sam = oblicz(brutto, rok, Z);

          expect(Math.abs(para.nettoRocznie - 2 * sam.nettoRocznie)).toBeLessThanOrEqual(1);
        }
      }
    });

    it('para na zleceniu też nie traci na wspólnym rozliczeniu', () => {
      for (const [a, b] of [
        [13_000, 0],
        [20_000, 3_000],
        [8_000, 8_000],
        [30_000, 0],
      ]) {
        for (const rok of lata) {
          const wspolnie = obliczWspolnie(a, b, rok, Z);
          const osobno = oblicz(a, rok, Z).nettoRocznie + oblicz(b, rok, Z).nettoRocznie;

          expect(wspolnie.nettoRocznie).toBeGreaterThanOrEqual(osobno - 1);
        }
      }
    });

    it('zysk pary na zleceniu nie przekracza podwójnego maksimum', () => {
      for (let a = 0; a <= 40_000; a += 4_000) {
        for (let b = 0; b <= 40_000; b += 4_000) {
          const zysk = porownajWspolnie(a, b, Z).zyskRocznie;

          expect(zysk).toBeGreaterThanOrEqual(0);
          expect(zysk).toBeLessThanOrEqual(MAKSYMALNA_KORZYSC_WSPOLNA);
        }
      }
    });

    it('progiWspolne działają także dla zlecenia', () => {
      const { poczatek, pelna } = progiWspolne(0, Z);

      expect(porownajWspolnie(poczatek - 1, 0, Z).zyskRocznie).toBe(0);
      expect(porownajWspolnie(pelna, 0, Z).zyskRocznie).toBe(MAKSYMALNA_KORZYSC_WSPOLNA);
      // Przy małżonku bez dochodu progi leżą wyżej niż indywidualne — tak samo
      // jak przy etacie, bo granice skali działają wtedy podwójnie.
      expect(poczatek).toBeGreaterThan(BRUTTO_POCZATEK_KORZYSCI_ZLECENIE);
    });
  });

  /*
   * Właściwość 11 — PPK na zleceniu działa jak na etacie.
   *
   * Zleceniobiorca podlegający obowiązkowo ubezpieczeniom emerytalno-rentowym
   * jest „osobą zatrudnioną" w rozumieniu ustawy o PPK, więc obie wpłaty mają
   * ten sam sens co przy umowie o pracę. Zerowanie dotyczy wyłącznie studenta
   * (test wyżej).
   */
  describe('PPK', () => {
    it('wpłata pracownika obniża netto, wpłata pracodawcy tylko podatek', () => {
      const bez = oblicz(10_000, 2026, Z);
      const zPpk = oblicz(10_000, 2026, {
        ...Z,
        ppkPracownik: PPK_PRACOWNIK_PODSTAWOWY,
        ppkPracodawca: PPK_PRACODAWCA_PODSTAWOWY,
      });

      expect(zPpk.ppk).toBeCloseTo(120_000 * 0.02, 2);
      expect(zPpk.ppkPracodawcy).toBeCloseTo(120_000 * 0.015, 2);
      expect(zPpk.skladkiSpoleczne).toBe(bez.skladkiSpoleczne);
      expect(zPpk.skladkaZdrowotna).toBe(bez.skladkaZdrowotna);
      expect(bez.nettoRocznie - zPpk.nettoRocznie).toBeCloseTo(
        zPpk.ppk + (zPpk.podatek - bez.podatek),
        2,
      );
    });

    it('wpłata pracodawcy dostaje koszty 20% jak reszta przychodu', () => {
      // Rozstrzygnięcie, nie ustalenie — patrz model.md, część E. Wpłata jest
      // przychodem z tego samego źródła (art. 13 pkt 8), więc liczy się jej te
      // same koszty; przy okazji nie jest oskładkowana, więc podstawy kosztów
      // nie pomniejsza.
      const w = oblicz(10_000, 2026, { ...Z, ppkPracodawca: PPK_PRACODAWCA_PODSTAWOWY });

      expect(w.kup).toBeCloseTo(
        KUP_ZLECENIE_STAWKA * (w.przychodPodatkowy - w.skladkiSpoleczne),
        2,
      );
    });

    it('wyłączone nie zmienia wyniku', () => {
      for (const brutto of brutta) {
        expect(oblicz(brutto, 2026, { ...Z, ppkPracownik: 0, ppkPracodawca: 0 })).toEqual(
          oblicz(brutto, 2026, Z),
        );
      }
    });
  });
});
