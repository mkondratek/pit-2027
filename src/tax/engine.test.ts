import { describe, expect, it } from 'vitest';

import {
  BRUTTO_PELNA_KORZYSC,
  BRUTTO_POCZATEK_KORZYSCI,
  MAKSYMALNA_KORZYSC_ROCZNA,
  MAKSYMALNA_KORZYSC_WSPOLNA,
  obliczWspolnie,
  oblicz,
  podatekWgSkali,
  porownaj,
  porownajWspolnie,
  progiWspolne,
  roundPln,
} from './engine';
import { type Rok } from './constants';

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
