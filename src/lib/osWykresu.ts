/**
 * Rozmieszczenie podpisów pod osią poziomą wykresu — który podpis mieści się
 * w pierwszym wierszu, a który trzeba zepchnąć do drugiego.
 *
 * Osobny moduł z tego samego powodu co `suwak.ts`: to jedyny kawałek wykresu,
 * który da się sprawdzić bez przeglądarki, a sprawdzić trzeba, bo raz już się
 * wywrócił — przy wspólnym rozliczeniu z ulgą oba progi są pięciocyfrowe i leżą
 * tak blisko siebie, że podpisy na siebie nachodziły ([#13]).
 *
 * [#13]: https://github.com/mkondratek/pit-2027/issues/13
 */

/**
 * Rozmiar pisma podpisów w jednostkach `viewBox` — **najciaśniejszy z tych,
 * w jakich wykres bywa rysowany**, czyli wariant wąskiego ekranu.
 *
 * Wykres skaluje się razem z szerokością rodzica, a rozmiar pisma jest podany
 * w jednostkach `viewBox`, więc o kolizji decyduje wyłącznie stosunek
 * szerokości napisu do szerokości osi — ten sam na każdym ekranie o tej samej
 * klasie szerokości. Wariant wąski (12 i 11) daje napisy **relatywnie
 * najszersze**, bo szeroki schodzi do 8 i 7,5 przy niezmienionej osi. Układ
 * liczymy więc raz, dla wariantu wąskiego, i stosujemy wszędzie: podpisy nie
 * przeskakują między wierszami przy zmianie szerokości okna, a cena jest taka,
 * że na szerokim ekranie drugi wiersz bywa użyty, choć zmieściłby się i jeden.
 */
const PISMO_PROGU = 12;
const PISMO_KRANCA = 11;

/**
 * Najmniejsza przerwa między sąsiednimi podpisami, w jednostkach `viewBox`.
 *
 * Musi być wyraźnie większa od spacji grupującej wewnątrz liczby (ok. 3
 * jednostki przy piśmie 12), inaczej „30 784" i „35 909" czyta się jak jeden
 * ciąg cyfr. Nie może być natomiast dużo większa: przy 6 jednostkach układ
 * domyślny — etat bez opcji, gdzie „14 776" stoi najbliżej podpisu prawego
 * krańca ze wszystkich układów mieszczących się w jednym wierszu — ma zapasu
 * jeszcze ok. 6 jednostek, a ten układ ma zostać dokładnie taki, jaki był.
 */
const ODSTEP_MIN = 6;

/** Odległość drugiego wiersza podpisów od pierwszego, w jednostkach `viewBox`. */
export const WYSOKOSC_WIERSZA = 13;

/**
 * Szerokości znaków w częściach `em`.
 *
 * Zmierzone w przeglądarce (`getComputedTextLength`) na `system-ui` przy piśmie
 * 11, czyli w wariancie, w którym ten krój jest najszerszy z używanych na
 * wykresie — SF Pro rozsuwa znaki tym mocniej, im mniejszy rozmiar. Wartości są
 * podniesione o 2% (tyle dokłada półgruby wariant podpisów progów)
 * i **zaokrąglone w górę**, więc model wychodzi o 1–2% szerszy od pomiaru;
 * same pomiary są zapisane w testach.
 *
 * Kierunek zaokrąglenia jest tu całą treścią: zawyżenie kosztuje najwyżej
 * drugi wiersz tam, gdzie napisy zmieściłyby się w jednym, a zaniżenie daje
 * dokładnie tę wadę, którą ten moduł ma usuwać. Dlatego nieznany znak dostaje
 * szerokość najszerszej małej litery, a nie średnią.
 *
 * Jedynka jest o jedną trzecią węższa od pozostałych cyfr i model to
 * wykorzystuje, bo inaczej nie zmieściłby w jednym wierszu układu domyślnego
 * (etat bez opcji, „14 776" tuż obok podpisu prawego krańca). Krój z cyframi
 * tabelarycznymi dałby jej pełną szerokość — stąd zapas 2% i minimalny odstęp
 * niżej, żeby taki poślizg nie oznaczał od razu kolizji.
 */
const SZEROKOSC_ZNAKU: Record<string, number> = {
  '0': 0.65,
  '1': 0.49,
  '2': 0.63,
  '3': 0.65,
  '4': 0.67,
  '5': 0.64,
  '6': 0.66,
  '7': 0.61,
  '8': 0.66,
  '9': 0.66,
  // Spacja grupująca (U+00A0 — tę wstawia `Intl`) i zwykła.
  ' ': 0.26,
  ' ': 0.26,
  i: 0.26,
  j: 0.26,
  m: 0.9,
  w: 0.8,
  n: 0.61,
  e: 0.6,
  ę: 0.6,
  c: 0.6,
};

/**
 * Domyślna szerokość znaku spoza tabeli — z grubsza najszersza mała litera.
 * Nieznany znak ma zostać przeszacowany, nie niedoszacowany (patrz wyżej).
 */
