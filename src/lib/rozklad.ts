/**
 * Rozkład wynagrodzeń — dane porównawcze, nie model podatkowy.
 *
 * Osobny moduł od `src/tax/`, i to świadomie: silnik liczy, ile ktoś zapłaci,
 * a to tutaj odpowiada na zupełnie inne pytanie — „gdzie na tle innych stoi
 * kwota, którą wpisałem". Gdyby te decyle wylądowały w `constants.ts`, zaczęłyby
 * wyglądać na parametr podatku, którym nie są: zmiana skali ich nie rusza, a
 * każdy kolejny odczyt GUS-u rusza je bez żadnej zmiany w prawie.
 *
 * ŹRÓDŁO
 * GUS, „Rozkład wynagrodzeń w gospodarce narodowej w lutym 2026 r.",
 * informacja sygnalna opublikowana 5 sierpnia 2026 r., tablica 15
 * („Decyle wynagrodzeń miesięcznych brutto w gospodarce narodowej według płci"),
 * kolumna „Ogółem".
 * https://stat.gov.pl/obszary-tematyczne/rynek-pracy/pracujacy-zatrudnieni-wynagrodzenia-koszty-pracy/rozklad-wynagrodzen-w-gospodarce-narodowej-w-lutym-2026-r-,32,26.html
 *
 * POPULACJA — najważniejsze zastrzeżenie
 * Dane pochodzą z rejestrów ZUS i obejmują **wynagrodzenia ze stosunku pracy
 * lub stosunku służbowego**, wypłacone w jednym miesiącu (luty 2026). To nie
 * jest ani „wszyscy pracujący", ani „wszyscy podatnicy":
 *   - są w tym etaty pełne i niepełne (stąd pierwszy decyl równo na płacy
 *     minimalnej, a nie poniżej),
 *   - **nie ma** samodzielnych umów zlecenia, umów o dzieło ani B2B — zlecenie
 *     wchodzi do rachunku wyłącznie wtedy, gdy zawarto je z tym samym
 *     pracodawcą, u którego dana osoba jest już zatrudniona na etacie,
 *   - nie ma emerytów, osób pracujących część roku ani nikogo, kto w lutym
 *     2026 r. nie dostał wypłaty.
 * Dlatego etykieta w interfejsie mówi „zatrudnionych na umowę o pracę", a nie
 * „Polaków" ani „podatników" — te dwa słowa znaczyłyby coś innego i nieprawdę.
 *
 * Pełny opis metody, wraz z tym, czego z tych danych wyczytać NIE można,
 * jest w `model.md`, część G.
 */

/**
 * Decyle miesięcznego wynagrodzenia brutto, luty 2026, ogółem, w złotych.
 *
 * Indeks `i` to decyl `i + 1`, czyli percentyl `10 * (i + 1)`: `DECYLE[4]`
 * to mediana. Wartości przepisane z tablicy 15 co do grosza — zaokrąglanie
 * zostawiamy prezentacji, żeby dało się je porównać ze źródłem bez zgadywania,
 * co po drodze zaokrągliliśmy.
 *
 * Pierwszy decyl wypada **dokładnie** na płacy minimalnej 2026 (4806 zł) i nie
 * jest to zbieg okoliczności: na płacy minimalnej siedzi tak duża grupa, że
 * rozkład ma w tym miejscu pionową ścianę. Konsekwencja dla odczytu jest
 * opisana przy `pozycjaWRozkladzie`.
 */
export const DECYLE = [
  4806, 5278.84, 6010.65, 6802.04, 7690.82, 8820, 10257.14, 12598.55, 17111,
] as const;

/** Mediana (decyl 5) — wyciągnięta osobno, bo mówi o niej tekst na stronie. */
export const MEDIANA = DECYLE[4];

/** Miesiąc pomiaru, do podpisu pod liczbą. */
export const ROZKLAD_MIESIAC = 'luty 2026';

/** Percentyl pierwszego i ostatniego znanego punktu — granice, poza które nie wychodzimy. */
export const PERCENTYL_MIN = 10;
export const PERCENTYL_MAX = 90;

/**
 * Gdzie wpisana kwota stoi w rozkładzie.
 *
 * `poza` mówi, że kwota wypadła za siatką decyli i podany percentyl jest
 * **granicą**, a nie odczytem — interfejs musi wtedy zmienić zdanie, a nie
 * tylko liczbę.
 */
export interface Pozycja {
  /** Odsetek zatrudnionych zarabiających mniej, zaokrąglony do 5 punktów. */
  percentyl: number;
  /** `null`, gdy kwota mieści się między pierwszym a dziewiątym decylem. */
  poza: 'ponizej' | 'powyzej' | null;
}

/**
 * Percentyl zaokrąglany do 5 punktów, i to nie z lenistwa.
 *
 * Między dwoma sąsiednimi decylami nie wiemy nic poza tym, że rozkład tam
 * rośnie — interpolacja daje liczbę z jednym miejscem po przecinku, ale ta
 * dokładność jest zmyślona. Pięć punktów to najgrubsze ziarno, które nadal
 * niesie treść („75%" mówi co innego niż „80%"), a jednocześnie nie udaje, że
 * odróżniamy 76. percentyl od 77.
 */
