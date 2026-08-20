/**
 * Stan w adresie URL. To jest mechanizm udostępniania, nie wygoda —
 * link z konkretną kwotą jest tym, co ludzie wklejają znajomym.
 */

import type { FormaZatrudnienia } from '../tax/constants';

const PARAM = 'brutto';
const PARAM_MALZONEK = 'malzonek';
const PARAM_ULGA = 'ulga';
const PARAM_ULGA_MALZONKA = 'ulga-malzonka';
const PARAM_PPK = 'ppk';
const PARAM_KOSZTY = 'koszty';
const PARAM_FORMA = 'forma';
const PARAM_BEZ_CHOROBOWEJ = 'bez-chorobowej';
const PARAM_STUDENT = 'student';

/**
 * Wszystko poza samą kwotą. Jedna lista, bo „czy adres jest czysty" to pytanie
 * o dowolny nasz parametr, a nie o `malzonek` z osobna — inaczej link niosący
 * wyłącznie ulgę wyglądałby na wejście prosto ze strony głównej i pierwszy zapis
 * by go wyczyścił. Każdy nowy parametr dopisuje się tu razem ze swoją stałą.
 */
const PARAMETRY_STANU = [
  PARAM_MALZONEK,
  PARAM_ULGA,
  PARAM_ULGA_MALZONKA,
  PARAM_PPK,
  PARAM_KOSZTY,
  PARAM_FORMA,
  PARAM_BEZ_CHOROBOWEJ,
  PARAM_STUDENT,
];

/**
 * Kwota, którą `odczytajBrutto` oddało jako domyślną, bo wejście było na czysty
 * adres. `null` znaczy „nie ma czego tłumić": albo link już niósł stan, albo
 * użytkownik zdążył kwotę zmienić.
 */
let domyslnaNaCzystymAdresie: number | null = null;

export function odczytajBrutto(fallback: number): number {
  if (typeof window === 'undefined') return fallback;

  const parametry = new URLSearchParams(window.location.search);
  const surowe = parametry.get(PARAM);

  if (surowe === null) {
    // Czysty adres (bez żadnego naszego parametru) zapamiętujemy razem z
    // wartością domyślną — tylko tak da się później odróżnić zapis
    // inicjalizujący od zapisu po realnej zmianie kwoty.
    if (!PARAMETRY_STANU.some((nazwa) => parametry.has(nazwa))) {
      domyslnaNaCzystymAdresie = Math.round(fallback);
    }
    return fallback;
  }

  const liczba = Number(surowe);
  return Number.isFinite(liczba) && liczba > 0 ? Math.round(liczba) : fallback;
}

/**
 * Wynagrodzenie małżonka albo `null`, gdy w adresie go nie ma.
 *
 * Sama obecność parametru włącza wspólne rozliczenie — osobnej flagi nie
 * dokładamy, bo dwa źródła prawdy potrafią sobie zaprzeczyć (`?wspolnie=1`
 * bez kwoty albo kwota przy wyłączonej fladze), a jedno pytanie „czy w adresie
 * jest małżonek" odpowiada na oba. `?malzonek=0` jest poprawne i wcale nie
 * puste: to udostępniony wynik pary, w której zarabia jedna osoba.
 */
export function odczytajMalzonka(): number | null {
  if (typeof window === 'undefined') return null;

  const surowe = new URLSearchParams(window.location.search).get(PARAM_MALZONEK);
  if (surowe === null) return null;

  const liczba = Number(surowe);
  return Number.isFinite(liczba) && liczba >= 0 ? Math.round(liczba) : null;
}

/** Flaga włącz/wyłącz w adresie. Liczy się wyłącznie `=1`; brak i cokolwiek innego to „nie". */
function flaga(nazwa: string): boolean {
  if (typeof window === 'undefined') return false;

  return new URLSearchParams(window.location.search).get(nazwa) === '1';
}

/**
 * Ulga dla młodych — Twoja i małżonka, osobno, bo to cecha konkretnej osoby
 * (wiek), a nie ustawienie gospodarstwa: silnik też ich nie dziedziczy.
 *
 * Zapisujemy je tylko włączone (`?ulga=1`), nigdy `=0`: adres ma nieść odstępstwo
 * od stanu domyślnego, a nie pełen zrzut ustawień. Ulga małżonka bez małżonka
 * jest sprzecznością, więc czyta się ją wyłącznie razem z `?malzonek=` — ta sama
 * zasada „jedno źródło prawdy", którą opisuje `odczytajMalzonka`.
 */
