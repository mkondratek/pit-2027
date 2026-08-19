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

/**
 * Wszystko, co przy wspólnym rozliczeniu zostaje indywidualne.
 *
 * Wspólne rozliczenie łączy wyłącznie dochody — składki (każda z własnym limitem
 * 30-krotności), koszty uzyskania przychodu i składka zdrowotna liczą się osobno
 * każdemu małżonkowi. Ten typ jest tym „osobno", a `Wynik` jego nadbudową dla
 * jednej osoby rozliczającej się samotnie.
 */
export interface SkladnikiOsoby {
  bruttoMiesiecznie: number;
  bruttoRocznie: number;
  skladkiSpoleczne: number;
  skladkaZdrowotna: number;
  /**
   * Faktycznie odliczone koszty uzyskania przychodu.
   *
   * Nie ma kosztów uzyskania przychodu, którego nie ma: u małżonka bez pracy
   * jest to zero, a nie 3 000 zł. Bez tego ograniczenia rozbicie w interfejsie
   * przestawałoby się spinać — pokazywałoby odliczenie, którego w podstawie
   * nie widać — a przy wspólnym rozliczeniu byłoby to wprost zawyżenie ulgi
   * o nieistniejący etat.
   */
  kup: number;
  /** Dochód: brutto − składki społeczne − KUP, zaokrąglony do pełnych złotych. */
  dochod: number;
  ppk: number;
}

