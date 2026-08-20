/**
 * Silnik podatkowy — model roczny wynagrodzenia z umowy o pracę i z umowy zlecenia.
 *
 * Odwzorowuje część B/C pliku model.md (umowa o pracę) oraz część F (zlecenie).
 * Model roczny, nie miesięczna lista płac: zaokrąglenia zachodzą raz w roku,
 * a nie dwanaście razy, więc wynik może się różnić od sumy dwunastu zaliczek
 * o kilka–kilkanaście złotych. Do odpowiedzi na pytanie „ile zyskam" to
 * wystarcza; do listy płac trzeba pętli miesięcznej.
 */

import {
  DANINA_PROG,
  DANINA_STAWKA,
  KAP_2021_STAWKA,
  KAP_2021_ZMNIEJSZAJACA_MIES,
  KUP_PODSTAWOWE_MIES,
  KUP_PODWYZSZONE_MIES,
  KUP_ZLECENIE_STAWKA,
  KWOTA_ZMNIEJSZAJACA_ROK,
  LIMIT_30X,
  LIMIT_PIT_ZERO,
  RATE_CHOROBOWA,
  RATE_EMERYTALNA,
  RATE_RENTOWA,
  RATE_ZDROWOTNA,
  SKALA,
  type FormaZatrudnienia,
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
 * podstawy, minus kwota zmniejszająca 43,76 zł miesięcznie (zakładamy PIT-2 —
 * tak jak reszta silnika, która zawsze stosuje kwotę zmniejszającą), bez
 * odliczania składki zdrowotnej. Składka zdrowotna nie może przekroczyć tej
 * kwoty.
 *
 * ⚠️ Argumentem jest podstawa **policzona tak, jakby zwolnienie PIT-0 nie
 * przysługiwało** — nie bieżąca podstawa opodatkowania. Art. 83 ust. 2a mówi
 * o kwocie z ust. 2b, „**którą płatnik obliczyłby, gdyby przychód
 * ubezpieczonego nie był zwolniony od podatku dochodowego** na podstawie tego
 * przepisu". Zwolnienie jest więc w hipotetycznej zaliczce pomijane i kap przy
 * przychodzie w całości zwolnionym **nie spada do zera** — wychodzi tyle, ile
 * wyszłoby osobie bez ulgi. Wołający ma obowiązek podać właściwą podstawę;
 * podanie podstawy po zwolnieniu było błędem naprawionym w tej funkcji przez
 * zmianę tego, co się do niej podaje (patrz `skladniki`).
 *
 * Stawka jest płaska 17%, choć w 2021 r. powyżej 85 528 zł dochodu wchodziło
 * 32%. Jest to bezpieczne uproszczenie: 17% zaniża kap, a kap i tak wiąże
 * dopiero poniżej ~1 250 zł/mies brutto — daleko od drugiego progu z 2021 r.
 *
 * `zKwotaZmniejszajaca` odróżnia umowę o pracę od zlecenia i dotyczy **sposobu**
 * liczenia hipotetycznej zaliczki, nie jej podstawy — więc jest niezależne od
 * poprawki z ust. 2a wyżej. Kwota 43,76 zł miesięcznie brała się z PIT-2,
 * a PIT-2 **w 2021 r. przysługiwał wyłącznie pracownikom**; zleceniobiorca mógł
 * go złożyć dopiero od 2023 r. Skoro hipotetyczna zaliczka liczy się „wg stanu
 * na 31.12.2021", to przy zleceniu kwoty zmniejszającej w niej nie ma.
 * Domyślnie `true`, czyli wariant pracowniczy.
 *
 * Przy zleceniu kap nie wiąże **nigdy**, przy żadnej kwocie brutto: koszty 20%
 * zostawiają 80% podstawy, więc hipotetyczna zaliczka to 17% × 80% = 13,6%
 * tego, od czego składka bierze 9%. Ta granica ~1 250 zł/mies jest więc
 * wyłącznie etatowa (model.md F.6).
 */
export function kapZdrowotnej(
  podstawaBezZwolnienia: number,
  zKwotaZmniejszajaca = true,
): number {
  const zmniejszenie = zKwotaZmniejszajaca ? 12 * KAP_2021_ZMNIEJSZAJACA_MIES : 0;

  return round2(Math.max(0, podstawaBezZwolnienia * KAP_2021_STAWKA - zmniejszenie));
}

/**
 * Danina solidarnościowa — art. 30h ustawy o PIT (model.md B.8).
 *
 * 4% (2026) albo 5% (2027, zapowiedź) od **nadwyżki** podstawy ponad
 * 1 000 000 zł. Podatnik z podstawą 1 000 013 zł płaci **złotówkę**, a nie
 * czterdzieści tysięcy — próg jest punktem przełamania jak w skali, nie
 * bramką naliczającą daninę od całego dochodu po jego przekroczeniu.
 *
 * Zaokrąglenie do pełnych złotych: art. 30i odsyła do Ordynacji podatkowej,
 * więc art. 63 §1 stosuje się tak samo jak do podatku.
 *
 * Danina jest **poza zaliczkami** — płaci się ją raz w roku deklaracją DSF-1
 * do 30 kwietnia. Model jest roczny, więc mieści ją bez zastrzeżeń; lista płac
 * by nie mieściła i dlatego test zgodności z dwunastoma zaliczkami operuje na
 * kwotach daleko poniżej progu.
 */
export function daninaSolidarnosciowa(podstawaDaniny: number, rok: Rok): number {
  return roundPln(Math.max(0, podstawaDaniny - DANINA_PROG) * DANINA_STAWKA[rok]);
}

export interface Opcje {
  /**
   * Forma zatrudnienia. Domyślnie `'umowaOPrace'` — przy tej wartości silnik
   * liczy dokładnie to co dotąd, co do grosza.
   *
   * `'zlecenie'` zmienia trzy rzeczy i **tylko** te trzy (model.md, część F):
   * koszty uzyskania przychodu (20% przychodu po składkach zamiast 250 zł/mies),
   * dobrowolność składki chorobowej (`chorobowaDobrowolna`) i dostępność
   * zwolnienia studenckiego (`studentDo26`). Skala podatkowa, kwota
   * zmniejszająca, składka zdrowotna, limit 30-krotności, ulga dla młodych
   * i wspólne rozliczenie działają identycznie — bo to ta sama skala z art. 27
   * ust. 1 i te same przepisy składkowe.
   *
   * Model zakłada, że zlecenie jest **jedynym tytułem do ubezpieczeń**. Zbiegu
   * tytułów (etat u jednego podmiotu + zlecenie u drugiego) silnik nie liczy —
   * patrz model.md F.7.
   */
  forma?: FormaZatrudnienia;
  /**
   * Dobrowolne ubezpieczenie chorobowe przy **zleceniu**. Domyślnie `true`.
   *
   * Przy umowie o pracę chorobowa jest obowiązkowa i ta opcja nic nie zmienia —
   * jest ignorowana, żeby nie dało się nią przypadkiem podnieść netto etatowca.
   *
   * Domyślne `true` jest wyborem prezentacyjnym: dzięki niemu porównanie etatu
   * ze zleceniem przy tej samej kwocie brutto pokazuje **wyłącznie** różnicę
   * w kosztach uzyskania przychodu, a nie sumę dwóch niezależnych różnic.
   * Zleceniobiorca, który do chorobowej nie przystąpił, ma o 2,45% brutto
   * wyższe netto — wystarczy podać `false`.
   */
  chorobowaDobrowolna?: boolean;
  /**
   * Uczeń lub student do ukończenia 26. roku życia na **zleceniu** — pełne
   * zwolnienie ze składek ZUS (art. 6 ust. 4 ustawy o systemie ubezpieczeń
   * społecznych). Domyślnie wyłączone.
   *
   * Znaczy: zero składek społecznych **i zero składki zdrowotnej** — z tego
   * zlecenia nie ma tytułu do żadnego z ubezpieczeń (do zdrowotnego student
   * jest zgłaszany przez rodzica albo uczelnię). To największa pojedyncza
   * różnica w całym silniku: z brutto znika ~22%.
   *
   * Trzy rzeczy, których ta opcja **nie** robi:
   * 1. nie działa przy umowie o pracę (tam status studenta nic nie zmienia) —
   *    jest wtedy ignorowana;
   * 2. nie zwalnia z podatku. Zwolnienie ze składek to ZUS, a nie PIT; podatek
   *    znika osobno, przez `ulgaDlaMlodych`, i te dwie opcje są niezależne
   *    (30-letni student ma pierwsze bez drugiego, 24-latek po studiach
   *    odwrotnie). Typowy student ma obie;
   * 3. nie łączy się z PPK — bez obowiązkowych składek emerytalno-rentowych
   *    zleceniobiorca nie jest „osobą zatrudnioną" w rozumieniu ustawy o PPK,
   *    więc wpłaty są zerowane, nawet jeśli podano stawki.
   */
  studentDo26?: boolean;
  /**
   * Zamieszkanie poza miejscowością zakładu pracy — KUP 300 zł zamiast 250 zł.
   *
   * Wyłącznie pracownicze: przy zleceniu koszty są procentowe i tego wariantu
   * nie mają, więc opcja jest wtedy ignorowana.
   */
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
  /** Forma zatrudnienia, według której policzono tę osobę. */
  forma: FormaZatrudnienia;
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
  /**
   * Podstawa obliczenia daniny solidarnościowej — art. 30h ust. 2 (model.md B.8).
   *
   * W tym modelu równa się co do złotówki `dochod`, i **nie jest to zbieg
   * okoliczności**: przepis każe wziąć sumę dochodów opodatkowanych wg skali
   * (oraz art. 30b, 30c, 30f — których kalkulator nie zna) pomniejszoną
   * o składki społeczne, a to jest dokładnie ta sama droga od przychodu, którą
   * przechodzi `dochod`. Pole istnieje mimo tej równości z dwóch powodów:
   *
   * 1. **przy wspólnym rozliczeniu te dwie liczby się rozjeżdżają.** Podatek
   *    liczy się od połowy ŁĄCZNEGO dochodu, danina — od dochodu każdego
   *    z osobna. `WynikWspolny.podstawaOpodatkowania` jest sumą gospodarstwa
   *    i **nie wolno** jej podstawić pod próg 1 000 000 zł; właściwa liczba to
   *    to pole, osobno dla każdej z `osoby`;
   * 2. katalog dochodów wchodzących do podstawy daniny jest szerszy niż to, co
   *    kalkulator liczy (patrz `danina`), więc rzeczywista podstawa bywa wyższa.
   */
  podstawaDaniny: number;
  /**
   * Danina solidarnościowa tej osoby w danym roku — zero poniżej progu.
   *
   * **Zaniża, nigdy nie zawyża.** Do podstawy wchodzą też dochody z kapitałów
   * (art. 30b), z działalności na liniowym (art. 30c) i z zagranicznych
   * jednostek kontrolowanych (art. 30f), a kalkulator zna wyłącznie skalę.
   * Kto ma dochody z tamtych źródeł, zapłaci więcej, niż tu widać — i może
   * przekroczyć próg, choć z samej wypłaty by go nie przekroczył.
   */
  danina: number;
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

/**
 * Część wyliczenia, która przy wspólnym rozliczeniu zostaje przy jednej osobie.
 *
 * `rok` wchodzi tu wyłącznie przez daninę solidarnościową — reszta drogi od
 * brutto do dochodu jest w obu latach identyczna (zmienia się dopiero skala,
 * a ta jest stosowana wyżej). Danina jest jednak indywidualna nawet przy
 * wspólnym rozliczeniu, więc musi się policzyć właśnie tutaj, a nie na
 * poziomie gospodarstwa.
 */
function skladniki(bruttoMiesiecznie: number, rok: Rok, opcje: Opcje = {}): SkladnikiOsoby {
  const bruttoRocznie = bruttoMiesiecznie * 12;

  const forma = opcje.forma ?? 'umowaOPrace';
  const zlecenie = forma === 'zlecenie';
  // Zwolnienie studenckie dotyczy wyłącznie zlecenia — przy etacie status
  // studenta nie zmienia niczego, więc opcja jest tam po prostu ignorowana.
  const bezZus = zlecenie && (opcje.studentDo26 ?? false);
  const limit30x = opcje.limit30x ?? LIMIT_30X[2026];

  // Emerytalna i rentowa podlegają limitowi 30-krotności.
  //
  // Chorobowa u pracownika jest obowiązkowa i limitu nie ma. Przy zleceniu jest
  // dobrowolna — a wtedy jej podstawa ma **własny** limit: 250% prognozowanego
  // przeciętnego wynagrodzenia miesięcznie (art. 20 ust. 3 ustawy o systemie
  // ubezpieczeń społecznych). W modelu rocznym o równych miesiącach 12 × 250%
  // to dokładnie 30-krotność, więc obie podstawy schodzą się do tej samej
  // liczby — patrz `LIMIT_CHOROBOWEJ_DOBROWOLNEJ_MIES` i pilnujący tego test.
  const chorobowa = zlecenie ? (opcje.chorobowaDobrowolna ?? true) : true;
  const podstawaEmerRent = bezZus ? 0 : Math.min(bruttoRocznie, limit30x);
  const podstawaChorobowej =
    bezZus || !chorobowa ? 0 : zlecenie ? Math.min(bruttoRocznie, limit30x) : bruttoRocznie;
  const skladkiSpoleczne = round2(
    podstawaEmerRent * (RATE_EMERYTALNA + RATE_RENTOWA) + podstawaChorobowej * RATE_CHOROBOWA,
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
  //
  // Bez obowiązkowych składek emerytalno-rentowych nie ma „osoby zatrudnionej"
  // w rozumieniu ustawy o PPK, więc student na zleceniu do programu nie
  // przystępuje — obie wpłaty są wtedy zerowane, także gdy podano stawki.
  const ppkPracodawcy = bezZus ? 0 : round2(bruttoRocznie * (opcje.ppkPracodawca ?? 0));
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

  // KUP stosuje się TYLKO do części opodatkowanej (model.md B.6, potwierdzone
  // wprost dla zlecenia przez podatki.gov.pl: „od przychodów objętych ulgą nie
  // obliczasz 20% kosztów uzyskania przychodów") — przy przychodzie w całości
  // zwolnionym nie ma ich wcale. Odliczyć da się przy tym najwyżej tyle, ile
  // z tej części zostało po składkach; dzięki temu dochód zwykle wychodzi
  // nieujemny sam z siebie i równa się różnicy pokazywanych w rozbiciu kwot.
  //
  // Ta sama podstawa — „przychód minus składki" — pełni przy obu formach inną
  // rolę: przy etacie jest tylko ogranicznikiem kwoty ryczałtowej, przy
  // zleceniu jest tym, od czego liczy się 20% (art. 22 ust. 9 pkt 4).
  //
  // Obcięcie dochodu na zerze wchodzi w grę wyłącznie z ulgą: składki naliczone
  // od całości brutto potrafią przewyższyć samą część opodatkowaną (całość
  // zwolniona ⇒ przychód opodatkowany zero, a składki dodatnie). Bez ulgi
  // ogranicznik KUP powyżej gwarantuje nieujemność i `max` nigdy nie działa —
  // wynik jest wtedy co do grosza taki jak przed wprowadzeniem ulgi. Przy
  // zleceniu jest tak zawsze: 20% czegoś nieujemnego nigdy tego nie przekroczy.
  //
  // Model.md (część C) odejmuje tu **całość** składek społecznych, także tę
  // przypadającą na przychód zwolniony, i tak jest to zaimplementowane.
  const kupRoczne = (opcje.kupPodwyzszone ? KUP_PODWYZSZONE_MIES : KUP_PODSTAWOWE_MIES) * 12;
  const podstawaZ = (przychod: number) => {
    const poSkladkach = Math.max(0, przychod - skladkiSpoleczne);
    const kup = zlecenie
      ? round2(KUP_ZLECENIE_STAWKA * poSkladkach)
      : Math.min(kupRoczne, poSkladkach);
    return { kup, dochod: roundPln(Math.max(0, przychod - skladkiSpoleczne - kup)) };
  };

  const { kup, dochod } = podstawaZ(przychodOpodatkowany);

  // Podstawa hipotetycznej zaliczki z art. 83 ust. 2a: ta sama arytmetyka, ale
  // od **całego** przychodu podatkowego, bez zdejmowania zwolnienia — bo
  // przepis każe wziąć kwotę, „którą płatnik obliczyłby, gdyby przychód
  // ubezpieczonego nie był zwolniony od podatku". Konsekwencja: pełne KUP
  // (przysługują od całości, skoro całość jest w tym rachunku opodatkowana) —
  // przy zleceniu odpowiednio pełne 20%. Bez ulgi jest to dokładnie `dochod`.
  const podstawaBezZwolnienia = podstawaZ(przychodPodatkowy).dochod;

  // Zdrowotna: 9% po odjęciu społecznych, ale przed KUP — od CAŁOŚCI przychodu,
  // bo zwolnienie nie jest składkowe. Podlega kapowi z art. 83 (B.5), ale kap
  // liczy się od podstawy SPRZED zwolnienia (ust. 2a) — więc przy przychodzie
  // w całości zwolnionym składka **nie spada do zera**, tylko zostaje na
  // poziomie takim jak bez ulgi. Zwolnienie z PIT nie jest zwolnieniem ze
  // składki zdrowotnej.
  //
  // Podstawą samej składki jest tu `bruttoRocznie`, a nie `przychodPodatkowy`:
  // wpłata pracodawcy do PPK jest nieoskładkowana także zdrowotnie (B.7). Kap
  // liczy się natomiast od podstawy z tą wpłatą — bo kapem jest hipotetyczna
  // zaliczka na PIT, a ta widzi cały przychód podatkowy.
  //
  // Student na zleceniu nie ma z tego tytułu ubezpieczenia zdrowotnego w ogóle
  // (zgłasza go rodzic albo uczelnia), więc nie ma tu czego liczyć ani czapkować.
  // To jest zwolnienie ze **składki**, a nie kap zbity do zera — różnica
  // widoczna choćby w tym, że działa też bez ulgi dla młodych.
  const skladkaZdrowotna = bezZus
    ? 0
    : Math.min(
        round2((bruttoRocznie - skladkiSpoleczne) * RATE_ZDROWOTNA),
        // Bez ulgi kap wiązałby dopiero poniżej ~1 250 zł/mies brutto — patrz
        // komentarz przy `kapZdrowotnej` w engine.test.ts. Nie stosujemy go tam,
        // żeby włączenie ulgi było jedyną rzeczą zmieniającą dotychczasowe wyniki.
        // Po poprawce z ust. 2a kap ma tu i tak tę samą wartość co bez ulgi,
        // więc różnica między gałęziami została już tylko w tej ćwiartce płacy
        // minimalnej — a przy zleceniu nie ma jej wcale, bo tam kap nie wiąże
        // przy żadnej kwocie (17% × 80% = 13,6% > 9%).
        przychodZwolniony > 0 ? kapZdrowotnej(podstawaBezZwolnienia, !zlecenie) : Infinity,
      );

  return {
    forma,
    bruttoMiesiecznie,
    bruttoRocznie,
    przychodPodatkowy,
    przychodZwolniony,
    przychodOpodatkowany,
    skladkiSpoleczne,
    skladkaZdrowotna,
    kup,
    dochod,
    // Podstawą daniny jest dochód PO zwolnieniu PIT-0: art. 30h ust. 2 mówi
    // o dochodach „podlegających opodatkowaniu", a przychód zwolniony z art. 21
    // opodatkowaniu z definicji nie podlega. Wychodzi to tu samo z siebie, bo
    // `dochod` jest już policzony od `przychodOpodatkowany` — i dobrze, bo to
    // jedyna rzecz w tym rachunku, którą łatwo byłoby zrobić odwrotnie.
    podstawaDaniny: dochod,
    danina: daninaSolidarnosciowa(dochod, rok),
    ppk: bezZus ? 0 : round2(bruttoRocznie * (opcje.ppkPracownik ?? 0)),
    ppkPracodawcy,
  };
}

export interface Wynik {
  rok: Rok;
  /**
   * Forma zatrudnienia, według której policzono wynik.
   *
   * Przy wspólnym rozliczeniu (`WynikWspolny`) jest to forma **Twoja**;
   * małżonek może mieć inną i jego wartość siedzi w `osoby[1].forma`.
   */
  forma: FormaZatrudnienia;
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
  /**
   * Danina solidarnościowa — odjęta od netto (art. 30h; model.md B.8).
   *
   * Zero dla zdecydowanej większości; dodatnia dopiero od ok. 88 400 zł/mies
   * brutto na etacie. Wystawiona osobno, żeby dało się ją pokazać w rozbiciu:
   * bez tego wyższe obciążenie w 2027 r. wyglądałoby jak błąd rachunkowy.
   *
   * Przy wspólnym rozliczeniu jest to **suma danin obu małżonków**, z których
   * każda została policzona od jego własnej podstawy — patrz
   * `SkladnikiOsoby.podstawaDaniny`. Podstawą daniny jednej osoby nigdy nie
   * jest `podstawaOpodatkowania` tego wyniku, bo ta jest łączna.
   */
  danina: number;
  /** Wpłata pracownika do PPK — odjęta od netto. */
  ppk: number;
  /** Wpłata pracodawcy do PPK — **nie** odjęta od netto; patrz `SkladnikiOsoby`. */
  ppkPracodawcy: number;
  nettoRocznie: number;
  nettoMiesiecznie: number;
}

/** Pełne wyliczenie dla jednego roku podatkowego. */
export function oblicz(bruttoMiesiecznie: number, rok: Rok, opcje: Opcje = {}): Wynik {
  const osoba = skladniki(bruttoMiesiecznie, rok, opcje);
  const podatek = roundPln(podatekWgSkali(osoba.dochod, rok));

  // Wpłata pracodawcy do PPK NIE jest tu odejmowana ani dodawana: nie jest
  // wypłacana pracownikowi, więc nie powiększa netto, i nie jest z wypłaty
  // potrącana, więc go nie obciąża. Jej jedyny ślad w netto to wyższy `podatek`
  // (model.md B.2, uwaga przy kroku 10).
  //
  // Danina solidarnościowa jest natomiast odejmowana wprost. Płaci się ją poza
  // zaliczkami, dopiero do 30 kwietnia następnego roku, więc w miesięcznym
  // pasku wypłaty jej nie widać — ale zapłacić trzeba, i „netto rocznie" bez
  // niej byłoby liczbą, której nikt nie zobaczy na koncie.
  const nettoRocznie = round2(
    osoba.bruttoRocznie -
      osoba.skladkiSpoleczne -
      osoba.skladkaZdrowotna -
      podatek -
      osoba.danina -
      osoba.ppk,
  );

  return {
    rok,
    forma: osoba.forma,
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
    danina: osoba.danina,
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
   * `ulgaDlaMlodych` i `studentDo26`**.
   *
   * Ulga dla młodych jest cechą osoby (wiek), a nie ustawieniem gospodarstwa:
   * to, że Ty masz mniej niż 26 lat, nie mówi nic o małżonku. Gdyby dziedziczyła
   * się razem z resztą opcji, `{ ulgaDlaMlodych: true }` po cichu zwalniałoby
   * oboje i zawyżało netto pary o kilka tysięcy złotych. Dokładnie to samo
   * dotyczy `studentDo26`, i to jeszcze mocniej: ciche odziedziczenie zdjęłoby
   * małżonkowi całe ~22% składek. Oba pola z tego obiektu **nie przechodzą** na
   * małżonka — jego ulgę trzeba włączyć wprost:
   *
   * ```ts
   * porownajWspolnie(a, b, { ulgaDlaMlodych: true });                          // tylko Ty
   * porownajWspolnie(a, b, { malzonek: { ulgaDlaMlodych: true } });            // tylko małżonek
   * porownajWspolnie(a, b, { ulgaDlaMlodych: true,
   *                          malzonek: { ulgaDlaMlodych: true } });            // oboje
   * ```
   *
   * Pozostałe opcje (forma zatrudnienia, chorobowa, KUP, PPK, limit
   * 30-krotności) dziedziczą się jak dotąd, o ile `malzonek` nie został podany.
   * Forma zatrudnienia dziedziczy się celowo: pomyłka polega tu najwyżej na
   * policzeniu małżonkowi innych kosztów uzyskania przychodu, a nie na zdjęciu
   * mu składek albo podatku — więc jest o rząd wielkości mniej kosztowna niż
   * przy dwóch polach wyżej, a para na dwóch zleceniach to sytuacja realna.
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
 * 4. **Danina solidarnościowa wspólnemu rozliczeniu nie podlega w ogóle.** Jest
 *    indywidualna: każdy z małżonków liczy ją od swojego dochodu, a dochodów
 *    ani się nie sumuje, ani nie dzieli na pół (objaśnienia MF z 28.08.2019).
 *    To najbardziej kontrintuicyjny punkt tej funkcji, bo podatek — liczony
 *    linijkę wyżej — robi dokładnie odwrotnie. Szczegóły przy `danina` niżej.
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
    skladniki(bruttoMiesiecznie, rok, moje),
    // Ulga dla młodych i zwolnienie studenckie nie dziedziczą się przez
    // `?? moje` — patrz `OpcjeWspolne`.
    skladniki(
      bruttoMalzonka,
      rok,
      malzonek ?? { ...moje, ulgaDlaMlodych: false, studentDo26: false },
    ),
  ];

  const suma = (wybierz: (o: SkladnikiOsoby) => number) => wybierz(osoby[0]) + wybierz(osoby[1]);

  // Dochody są już zaokrąglone do pełnych złotych osobno dla każdego małżonka
  // (tak jak w zeznaniu, gdzie każdy ma własną rubrykę), więc suma też jest
  // całkowita. Połowa bywa przez to „i pół" — zaokrągla się dopiero podatek.
  const podstawaOpodatkowania = suma((o) => o.dochod);
  const podatek = roundPln(2 * podatekWgSkali(podstawaOpodatkowania / 2, rok));

  // Danina solidarnościowa jest INDYWIDUALNA i wspólne rozliczenie jej nie
  // dotyka — to jest w tym miejscu jedyna rzecz warta zapamiętania, i zarazem
  // ta, którą najłatwiej zrobić źle na dwa przeciwne sposoby.
  //
  // Objaśnienia podatkowe MF z 28.08.2019: każdy z małżonków bierze pod uwagę
  // wyłącznie swoje dochody, niezależnie od tego, czy rozliczają się wspólnie;
  // dochodów małżonków ani się nie sumuje, ani nie dzieli na pół. Dlatego danina
  // jest policzona w `skladniki`, osobno dla każdej osoby, a tutaj tylko się
  // sumuje — dokładnie jak składki, KUP i limit PIT-0.
  //
  // Gdyby pójść na skróty i policzyć ją z `podstawaOpodatkowania` (sumy
  // gospodarstwa), para 2 × 600 000 zł zapłaciłaby daninę od 200 000 zł
  // nadwyżki, choć żadne z nich progu nie dotknęło. Gdyby z połowy sumy — jak
  // podatek — samotny milioner z niepracującym małżonkiem uciekłby od daniny
  // w całości. Obie wersje dają liczby nie do obrony; prawidłowa jest ta niżej.
  const danina = suma((o) => o.danina);

  const skladkiSpoleczne = round2(suma((o) => o.skladkiSpoleczne));
  const skladkaZdrowotna = round2(suma((o) => o.skladkaZdrowotna));
  // Wpłaty PPK są indywidualne — jak składki i jak limit PIT-0. Każdy małżonek
  // ma własną podstawę i własną stawkę, więc liczą się osobno w `skladniki`,
  // a tutaj tylko sumują do rozbicia gospodarstwa.
  const ppk = round2(suma((o) => o.ppk));
  const ppkPracodawcy = round2(suma((o) => o.ppkPracodawcy));
  const bruttoRocznie = suma((o) => o.bruttoRocznie);

  const nettoRocznie = round2(
    bruttoRocznie - skladkiSpoleczne - skladkaZdrowotna - podatek - danina - ppk,
  );

  return {
    rok,
    // Forma gospodarstwa jako całości nie istnieje — małżonkowie mogą mieć
    // różne. Na wierzchu jest Twoja, rozbicie na osoby siedzi w `osoby`.
    forma: osoby[0].forma,
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
    danina,
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

  // Szukamy wyłącznie poniżej daniny — patrz `ostatnieBruttoBezDaniny`. Liczy
  // się tu danina osoby, której wynagrodzenie przemiatamy; danina małżonka jest
  // przy stałych jego zarobkach stałym obciążeniem i monotoniczności nie psuje.
  const { malzonek: _, ...moje } = opcje;
  const gorna = ostatnieBruttoBezDaniny(moje);

  return {
    poczatek: pierwszeBrutto((brutto) => zysk(brutto) > 0, gorna),
    pelna: pierwszeBrutto((brutto) => zysk(brutto) >= MAKSYMALNA_KORZYSC_WSPOLNA, gorna),
  };
}

/**
 * To samo dla jednej osoby, przy dowolnym zestawie opcji.
 *
 * Progi przesuwają się z każdą rzeczą, która zmienia drogę od brutto do
 * dochodu: forma zatrudnienia (koszty 20% zamiast 250 zł/mies), ulga dla
 * młodych, zwolnienie studenckie, chorobowa. Stałe niżej pokrywają cztery
 * najczęstsze przypadki i są testowane co do złotówki; ta funkcja obsługuje
 * resztę kombinacji, żeby interfejs nie musiał ich zgadywać ani mnożyć stałych.
 */
export function progiIndywidualne(opcje: Opcje = {}): { poczatek: number; pelna: number } {
  const zysk = (brutto: number) => porownaj(brutto, opcje).zyskRocznie;
  const gorna = ostatnieBruttoBezDaniny(opcje);

  return {
    poczatek: pierwszeBrutto((brutto) => zysk(brutto) > 0, gorna),
    pelna: pierwszeBrutto((brutto) => zysk(brutto) >= MAKSYMALNA_KORZYSC_ROCZNA, gorna),
  };
}

/** Kres wyszukiwania progów — powyżej tej kwoty żaden z nich nie ma sensu. */
const GORNA_SZUKANIA = 200_000;

/** Najmniejsze pełne złote brutto spełniające warunek niemalejący; `gorna`, gdy żadne. */
function pierwszeBrutto(
  warunek: (brutto: number) => boolean,
  gorna = GORNA_SZUKANIA,
): number {
  if (warunek(0)) return 0;
  if (!warunek(gorna)) return gorna;

  let nie = 0;
  let tak = gorna;
  while (tak - nie > 1) {
    const srodek = Math.floor((nie + tak) / 2);
    if (warunek(srodek)) tak = srodek;
    else nie = srodek;
  }

  return tak;
}

/**
 * Ostatnie pełne złote brutto, przy którym danina solidarnościowa jeszcze nie
 * wchodzi — i tym samym kres obszaru, w którym zysk z reformy jest niemalejący.
 *
 * Bez tego ograniczenia wyszukiwanie progów przestaje działać, i to cicho.
 * `pierwszeBrutto` opiera się na monotoniczności warunku, a danina ją łamie:
 * zysk rośnie do 3 600 zł, trzyma się tej wartości, a od momentu przekroczenia
 * miliona zaczyna spadać — o 1% każdej złotówki nadwyżki — aż zejdzie poniżej
 * zera. Warunek „zysk ≥ 3 600" jest więc prawdziwy w **paśmie**, a nie od
 * pewnego miejsca w górę; wyszukiwanie połówkowe pytające o samą górną granicę
 * dostawało tam „nie" i zwracało tę granicę jako próg, czyli liczbę bez
 * żadnego związku z rzeczywistością.
 *
 * Granica zależy od opcji (na etacie ok. 88 400 zł/mies, przy zleceniu wyraźnie
 * wyżej, bo koszty 20% zbijają dochód, a z ulgą dla młodych jeszcze wyżej),
 * więc jest wyszukiwana, a nie wpisana. Sama danina jest względem brutto
 * niemalejąca, więc tu wyszukiwanie połówkowe jest uprawnione.
 */
function ostatnieBruttoBezDaniny(opcje: Opcje): number {
  return pierwszeBrutto((brutto) => oblicz(brutto, 2027, opcje).danina > 0) - 1;
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
 * To samo dla **umowy zlecenia** (chorobowa opłacana, bez ulg).
 *
 * Progi leżą wyżej niż etatowe, i to sporo — bo koszty 20% zjadają jedną piątą
 * przychodu po składkach, zamiast 3 000 zł rocznie. Dochód = 0,8 × 0,8629 ×
 * brutto_rok = 0,69032 × brutto_rok, więc granica 120 000 zł wypada przy
 * 173 833 zł rocznie ⇒ **14 487 zł/mies**, a 150 000 zł przy 217 291 zł ⇒
 * **18 108 zł/mies**.
 *
 * Sens dla interfejsu jest taki sam jak przy uldze dla młodych: zleceniobiorca
 * zyskuje na zmianie skali dopiero od zarobków wyraźnie wyższych niż etatowiec
 * z tą samą kwotą brutto — ale za to jego bieżące netto jest wyższe. Wartości
 * są sprawdzane co do złotówki na krawędzi (patrz engine.test.ts); pozostałe
 * kombinacje opcji liczy `progiIndywidualne`.
 */
export const BRUTTO_POCZATEK_KORZYSCI_ZLECENIE = 14_487;
export const BRUTTO_PELNA_KORZYSC_ZLECENIE = 18_108;

/**
 * Przy wspólnym rozliczeniu maksimum jest dwukrotne, bo obie granice skali
 * działają na połowę łącznego dochodu, czyli faktycznie podwójnie. Nie da się
 * przekroczyć: zysk pary to 2 × zysk osoby z połową ich łącznego dochodu.
 */
export const MAKSYMALNA_KORZYSC_WSPOLNA = 2 * MAKSYMALNA_KORZYSC_ROCZNA;
