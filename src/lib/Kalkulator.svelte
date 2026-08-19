<script lang="ts">
  import { LIMIT_PIT_ZERO, PLACA_MINIMALNA } from '../tax/constants';
  import {
    BRUTTO_PELNA_KORZYSC,
    BRUTTO_PELNA_KORZYSC_ULGA,
    BRUTTO_POCZATEK_KORZYSCI,
    BRUTTO_POCZATEK_KORZYSCI_ULGA,
    MAKSYMALNA_KORZYSC_ROCZNA,
    MAKSYMALNA_KORZYSC_WSPOLNA,
    type OpcjeWspolne,
    porownaj,
    porownajWspolnie,
    progiWspolne,
  } from '../tax/engine';
  import WykresZysku from './WykresZysku.svelte';
  import { kwota, kwotaDokladna, zeZnakiem } from './format';
  import {
    odczytajBrutto,
    odczytajMalzonka,
    odczytajUlge,
    odczytajUlgeMalzonka,
    zapiszStan,
  } from './url';

  // Suwak obejmuje zakres, w którym cokolwiek się dzieje. Wpisać z ręki można
  // znacznie więcej, bo powyżej suwaka zysk wprawdzie stoi w miejscu, ale netto
  // rośnie dalej — przycięcie kwoty pokazywałoby komuś cudzą wypłatę jako jego.
  const MIN_SUWAK = 3_000;
  const MAX_SUWAK = 30_000;
  const MIN_POLE = 1_000;
  const MAX_POLE = 100_000;

  const startowe = wZakresiePola(odczytajBrutto(12_000));
  const startowyMalzonek = odczytajMalzonka();
  const startowaUlga = odczytajUlge();
  const startowaUlgaMalzonka = odczytajUlgeMalzonka();

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

  /**
   * Ulga dla młodych — dwie niezależne flagi, bo silnik jej nie dziedziczy:
   * wiek jest cechą konkretnej osoby, a nie ustawieniem gospodarstwa. Stąd też
   * rozmieszczenie w układzie: każdy przełącznik stoi przy wynagrodzeniu tej
   * osoby, której dotyczy, zamiast tworzyć osobną grupę „ulgi" z dwoma polami,
   * przy której trzeba by dopiero czytać, kto jest kto.
   */
  let ulga = $state(startowaUlga);
  let ulgaMalzonka = $state(startowaUlgaMalzonka);

  let rozwiniete = $state(false);

  /** Czy w bieżącym scenariuszu ktokolwiek korzysta ze zwolnienia. */
  const jakasUlga = $derived(ulga || (wspolne && ulgaMalzonka));

  /**
   * Opcje dla silnika. `malzonek` podajemy zawsze wprost, bo bez tego
   * `porownajWspolnie` zeruje małżonkowi ulgę — dokładnie po to, żeby nie
   * zwolnić po cichu obojga (patrz `OpcjeWspolne`). Przy rozliczeniu
   * indywidualnym pole jest po prostu ignorowane.
   */
  const opcje: OpcjeWspolne = $derived({
    ulgaDlaMlodych: ulga,
    malzonek: { ulgaDlaMlodych: ulgaMalzonka },
  });

  const wynik = $derived(
    wspolne ? porownajWspolnie(brutto, bruttoMalzonka, opcje) : porownaj(brutto, opcje),
  );
  const zyskuje = $derived(wynik.zyskRocznie > 0);

  const maksymalnyZysk = $derived(
    wspolne ? MAKSYMALNA_KORZYSC_WSPOLNA : MAKSYMALNA_KORZYSC_ROCZNA,
  );

  /**
   * Progi korzyści. Przy rozliczeniu indywidualnym to dwie stałe — osobna para
   * dla osoby z ulgą, bo pierwsze 85 528 zł przychodu jest u niej wolne od
   * podatku i nowa skala rusza dopiero od 20 139 zł brutto zamiast 11 878 zł.
   * Przy wspólnym rozliczeniu przesuwają się wraz z zarobkami małżonka, bo
   * liczy się połowa łącznego dochodu — przy małżonku bez dochodu obie granice
   * skali działają podwójnie i próg wypada mniej więcej dwa razy wyżej;
   * `progiWspolne` dostaje te same opcje co reszta wyliczenia, więc ulga jest
   * w nich uwzględniona.
   */
  const progi = $derived(
    wspolne
      ? progiWspolne(bruttoMalzonka, opcje)
      : ulga
        ? { poczatek: BRUTTO_POCZATEK_KORZYSCI_ULGA, pelna: BRUTTO_PELNA_KORZYSC_ULGA }
        : { poczatek: BRUTTO_POCZATEK_KORZYSCI, pelna: BRUTTO_PELNA_KORZYSC },
  );

  /**
   * Górny kraniec osi wykresu. Dobierany tak, żeby próg pełnej korzyści wypadał
   * mniej więcej w dwóch trzecich szerokości — tak jak przy rozliczeniu
   * indywidualnym bez ulgi, gdzie 14 776 zł leży w tym miejscu osi kończącej się
   * na 20 000 zł. Widełki pilnują, żeby oś nie zrobiła się absurdalnie ciasna,
   * gdy małżonek zarabia tyle, że para ma pełną korzyść niemal od razu.
   *
   * Ulga przesuwa oba załamania w górę (23 036 zł indywidualnie, prawie 36 000 zł
   * przy małżonku bez dochodu), więc sufit 40 000 zł ścinałby wtedy podpis progu
   * przy krawędzi. Podnosimy go tylko w scenariuszach z ulgą — bez niej oś
   * zostaje co do złotówki taka jak dotąd.
   */
  const gornaOsi = $derived(
    wspolne || jakasUlga
      ? Math.min(
          jakasUlga ? 55_000 : 40_000,
          Math.max(12_000, Math.ceil((MIN_SUWAK + (progi.pelna - MIN_SUWAK) / 0.69) / 1_000) * 1_000),
        )
      : 20_000,
  );

  /**
   * Suwak sięga co najmniej tam, gdzie oś wykresu, bo wykres jest jego drugim
   * sterownikiem — inaczej przeciągnięcie w prawy koniec zatrzymywałoby znacznik
   * w połowie gestu.
   */
  const maxSuwak = $derived(Math.max(MAX_SUWAK, gornaOsi));

  const doProgu = $derived(Math.max(0, progi.poczatek - brutto));
  const ponizejMinimalnej = $derived(brutto < PLACA_MINIMALNA);

  // Jednorazowo po wczytaniu, żeby adres dało się skopiować, zanim ktoś dotknie
  // pola. Później zapisują już tylko zakończona edycja i puszczony suwak —
  // zapis na każdym znaku wpisywał do adresu wartości pośrednie.
  $effect(() => {
    zapiszStan(startowe, startowyMalzonek, startowaUlga, startowaUlgaMalzonka);
  });

  /**
   * Adres ma nieść cały scenariusz, także ten wspólny — patrz `url.ts`. Stan
   * wyłączonej sekcji do adresu nie idzie: przy rozliczeniu indywidualnym nie ma
   * małżonka, więc nie ma też jego ulgi.
   */
  function zapisz() {
    zapiszStan(brutto, wspolne ? bruttoMalzonka : null, ulga, wspolne && ulgaMalzonka);
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

  function przelaczWspolne(wlaczone: boolean) {
    wspolne = wlaczone;
    zapisz();
  }

  function przelaczUlge(wlaczone: boolean) {
    ulga = wlaczone;
    zapisz();
  }

  function przelaczUlgeMalzonka(wlaczone: boolean) {
    ulgaMalzonka = wlaczone;
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

  <!-- Przełączniki i drugie pole są pod suwakiem, bo oba pytania mają sens
       dopiero po podaniu własnej pensji. Treść pojawia się na kliknięcie, nie
       w trakcie przeciągania, więc zmiana wysokości strony jest tu odpowiedzią
       na decyzję użytkownika, a nie drganiem układu — i dlatego wolno jej być
       animacją, a nie przeskokiem.

       Kontrolki zostają zwykłymi checkboxami (klawiatura, fokus i ogłaszanie
       stanu za darmo), tylko z wygaszonym wyglądem systemowym. Każda robi dwie
       rzeczy naraz: przełącza tryb obliczeń i otwiera dodatkową treść —
       pierwsze niesie `checked`, drugie `aria-expanded` z `aria-controls`.

       Etykieta mówi o wieku, nie o nazwie przepisu: „PIT-0" i „ulga dla
       młodych" to hasła dla kogoś, kto już wie, że mu przysługują, a ta
       kontrolka istnieje głównie dla tych, którzy nie wiedzą. Nazwa ulgi pada
       dopiero w wyjaśnieniu pod spodem i w rozbiciu. -->
  <label class="przelacznik">
    <input
      type="checkbox"
      checked={ulga}
      aria-expanded={ulga}
      aria-controls="ulga-wyjasnienie"
      onchange={(e) => przelaczUlge(e.currentTarget.checked)}
    />
    Mam mniej niż 26 lat
  </label>

  <div class="rozwijane" class:otwarte={ulga} id="ulga-wyjasnienie">
    <div class="klip" inert={!ulga}>
      <!-- Najważniejsze zdanie na tej stronie dla osoby poniżej 26 lat: zwolnienie
           obowiązuje już dziś, więc podnosi netto po obu stronach porównania i
           właśnie dlatego zysk z reformy zwykle zostaje zerowy. Bez tego wyższe
           netto przy zerowym zysku wygląda na błąd kalkulatora. -->
      <p class="wskazowka wyjasnienie">
        Zarobki do {kwota(LIMIT_PIT_ZERO)} rocznie są wtedy wolne od PIT. Ta ulga obowiązuje już
        dziś i zapowiedź jej nie zmienia — widać ją więc w netto po obu stronach, ale nie w zysku
        z reformy.
      </p>
    </div>
  </div>

  <label class="przelacznik">
    <input
      type="checkbox"
      checked={wspolne}
      aria-expanded={wspolne}
      aria-controls="malzonek"
      onchange={(e) => przelaczWspolne(e.currentTarget.checked)}
    />
    Rozliczam się wspólnie z małżonkiem
  </label>

  <!-- Blok zostaje w drzewie także zwinięty — to warunek animowania wysokości.
       Zwinięty jest jednak `inert` i `visibility: hidden`, więc wypada z
       kolejności fokusu i z drzewa dostępności dokładnie tak, jakby go nie
       było; wynik i tak liczy się z `wspolne`, nie z zawartości pola. -->
  <div class="rozwijane" class:otwarte={wspolne} id="malzonek">
    <div class="klip" inert={!wspolne}>
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

        <!-- Druga, niezależna ulga stoi tutaj, przy wynagrodzeniu małżonka, a nie
             obok Twojej: wiek jest cechą osoby, więc przełącznik należy do tej
             samej grupki co pole, którego dotyczy. Wcięcie i pionowa kreska
             sekcji małżonka mówią to samo bez ani jednego dodatkowego słowa,
             dzięki czemu etykiety mogą zostać krótkie, a kontrolek jest tyle,
             ile osób — nie ich dwukrotność ze zdublowanym „Twoja / małżonka".
             Nic nie rozwija, więc bez `aria-expanded`: wyjaśnienie o zwolnieniu
             pada raz, wyżej, i dotyczy obojga. -->
        <label class="przelacznik">
          <input
            type="checkbox"
            checked={ulgaMalzonka}
            onchange={(e) => przelaczUlgeMalzonka(e.currentTarget.checked)}
          />
          Małżonek ma mniej niż 26 lat
        </label>
      </div>
    </div>
  </div>
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
  {ulga}
  ulgaMalzonka={wspolne && ulgaMalzonka}
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
      <!-- Sedno ulgi dla młodych: bez tego wiersza z tabeli widać tylko, że
           podatek jest niższy, a nie dlaczego. Pokazujemy go wyłącznie, gdy
           coś rzeczywiście jest zwolnione — przy wyłączonej uldze tabela
           zostaje taka jak dotąd, co do wiersza. -->
      {#if wynik.przed.przychodZwolniony > 0 || wynik.po.przychodZwolniony > 0}
        <tr>
          <th scope="row">Przychód zwolniony z PIT</th>
          <td>−{kwotaDokladna(wynik.przed.przychodZwolniony)}</td>
          <td>−{kwotaDokladna(wynik.po.przychodZwolniony)}</td>
        </tr>
      {/if}
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
    {#if wynik.przed.przychodZwolniony > 0}
      Ulga dla młodych (PIT-0, art. 21 ust. 1 pkt 148 ustawy o PIT) zwalnia z podatku przychód
      do {kwota(LIMIT_PIT_ZERO)} rocznie — limit przysługuje każdemu osobno i jest wspólny dla
      wszystkich zwolnień PIT-0. Składki ZUS naliczają się od całości wynagrodzenia, bo
      zwolnienie jest podatkowe, nie składkowe. Składka zdrowotna też się należy w pełnej
      wysokości: art. 83 ust. 2a ustawy zdrowotnej każe porównywać ją z zaliczką policzoną wg
      stanu na 31.12.2021 tak, jakby zwolnienie nie przysługiwało — więc wbrew częstej opinii
      nie spada przy uldze do zera.
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

  /* Etykieta jest klikalnym celem razem z przełącznikiem, więc nie
     `display: block` jak pozostałe etykiety w tym komponencie. Cały wiersz
     dostaje ramkę i tło jak `summary` niżej: to też jest rzecz, która coś
     otwiera, więc ma wyglądać na rodzeństwo, a nie na inny gatunek kontrolki.
     Pełna szerokość (bez `fit-content`) daje przy okazji wygodny cel dotykowy
     wysokości ~44 px, mimo że sam suwaczek ma 20 px. */
  .przelacznik {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    margin: 1.25rem 0 0;
    padding: 0.6875rem 0.875rem;
    border: 1px solid var(--linia);
    border-radius: 0.5rem;
    background: var(--tlo-karta);
    cursor: pointer;
    /* Wielokrotne przełączanie nie ma zaznaczać napisu. */
    user-select: none;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--tekst);
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;
  }

  /* Drugi przełącznik pod pierwszym: ciaśniej niż odstęp od suwaka, żeby oba
     czytały się jako jedna grupa pytań o Twoją sytuację. Kombinator ogólny
     (`~`, nie `+`), bo między nimi siedzi rozwijane wyjaśnienie ulgi. */
  .przelacznik ~ .przelacznik {
    margin-top: 0.5rem;
  }

  .przelacznik:hover {
    background: var(--akcent-tlo);
    border-color: color-mix(in srgb, var(--akcent) 40%, var(--linia));
  }

  /* Obwódka fokusu obejmuje cały wiersz, bo cały wiersz jest celem kliknięcia
     — tak samo jak przy `summary`. Systemowa obwódka samego kwadracika
     zostaje zgaszona, żeby nie było dwóch pierścieni naraz. */
  .przelacznik:has(input:focus-visible) {
    outline: 2px solid var(--akcent);
    outline-offset: 2px;
  }

  /* Wygaszony wygląd systemowy — element pozostaje checkboxem, zmienia się
     tylko obraz. Tor plus krążek: stan widać z odległości, a przejście
     krążka pokazuje kierunek zmiany. */
  .przelacznik input {
    appearance: none;
    flex: none;
    position: relative;
    width: 2.25rem;
    height: 1.25rem;
    margin: 0;
    padding: 0;
    border: 1px solid var(--linia);
    border-radius: 999px;
    /* Odrobinę ciemniejsze od karty, na której leży — samo `--tlo` ginęło na
       białym tle i tor czytał się jak pusta ramka. */
    background: color-mix(in srgb, var(--tekst-cichy) 12%, var(--tlo-karta));
    cursor: pointer;
    outline: none;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease;
  }

  .przelacznik input::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0.125rem;
    width: 0.875rem;
    height: 0.875rem;
    border-radius: 50%;
    background: var(--tekst-cichy);
    transform: translateY(-50%);
    transition:
      transform 0.2s ease,
      background-color 0.2s ease;
  }

  .przelacznik input:checked {
    background: var(--akcent);
    border-color: var(--akcent);
  }

  .przelacznik input:checked::before {
    background: var(--tlo-karta);
    transform: translate(1rem, -50%);
  }

  /* Płynne rozwinięcie bez mierzenia wysokości w JS — ten sam zamiar co przy
     „Skąd ta liczba?", ale innym narzędziem: `::details-content` istnieje
     wyłącznie dla `details`, a tu jest zwykły blok sterowany checkboxem.
     Odpowiednikiem jest tor siatki `0fr → 1fr`, który animuje do wysokości
     treści równie dobrze i działa też tam, gdzie `interpolate-size` jeszcze
     nie dojechało (stąd bez `@supports` — nie ma czego zabezpieczać).
     Czas i krzywa te same, żeby oba rozwinięcia czytały się jak jedno
     zachowanie strony. */
  .rozwijane {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.25s ease;
  }

  .rozwijane.otwarte {
    grid-template-rows: 1fr;
  }

  /* `min-height: 0` puszcza element poniżej jego wysokości minimalnej —
     bez tego tor 0fr i tak zostałby rozepchany treścią. `visibility`
     przełącza się dopiero na końcu zwijania (przejście trwa tyle co
     wysokość), więc treść nie znika w połowie gestu, a zwinięta wypada
     z fokusu i z drzewa dostępności. */
  .klip {
    overflow: hidden;
    min-height: 0;
    visibility: hidden;
    opacity: 0;
    transition:
      visibility 0.25s,
      opacity 0.2s ease;
  }

  .rozwijane.otwarte .klip {
    visibility: visible;
    opacity: 1;
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

  /* Wcięcie równe poziomemu paddingowi przełącznika — wyjaśnienie ustawia się
     do krawędzi tekstu ramki nad sobą, a nie do krawędzi kolumny. */
  .wyjasnienie {
    padding: 0 0.875rem;
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
    details::details-content,
    .przelacznik,
    .przelacznik input,
    .przelacznik input::before,
    .rozwijane,
    .klip {
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
