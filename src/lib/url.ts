/**
 * Stan w adresie URL. To jest mechanizm udostępniania, nie wygoda —
 * link z konkretną kwotą jest tym, co ludzie wklejają znajomym.
 */

const PARAM = 'brutto';
const PARAM_MALZONEK = 'malzonek';

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
    if (!parametry.has(PARAM_MALZONEK)) domyslnaNaCzystymAdresie = Math.round(fallback);
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
function zapisInicjalizujacy(brutto: number, bruttoMalzonka: number | null): boolean {
  if (domyslnaNaCzystymAdresie === null) return false;
  if (brutto === domyslnaNaCzystymAdresie && bruttoMalzonka === null) return true;

  domyslnaNaCzystymAdresie = null;
  return false;
}

/** Zapisuje cały stan naraz — przy rozliczeniu indywidualnym adres zostaje krótki. */
export function zapiszStan(brutto: number, bruttoMalzonka: number | null): void {
  if (typeof window === 'undefined') return;
  if (zapisInicjalizujacy(brutto, bruttoMalzonka)) return;

  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, String(brutto));

  if (bruttoMalzonka === null) url.searchParams.delete(PARAM_MALZONEK);
  else url.searchParams.set(PARAM_MALZONEK, String(bruttoMalzonka));

  window.history.replaceState(null, '', url);
}
