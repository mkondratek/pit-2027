<script lang="ts">
  import { PLACA_MINIMALNA } from '../tax/constants';
  import {
    BRUTTO_PELNA_KORZYSC,
    BRUTTO_POCZATEK_KORZYSCI,
    MAKSYMALNA_KORZYSC_ROCZNA,
    MAKSYMALNA_KORZYSC_WSPOLNA,
    porownaj,
    porownajWspolnie,
    progiWspolne,
  } from '../tax/engine';
  import WykresZysku from './WykresZysku.svelte';
  import { kwota, kwotaDokladna, zeZnakiem } from './format';
  import { odczytajBrutto, odczytajMalzonka, zapiszStan } from './url';

  // Suwak obejmuje zakres, w którym cokolwiek się dzieje. Wpisać z ręki można
  // znacznie więcej, bo powyżej suwaka zysk wprawdzie stoi w miejscu, ale netto
  // rośnie dalej — przycięcie kwoty pokazywałoby komuś cudzą wypłatę jako jego.
  const MIN_SUWAK = 3_000;
  const MAX_SUWAK = 30_000;
  const MIN_POLE = 1_000;
  const MAX_POLE = 100_000;

  const startowe = wZakresiePola(odczytajBrutto(12_000));
  const startowyMalzonek = odczytajMalzonka();

  /** Kwota, na której liczy silnik — zawsze skończona liczba, nigdy pusta. */
  let brutto = $state(startowe);

  /**
   * Treść pola trzymana osobno od kwoty: w trakcie pisania wolno jej być pustej
   * albo spoza zakresu, bo „1", „12", „123" to etapy wpisywania 13 000, a nie
   * błędy do naprawienia.
   */
  let pole = $state(String(startowe));

  /**
   * Wspólne rozliczenie z małżonkiem. Domyślnie wyłączone: rozliczenie
   * indywidualne zostaje scenariuszem podstawowym, a wspólne pojawia się dopiero
   * na świadome kliknięcie — razem z drugim polem.
   */
  let wspolne = $state(startowyMalzonek !== null);

  /**
   * Zero jest tu poprawną i najczęstszą odpowiedzią, nie brakiem odpowiedzi:
   * para z jednym żywicielem to główny powód, dla którego wspólne rozliczenie
   * w ogóle istnieje. Dlatego jest wartością startową i dolną granicą pola.
   */
  let bruttoMalzonka = $state(startowyMalzonek ?? 0);
  let poleMalzonka = $state(String(startowyMalzonek ?? 0));

  let rozwiniete = $state(false);

  const wynik = $derived(
    wspolne ? porownajWspolnie(brutto, bruttoMalzonka) : porownaj(brutto),
  );
  const zyskuje = $derived(wynik.zyskRocznie > 0);

  const maksymalnyZysk = $derived(
    wspolne ? MAKSYMALNA_KORZYSC_WSPOLNA : MAKSYMALNA_KORZYSC_ROCZNA,
  );

  /**
   * Progi korzyści. Przy rozliczeniu indywidualnym to dwie stałe; przy wspólnym
   * przesuwają się wraz z zarobkami małżonka, bo liczy się połowa łącznego
   * dochodu — przy małżonku bez dochodu obie granice skali działają podwójnie
   * i próg wypada mniej więcej dwa razy wyżej.
   */
  const progi = $derived(
    wspolne
      ? progiWspolne(bruttoMalzonka)
      : { poczatek: BRUTTO_POCZATEK_KORZYSCI, pelna: BRUTTO_PELNA_KORZYSC },
  );

  /**
   * Górny kraniec osi wykresu. Dobierany tak, żeby próg pełnej korzyści wypadał
   * mniej więcej w dwóch trzecich szerokości — tak jak przy rozliczeniu
   * indywidualnym, gdzie 14 776 zł leży w tym miejscu osi kończącej się na
   * 20 000 zł. Widełki pilnują, żeby oś nie zrobiła się absurdalnie ciasna, gdy
   * małżonek zarabia tyle, że para ma pełną korzyść niemal od razu.
   */
  const gornaOsi = $derived(
    wspolne
      ? Math.min(40_000, Math.max(12_000, Math.ceil((MIN_SUWAK + (progi.pelna - MIN_SUWAK) / 0.69) / 1_000) * 1_000))
      : 20_000,
  );

  /**
   * Suwak sięga co najmniej tam, gdzie oś wykresu, bo wykres jest jego drugim
   * sterownikiem — inaczej przeciągnięcie w prawy koniec zatrzymywałoby znacznik
   * w połowie gestu.
   */
  const maxSuwak = $derived(wspolne ? Math.max(MAX_SUWAK, gornaOsi) : MAX_SUWAK);

  const doProgu = $derived(Math.max(0, progi.poczatek - brutto));
  const ponizejMinimalnej = $derived(brutto < PLACA_MINIMALNA);

  // Jednorazowo po wczytaniu, żeby adres dało się skopiować, zanim ktoś dotknie
  // pola. Później zapisują już tylko zakończona edycja i puszczony suwak —
  // zapis na każdym znaku wpisywał do adresu wartości pośrednie.
  $effect(() => {
    zapiszStan(startowe, startowyMalzonek);
  });

  /** Adres ma nieść cały scenariusz, także ten wspólny — patrz `url.ts`. */
  function zapisz() {
    zapiszStan(brutto, wspolne ? bruttoMalzonka : null);
  }

  function wZakresiePola(wartosc: number): number {
    return Math.min(MAX_POLE, Math.max(MIN_POLE, Math.round(wartosc)));
  }

  function wZakresieSuwaka(wartosc: number): number {
    return Math.min(maxSuwak, Math.max(MIN_SUWAK, Math.round(wartosc)));
  }

  /** Pisanie w polu: wynik idzie za tym, co widać, ale bez domykania do zakresu. */
  function pisz(surowe: string) {
    pole = surowe;

    const liczba = Number(surowe);
    // Pusto albo śmieć — zostaje ostatnia sensowna kwota, żeby wynik się nie wywrócił.
    if (surowe.trim() === '' || !Number.isFinite(liczba) || liczba < 0) return;

    brutto = Math.round(liczba);
  }

  /** Koniec edycji (blur albo Enter) — dopiero tu domykamy do zakresu suwaka. */
  function zakoncz() {
    brutto = wZakresiePola(brutto);
    pole = String(brutto);
    zapisz();
  }

  /** To samo dla pola małżonka, tyle że tu wolno wpisać zero. */
  function piszMalzonka(surowe: string) {
    poleMalzonka = surowe;

    const liczba = Number(surowe);
    if (surowe.trim() === '' || !Number.isFinite(liczba) || liczba < 0) return;

    bruttoMalzonka = Math.round(liczba);
  }

  function zakonczMalzonka() {
    bruttoMalzonka = Math.min(MAX_POLE, Math.max(0, bruttoMalzonka));
    poleMalzonka = String(bruttoMalzonka);
    zapisz();
  }

  function przelacz(wlaczone: boolean) {
    wspolne = wlaczone;
    zapisz();
  }

  /** Suwak nie ma stanów pośrednich, więc klamruje od razu. */
  function przesun(wartosc: number) {
    brutto = wZakresieSuwaka(wartosc);
    pole = String(brutto);
  }
