/**
 * Silnik podatkowy — model roczny wynagrodzenia z umowy o pracę.
 *
 * Odwzorowuje część B/C pliku model.md. Model roczny, nie miesięczna lista płac:
 * zaokrąglenia zachodzą raz w roku, a nie dwanaście razy, więc wynik może się
 * różnić od sumy dwunastu zaliczek o kilka–kilkanaście złotych. Do odpowiedzi
 * na pytanie „ile zyskam" to wystarcza; do listy płac trzeba pętli miesięcznej.
 */

import {
  KUP_PODSTAWOWE_MIES,
  KUP_PODWYZSZONE_MIES,
  KWOTA_ZMNIEJSZAJACA_ROK,
  LIMIT_30X,
  RATE_CHOROBOWA,
  RATE_EMERYTALNA,
  RATE_RENTOWA,
  RATE_ZDROWOTNA,
  SKALA,
  type Rok,
} from './constants';

/** Zaokrąglenie do pełnych złotych, HALF_UP — art. 63 §1 Ordynacji podatkowej. */
export function roundPln(x: number): number {
  return Math.floor(x + 0.5);
}

/** Zaokrąglenie do groszy, HALF_UP — składki ZUS nie idą do pełnych złotych. */
export function round2(x: number): number {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

/**
 * Podatek roczny wg skali, po odjęciu kwoty zmniejszającej.
 *
 * Kwoty stałe progów (14 400 dla 2026; 15 600 i 20 400 dla 2027) nie są tu
 * wpisane — wynikają z przejścia po przedziałach. Dzięki temu zmiana stawki
 * w constants.ts nie wymaga przeliczenia niczego ręcznie.
 */
export function podatekWgSkali(dochod: number, rok: Rok): number {
  let podatek = 0;
  let dolna = 0;

  for (const prog of SKALA[rok]) {
    if (dochod <= dolna) break;
    const wPrzedziale = Math.min(dochod, prog.do) - dolna;
    podatek += wPrzedziale * prog.stawka;
    dolna = prog.do;
  }

  return Math.max(0, podatek - KWOTA_ZMNIEJSZAJACA_ROK);
}

export interface Opcje {
  /** Zamieszkanie poza miejscowością zakładu pracy — KUP 300 zł zamiast 250 zł. */
  kupPodwyzszone?: boolean;
  /** Wpłata pracownika do PPK, ułamek (0,02 = 2%). Potrącana z netto. */
  ppkPracownik?: number;
  /**
   * Roczny limit podstawy składki emerytalnej i rentowej.
   *
   * Domyślnie limit obowiązujący, ten sam po obu stronach porównania — i to jest
   * celowe. Limit rośnie co roku niezależnie od reformy, więc podstawienie po
   * stronie 2027 prognozy 299 130 zł zmieszałoby efekt zmiany skali z efektem
   * zwykłej waloryzacji ZUS i zaniżyło pokazywany zysk osobom o wysokich
   * zarobkach (przy 30 000 zł brutto: 2 502 zł zamiast 3 600 zł). Pytanie brzmi
   * „ile dałaby nowa skala", a nie „jak będę zarabiać w 2027", więc zmienia się
   * wyłącznie skala. Parametr jest wystawiony na wypadek, gdyby kiedyś potrzebny
   * był model prognostyczny.
   */
  limit30x?: number;
}

export interface Wynik {
  rok: Rok;
  bruttoMiesiecznie: number;
  bruttoRocznie: number;
  skladkiSpoleczne: number;
  skladkaZdrowotna: number;
  kup: number;
  podstawaOpodatkowania: number;
  podatek: number;
  ppk: number;
  nettoRocznie: number;
  nettoMiesiecznie: number;
}

/** Pełne wyliczenie dla jednego roku podatkowego. */
export function oblicz(bruttoMiesiecznie: number, rok: Rok, opcje: Opcje = {}): Wynik {
  const bruttoRocznie = bruttoMiesiecznie * 12;

  // Emerytalna i rentowa podlegają limitowi 30-krotności; chorobowa nie.
  const podstawaEmerRent = Math.min(bruttoRocznie, opcje.limit30x ?? LIMIT_30X[2026]);
  const skladkiSpoleczne = round2(
    podstawaEmerRent * (RATE_EMERYTALNA + RATE_RENTOWA) + bruttoRocznie * RATE_CHOROBOWA,
  );

  // Zdrowotna: po odjęciu społecznych, ale przed KUP.
  const skladkaZdrowotna = round2((bruttoRocznie - skladkiSpoleczne) * RATE_ZDROWOTNA);

  const kup = (opcje.kupPodwyzszone ? KUP_PODWYZSZONE_MIES : KUP_PODSTAWOWE_MIES) * 12;

  const podstawaOpodatkowania = roundPln(Math.max(0, bruttoRocznie - skladkiSpoleczne - kup));
  const podatek = roundPln(podatekWgSkali(podstawaOpodatkowania, rok));

  const ppk = round2(bruttoRocznie * (opcje.ppkPracownik ?? 0));

  const nettoRocznie = round2(
    bruttoRocznie - skladkiSpoleczne - skladkaZdrowotna - podatek - ppk,
  );

  return {
    rok,
    bruttoMiesiecznie,
    bruttoRocznie,
    skladkiSpoleczne,
    skladkaZdrowotna,
    kup,
    podstawaOpodatkowania,
    podatek,
    ppk,
    nettoRocznie,
    nettoMiesiecznie: round2(nettoRocznie / 12),
  };
}

export interface Porownanie {
  przed: Wynik;
  po: Wynik;
  zyskRocznie: number;
  zyskMiesiecznie: number;
}

/** Porównanie stanu obowiązującego z zapowiadanym. */
export function porownaj(bruttoMiesiecznie: number, opcje: Opcje = {}): Porownanie {
  const przed = oblicz(bruttoMiesiecznie, 2026, opcje);
  const po = oblicz(bruttoMiesiecznie, 2027, opcje);
  const zyskRocznie = round2(po.nettoRocznie - przed.nettoRocznie);

  return {
    przed,
    po,
    zyskRocznie,
    zyskMiesiecznie: round2(zyskRocznie / 12),
  };
}

/**
 * Progi orientacyjne, wyprowadzone z modelu (patrz model.md, część D).
 * Trzymane jako liczby, bo służą do komunikatu w UI — nie do obliczeń.
 */
export const BRUTTO_POCZATEK_KORZYSCI = 11_878;
export const BRUTTO_PELNA_KORZYSC = 14_776;
export const MAKSYMALNA_KORZYSC_ROCZNA = 3_600;
