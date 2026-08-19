/**
 * Silnik podatkowy — model roczny wynagrodzenia z umowy o pracę.
 *
 * Odwzorowuje część B/C pliku model.md. Model roczny, nie miesięczna lista płac:
 * zaokrąglenia zachodzą raz w roku, a nie dwanaście razy, więc wynik może się
 * różnić od sumy dwunastu zaliczek o kilka–kilkanaście złotych. Do odpowiedzi
 * na pytanie „ile zyskam" to wystarcza; do listy płac trzeba pętli miesięcznej.
 */

import {
  KAP_2021_STAWKA,
  KAP_2021_ZMNIEJSZAJACA_MIES,
  KUP_PODSTAWOWE_MIES,
  KUP_PODWYZSZONE_MIES,
  KWOTA_ZMNIEJSZAJACA_ROK,
  LIMIT_30X,
  LIMIT_PIT_ZERO,
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

/**
 * Kap składki zdrowotnej — art. 83 ustawy zdrowotnej (model.md B.5).
 *
 * Zwraca hipotetyczną zaliczkę na PIT „wg stanu na 31.12.2021": stawka 17% od
 * podstawy opodatkowania, minus kwota zmniejszająca 43,76 zł miesięcznie
 * (zakładamy PIT-2 — tak jak reszta silnika, która zawsze stosuje kwotę
 * zmniejszającą). Składka zdrowotna nie może przekroczyć tej kwoty.
 *
 * Podstawa jest ta sama, którą liczy `skladniki`, czyli **bez przychodu
 * zwolnionego**: ulga dla młodych obowiązywała już w 2021 r., więc w
 * hipotetycznej zaliczce przychód zwolniony też się nie pojawia. Stąd
 * najważniejsza konsekwencja: przy przychodzie w całości zwolnionym podstawa
 * wynosi zero, hipotetyczna zaliczka zero — i **składka zdrowotna spada do
 * zera**, mimo że sam przychód jest oskładkowany normalnie.
 */
export function kapZdrowotnej(podstawaOpodatkowania: number): number {
  return round2(
    Math.max(0, podstawaOpodatkowania * KAP_2021_STAWKA - 12 * KAP_2021_ZMNIEJSZAJACA_MIES),
  );
}

export interface Opcje {
  /** Zamieszkanie poza miejscowością zakładu pracy — KUP 300 zł zamiast 250 zł. */
  kupPodwyzszone?: boolean;
  /**
   * Ulga dla młodych — PIT-0 do ukończenia 26. roku życia (art. 21 ust. 1
   * pkt 148). Domyślnie wyłączona.
   *
   * Zwalnia z podatku **przychód** (nie dochód) do wspólnego dla wszystkich ulg
   * PIT-0 limitu 85 528 zł rocznie. Kto korzysta równolegle z innej ulgi PIT-0
   * (na powrót, rodziny 4+, senior), ma ten limit już częściowo zużyty —
   * silnik tego nie modeluje i przyjmuje limit w całości wolny.
   *
   * Cecha **konkretnej osoby**, nie gospodarstwa: przy wspólnym rozliczeniu
   * patrz `OpcjeWspolne.malzonek`.
   */
  ulgaDlaMlodych?: boolean;
  /**
   * Wpłata **pracownika** do PPK, ułamek (0,02 = 2%). Domyślnie zero.
   *
   * Potrącana z netto — po podatku i po ZUS — więc obniża wypłatę dokładnie
   * o swoją wartość i nie rusza ani podstawy opodatkowania, ani składek
   * (model.md B.7, krok 9 z B.2).
   */
  ppkPracownik?: number;
  /**
   * Wpłata **pracodawcy** do PPK, ułamek (0,015 = 1,5%). Domyślnie zero.
   *
   * Nie jest potrącana z wypłaty — to dopłata ponad wynagrodzenie — ale jest
   * **przychodem podatkowym pracownika**: powiększa podstawę opodatkowania,
   * przy tym **nie wchodząc** do podstawy składek społecznych ani zdrowotnej
   * (model.md B.7). Kosztem dla pracownika jest więc sam podatek od niej,
   * a nie cała kwota; kwota trafia na jego rachunek PPK i jest wystawiona
   * w wyniku jako `ppkPracodawcy`.
   *
   * Pominięcie tego składnika zaniżałoby podatek — dlatego opcja istnieje
   * mimo że dla samego „ile mi zostanie w kieszeni" wygodniej byłoby jej nie mieć.
   */
  ppkPracodawca?: number;
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
  /**
   * Przychód podatkowy: brutto + wpłata pracodawcy do PPK.
   *
   * Różni się od brutto wyłącznie wtedy, gdy pracodawca wpłaca do PPK — i to
   * jest właśnie ta różnica, od której liczy się podatek, a nie liczą się
   * składki. Bez PPK pracodawcy równa się `bruttoRocznie` co do grosza.
   */
  przychodPodatkowy: number;
  /**
   * Przychód zwolniony z podatku w ramach PIT-0 (ulga dla młodych) — zero, gdy
   * ulga wyłączona. Wystawione osobno, żeby dało się to pokazać w rozbiciu:
   * inaczej z samego niższego podatku nie widać, skąd się wziął.
   */
  przychodZwolniony: number;
  /** Przychód podlegający opodatkowaniu: przychód podatkowy − przychód zwolniony. */
  przychodOpodatkowany: number;
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
  /**
   * Dochód: przychód opodatkowany − składki społeczne − KUP, zaokrąglony do
   * pełnych złotych i obcięty na zerze.
   */
  dochod: number;
  /** Wpłata pracownika do PPK — potrącana z netto. */
  ppk: number;
  /**
   * Wpłata pracodawcy do PPK — **nie** jest odejmowana od netto.
   *
   * Dla pracownika to nie jest koszt, tylko pieniądze, które dostaje na
   * rachunek PPK ponad wynagrodzenie; kosztuje go wyłącznie podatek od niej,
   * widoczny już w `podatek`. Wystawiona osobno właśnie po to, żeby dało się to
   * w rozbiciu pokazać uczciwie — inaczej z samego wyższego podatku wyglądałaby
   * jak strata.
   */
  ppkPracodawcy: number;
}

/** Część wyliczenia, która przy wspólnym rozliczeniu zostaje przy jednej osobie. */
function skladniki(bruttoMiesiecznie: number, opcje: Opcje = {}): SkladnikiOsoby {
  const bruttoRocznie = bruttoMiesiecznie * 12;

  // Emerytalna i rentowa podlegają limitowi 30-krotności; chorobowa nie.
  const podstawaEmerRent = Math.min(bruttoRocznie, opcje.limit30x ?? LIMIT_30X[2026]);
  const skladkiSpoleczne = round2(
    podstawaEmerRent * (RATE_EMERYTALNA + RATE_RENTOWA) + bruttoRocznie * RATE_CHOROBOWA,
  );

  // Wpłata pracodawcy do PPK: przychód podatkowy pracownika, ale NIE podstawa
  // składek (model.md B.7). Dlatego pojawia się dopiero tutaj — po policzeniu
  // składek społecznych i poza podstawą zdrowotnej niżej.
  //
  // Podstawą wpłat jest brutto: wpłat PPK nie ogranicza 30-krotność, więc nie
  // jest to `podstawaEmerRent`. Model jest roczny, co zaciera jedno
  // uproszczenie — wpłata pracodawcy jest przychodem w miesiącu PRZEKAZANIA,
  // czyli zwykle miesiąc później (model.md B.7, krok 0 z B.2). W skali roku
  // przesunięcie znika; różnica pojawiłaby się tylko na styku lat.
  const ppkPracodawcy = round2(bruttoRocznie * (opcje.ppkPracodawca ?? 0));
  const przychodPodatkowy = round2(bruttoRocznie + ppkPracodawcy);

  // Zwolnienie PIT-0 zdejmuje z podatku PRZYCHÓD, nie dochód, i nie dotyczy
  // składek: te wyżej naliczyły się od całości brutto. Zwolnienie jest
  // podatkowe, nie składkowe (model.md B.6).
  //
  // Wpłata pracodawcy do PPK wchodzi tu do przychodu objętego zwolnieniem
  // i zużywa limit 85 528 zł na równi z wynagrodzeniem. Podstawa: B.6 wymienia
  // wśród objętych przychodów „stosunek pracy", a wpłata pracodawcy jest
  // przychodem właśnie z tego źródła — to jedyny powód, dla którego w ogóle
  // jest opodatkowana. Model.md nie przesądza tego wprost, więc rozstrzygnięcie
  // jest odnotowane w części E („Otwarte pytania"); dotyczy wyłącznie osób
  // z ulgą i tylko na krawędzi limitu.
  const przychodZwolniony = opcje.ulgaDlaMlodych ? Math.min(przychodPodatkowy, LIMIT_PIT_ZERO) : 0;
  const przychodOpodatkowany = round2(przychodPodatkowy - przychodZwolniony);

  // KUP stosuje się TYLKO do części opodatkowanej (model.md B.6) — przy
  // przychodzie w całości zwolnionym nie ma ich wcale. Odliczyć da się przy tym
  // najwyżej tyle, ile z tej części zostało po składkach; dzięki temu dochód
  // zwykle wychodzi nieujemny sam z siebie i równa się różnicy pokazywanych
  // w rozbiciu kwot.
  const kup = Math.min(
    (opcje.kupPodwyzszone ? KUP_PODWYZSZONE_MIES : KUP_PODSTAWOWE_MIES) * 12,
    Math.max(0, przychodOpodatkowany - skladkiSpoleczne),
  );

  // Obcięcie na zerze wchodzi w grę wyłącznie z ulgą: składki naliczone od
  // całości brutto potrafią przewyższyć samą część opodatkowaną (całość
  // zwolniona ⇒ przychód opodatkowany zero, a składki dodatnie). Bez ulgi
  // ogranicznik KUP powyżej gwarantuje nieujemność i `max` nigdy nie działa —
  // wynik jest wtedy co do grosza taki jak przed wprowadzeniem ulgi.
  //
  // Model.md (część C) odejmuje tu **całość** składek społecznych, także tę
  // przypadającą na przychód zwolniony, i tak jest to zaimplementowane.
  const dochod = roundPln(Math.max(0, przychodOpodatkowany - skladkiSpoleczne - kup));

  // Zdrowotna: 9% po odjęciu społecznych, ale przed KUP — od CAŁOŚCI przychodu,
  // bo zwolnienie nie jest składkowe. Podlega jednak kapowi z art. 83 (B.5),
  // który przy przychodzie zwolnionym z podatku ściąga ją aż do zera.
  //
  // Podstawą jest tu `bruttoRocznie`, a nie `przychodPodatkowy`: wpłata
  // pracodawcy do PPK jest nieoskładkowana także zdrowotnie (B.7). Kap liczy się
  // natomiast od `dochod`, czyli już z tą wpłatą — bo kapem jest hipotetyczna
  // zaliczka na PIT, a ta widzi cały przychód podatkowy.
  const skladkaZdrowotna = Math.min(
    round2((bruttoRocznie - skladkiSpoleczne) * RATE_ZDROWOTNA),
    // Bez ulgi kap wiązałby dopiero poniżej ~1 250 zł/mies brutto — patrz
    // komentarz przy `kapZdrowotnej` w engine.test.ts. Nie stosujemy go tam,
    // żeby włączenie ulgi było jedyną rzeczą zmieniającą dotychczasowe wyniki.
    przychodZwolniony > 0 ? kapZdrowotnej(dochod) : Infinity,
  );

  return {
    bruttoMiesiecznie,
    bruttoRocznie,
    przychodPodatkowy,
    przychodZwolniony,
    przychodOpodatkowany,
    skladkiSpoleczne,
    skladkaZdrowotna,
    kup,
    dochod,
    ppk: round2(bruttoRocznie * (opcje.ppkPracownik ?? 0)),
    ppkPracodawcy,
  };
}

export interface Wynik {
  rok: Rok;
  bruttoMiesiecznie: number;
  bruttoRocznie: number;
  /** Przychód podatkowy: brutto + wpłata pracodawcy do PPK. */
  przychodPodatkowy: number;
  /** Przychód zwolniony z PIT (ulga dla młodych); zero, gdy ulga wyłączona. */
  przychodZwolniony: number;
  /** Przychód podlegający opodatkowaniu: przychód podatkowy − przychód zwolniony. */
  przychodOpodatkowany: number;
  skladkiSpoleczne: number;
  skladkaZdrowotna: number;
  kup: number;
  podstawaOpodatkowania: number;
  podatek: number;
  /** Wpłata pracownika do PPK — odjęta od netto. */
  ppk: number;
  /** Wpłata pracodawcy do PPK — **nie** odjęta od netto; patrz `SkladnikiOsoby`. */
  ppkPracodawcy: number;
  nettoRocznie: number;
  nettoMiesiecznie: number;
}

/** Pełne wyliczenie dla jednego roku podatkowego. */
export function oblicz(bruttoMiesiecznie: number, rok: Rok, opcje: Opcje = {}): Wynik {
  const osoba = skladniki(bruttoMiesiecznie, opcje);
  const podatek = roundPln(podatekWgSkali(osoba.dochod, rok));

  // Wpłata pracodawcy do PPK NIE jest tu odejmowana ani dodawana: nie jest
  // wypłacana pracownikowi, więc nie powiększa netto, i nie jest z wypłaty
  // potrącana, więc go nie obciąża. Jej jedyny ślad w netto to wyższy `podatek`
  // (model.md B.2, uwaga przy kroku 10).
  const nettoRocznie = round2(
    osoba.bruttoRocznie - osoba.skladkiSpoleczne - osoba.skladkaZdrowotna - podatek - osoba.ppk,
  );

  return {
    rok,
    bruttoMiesiecznie,
    bruttoRocznie: osoba.bruttoRocznie,
    przychodPodatkowy: osoba.przychodPodatkowy,
    przychodZwolniony: osoba.przychodZwolniony,
    przychodOpodatkowany: osoba.przychodOpodatkowany,
    skladkiSpoleczne: osoba.skladkiSpoleczne,
    skladkaZdrowotna: osoba.skladkaZdrowotna,
    kup: osoba.kup,
    podstawaOpodatkowania: osoba.dochod,
    podatek,
    ppk: osoba.ppk,
    ppkPracodawcy: osoba.ppkPracodawcy,
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
  /**
   * Opcje małżonka, jeśli inne niż Twoje. Domyślnie te same — **z wyjątkiem
   * `ulgaDlaMlodych`**.
   *
   * Ulga dla młodych jest cechą osoby (wiek), a nie ustawieniem gospodarstwa:
   * to, że Ty masz mniej niż 26 lat, nie mówi nic o małżonku. Gdyby dziedziczyła
   * się razem z resztą opcji, `{ ulgaDlaMlodych: true }` po cichu zwalniałoby
   * oboje i zawyżało netto pary o kilka tysięcy złotych. Dlatego pole z tego
   * obiektu **nie przechodzi** na małżonka — jego ulgę trzeba włączyć wprost:
   *
   * ```ts
   * porownajWspolnie(a, b, { ulgaDlaMlodych: true });                          // tylko Ty
   * porownajWspolnie(a, b, { malzonek: { ulgaDlaMlodych: true } });            // tylko małżonek
   * porownajWspolnie(a, b, { ulgaDlaMlodych: true,
   *                          malzonek: { ulgaDlaMlodych: true } });            // oboje
   * ```
   *
   * Pozostałe opcje (KUP, PPK, limit 30-krotności) dziedziczą się jak dotąd,
   * o ile `malzonek` nie został podany.
   */
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
    // Ulga dla młodych nie dziedziczy się przez `?? moje` — patrz `OpcjeWspolne`.
    skladniki(bruttoMalzonka, malzonek ?? { ...moje, ulgaDlaMlodych: false }),
  ];

  const suma = (wybierz: (o: SkladnikiOsoby) => number) => wybierz(osoby[0]) + wybierz(osoby[1]);

  // Dochody są już zaokrąglone do pełnych złotych osobno dla każdego małżonka
  // (tak jak w zeznaniu, gdzie każdy ma własną rubrykę), więc suma też jest
  // całkowita. Połowa bywa przez to „i pół" — zaokrągla się dopiero podatek.
  const podstawaOpodatkowania = suma((o) => o.dochod);
  const podatek = roundPln(2 * podatekWgSkali(podstawaOpodatkowania / 2, rok));

  const skladkiSpoleczne = round2(suma((o) => o.skladkiSpoleczne));
  const skladkaZdrowotna = round2(suma((o) => o.skladkaZdrowotna));
  // Wpłaty PPK są indywidualne — jak składki i jak limit PIT-0. Każdy małżonek
  // ma własną podstawę i własną stawkę, więc liczą się osobno w `skladniki`,
  // a tutaj tylko sumują do rozbicia gospodarstwa.
  const ppk = round2(suma((o) => o.ppk));
  const ppkPracodawcy = round2(suma((o) => o.ppkPracodawcy));
  const bruttoRocznie = suma((o) => o.bruttoRocznie);

  const nettoRocznie = round2(
    bruttoRocznie - skladkiSpoleczne - skladkaZdrowotna - podatek - ppk,
  );

  return {
    rok,
    osoby,
    bruttoMiesiecznie: bruttoMiesiecznie + bruttoMalzonka,
    bruttoRocznie,
    przychodPodatkowy: round2(suma((o) => o.przychodPodatkowy)),
    // Limit PIT-0 przysługuje każdemu osobno (jak KUP i limit 30-krotności),
    // więc tu jest już tylko suma gospodarstwa; rozbicie na osoby siedzi
    // w `osoby`.
    przychodZwolniony: suma((o) => o.przychodZwolniony),
    przychodOpodatkowany: round2(suma((o) => o.przychodOpodatkowany)),
    skladkiSpoleczne,
    skladkaZdrowotna,
    kup: suma((o) => o.kup),
    podstawaOpodatkowania,
    podatek,
    ppk,
    ppkPracodawcy,
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
 * To samo dla osoby korzystającej z ulgi dla młodych — progi przesuwają się
 * w górę dokładnie o tyle, ile trzeba zarobić, żeby *po* zwolnieniu 85 528 zł
 * dochód wciąż przekraczał granicę przedziału.
 *
 * Wyprowadzenie (KUP podstawowe, poniżej 30-krotności, więc składki to 13,71%
 * brutto): dochód = 0,8629 × brutto_rok − 85 528 − 3 000. Żeby ruszył z miejsca
 * zysk z nowej skali, musi przekroczyć 120 000 zł ⇒ brutto_rok > 241 658 zł ⇒
 * **20 139 zł/mies**. Pełna korzyść od dochodu 150 000 zł ⇒ **23 036 zł/mies**.
 *
 * Sens tych liczb dla interfejsu: młody pracownik praktycznie nigdy nie zyskuje
 * na zmianie skali, bo jego pierwsze 85 528 zł jest już wolne od podatku.
 * Kalkulator ma mu pokazać poprawne (dużo wyższe) netto, a nie obiecywać zysk.
 * Wartości są testowane co do złotówki na krawędzi — patrz engine.test.ts.
 */
export const BRUTTO_POCZATEK_KORZYSCI_ULGA = 20_139;
export const BRUTTO_PELNA_KORZYSC_ULGA = 23_036;

/**
 * Przy wspólnym rozliczeniu maksimum jest dwukrotne, bo obie granice skali
 * działają na połowę łącznego dochodu, czyli faktycznie podwójnie. Nie da się
 * przekroczyć: zysk pary to 2 × zysk osoby z połową ich łącznego dochodu.
 */
export const MAKSYMALNA_KORZYSC_WSPOLNA = 2 * MAKSYMALNA_KORZYSC_ROCZNA;