</script>

<section class="wejscie">
  <label for="brutto">Twoje wynagrodzenie brutto</label>

  <div class="pole">
    <input
      id="brutto"
      type="number"
      inputmode="numeric"
      min={MIN_POLE}
      max={MAX_POLE}
      step="100"
      value={pole}
      oninput={(e) => pisz(e.currentTarget.value)}
      onblur={zakoncz}
      onkeydown={(e) => {
        if (e.key === 'Enter') zakoncz();
      }}
    />
    <span class="jednostka">zł / mies.</span>
  </div>

  <input
    class="suwak"
    type="range"
    min={MIN_SUWAK}
    max={maxSuwak}
    step="100"
    aria-label="Wynagrodzenie brutto miesięcznie"
    aria-valuetext="{kwota(brutto)} miesięcznie"
    value={Math.min(brutto, maxSuwak)}
    oninput={(e) => przesun(e.currentTarget.valueAsNumber)}
    onchange={zapisz}
  />

  <!-- Przełącznik i drugie pole są pod suwakiem, bo pytanie o małżonka ma sens
       dopiero po podaniu własnej pensji. Pole pojawia się na kliknięcie, nie
       w trakcie przeciągania, więc zmiana wysokości strony jest tu odpowiedzią
       na decyzję użytkownika, a nie drganiem układu. -->
  <label class="przelacznik">
    <input
      type="checkbox"
      checked={wspolne}
      onchange={(e) => przelacz(e.currentTarget.checked)}
    />
    Rozliczam się wspólnie z małżonkiem
  </label>

  {#if wspolne}
    <div class="malzonek">
      <label for="brutto-malzonka">Wynagrodzenie brutto małżonka</label>

      <div class="pole">
        <input
          id="brutto-malzonka"
          type="number"
          inputmode="numeric"
          min="0"
          max={MAX_POLE}
          step="100"
          value={poleMalzonka}
          oninput={(e) => piszMalzonka(e.currentTarget.value)}
          onblur={zakonczMalzonka}
          onkeydown={(e) => {
            if (e.key === 'Enter') zakonczMalzonka();
          }}
        />
        <span class="jednostka">zł / mies.</span>
      </div>

      <p class="wskazowka">
        Jeśli małżonek nie pracuje, zostaw 0 — to poprawny i najczęstszy przypadek, a zysk
        z reformy potrafi być wtedy dwa razy większy.
      </p>
    </div>
  {/if}
</section>

<!-- Treść akapitu w jednym miejscu, bo obok wersji widocznej renderujemy jeszcze
     wersje-duchy, które rezerwują wysokość (patrz `.stos` niżej). -->
{#snippet tekstZysku(zyskRocznie: number, maksimum: number)}
  To {kwota(zyskRocznie)} przez cały rok.
  {#if zyskRocznie === maksimum}
    To maksimum — wyższa pensja da wyższe netto, ale z tej zmiany zawsze wychodzi tyle samo.
  {/if}
{/snippet}

{#snippet tekstBrakuZysku(prog: number, brakuje: number)}
  {#if brakuje < 1}
    Jesteś dokładnie na granicy — zysk zaczyna się kilka złotych wyżej. Reforma dotyczy
    mniej więcej co dziesiątego podatnika.
  {:else}
    Nowa skala zmienia wynagrodzenie od {kwota(prog)} brutto —
    brakuje {kwota(brakuje)} podwyżki. Reforma dotyczy mniej więcej co dziesiątego
    podatnika.
  {/if}
{/snippet}

<!-- Przy wspólnym rozliczeniu próg nie jest stałą z ustawy, tylko wynikiem
     zarobków małżonka — dlatego zdanie tłumaczy, skąd się bierze, zamiast podać
     liczbę bez wyjaśnienia. -->
{#snippet tekstBrakuZyskuWspolnie(prog: number, brakuje: number)}
  Liczy się połowa łącznego dochodu, więc przy zarobkach małżonka {kwota(bruttoMalzonka)}
  zmiana zaczyna się od {kwota(prog)} Twojego brutto — brakuje {kwota(brakuje)}.
{/snippet}

<section class="wynik" class:zyskuje aria-live="polite">
  <!-- Etykieta i sama liczba mieszczą się w jednym wierszu w obu wariantach
       (krótkie napisy, `line-height: 1` na liczbie), więc tu nic nie skacze. -->
  {#if zyskuje}
    <p class="etykieta">
      {wspolne ? 'Na rękę dostaniecie miesięcznie' : 'Na rękę dostaniesz miesięcznie'}
    </p>
    <p class="liczba">
      {#if wynik.zyskMiesiecznie < 1}
        &lt;&nbsp;1 zł
      {:else}
        {zeZnakiem(wynik.zyskMiesiecznie)}
      {/if}
    </p>
  {:else}
    <p class="etykieta">
      {wspolne ? 'Dla Was ta zmiana oznacza' : 'Dla Ciebie ta zmiana oznacza'}
    </p>
    <p class="liczba">0 zł</p>
  {/if}

  <!-- Skacze dopiero akapit pod liczbą: raz jeden wiersz, raz trzy. Zamiast
       zgadywać `min-height` w pikselach — który i tak zależy od szerokości,
       zawijania i kroju pisma — wkładamy wszystkie warianty w tę samą komórkę
       siatki. Wysokość komórki to maksimum z nich przy każdej szerokości.
       Duchy niosą najdłuższe możliwe brzmienie (największy zysk, największy
       brak), bo dłuższa kwota potrafi dołożyć wiersz zawijania. -->
  <div class="stos">
    <p class="rocznie">
      {#if zyskuje}
        {@render tekstZysku(wynik.zyskRocznie, maksymalnyZysk)}
      {:else if wspolne}
        {@render tekstBrakuZyskuWspolnie(progi.poczatek, doProgu)}
      {:else}
        {@render tekstBrakuZysku(progi.poczatek, doProgu)}
      {/if}
    </p>
    <!-- Duchy niosą najdłuższe brzmienie dla bieżącego trybu: największy możliwy
         zysk i największy możliwy brak (czyli cały próg). Obie te wartości
         zmieniają się wyłącznie przy przełączeniu trybu albo zmianie pensji
         małżonka — nigdy w trakcie przeciągania suwaka — więc rezerwacja
         wysokości trzyma się tak samo jak dotąd. -->
    <p class="rocznie duch" aria-hidden="true">
      {@render tekstZysku(maksymalnyZysk, maksymalnyZysk)}
    </p>
    <p class="rocznie duch" aria-hidden="true">
      {#if wspolne}
        {@render tekstBrakuZyskuWspolnie(progi.poczatek, progi.poczatek)}
      {:else}
        {@render tekstBrakuZysku(progi.poczatek, progi.poczatek)}
      {/if}
    </p>
  </div>
</section>

<section class="porownanie">
  <div>
    <p class="rok">dziś</p>
    <p class="netto">{kwota(wynik.przed.nettoMiesiecznie)}</p>
    <p class="opis">{wspolne ? 'łącznie netto miesięcznie' : 'netto miesięcznie'}</p>
  </div>

  <div class="strzalka" aria-hidden="true">→</div>

  <div>
    <p class="rok">od 2027</p>
    <p class="netto" class:wyroznione={zyskuje}>{kwota(wynik.po.nettoMiesiecznie)}</p>
    <p class="opis">{wspolne ? 'łącznie netto miesięcznie' : 'netto miesięcznie'}</p>
  </div>
</section>

<!-- Wykres jest drugim sterownikiem tej samej kwoty: `onZmiana` odpowiada
     `oninput` suwaka, a `zakonczone` jego `onchange` (zapis adresu na koniec
     gestu, nie na każdym drgnięciu). -->
<!-- Oś pozioma zostaje przy Twoim wynagrodzeniu także we wspólnym rozliczeniu —
     to nadal ta jedna kwota, którą gest przesuwa, więc przeciąganie znaczy
     dokładnie to samo co dotąd. Zmienia się treść krzywej: przy włączonym
     wspólnym rozliczeniu pokazuje łączny zysk pary przy zarobkach małżonka
     przyjętych za stałe, z dwukrotnie wyższym pułapem i przesuniętymi
     załamaniami. Osi „łączne zarobki obojga" celowo nie robimy: nie dałoby się
     jej przeciągać, bo z jednej sumy nie wynika, ile zarabia które z was. -->
<WykresZysku
  {brutto}
  bruttoMalzonka={wspolne ? bruttoMalzonka : null}
  {progi}
  maxX={gornaOsi}
  onZmiana={(wartosc, zakonczone) => {
    przesun(wartosc);
    if (zakonczone) zapisz();
  }}
/>

<details bind:open={rozwiniete}>
  <summary>
    <span class="znacznik" aria-hidden="true"></span>
    Skąd ta liczba?
    <!-- Stan i tak ogłasza czytnik ekranu przez samo details, więc podpowiedź
         jest wyłącznie wizualną zachętą do kliknięcia. -->
    <span class="podpowiedz" aria-hidden="true">{rozwiniete ? 'ukryj' : 'pokaż rozbicie'}</span>
  </summary>

  <table>
    <thead>
      <tr>
        <th scope="col">rocznie</th>
        <th scope="col">dziś</th>
        <th scope="col">od 2027</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Brutto</th>
        <td>{kwotaDokladna(wynik.przed.bruttoRocznie)}</td>
        <td>{kwotaDokladna(wynik.po.bruttoRocznie)}</td>
      </tr>
      <tr>
        <th scope="row">Składki społeczne</th>
        <td>−{kwotaDokladna(wynik.przed.skladkiSpoleczne)}</td>
        <td>−{kwotaDokladna(wynik.po.skladkiSpoleczne)}</td>
      </tr>
      <tr>
        <th scope="row">Składka zdrowotna</th>
        <td>−{kwotaDokladna(wynik.przed.skladkaZdrowotna)}</td>
        <td>−{kwotaDokladna(wynik.po.skladkaZdrowotna)}</td>
      </tr>
      <tr>
        <th scope="row">Koszty uzyskania przychodu</th>
        <td>{kwotaDokladna(wynik.przed.kup)}</td>
        <td>{kwotaDokladna(wynik.po.kup)}</td>
      </tr>
      <tr>
        <th scope="row">Podstawa opodatkowania</th>
        <td>{kwotaDokladna(wynik.przed.podstawaOpodatkowania)}</td>
        <td>{kwotaDokladna(wynik.po.podstawaOpodatkowania)}</td>
      </tr>
      <tr>
        <th scope="row">Podatek</th>
        <td>−{kwotaDokladna(wynik.przed.podatek)}</td>
        <td>−{kwotaDokladna(wynik.po.podatek)}</td>
      </tr>
      <tr class="suma">
        <th scope="row">Netto</th>
        <td>{kwotaDokladna(wynik.przed.nettoRocznie)}</td>
        <td>{kwotaDokladna(wynik.po.nettoRocznie)}</td>
      </tr>
    </tbody>
  </table>

  <p class="nota">
    Podstawa opodatkowania i podatek zaokrąglane do pełnych złotych zgodnie z art. 63 §1 Ordynacji
    podatkowej. Kwota wolna 30 000 zł i kwota zmniejszająca podatek 3 600 zł pozostają bez zmian —
    zmienia się wyłącznie skala.
    {#if wspolne}
      Wszystkie kwoty w tabeli są sumą obojga małżonków. Podatek to dwukrotność podatku od połowy
      łącznego dochodu (art. 6 ust. 2 ustawy o PIT), więc kwota zmniejszająca odlicza się dwa razy.
      Składki liczy każdy od swojego wynagrodzenia, z własnym limitem 30-krotności, a składka
      zdrowotna pozostaje indywidualna — wspólnemu rozliczeniu podlega sam podatek.
    {/if}
  </p>
</details>

<!-- Na końcu treści: pojawienie się tej uwagi nic nie przesuwa, więc nie trzeba
     rezerwować na nią miejsca i nie zostaje pusty pas pod wykresem. -->
{#if ponizejMinimalnej}
  <p class="uwaga">
    To mniej niż płaca minimalna ({kwota(PLACA_MINIMALNA)} w 2026 r.), która obowiązuje przy pełnym
    etacie. Przy niepełnym taka kwota jest jak najbardziej możliwa i wyliczenie pozostaje poprawne.
  </p>
{/if}


<style>
  .wejscie {
    margin-bottom: 2.5rem;
  }

  label {
    display: block;
    font-size: 0.875rem;
    color: var(--tekst-cichy);
    margin-bottom: 0.5rem;
  }

  .pole {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  input[type='number'] {
    font-size: 2rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    width: 7ch;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--linia);
    border-radius: 0.375rem;
    background: var(--tlo-karta);
    color: inherit;
  }

  .jednostka {
    color: var(--tekst-cichy);
  }

  .suwak {
    width: 100%;
    margin-top: 0.5rem;
    /* Sam element ma ~16 px, a WCAG 2.2 chce 24 px celu dotykowego — brakującą
       wysokość dokłada padding, więc uchwyt zostaje wizualnie taki sam. */
    padding-block: 0.5rem;
    box-sizing: content-box;
    accent-color: var(--akcent);
  }

  /* Etykieta jest klikalnym celem razem z kwadracikiem, więc nie `display: block`
     jak pozostałe etykiety w tym komponencie. */
  .przelacznik {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: fit-content;
    margin: 1.25rem 0 0;
    cursor: pointer;
    /* Wielokrotne przełączanie nie ma zaznaczać napisu. */
    user-select: none;
    font-size: 0.9375rem;
    color: var(--tekst);
  }

  .przelacznik input {
    width: 1rem;
    height: 1rem;
    margin: 0;
    accent-color: var(--akcent);
    cursor: pointer;
  }

  .malzonek {
    margin-top: 1rem;
    padding-left: 1rem;
    border-left: 2px solid var(--linia);
  }

  /* Mniejsze od pola głównego: druga pensja jest dopowiedzeniem do pierwszej,
     nie drugim równorzędnym pytaniem. Szersze o znak, bo `ch` maleje razem
     z krojem, a stałe `padding` w rem — nie, więc przy 7ch pięciocyfrowa kwota
     ucinała się o ostatnią cyfrę. */
  .malzonek input[type='number'] {
    font-size: 1.5rem;
    width: 8ch;
  }

  .wskazowka {
    margin: 0.5rem 0 0;
    font-size: 0.8125rem;
    color: var(--tekst-cichy);
  }

  .wynik {
    background: var(--tlo-karta);
    border: 1px solid var(--linia);
    border-radius: 0.75rem;
    padding: 1.75rem;
    text-align: center;
  }

  .wynik.zyskuje {
    background: var(--akcent-tlo);
    border-color: color-mix(in srgb, var(--akcent) 35%, transparent);
  }

  .etykieta {
    margin: 0;
    font-size: 0.875rem;
    color: var(--tekst-cichy);
  }

  .liczba {
    margin: 0.25rem 0;
    font-size: clamp(2.5rem, 10vw, 4rem);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .wynik.zyskuje .liczba {
    color: var(--akcent);
  }

  /* Wszystkie dzieci lądują w tej samej komórce siatki, więc wysokość stosu to
     maksimum z ich wysokości — liczone przez przeglądarkę przy każdej
     szerokości, bez mierzenia czegokolwiek w JS. */
  .stos {
    display: grid;
  }

  .stos > * {
    grid-area: 1 / 1;
  }

  /* `visibility: hidden` zostawia pudełko w układzie, ale wycina je z obrazu,
     z drzewa dostępności i z kolejności fokusu (te akapity i tak nie mają
     niczego interaktywnego). `aria-hidden` w znaczniku to pas i szelki. */
  .duch {
    visibility: hidden;
  }

  /* Miara szersza, niż chciałoby się dla zwykłego akapitu, bo ten nie jest
     zwykły: wszystkie warianty leżą w jednej komórce `.stos`, więc najdłuższy
     z nich dyktuje wysokość panelu każdemu. Przy 28rem wariant bez zysku łamał
     się na trzy wiersze, z sierotą w ostatnim. Próg dwóch wierszy wypada przy
     ~32rem (mierzone na najdłuższym duchu, „brakuje 11 878 zł"); 35rem daje
     zapas na inny krój systemowy, a i tak zostaje wyraźnie węższe od panelu,
     więc akapit nadal czyta się jak wtrącenie pod liczbą, nie jak jej ramka. */
  .rocznie {
    margin: 0.75rem auto 0;
    max-width: 35rem;
    font-size: 0.9375rem;
    color: var(--tekst-cichy);
  }

  .porownanie {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(1rem, 6vw, 3rem);
    margin: 1.75rem 0;
    text-align: center;
  }

  .rok {
    margin: 0;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--tekst-cichy);
  }

  .netto {
    margin: 0.125rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .netto.wyroznione {
    color: var(--akcent);
  }

  .opis {
    margin: 0;
    font-size: 0.75rem;
    color: var(--tekst-cichy);
  }

  .strzalka {
    font-size: 1.5rem;
    color: var(--tekst-cichy);
  }

  .uwaga {
    margin: 0 0 1.75rem;
    padding: 0.75rem 1rem;
    border-left: 2px solid var(--linia);
    font-size: 0.875rem;
    color: var(--tekst-cichy);
  }

  details {
    border-top: 1px solid var(--linia);
    padding-top: 1.25rem;
  }

  summary {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.6875rem 0.875rem;
    border: 1px solid var(--linia);
    border-radius: 0.5rem;
    background: var(--tlo-karta);
    cursor: pointer;
    /* Wielokrotne klikanie w rozwijanie nie ma zaznaczać napisu. */
    user-select: none;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--tekst);
    /* Własny znacznik zamiast systemowego trójkąta: `list-style` gasi go
       w Firefoksie i nowym Chrome, `::-webkit-details-marker` w Safari. */
    list-style: none;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary:hover {
    background: var(--akcent-tlo);
    border-color: color-mix(in srgb, var(--akcent) 40%, var(--linia));
  }

  summary:focus-visible {
    outline: 2px solid var(--akcent);
    outline-offset: 2px;
  }

  /* Kwadrat z dwoma bokami: obrócony o −45° to strzałka w prawo, o 45° w dół. */
  .znacznik {
    flex: none;
    width: 0.4375rem;
    height: 0.4375rem;
    margin-left: 0.125rem;
    border-right: 1.5px solid currentColor;
    border-bottom: 1.5px solid currentColor;
    color: var(--tekst-cichy);
    transform: rotate(-45deg);
    transition:
      transform 0.2s ease,
      color 0.15s ease;
  }

  details[open] .znacznik {
    transform: rotate(45deg);
  }

  summary:hover .znacznik,
  summary:focus-visible .znacznik {
    color: var(--akcent);
  }

  .podpowiedz {
    margin-left: auto;
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--tekst-cichy);
  }

  summary:hover .podpowiedz {
    color: var(--akcent);
  }

  /* Płynne rozwijanie bez mierzenia wysokości w JS — tylko tam, gdzie
     przeglądarka umie animować do `auto`. Gdzie nie umie, otwiera się skokowo. */
  @supports (interpolate-size: allow-keywords) and (selector(::details-content)) {
    details {
      interpolate-size: allow-keywords;
    }

    details::details-content {
      block-size: 0;
      overflow: hidden;
      opacity: 0;
      transition:
        block-size 0.25s ease,
        opacity 0.2s ease,
        content-visibility 0.25s allow-discrete;
    }

    details[open]::details-content {
      block-size: auto;
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    summary,
    .znacznik,
    details::details-content {
      transition: none;
    }
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    font-size: 0.875rem;
    font-variant-numeric: tabular-nums;
  }

  th[scope='col'] {
    text-align: right;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--tekst-cichy);
    font-weight: 500;
  }

  th[scope='col']:first-child,
  th[scope='row'] {
    text-align: left;
  }

  th[scope='row'] {
    font-weight: 400;
    color: var(--tekst-cichy);
  }

  /* Odstęp od lewej, bo przy wąskim ekranie sąsiednie kwoty inaczej się stykają. */
  td,
  th[scope='col']:not(:first-child) {
    text-align: right;
    padding: 0.375rem 0 0.375rem 0.75rem;
  }

  th {
    padding: 0.375rem 0;
  }

  .suma th,
  .suma td {
    border-top: 1px solid var(--linia);
    font-weight: 600;
    color: var(--tekst);
  }

  .nota {
    font-size: 0.75rem;
    color: var(--tekst-cichy);
    margin: 1rem 0 0;
  }

  @media (max-width: 30rem) {
    .porownanie {
      gap: 1rem;
    }

    .netto {
      font-size: 1.25rem;
    }

    table {
      font-size: 0.8125rem;
    }
  }
</style>
