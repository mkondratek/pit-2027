/**
 * Stan w adresie URL. To jest mechanizm udostępniania, nie wygoda —
 * link z konkretną kwotą jest tym, co ludzie wklejają znajomym.
 */

const PARAM = 'brutto';
const PARAM_MALZONEK = 'malzonek';
const PARAM_ULGA = 'ulga';
const PARAM_ULGA_MALZONKA = 'ulga-malzonka';

/**
 * Wszystko poza samą kwotą. Jedna lista, bo „czy adres jest czysty" to pytanie
 * o dowolny nasz parametr, a nie o `malzonek` z osobna — inaczej link niosący
 * wyłącznie ulgę wyglądałby na wejście prosto ze strony głównej i pierwszy zapis
 * by go wyczyścił.
 */
const PARAMETRY_STANU = [PARAM_MALZONEK, PARAM_ULGA, PARAM_ULGA_MALZONKA];

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
  ulga: boolean,
  ulgaMalzonka: boolean,
): boolean {
  if (domyslnaNaCzystymAdresie === null) return false;
  if (brutto === domyslnaNaCzystymAdresie && bruttoMalzonka === null && !ulga && !ulgaMalzonka) {
    return true;
  }

  domyslnaNaCzystymAdresie = null;
  return false;
}

/**
 * Zapisuje cały stan naraz — przy rozliczeniu indywidualnym bez ulgi adres
 * zostaje tak krótki jak dotąd.
 *
 * Flagi są domyślnie wyłączone, więc dotychczasowe wywołania dwuargumentowe
 * znaczą dokładnie to co wcześniej.
 */
export function zapiszStan(
  brutto: number,
  bruttoMalzonka: number | null,
  ulga = false,
  ulgaMalzonka = false,
): void {
  if (typeof window === 'undefined') return;
  if (zapisInicjalizujacy(brutto, bruttoMalzonka, ulga, ulgaMalzonka)) return;

  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, String(brutto));

  if (bruttoMalzonka === null) url.searchParams.delete(PARAM_MALZONEK);
  else url.searchParams.set(PARAM_MALZONEK, String(bruttoMalzonka));

  if (ulga) url.searchParams.set(PARAM_ULGA, '1');
  else url.searchParams.delete(PARAM_ULGA);

  // Bez małżonka nie ma czyjej ulgi zapisywać — parametr znikłby i tak przy
  // odczycie, a w adresie wyglądałby na stan, którego interfejs nie pokazuje.
  if (ulgaMalzonka && bruttoMalzonka !== null) url.searchParams.set(PARAM_ULGA_MALZONKA, '1');
  else url.searchParams.delete(PARAM_ULGA_MALZONKA);

  window.history.replaceState(null, '', url);
}