const SZEROKOSC_DOMYSLNA = 0.9;

/** Szerokość napisu w jednostkach `viewBox`. */
export function szerokoscTekstu(tekst: string, pismo: number): number {
  let em = 0;
  for (const znak of tekst) em += SZEROKOSC_ZNAKU[znak] ?? SZEROKOSC_DOMYSLNA;

  return em * pismo;
}

/** Poziomy zasięg podpisu: `[lewa krawędź, prawa krawędź]`. */
type Zasieg = [number, number];

function wolne(zajete: Zasieg[], [od, do_]: Zasieg): boolean {
  return zajete.every(([a, b]) => do_ + ODSTEP_MIN <= a || od - ODSTEP_MIN >= b);
}

/** Podpis progu: tekst i miejsce na osi, w którym ma stać wyśrodkowany. */
export interface PodpisProgu {
  tekst: string;
  x: number;
}

/**
 * Wiersz, w którym ma stanąć podpis: `0` — tuż pod osią, `1` — jeden wiersz
 * niżej, `null` — nie ma go gdzie postawić i trzeba go pominąć.
 */
export type Wiersz = 0 | 1 | null;

/**
 * Rozdziela podpisy progów między dwa wiersze pod osią.
 *
 * Podpisy krańców osi są nieruchome — stoją zawsze w pierwszym wierszu,
 * dosunięte do końców osi — bo bez nich nie wiadomo, jaki zakres wykres
 * obejmuje. Podpisy progów ustępują: każdy zajmuje pierwszy wiersz, jeśli się
 * w nim mieści obok tego, co już tam stoi, a w przeciwnym razie schodzi do
 * drugiego. Idziemy od lewej, więc przy kolizji pary to podpis prawego progu
 * schodzi niżej — układ czyta się wtedy jak schodek w dół, zgodnie z kierunkiem
 * czytania.
 *
 * Zejście do drugiego wiersza jest tu lepsze od trzech pozostałych wyjść.
 * Zmniejszenie pisma musiałoby w najgorszym przypadku (zlecenie z ulgą dla
 * młodych, progi 22 746 i 25 981) zejść do ok. 86% rozmiaru, a przy dwóch
 * liczbach obok siebie i tak zostawiłoby przerwę niewiele większą od spacji
 * wewnątrz liczby. Skrót „30,8 tys." jest **szerszy** od „30 784", nie węższy
 * (cztery znaki „ tys." kosztują więcej niż trzy zaoszczędzone cyfry), więc
 * niczego nie rozwiązuje. Pominięcie jednego z progów zostawiałoby na wykresie
 * przerywaną linię bez podpisu, a przy dwóch liniach obok siebie czytelnik nie
 * ma jak zgadnąć, której dotyczy ta pozostała. Drugi wiersz zachowuje obie
 * liczby w pełnym rozmiarze, każdą wyśrodkowaną dokładnie pod swoją linią,
 * i działa przy dowolnej ciasnocie — także wtedy, gdy progi dzieli złotówka.
 *
 * `null` jest wyjściem ostatecznym, na wypadek osi tak ciasnej, że podpis nie
 * mieści się w żadnym z wierszy. Zakłada się przy tym, że progi, które tu
 * przychodzą, leżą wyraźnie wewnątrz osi (`widoczny` w komponencie) — dzięki
 * temu żaden podpis nie wystaje poza `viewBox` i nie trzeba tego sprawdzać
 * drugi raz.
 */
export function rzedyPodpisow(opis: {
  /** Podpis lewego krańca osi, dosunięty do `L`. */
  lewy: string;
  /** Podpis prawego krańca osi, dosunięty do `R`. */
  prawy: string;
  poczatek: PodpisProgu | null;
  pelna: PodpisProgu | null;
  /** Lewy i prawy koniec osi w jednostkach `viewBox`. */
  L: number;
  R: number;
}): { poczatek: Wiersz; pelna: Wiersz } {
  const { lewy, prawy, poczatek, pelna, L, R } = opis;

  const wiersze: Zasieg[][] = [
    [
      [L, L + szerokoscTekstu(lewy, PISMO_KRANCA)],
      [R - szerokoscTekstu(prawy, PISMO_KRANCA), R],
    ],
    [],
  ];

  const przypisz = (podpis: PodpisProgu | null): Wiersz => {
    if (podpis === null) return null;

    const polowa = szerokoscTekstu(podpis.tekst, PISMO_PROGU) / 2;
    const zasieg: Zasieg = [podpis.x - polowa, podpis.x + polowa];

    for (const wiersz of [0, 1] as const) {
      if (wolne(wiersze[wiersz], zasieg)) {
        wiersze[wiersz].push(zasieg);

        return wiersz;
      }
    }

    return null;
  };

  return { poczatek: przypisz(poczatek), pelna: przypisz(pelna) };
}