export function odczytajUlge(): boolean {
  return flaga(PARAM_ULGA);
}

export function odczytajUlgeMalzonka(): boolean {
  return odczytajMalzonka() !== null && flaga(PARAM_ULGA_MALZONKA);
}

/**
 * PPK i podwyższone koszty uzyskania przychodu — po jednej fladze, bo interfejs
 * oferuje same wpłaty podstawowe (2% + 1,5%), a nie dowolne stawki. Gdyby
 * kiedyś dochodziły stawki niestandardowe, parametr zamieniłby się w liczbę
 * dokładnie tak, jak `malzonek` jest liczbą, a nie flagą „mam małżonka".
 *
 * Osobnych parametrów dla małżonka nie ma świadomie: obie opcje dziedziczą się
 * na niego z Twoich ustawień (patrz `OpcjeWspolne` w silniku), więc nie ma
 * drugiego stanu, który dałoby się zapisać.
 *
 * Koszty czyta się wyłącznie przy umowie o pracę: przy zleceniu są procentowe
 * i wariantu „poza miejscowością" nie mają, więc silnik tę opcję ignoruje,
 * a interfejs jej nie pokazuje.
 */
export function odczytajPpk(): boolean {
  return flaga(PARAM_PPK);
}

export function odczytajPodwyzszoneKoszty(): boolean {
  return odczytajForme() === 'umowaOPrace' && flaga(PARAM_KOSZTY);
}

/**
 * Forma zatrudnienia — jedyny parametr niosący wartość, a nie „włączone".
 *
 * Etat jest stanem domyślnym, więc w adresie pojawia się wyłącznie
 * `?forma=zlecenie`; wszystko inne (brak parametru, literówka, przyszła
 * wartość, której ta wersja strony nie zna) czyta się jako etat, bo lepiej
 * pokazać wariant podstawowy niż wywrócić wyliczenie. Wartość, a nie flaga
 * `?zlecenie=1`, z tego samego powodu, dla którego `malzonek` jest kwotą:
 * form zatrudnienia jest z natury więcej niż dwie i dopisanie trzeciej ma
 * zmienić dozwolone wartości, a nie dołożyć drugą flagę, która może być
 * zapalona razem z pierwszą.
 */
export function odczytajForme(): FormaZatrudnienia {
  if (typeof window === 'undefined') return 'umowaOPrace';

  return new URLSearchParams(window.location.search).get(PARAM_FORMA) === 'zlecenie'
    ? 'zlecenie'
    : 'umowaOPrace';
}

/**
 * Rezygnacja z dobrowolnej chorobowej i zwolnienie studenckie — obie rzeczy
 * istnieją wyłącznie przy zleceniu, więc czyta się je tylko razem z nim.
 * Ta sama zasada, co przy uldze małżonka: ustawienie bez swojego trybu jest
 * stanem, którego interfejs nie umie pokazać, więc nie wolno go wczytać.
 *
 * Chorobowa jest zapisana „od tyłu" (`bez-chorobowej=1` zamiast
 * `chorobowa=0`), bo adres niesie odstępstwa od stanu domyślnego, a domyślnie
 * chorobową się płaci — patrz `zapiszStan`.
 */
export function odczytajBezChorobowej(): boolean {
  return odczytajForme() === 'zlecenie' && flaga(PARAM_BEZ_CHOROBOWEJ);
}

export function odczytajStudenta(): boolean {
  return odczytajForme() === 'zlecenie' && flaga(PARAM_STUDENT);
}

/**
 * Czy to jeszcze zapis inicjalizujący, czyli taki, po którym w adresie nie ma
 * się nic pojawić.
 *
 * Czysty adres ma czysty zostać, dopóki ktoś faktycznie nie zmieni stanu —
 * inaczej każde wejście na stronę rozsypuje statystyki na osobne URL-e, a link
 * skopiowany od razu po wejściu udostępnia wartość domyślną jako czyjąś pensję.
 * Pierwszy zapis z inną zawartością znaczy, że interakcja się odbyła: od tego
 * momentu zapisujemy już wszystko, łącznie z powrotem dokładnie do wartości
 * domyślnej.
 */
function zapisInicjalizujacy(
  brutto: number,
  bruttoMalzonka: number | null,
  ustawienia: Ustawienia,
): boolean {
  if (domyslnaNaCzystymAdresie === null) return false;
  if (
    brutto === domyslnaNaCzystymAdresie &&
    bruttoMalzonka === null &&
    !cokolwiekNiedomyslne(ustawienia)
  ) {
    return true;
  }

  domyslnaNaCzystymAdresie = null;
  return false;
}

