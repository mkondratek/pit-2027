/**
 * Stałe modelu podatkowego.
 *
 * Źródła i oznaczenia pewności — patrz model.md (część B.1).
 * Wartości oznaczone ZAPOWIEDŹ / NIEJASNE pochodzą z konferencji prasowej
 * z 19.08.2026 albo z wnioskowania, nie z tekstu przepisu.
 */

/** Składki społeczne pracownika. [PEWNE] */
export const RATE_EMERYTALNA = 0.0976;
export const RATE_RENTOWA = 0.015;
export const RATE_CHOROBOWA = 0.0245;

/** Składka zdrowotna — nieodliczalna od podatku od 2022. [PEWNE] */
export const RATE_ZDROWOTNA = 0.09;

/** Roczny limit podstawy składki emerytalnej i rentowej (30-krotność). */
export const LIMIT_30X: Record<Rok, number> = {
  2026: 282_600, // [PEWNE] 30 × 9 420 zł
  2027: 299_130, // [NIEJASNE] 30 × 9 971 zł — prognoza z założeń makro, nie z ustawy budżetowej
};

/** Koszty uzyskania przychodu, miesięcznie. [PEWNE] */
export const KUP_PODSTAWOWE_MIES = 250;
export const KUP_PODWYZSZONE_MIES = 300;

/** Kwota wolna 30 000 zł ⇒ kwota zmniejszająca podatek. [PEWNE — bez zmian w 2027] */
export const KWOTA_ZMNIEJSZAJACA_ROK = 3_600;

/**
 * Wspólny roczny limit zwolnień PIT-0. [PEWNE]
 *
 * Jedna kwota na wszystkie cztery ulgi PIT-0 u jednego podatnika (młodzi —
 * art. 21 ust. 1 pkt 148, na powrót, rodziny 4+, pracujący seniorzy) i dotyczy
 * **przychodu**, nie dochodu. Nie jest odesłaniem do granicy I przedziału skali
 * (tym jest limit 50% KUP — patrz model.md B.4), więc nowa skala 2027 sama z
 * siebie tej kwoty nie rusza: ta sama wartość po obu stronach porównania.
 */
export const LIMIT_PIT_ZERO = 85_528;

/**
 * Kap składki zdrowotnej — art. 83 ustawy zdrowotnej. [PEWNE]
 *
 * Składkę obniża się do wysokości hipotetycznej zaliczki na PIT liczonej wg
 * przepisów z 31.12.2021: stawka 17%, KUP 250/300 zł, miesięczna kwota
 * zmniejszająca 43,76 zł, bez odliczania zdrowotnej. Parametry są z 2021 r.
 * i nie zmieniają się wraz z rokiem podatkowym — to stan zamrożony w przepisie,
 * nie bieżąca skala.
 */
export const KAP_2021_STAWKA = 0.17;
export const KAP_2021_ZMNIEJSZAJACA_MIES = 43.76;

/**
 * Płaca minimalna przy pełnym etacie. [PEWNE dla 2026]
 *
 * Nie wchodzi do wzoru — służy wyłącznie do ostrzeżenia w interfejsie. Nie jest
 * dolną granicą wynagrodzenia z umowy o pracę: przy niepełnym etacie kwota jest
 * proporcjonalnie niższa i to nadal legalna umowa. Wartość na 2027 r. pozostaje
 * nieustalona (źródła podają sprzecznie 4 950 i 5 103 zł), dlatego trzymamy tu
 * tę pewną.
 */
export const PLACA_MINIMALNA = 4_806;

export type Rok = 2026 | 2027;

/** Skala podatkowa. Progi jako punkty przełamania stawki. */
export const SKALA: Record<Rok, Prog[]> = {
  // [PEWNE] stan obowiązujący
  2026: [
    { do: 120_000, stawka: 0.12 },
    { do: Infinity, stawka: 0.32 },
  ],
  // [ZAPOWIEDŹ] konferencja prasowa 19.08.2026 — brak projektu ustawy
  2027: [
    { do: 130_000, stawka: 0.12 },
    { do: 150_000, stawka: 0.24 },
    { do: Infinity, stawka: 0.32 },
  ],
};

export interface Prog {
  /** Górna granica przedziału (włącznie). */
  do: number;
  stawka: number;
}