const doPieciu = (percentyl: number) => Math.round(percentyl / 5) * 5;

/**
 * Percentyl kwoty brutto w rozkładzie wynagrodzeń.
 *
 * Metoda: interpolacja **liniowa** między dwoma sąsiednimi decylami.
 *
 * Wariant log-liniowy — teoretycznie właściwszy dla rozkładu prawoskośnego —
 * został policzony na wszystkich przedziałach i różni się najwyżej o **0,38
 * punktu** (najgorzej przy 14 740 zł). To mniej niż ziarno, które i tak
 * deklarujemy, ale różnica nie znika bez śladu: dla ok. **4%** kwot z zakresu
 * obie metody wypadają po dwóch stronach granicy zaokrąglenia i dają wynik
 * różniący się o jeden krok, czyli 5 punktów. Obie mieszczą się we własnej
 * niepewności, więc wybór jest wyborem, a nie rachunkiem — pada na liniową,
 * bo czytelnik sprawdzi ją w pamięci, mając przed sobą tablicę 15, a możliwość
 * sprawdzenia jest na tej stronie wartością samą w sobie. Obie metody są
 * dokładne w punktach źródłowych, więc żaden decyl na tym nie traci.
 *
 * Poza siatką decyli **nie zgadujemy**. Powyżej dziewiątego decyla rozkład ma
 * długi, nieznany nam ogon — dociąganie go do 100. percentyla przy 100 000 zł
 * byłoby czystą fikcją. Poniżej pierwszego jest tak samo, tyle że krócej.
 * W obu przypadkach zwracamy granicę i flagę `poza`.
 *
 * Dokładnie na płacy minimalnej (4806 zł = pierwszy decyl) wychodzi 10%.
 * Wypada to czytać jako **górną granicę**: skoro na tej jednej kwocie stoi
 * kilkuprocentowa grupa, to „więcej niż ok. 10%" jest najżyczliwszym prawdziwym
 * zdaniem, jakie da się powiedzieć — mniej zarabia część tej grupy, ale na
 * pewno nie więcej niż 10% wszystkich.
 */
export function pozycjaWRozkladzie(brutto: number): Pozycja {
  const pierwszy = DECYLE[0];
  const ostatni = DECYLE[DECYLE.length - 1];

  if (brutto < pierwszy) return { percentyl: PERCENTYL_MIN, poza: 'ponizej' };
  if (brutto > ostatni) return { percentyl: PERCENTYL_MAX, poza: 'powyzej' };

  // Ostatni decyl nie mniejszy od kwoty wyznacza górny koniec przedziału;
  // pętla od 1, bo `brutto >= DECYLE[0]` jest już sprawdzone wyżej.
  for (let i = 1; i < DECYLE.length; i++) {
    const dol = DECYLE[i - 1];
    const gora = DECYLE[i];
    if (brutto > gora) continue;

    const percentylDolu = i * 10;
    const udzial = (brutto - dol) / (gora - dol);
    return { percentyl: doPieciu(percentylDolu + udzial * 10), poza: null };
  }

  // Nieosiągalne: `brutto <= ostatni` domyka pętlę najpóźniej na ostatnim
  // przedziale. Zostaje dla wyczerpania typu, bez rzucania wyjątku.
  return { percentyl: PERCENTYL_MAX, poza: null };
}

/**
 * Zdanie, które staje przy kwocie.
 *
 * Tekst mieszka tu, a nie w komponencie, bo jego brzmienie jest częścią
 * uczciwości tych danych, nie dekoracją: kształt zdania niesie informację
 * o tym, **jak pewna** jest liczba, i musi się zmieniać razem z `poza`.
 * Dlatego też jest objęty testami.
 *
 * W środku rozkładu zdanie jest oszacowaniem punktowym i tak brzmi:
 * „więcej niż ok. 75%". Na obu ogonach żadnego punktu nie mamy — mamy przedział
 * — więc zdanie zmienia formę na „jesteś w 10% najlepiej/najmniej zarabiających".
 * To nie jest stylistyka: gdyby ogon dostał to samo „więcej niż ok. 90%", ktoś
 * z pensją 60 000 zł przeczytałby oszacowanie tam, gdzie jest tylko dolna
 * granica. Zmiana formy zdania mówi to bez ani jednego słowa o metodzie.
 *
 * Grupa odniesienia („zatrudnionych") pada wprost w wariancie środkowym, czyli
 * tym, który widzi większość czytelników. Na ogonach nie mieści się bez zgrzytu
 * gramatycznego i niosą ją wyjaśnienie pod znakiem zapytania oraz `model.md`.
 */
export function zdaniePozycji(pozycja: Pozycja): string {
  if (pozycja.poza === 'ponizej') return 'Jesteś w 10% najmniej zarabiających';
  if (pozycja.poza === 'powyzej') return 'Jesteś w 10% najlepiej zarabiających';

  return `Zarabiasz więcej niż ok. ${pozycja.percentyl}% zatrudnionych`;
}