/** Część wyliczenia, która przy wspólnym rozliczeniu zostaje przy jednej osobie. */
function skladniki(bruttoMiesiecznie: number, opcje: Opcje = {}): SkladnikiOsoby {
  const bruttoRocznie = bruttoMiesiecznie * 12;

  // Emerytalna i rentowa podlegają limitowi 30-krotności; chorobowa nie.
  const podstawaEmerRent = Math.min(bruttoRocznie, opcje.limit30x ?? LIMIT_30X[2026]);
  const skladkiSpoleczne = round2(
    podstawaEmerRent * (RATE_EMERYTALNA + RATE_RENTOWA) + bruttoRocznie * RATE_CHOROBOWA,
  );

  // Zdrowotna: po odjęciu społecznych, ale przed KUP.
  const skladkaZdrowotna = round2((bruttoRocznie - skladkiSpoleczne) * RATE_ZDROWOTNA);

  // Odliczyć da się najwyżej tyle, ile zostało przychodu po składkach — patrz
  // `kup` w `SkladnikiOsoby`. Dzięki temu dochód wychodzi nieujemny sam z siebie
  // i zawsze równa się różnicy trzech pokazywanych w rozbiciu kwot.
  const kup = Math.min(
    (opcje.kupPodwyzszone ? KUP_PODWYZSZONE_MIES : KUP_PODSTAWOWE_MIES) * 12,
    Math.max(0, bruttoRocznie - skladkiSpoleczne),
  );

  return {
    bruttoMiesiecznie,
    bruttoRocznie,
    skladkiSpoleczne,
    skladkaZdrowotna,
    kup,
    dochod: roundPln(bruttoRocznie - skladkiSpoleczne - kup),
    ppk: round2(bruttoRocznie * (opcje.ppkPracownik ?? 0)),
  };
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
  const osoba = skladniki(bruttoMiesiecznie, opcje);
  const podatek = roundPln(podatekWgSkali(osoba.dochod, rok));

  const nettoRocznie = round2(
    osoba.bruttoRocznie - osoba.skladkiSpoleczne - osoba.skladkaZdrowotna - podatek - osoba.ppk,
  );

  return {
    rok,
    bruttoMiesiecznie,
    bruttoRocznie: osoba.bruttoRocznie,
    skladkiSpoleczne: osoba.skladkiSpoleczne,
    skladkaZdrowotna: osoba.skladkaZdrowotna,
    kup: osoba.kup,
    podstawaOpodatkowania: osoba.dochod,
    podatek,
    ppk: osoba.ppk,
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

/* ————————————— Wspólne rozliczenie małżonków (art. 6 ust. 2 ustawy o PIT) ————————————— */

export interface OpcjeWspolne extends Opcje {
  /** Opcje małżonka, jeśli inne niż Twoje. Domyślnie te same. */
  malzonek?: Opcje;
}

export interface WynikWspolny extends Wynik {
  /** Składniki liczone osobno: [Ty, małżonek]. */
  osoby: [SkladnikiOsoby, SkladnikiOsoby];
}

/**
 * Wspólne rozliczenie: podatek to dwukrotność podatku od połowy łącznego dochodu.
 *
 * Trzy rzeczy, na których łatwo się przejechać, i jak są tu rozstrzygnięte:
 *
 * 1. Sumują się **dochody**, nie kwoty brutto. Każdy małżonek ma własne składki
 *    (z własnym limitem 30-krotności) i własne koszty uzyskania przychodu —
 *    liczy je `skladniki`, osobno dla każdego.
 * 2. **Składka zdrowotna nie podlega wspólnemu rozliczeniu.** Jest indywidualna:
 *    liczona każdemu od jego własnej podstawy i odejmowana od jego netto. Tu
 *    widać ją już tylko w sumie gospodarstwa, bo to ona jest wynikiem.
 * 3. **Kwota zmniejszająca wchodzi dwukrotnie** i nie trzeba jej mnożyć ręcznie:
 *    `podatekWgSkali` odejmuje 3 600 zł od podatku z połowy dochodu, a całość
 *    mnożymy przez dwa, więc wychodzi 2 × max(0; skala(D/2) − 3 600). Odcięcie
 *    na zerze siedzi w środku, przed podwojeniem, i to jest właściwa kolejność:
 *    para z jednym żywicielem i dochodem 50 000 zł płaci zero, bo połowa (25 000)
 *    mieści się w kwocie wolnej — a nie 12% od nadwyżki ponad jedną kwotę wolną.
 *
 * Netto jest gospodarstwa, nie osoby: podatek jest wspólny i nie da się go
 * rozdzielić między małżonków inaczej niż arbitralnie.
 */
export function obliczWspolnie(
  bruttoMiesiecznie: number,
  bruttoMalzonka: number,
  rok: Rok,
  opcje: OpcjeWspolne = {},
): WynikWspolny {
  const { malzonek, ...moje } = opcje;
  const osoby: [SkladnikiOsoby, SkladnikiOsoby] = [
    skladniki(bruttoMiesiecznie, moje),
    skladniki(bruttoMalzonka, malzonek ?? moje),
  ];

  const suma = (wybierz: (o: SkladnikiOsoby) => number) => wybierz(osoby[0]) + wybierz(osoby[1]);

  // Dochody są już zaokrąglone do pełnych złotych osobno dla każdego małżonka
  // (tak jak w zeznaniu, gdzie każdy ma własną rubrykę), więc suma też jest
  // całkowita. Połowa bywa przez to „i pół" — zaokrągla się dopiero podatek.
  const podstawaOpodatkowania = suma((o) => o.dochod);
  const podatek = roundPln(2 * podatekWgSkali(podstawaOpodatkowania / 2, rok));

  const skladkiSpoleczne = round2(suma((o) => o.skladkiSpoleczne));
  const skladkaZdrowotna = round2(suma((o) => o.skladkaZdrowotna));
  const ppk = round2(suma((o) => o.ppk));
  const bruttoRocznie = suma((o) => o.bruttoRocznie);

  const nettoRocznie = round2(
    bruttoRocznie - skladkiSpoleczne - skladkaZdrowotna - podatek - ppk,
  );

  return {
    rok,
    osoby,
    bruttoMiesiecznie: bruttoMiesiecznie + bruttoMalzonka,
    bruttoRocznie,
    skladkiSpoleczne,
    skladkaZdrowotna,
    kup: suma((o) => o.kup),
    podstawaOpodatkowania,
    podatek,
    ppk,
    nettoRocznie,
    nettoMiesiecznie: round2(nettoRocznie / 12),
  };
}

export interface PorownanieWspolne extends Porownanie {
  przed: WynikWspolny;
  po: WynikWspolny;
}

/** Porównanie stanu obowiązującego z zapowiadanym — dla pary rozliczającej się wspólnie. */
export function porownajWspolnie(
  bruttoMiesiecznie: number,
  bruttoMalzonka: number,
  opcje: OpcjeWspolne = {},
): PorownanieWspolne {
  const przed = obliczWspolnie(bruttoMiesiecznie, bruttoMalzonka, 2026, opcje);
  const po = obliczWspolnie(bruttoMiesiecznie, bruttoMalzonka, 2027, opcje);
  const zyskRocznie = round2(po.nettoRocznie - przed.nettoRocznie);

  return {
    przed,
    po,
    zyskRocznie,
    zyskMiesiecznie: round2(zyskRocznie / 12),
  };
}

/**
 * Progi korzyści dla pary: przy jakim **Twoim** wynagrodzeniu zysk gospodarstwa
 * rusza z zera i przy jakim dochodzi do maksimum, przy zarobkach małżonka
 * przyjętych za stałe.
 *
 * Odpowiedniki `BRUTTO_POCZATEK_KORZYSCI` i `BRUTTO_PELNA_KORZYSC`, ale stałymi
 * być nie mogą: przesuwają się wraz z zarobkami małżonka (przy małżonku bez
 * dochodu granice dochodu działają podwójnie, więc progi wypadają dwa razy
 * wyżej). Zysk jest niemalejący względem wynagrodzenia, więc wystarczy
 * wyszukiwanie połówkowe — kilkanaście wywołań silnika zamiast przemiatania
 * całego zakresu.
 */
export function progiWspolne(
  bruttoMalzonka: number,
  opcje: OpcjeWspolne = {},
): { poczatek: number; pelna: number } {
  const zysk = (brutto: number) => porownajWspolnie(brutto, bruttoMalzonka, opcje).zyskRocznie;

  return {
    poczatek: pierwszeBrutto((brutto) => zysk(brutto) > 0),
    pelna: pierwszeBrutto((brutto) => zysk(brutto) >= MAKSYMALNA_KORZYSC_WSPOLNA),
  };
}

/** Najmniejsze pełne złote brutto spełniające warunek niemalejący; GORNA, gdy żadne. */
function pierwszeBrutto(warunek: (brutto: number) => boolean): number {
  const GORNA = 200_000;
  if (warunek(0)) return 0;
  if (!warunek(GORNA)) return GORNA;

  let nie = 0;
  let tak = GORNA;
  while (tak - nie > 1) {
    const srodek = Math.floor((nie + tak) / 2);
    if (warunek(srodek)) tak = srodek;
    else nie = srodek;
  }

  return tak;
}

/**
 * Progi orientacyjne, wyprowadzone z modelu (patrz model.md, część D).
 * Trzymane jako liczby, bo służą do komunikatu w UI — nie do obliczeń.
 */
export const BRUTTO_POCZATEK_KORZYSCI = 11_878;
export const BRUTTO_PELNA_KORZYSC = 14_776;
export const MAKSYMALNA_KORZYSC_ROCZNA = 3_600;

/**
 * Przy wspólnym rozliczeniu maksimum jest dwukrotne, bo obie granice skali
 * działają na połowę łącznego dochodu, czyli faktycznie podwójnie. Nie da się
 * przekroczyć: zysk pary to 2 × zysk osoby z połową ich łącznego dochodu.
 */
export const MAKSYMALNA_KORZYSC_WSPOLNA = 2 * MAKSYMALNA_KORZYSC_ROCZNA;
