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

/**
 * Miesięczny limit podstawy **dobrowolnej** składki chorobowej — 250%
 * prognozowanego przeciętnego wynagrodzenia (art. 20 ust. 3 ustawy o systemie
 * ubezpieczeń społecznych). [PEWNE dla 2026]
 *
 * Dotyczy tych, którzy chorobowemu podlegają dobrowolnie — czyli m.in.
 * zleceniobiorców, a **nie** pracowników (u nich chorobowa jest obowiązkowa
 * i tego limitu nie ma; patrz model.md B.2 krok 1).
 *
 * W skali roku 12 × 250% = 30 × przeciętnego wynagrodzenia, więc roczna granica
 * jest **liczbowo tożsama** z 30-krotnością z `LIMIT_30X` — mimo że to zupełnie
 * inny przepis i inne uzasadnienie. Model jest roczny i zakłada równe miesiące,
 * więc korzysta z tej tożsamości (pilnuje jej test); przy nierównych wypłatach
 * miesięczny limit obcinałby więcej niż roczna 30-krotność.
 */
export const LIMIT_CHOROBOWEJ_DOBROWOLNEJ_MIES: Record<Rok, number> = {
  2026: 23_550, // [PEWNE] 250% × 9 420 zł
  2027: 24_927.5, // [NIEJASNE] 250% × 9 971 zł — ta sama prognoza co przy 30-krotności
};

/** Koszty uzyskania przychodu pracownicze (umowa o pracę), miesięcznie. [PEWNE] */
export const KUP_PODSTAWOWE_MIES = 250;
export const KUP_PODWYZSZONE_MIES = 300;

/**
 * Zryczałtowane koszty uzyskania przychodu przy umowie zlecenia — 20%.
 * [PEWNE] art. 22 ust. 9 pkt 4 ustawy o PIT.
 *
 * Konstrukcja jest zupełnie inna niż pracownicza kwota 250 zł/mies: to **udział
 * w przychodzie**, i to nie w całym, tylko w przychodzie **pomniejszonym
 * o potrącone składki** emerytalną, rentową i chorobową („z tym że koszty te
 * oblicza się od przychodu pomniejszonego o potrącone przez płatnika w danym
 * miesiącu składki…"). Nie ma tu żadnego limitu rocznego — limit z art. 22
 * ust. 9a dotyczy wyłącznie kosztów 50% (ust. 9 pkt 1–3).
 *
 * Praktyczna konsekwencja dla kalkulatora: przy zleceniu koszty rosną wraz
 * z wynagrodzeniem, więc powyżej ~1 450 zł/mies brutto są **wyższe** niż
 * pracownicze 250 zł — model.md, część F.
 */
export const KUP_ZLECENIE_STAWKA = 0.2;

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
 * PPK — wpłaty podstawowe, ułamek podstawy (model.md B.7). [PEWNE]
 *
 * Do wpisania w interfejsie jako wartości domyślne po włączeniu PPK; **silnik
 * ich sam nie zakłada** — brak opcji znaczy brak PPK, żeby włączenie programu
 * było zawsze świadomym wyborem, a nie skutkiem ubocznym aktualizacji.
 *
 * Obie strony mogą wpłacać więcej (pracownik do 2% dodatkowo, pracodawca do
 * 2,5%), a pracownik zarabiający poniżej 1,2 × płacy minimalnej może obniżyć
 * swoją wpłatę do 0,5%. Dlatego opcje silnika są ułamkami, nie flagami —
 * te stałe to tylko punkt wyjścia.
 */
export const PPK_PRACOWNIK_PODSTAWOWY = 0.02;
export const PPK_PRACODAWCA_PODSTAWOWY = 0.015;

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

/**
 * Forma zatrudnienia objęta modelem (model.md, część F).
 *
 * Obie rozliczają się **tą samą skalą podatkową** (art. 27 ust. 1), więc
 * zapowiadana zmiana dotyczy ich jednakowo — różnią się kosztami uzyskania
 * przychodu i zestawem składek, nie stawkami podatku.
 *
 * `'umowaOPrace'` jest wartością domyślną wszędzie i dotychczasowe wyniki są
 * przy niej identyczne co do grosza. Umowy o dzieło model **nie obejmuje**:
 * ma inne koszty (20% od całego przychodu — bez składek, bo ich nie ma) i nie
 * jest objęta ulgą dla młodych.
 */
export type FormaZatrudnienia = 'umowaOPrace' | 'zlecenie';

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