/**
 * Czy w ustawieniach jest cokolwiek, co adres miałby nieść.
 *
 * Flagi wystarczy sprawdzić na prawdziwość, ale `forma` niesie wartość, a nie
 * „włączone": `'umowaOPrace'` jest w JS prawdziwe, a znaczy stan domyślny.
 * Bez tego rozróżnienia samo wczytanie strony (gdzie forma jest podawana
 * zawsze) wyglądałoby na interakcję i brudziło czysty adres.
 */
function cokolwiekNiedomyslne({ forma, ...flagi }: Ustawienia): boolean {
  return forma === 'zlecenie' || Object.values(flagi).some(Boolean);
}

/**
 * Wszystko, co idzie do adresu poza dwiema kwotami.
 *
 * Obiekt, a nie kolejne argumenty pozycyjne: przy czterech flagach z rzędu
 * `zapiszStan(15_000, null, false, false, true)` nie mówi już, co się właśnie
 * włączyło, a dołożenie piątej opcji znaczyłoby przeglądanie wszystkich
 * wywołań. Pola są opcjonalne, więc wyłączonej flagi nie trzeba podawać —
 * i tak zapisujemy wyłącznie włączone.
 *
 * Prawie wszystko jest tu zwykłym „włączone / wyłączone"; wyjątkiem jest
 * `forma`, która niesie wartość — patrz `odczytajForme` i `cokolwiekNiedomyslne`.
 */
export interface Ustawienia {
  forma?: FormaZatrudnienia;
  ulga?: boolean;
  ulgaMalzonka?: boolean;
  ppk?: boolean;
  podwyzszoneKoszty?: boolean;
  bezChorobowej?: boolean;
  student?: boolean;
}

/**
 * Zapisuje cały stan naraz — przy rozliczeniu indywidualnym bez żadnej opcji
 * adres zostaje tak krótki jak dotąd.
 *
 * Flagi są domyślnie wyłączone, więc wywołanie dwuargumentowe znaczy „sama
 * kwota", a `=0` w adresie nie pojawia się nigdy: parametr albo niesie
 * odstępstwo od stanu domyślnego, albo znika.
 */
export function zapiszStan(
  brutto: number,
  bruttoMalzonka: number | null,
  ustawienia: Ustawienia = {},
): void {
  if (typeof window === 'undefined') return;
  if (zapisInicjalizujacy(brutto, bruttoMalzonka, ustawienia)) return;

  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, String(brutto));

  if (bruttoMalzonka === null) url.searchParams.delete(PARAM_MALZONEK);
  else url.searchParams.set(PARAM_MALZONEK, String(bruttoMalzonka));

  const ustaw = (nazwa: string, wlaczone: boolean | undefined) => {
    if (wlaczone) url.searchParams.set(nazwa, '1');
    else url.searchParams.delete(nazwa);
  };

  // Etat jest stanem domyślnym, więc do adresu trafia wyłącznie zlecenie.
  const zlecenie = ustawienia.forma === 'zlecenie';
  if (zlecenie) url.searchParams.set(PARAM_FORMA, 'zlecenie');
  else url.searchParams.delete(PARAM_FORMA);

  ustaw(PARAM_ULGA, ustawienia.ulga);
  // Bez małżonka nie ma czyjej ulgi zapisywać — parametr znikłby i tak przy
  // odczycie, a w adresie wyglądałby na stan, którego interfejs nie pokazuje.
  ustaw(PARAM_ULGA_MALZONKA, ustawienia.ulgaMalzonka && bruttoMalzonka !== null);
  ustaw(PARAM_PPK, ustawienia.ppk);
  // Ta sama zasada, co przy uldze małżonka, tyle że po obu stronach formy:
  // podwyższone koszty są pracownicze, a chorobowa i status studenta istnieją
  // wyłącznie na zleceniu. Ustawienie spoza bieżącej formy nie ma czego
  // zapisywać — interfejs go wtedy nie pokazuje, a silnik je ignoruje.
  ustaw(PARAM_KOSZTY, ustawienia.podwyzszoneKoszty && !zlecenie);
  ustaw(PARAM_BEZ_CHOROBOWEJ, ustawienia.bezChorobowej && zlecenie);
  ustaw(PARAM_STUDENT, ustawienia.student && zlecenie);

  window.history.replaceState(null, '', url);
}
