import { describe, expect, it } from 'vitest';
import { rzedyPodpisow, szerokoscTekstu } from './osWykresu';

/*
 * Układ osi w jednostkach `viewBox` — te same liczby, co w `WykresZysku.svelte`.
 * Powtórzone tu świadomie: test ma sprawdzać rozmieszczanie podpisów, a nie
 * przeliczanie kwot na piksele.
 */
const MIN_X = 3_000;
const L = 26;
const R = 394;

const liczba = new Intl.NumberFormat('pl-PL', {
  maximumFractionDigits: 0,
  useGrouping: 'always',
});

/** Podpisy dokładnie takie, jakie rysuje komponent dla danego scenariusza. */
function scena(maxX: number, poczatek: number | null, pelna: number | null) {
  const skalaX = (b: number) => L + ((b - MIN_X) / (maxX - MIN_X)) * (R - L);
  const podpis = (b: number | null) =>
    b === null ? null : { tekst: liczba.format(b), x: skalaX(b) };

  return {
    lewy: `${liczba.format(MIN_X)} i mniej`,
    prawy: `${liczba.format(maxX)} i więcej`,
    poczatek: podpis(poczatek),
    pelna: podpis(pelna),
    L,
    R,
  };
}

/**
 * Model szerokości ma **zawyżać, nigdy nie zaniżać** — na tym stoi cała reszta
 * modułu. Liczby po prawej to szerokości zmierzone w przeglądarce
 * (`getComputedTextLength`, `system-ui`, macOS) na tych samych rozmiarach
 * pisma, w jakich liczony jest układ: 12 dla progów (półgruby), 11 dla krańców.
 */
describe('model szerokości napisu', () => {
  it.each([
    ['30 784', 12, 41.31],
    ['35 909', 12, 41.99],
    ['14 776', 12, 38.77],
    ['3 000 i mniej', 11, 68.21],
    ['51 000 i więcej', 11, 78.31],
    ['20 000 i więcej', 11, 79.97],
  ])('%s przy piśmie %d nie jest węższy niż zmierzone %d', (tekst, pismo, zmierzone) => {
    const model = szerokoscTekstu(tekst, pismo);

    expect(model).toBeGreaterThanOrEqual(zmierzone);
    // I nie jest przy tym szerszy, niż trzeba: z zapasu płaci się drugim
    // wierszem tam, gdzie napisy zmieściłyby się w jednym.
    expect(model).toBeLessThan(zmierzone * 1.05);
  });

  it('nieznany znak jest liczony jako szeroki, a nie pomijany', () => {
    expect(szerokoscTekstu('W', 12)).toBeGreaterThan(szerokoscTekstu('i', 12));
  });
});

describe('rozmieszczenie podpisów progów', () => {
  /*
   * Układ domyślny — etat bez żadnej opcji. Ten wykres ogląda większość
   * odwiedzających i ma zostać dokładnie taki, jaki był: oba podpisy w jednym
   * wierszu, mimo że „14 776" stoi już blisko podpisu prawego krańca.
   */
  it('etat bez opcji zostawia oba podpisy w pierwszym wierszu', () => {
    expect(rzedyPodpisow(scena(20_000, 11_878, 14_776))).toEqual({
      poczatek: 0,
      pelna: 0,
    });
  });

  it('zlecenie bez ulg zostawia oba podpisy w pierwszym wierszu', () => {
    expect(rzedyPodpisow(scena(25_000, 14_487, 18_108))).toEqual({
      poczatek: 0,
      pelna: 0,
    });
  });

  /*
   * Przypadek z [#13]: wspólne rozliczenie z ulgą po obu stronach. Progi są
   * pięciocyfrowe i dzieli je ok. 39 jednostek `viewBox`, a same podpisy mają
   * po ok. 42 — nachodziły na siebie o ponad dwie jednostki.
   */
  it('progi z #13 rozjeżdżają się na dwa wiersze', () => {
    expect(rzedyPodpisow(scena(51_000, 30_784, 35_909))).toEqual({
      poczatek: 0,
      pelna: 1,
    });
  });

  it('etat z ulgą dla młodych też wymaga drugiego wiersza', () => {
    expect(rzedyPodpisow(scena(33_000, 20_139, 23_036))).toEqual({
      poczatek: 0,
      pelna: 1,
    });
  });

  it('zlecenie z ulgą dla młodych też wymaga drugiego wiersza', () => {
    expect(rzedyPodpisow(scena(37_000, 22_746, 25_981))).toEqual({
      poczatek: 0,
      pelna: 1,
    });
  });

  /*
   * Kolizja z podpisem krańca, nie z drugim progiem: zlecenie i małżonek bez
   * dochodu wypychają próg pełnej korzyści pod prawą krawędź, gdzie stoi
   * „40 000 i więcej". Progi dzieli wtedy sporo miejsca, więc pierwszy podpis
   * zostaje w górnym wierszu, a schodzi tylko ten kolidujący.
   */
  it('próg wciśnięty pod podpis prawego krańca schodzi niżej', () => {
    expect(rzedyPodpisow(scena(40_000, 28_229, 34_478))).toEqual({
      poczatek: 0,
      pelna: 1,
    });
  });

  it('próg wciśnięty pod podpis lewego krańca schodzi niżej', () => {
    expect(rzedyPodpisow(scena(16_000, 5_357, 11_606))).toEqual({
      poczatek: 1,
      pelna: 0,
    });
  });

  it('brakujący próg nie zajmuje miejsca sąsiadowi', () => {
    expect(rzedyPodpisow(scena(51_000, null, 35_909))).toEqual({
      poczatek: null,
      pelna: 0,
    });
  });

  /*
   * Wyjście ostateczne. Oś tak ciasna, że oba progi nachodzą i na krańce,
   * i na siebie nawzajem — drugi wiersz starcza wtedy dla jednego z nich.
   * W kalkulatorze taka oś nie występuje (progi tak blisko krawędzi odpada
   * wcześniej `widoczny`), ale funkcja ma na to odpowiadać pominięciem
   * podpisu, a nie nałożeniem go na sąsiada.
   */
  it('gdy nie ma miejsca w żadnym wierszu, podpis znika', () => {
    const ciasno = {
      lewy: '3 000 i mniej',
      prawy: '4 000 i więcej',
      poczatek: { tekst: '3 400', x: 190 },
      pelna: { tekst: '3 500', x: 200 },
      L: 180,
      R: 210,
    };

    expect(rzedyPodpisow(ciasno)).toEqual({ poczatek: 1, pelna: null });
  });
});
