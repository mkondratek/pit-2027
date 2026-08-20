/**
 * Stan w adresie URL. To jest mechanizm udostępniania, nie wygoda —
 * link z konkretną kwotą jest tym, co ludzie wklejają znajomym.
 */

const PARAM = 'brutto';
const PARAM_MALZONEK = 'malzonek';
const PARAM_ULGA = 'ulga';
const PARAM_ULGA_MALZONKA = 'ulga-malzonka';
const PARAM_PPK = 'ppk';
const PARAM_KOSZTY = 'koszty';

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
 */
export function odczytajPpk(): boolean {
  return flaga(PARAM_PPK);
}

export function odczytajPodwyzszoneKoszty(): boolean {
  return flaga(PARAM_KOSZTY);
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
  flagi: Flagi,
): boolean {
  if (domyslnaNaCzystymAdresie === null) return false;
  if (
    brutto === domyslnaNaCzystymAdresie &&
    bruttoMalzonka === null &&
    !Object.values(flagi).some(Boolean)
  ) {
    return true;
  }

  domyslnaNaCzystymAdresie = null;
  return false;
}

/**
 * Wszystko, co w adresie jest zwykłym „włączone / wyłączone".
 *
 * Obiekt, a nie kolejne argumenty pozycyjne: przy czterech flagach z rzędu
 * `zapiszStan(15_000, null, false, false, true)` nie mówi już, co się właśnie
 * włączyło, a dołożenie piątej opcji znaczyłoby przeglądanie wszystkich
 * wywołań. Pola są opcjonalne, więc wyłączonej flagi nie trzeba podawać —
 * i tak zapisujemy wyłącznie włączone.
 */
export interface Flagi {
  ulga?: boolean;
  ulgaMalzonka?: boolean;
  ppk?: boolean;
  podwyzszoneKoszty?: boolean;
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
  flagi: Flagi = {},
): void {
  if (typeof window === 'undefined') return;
  if (zapisInicjalizujacy(brutto, bruttoMalzonka, flagi)) return;

  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, String(brutto));

  if (bruttoMalzonka === null) url.searchParams.delete(PARAM_MALZONEK);
  else url.searchParams.set(PARAM_MALZONEK, String(bruttoMalzonka));

  const ustaw = (nazwa: string, wlaczone: boolean | undefined) => {
    if (wlaczone) url.searchParams.set(nazwa, '1');
    else url.searchParams.delete(nazwa);
  };

  ustaw(PARAM_ULGA, flagi.ulga);
  // Bez małżonka nie ma czyjej ulgi zapisywać — parametr znikłby i tak przy
  // odczycie, a w adresie wyglądałby na stan, którego interfejs nie pokazuje.
  ustaw(PARAM_ULGA_MALZONKA, flagi.ulgaMalzonka && bruttoMalzonka !== null);
  ustaw(PARAM_PPK, flagi.ppk);
  ustaw(PARAM_KOSZTY, flagi.podwyzszoneKoszty);

  window.history.replaceState(null, '', url);
}
