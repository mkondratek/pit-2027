<script lang="ts">
  import {
    BRUTTO_PELNA_KORZYSC,
    BRUTTO_POCZATEK_KORZYSCI,
    MAKSYMALNA_KORZYSC_ROCZNA,
    MAKSYMALNA_KORZYSC_WSPOLNA,
    porownaj,
    porownajWspolnie,
  } from '../tax/engine';
  import { kwota } from './format';

  let {
    brutto,
    bruttoMalzonka = null,
    progi = { poczatek: BRUTTO_POCZATEK_KORZYSCI, pelna: BRUTTO_PELNA_KORZYSC },
    maxX = 20_000,
    onZmiana,
  }: {
    brutto: number;
    /**
     * Wynagrodzenie małżonka przy wspólnym rozliczeniu albo `null` przy
     * indywidualnym. Zmienia całą treść wykresu: krzywa pokazuje wtedy łączny
     * zysk pary, a pułap osi pionowej jest dwukrotny.
     */
    bruttoMalzonka?: number | null;
    /**
     * Załamania krzywej — gdzie zysk rusza z zera i gdzie dochodzi do pułapu.
     * Przy wspólnym rozliczeniu nie są stałymi: przesuwają się wraz z zarobkami
     * małżonka, więc liczy je rodzic (`progiWspolne`) i podaje razem z osią.
     */
    progi?: { poczatek: number; pelna: number };
    /** Górny kraniec osi poziomej; dobierany do progów, patrz rodzic. */
    maxX?: number;
    /**
     * Wykres nie tylko rysuje — wskazanie miejsca na nim ustawia wynagrodzenie.
     * `zakonczone` mówi, czy gest już się skończył: rodzic ma wtedy zapisać adres
     * URL, dokładnie tak jak suwak robi to na `onchange`, a nie na każdym ruchu.
     */
    onZmiana?: (wartosc: number, zakonczone: boolean) => void;
  } = $props();

  /**
   * Dolny kraniec osi. Górny przychodzi z zewnątrz, bo zależy od tego, gdzie
   * wypadają załamania: przy wspólnym rozliczeniu z małżonkiem bez dochodu cała
   * akcja dzieje się dwa razy dalej niż przy rozliczeniu indywidualnym i przy
   * osi do 20 000 zł nie byłoby na wykresie widać niczego poza zerem.
   */
  const MIN_X = 3_000;

  const wspolne = $derived(bruttoMalzonka !== null);
  const ZYSK_MAX = $derived(
    (wspolne ? MAKSYMALNA_KORZYSC_WSPOLNA : MAKSYMALNA_KORZYSC_ROCZNA) / 12,
  );

  /** Taki sam krok jak suwak — oba sterowniki mają dawać te same kwoty. */
  const KROK = 100;

  /**
   * Ile pikseli w poziomie musi przejechać palec, zanim uznamy gest za
   * przeciąganie wykresu, a nie za dotknięcie w drodze do przewinięcia strony.
   */
  const PROG_RUCHU = 4;

  // Układ w jednostkach viewBox. SVG skaluje się z szerokością rodzica, więc to
  // proporcje, nie piksele; rozmiary tekstu ustawia CSS (patrz niżej).
  const W = 400;
  const H = 170;
  const L = 26;
  const R = 394;
  const T = 26;
  const B = 132;

  const skalaX = (b: number) => L + ((b - MIN_X) / (maxX - MIN_X)) * (R - L);
  const skalaY = (z: number) => B - (Math.min(z, ZYSK_MAX) / ZYSK_MAX) * (B - T);

  /** Zysk miesięczny — jednej osoby albo całej pary, zależnie od trybu. */
  const zyskDla = (b: number) =>
    bruttoMalzonka === null
      ? porownaj(b).zyskMiesiecznie
      : porownajWspolnie(b, bruttoMalzonka).zyskMiesiecznie;

  /**
   * Krzywa nie zależy od tego, co użytkownik wpisał w swoje wynagrodzenie — to ta
   * sama funkcja dla wszystkich — więc przeliczenie nie zachodzi przy ruchu
   * suwaka. Zależy natomiast od zarobków małżonka i od zakresu osi, i tylko one
   * są tu czytane: `brutto` nigdzie w tym wyrażeniu nie występuje. Krok 100 zł
   * wystarcza na gładką linię; oba załamania dokładamy osobno, żeby były ostre,
   * a nie ścięte próbkowaniem.
   */
  const krzywa = $derived.by(() => {
    const punkty = new Set<number>([progi.poczatek, progi.pelna]);
    for (let b = MIN_X; b <= maxX; b += KROK) punkty.add(b);

    return [...punkty]
      .filter((b) => b >= MIN_X && b <= maxX)
      .sort((a, b) => a - b)
      .map((b) => `${skalaX(b).toFixed(1)},${skalaY(zyskDla(b)).toFixed(1)}`)
      .join(' ');
  });

  const obszar = $derived(`${L},${B} ${krzywa} ${R},${B}`);

  /**
   * Podpisane załamanie ma sens tylko wtedy, gdy leży wyraźnie wewnątrz osi.
   * Przy wysokich zarobkach małżonka próg początkowy schodzi poniżej lewego
   * krańca (para zyskuje przy każdym Twoim wynagrodzeniu) — wtedy linii nie ma,
   * zamiast wciskać podpis w kraniec osi.
   */
  const widoczny = (b: number) =>
    b > MIN_X + 0.08 * (maxX - MIN_X) && b < maxX - 0.08 * (maxX - MIN_X);

  const zysk = $derived(zyskDla(brutto));
  const pozaZakresem = $derived(brutto > maxX ? 'prawo' : brutto < MIN_X ? 'lewo' : null);
  const znacznikX = $derived(skalaX(Math.min(maxX, Math.max(MIN_X, brutto))));
  const znacznikY = $derived(skalaY(zysk));

  // `useGrouping: always`, bo domyślnie pl-PL nie grupuje liczb czterocyfrowych
  // i na osi obok „11 878" wypadałoby „3000".
  const liczba = new Intl.NumberFormat('pl-PL', {
    maximumFractionDigits: 0,
    useGrouping: 'always',
  });

  const opis = $derived(
    `Wykres ${wspolne ? 'łącznego zysku miesięcznego pary' : 'zysku miesięcznego'} ` +
      `w zależności od Twojego wynagrodzenia brutto` +
      `${wspolne ? ` przy wynagrodzeniu małżonka ${kwota(bruttoMalzonka ?? 0)}` : ''}. ` +
      `Oś pozioma obejmuje od ${liczba.format(MIN_X)} do ${liczba.format(maxX)} zł, a poza tym ` +
      `zakresem krzywa jest płaska: do ${kwota(progi.poczatek)} brutto zysk wynosi zero, potem ` +
      `rośnie, a od ${kwota(progi.pelna)} zatrzymuje się na ${kwota(ZYSK_MAX)} miesięcznie ` +
      `i wyżej już nie rośnie. Dla ${kwota(brutto)} brutto zysk wynosi ${kwota(zysk)} miesięcznie.`,
  );

  // ——— Sterowanie wskaźnikiem (mysz, palec, rysik — jedną ścieżką) ———

  let svgEl: SVGSVGElement | undefined;

  /** Wskaźnik jest wciśnięty nad wykresem. */
  let wcisniety = false;
  /** Gest już zmienia wartość (mysz od razu, palec po przekroczeniu progu). */
  let przeciagam = $state(false);
  let startX = 0;

  /**
   * Pozycja wskaźnika → kwota. `width: 100%` + `height: auto` znaczy, że viewBox
   * skaluje się równomiernie, więc wystarczy prosta proporcja szerokości.
   * Wynik zawsze mieści się w zakresie osi i trafia w krok suwaka.
   */
  function bruttoPod(e: PointerEvent): number {
    const ramka = svgEl!.getBoundingClientRect();
    const x = ((e.clientX - ramka.left) / ramka.width) * W;
    const surowe = MIN_X + ((x - L) / (R - L)) * (maxX - MIN_X);

    return Math.min(maxX, Math.max(MIN_X, Math.round(surowe / KROK) * KROK));
  }

  function ustaw(e: PointerEvent, zakonczone: boolean) {
    const wartosc = bruttoPod(e);
    // W trakcie gestu odzywamy się tylko przy realnej zmianie; koniec zgłaszamy
    // zawsze, bo to on domyka zapis adresu.
    if (wartosc !== brutto || zakonczone) onZmiana?.(wartosc, zakonczone);
  }

  function chwyc(e: PointerEvent) {
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;

    wcisniety = true;
    startX = e.clientX;
    // Przechwycenie: przeciąganie nie gubi się, gdy kursor wyjedzie poza SVG.
    // Rzuca, jeśli wskaźnik zdążył już zniknąć — wtedy po prostu jedziemy dalej
    // bez przechwycenia, zamiast wywracać cały gest.
    try {
      svgEl?.setPointerCapture(e.pointerId);
    } catch {
      /* pusto */
    }

    // Mysz nie przewija strony, więc reaguje natychmiast — kropka skacze pod
    // kursor już na wciśnięciu. Palec musi najpierw pokazać, że nie przewija.
    if (e.pointerType === 'mouse') {
      e.preventDefault();
      przeciagam = true;
      ustaw(e, false);
    }
  }

  function ciagnij(e: PointerEvent) {
    if (!wcisniety) return;

    if (!przeciagam) {
      if (Math.abs(e.clientX - startX) < PROG_RUCHU) return;
      przeciagam = true;
    }

    ustaw(e, false);
  }

  function pusc(e: PointerEvent) {
    if (!wcisniety) return;

    wcisniety = false;
    przeciagam = false;
    if (svgEl?.hasPointerCapture(e.pointerId)) svgEl.releasePointerCapture(e.pointerId);

    // Dotknięcie bez ruchu też ustawia kwotę — celowanie w samą kropkę na
    // telefonie byłoby drogie. Tu (i tylko tu) rodzic zapisuje adres.
    ustaw(e, true);
  }

  /** Przeglądarka przejęła gest — najczęściej zaczęła przewijać stronę. */
  function przerwij() {
    if (!wcisniety) return;

    const zmienialismy = przeciagam;
    wcisniety = false;
    przeciagam = false;
    // Jeśli zdążyliśmy ruszyć wartością, domykamy gest, żeby adres nie został
    // z kwotą sprzed przeciągnięcia.
    if (zmienialismy) onZmiana?.(brutto, true);
  }
</script>

<figure>
  <!-- Tytuł musi nieść słowo „zysk": krzywa rośnie do 300 zł i przy pobieżnym
       spojrzeniu daje się wziąć za wykres wynagrodzenia. -->
  <figcaption>
    <span class="tytul">
      {wspolne ? 'Wasz łączny zysk przy różnych Twoich zarobkach' : 'Miesięczny zysk przy różnych zarobkach'}
    </span>
    <!-- Podpowiedź o geście jest bez treści dla kogoś, kto steruje klawiaturą
         albo czytnikiem ekranu — dla nich kwotę ustawia suwak wyżej. Osobny
         wiersz, gdy nie mieści się obok tytułu (patrz `figcaption` w stylach). -->
    <span class="podpowiedz" aria-hidden="true">kliknij lub przeciągnij, żeby zmienić kwotę</span>
  </figcaption>

  <!-- Rola `img` zostaje: dla czytnika ekranu to nadal jeden obrazek z opisem,
       a nie kontrolka. Suwak wyżej robi dokładnie to samo i ma pełną obsługę
       klawiatury, więc udawanie tu `role="slider"` bez klawiatury dołożyłoby
       drugą, gorszą i mylącą kontrolkę zamiast czegokolwiek nowego. -->
  <svg
    bind:this={svgEl}
    viewBox="0 0 {W} {H}"
    role="img"
    aria-labelledby="opis-wykresu"
    class:przeciagam
    onpointerdown={chwyc}
    onpointermove={ciagnij}
    onpointerup={pusc}
    onpointercancel={przerwij}
  >
    <title id="opis-wykresu">{opis}</title>

    <text class="podpis-osi" x="0" y="12">zysk (zł / mies.)</text>

    <!-- Pułap korzyści: krzywa go dotyka dopiero po prawej, linia pokazuje go od razu. -->
    <line class="siatka przerywana" x1={L} y1={T} x2={R} y2={T} />
    <line class="os" x1={L} y1={B} x2={R} y2={B} />

    <text class="skala" x={L - 5} y={T + 4} text-anchor="end">{liczba.format(ZYSK_MAX)}</text>
    <text class="skala" x={L - 5} y={B + 4} text-anchor="end">0</text>

    {#if widoczny(progi.poczatek)}
      <line class="siatka przerywana" x1={skalaX(progi.poczatek)} y1={T} x2={skalaX(progi.poczatek)} y2={B} />
    {/if}
    {#if widoczny(progi.pelna)}
      <line class="siatka przerywana" x1={skalaX(progi.pelna)} y1={T} x2={skalaX(progi.pelna)} y2={B} />
    {/if}

    <polygon class="obszar" points={obszar} />
    <polyline class="krzywa" points={krzywa} />

    <line class="prowadnica" x1={znacznikX} y1={B} x2={znacznikX} y2={znacznikY} />
    <circle class="halo" cx={znacznikX} cy={znacznikY} r="12" />
    <circle class="znacznik" cx={znacznikX} cy={znacznikY} r="5" />
    <!-- Niewidoczny uchwyt: sam w sobie nic nie łapie (cały SVG reaguje na
         wskaźnik), ale daje kursor „przeciągnij" dokładnie nad kropką. -->
    <circle class="chwyt" cx={znacznikX} cy={znacznikY} r="16" />

    <!-- Końce osi to nie ucięcie wykresu, tylko granice, za którymi krzywa jest
         płaska — podpis mówi to wprost, zamiast rysować symbol przerwania osi.
         Oba są dosunięte do końców osi (start / end), a nie wyśrodkowane na
         nich: dłuższy tekst inaczej wychodziłby poza SVG na wąskim ekranie. -->
    <text class="skala kraniec" x={L} y={B + 16} text-anchor="start">
      {liczba.format(MIN_X)} i mniej
    </text>
    {#if widoczny(progi.poczatek)}
      <text class="prog" x={skalaX(progi.poczatek)} y={B + 16} text-anchor="middle">
        {liczba.format(progi.poczatek)}
      </text>
    {/if}
    {#if widoczny(progi.pelna)}
      <text class="prog" x={skalaX(progi.pelna)} y={B + 16} text-anchor="middle">
        {liczba.format(progi.pelna)}
      </text>
    {/if}
    <text class="skala kraniec" x={R} y={B + 16} text-anchor="end">
      {liczba.format(maxX)} i więcej
    </text>

    <text class="podpis-osi" x={(L + R) / 2} y={H - 5} text-anchor="middle">
      wynagrodzenie brutto (zł / mies.)
    </text>
  </svg>

  <!-- Bez rezerwacji miejsca: notka wyskakuje tylko poza osią (poniżej 3 000 albo
       powyżej 20 000 zł), więc drgnięcie dotyczy skraju suwaka, a stały pusty pas
       pod wykresem widziałby każdy. Ten akapit pojawia się poza osią, a że jest pod wykresem, jego
       wejście przesuwało wszystko niżej. Wszystkie warianty siedzą więc w jednej
       komórce siatki: widoczny jest co najwyżej jeden, dwa duchy trzymają
       wysokość. Duchy dostają najszerszą możliwą kwotę, bo dłuższa liczba
       potrafi dołożyć wiersz zawijania. -->
  <div class="stos">
    {#if pozaZakresem === 'prawo'}
      <p class="poza">{@render pozaPrawo(brutto)}</p>
    {:else if pozaZakresem === 'lewo'}
      <p class="poza">{@render pozaLewo(brutto)}</p>
    {/if}

  </div>
</figure>

{#snippet pozaPrawo(kwotaPoza: number)}
  {kwota(kwotaPoza)} nie mieści się na osi — powyżej {kwota(maxX)} krzywa jest już płaska, więc
  znacznik stoi przy prawej krawędzi. Ruch po wykresie ustawi kwotę z osi.
{/snippet}

{#snippet pozaLewo(kwotaPoza: number)}
  {kwota(kwotaPoza)} nie mieści się na osi — poniżej {kwota(MIN_X)} zysk wciąż wynosi zero, więc
  znacznik stoi przy lewej krawędzi. Ruch po wykresie ustawi kwotę z osi.
{/snippet}

<style>
  figure {
    margin: 0 0 1.75rem;
  }

  /* Tytuł i podpowiedź stoją obok siebie, dopóki się mieszczą; na wąskim
     ekranie podpowiedź spada do drugiego wiersza zamiast łamać tytuł. */
  figcaption {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .tytul {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--tekst);
  }

  .podpowiedz {
    font-size: 0.8125rem;
    color: var(--tekst-cichy);
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
    cursor: pointer;
    /* Sterujemy wyłącznie w poziomie, więc gest pionowy oddajemy przeglądarce:
       palcem położonym na wykresie nadal da się przewinąć stronę, a poziome
       przeciągnięcie zostaje u nas. `touch-action: none` byłoby tu pułapką —
       wykres jest szeroki i płaski, łatwo o niego zawadzić kciukiem, a strona
       sprawiałaby wtedy wrażenie zawieszonej. */
    touch-action: pan-y;
    /* Przeciąganie myszą nie ma zaznaczać podpisów osi. */
    -webkit-user-select: none;
    user-select: none;
  }

  svg.przeciagam {
    cursor: ew-resize;
  }

  .chwyt {
    fill: transparent;
    cursor: ew-resize;
  }

  /* Delikatna obwódka wokół kropki — mówi „to się da złapać", nie zabierając
     uwagi samej krzywej. Na dotyku hover potrafi zostać na stałe, więc tam
     pokazuje się tylko w trakcie przeciągania. */
  .halo {
    fill: var(--akcent);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
  }

  @media (hover: hover) {
    svg:hover .halo {
      opacity: 0.18;
    }
  }

  svg.przeciagam .halo {
    opacity: 0.28;
  }

  @media (prefers-reduced-motion: reduce) {
    .halo {
      transition: none;
    }
  }

  /* Rozmiar tekstu jest w jednostkach viewBox, więc skaluje się razem z wykresem.
     Jedna wartość na wąskie ekrany, druga na szerokie — inaczej podpisy są albo
     nieczytelne na telefonie, albo przesadnie duże na monitorze. */
  text {
    font-size: 12px;
    fill: var(--tekst-cichy);
  }

  @media (min-width: 30rem) {
    text {
      font-size: 8px;
    }
  }

  .prog {
    fill: var(--tekst);
    font-weight: 500;
  }

  /* Podpisy krańców są dłuższe od reszty skali i sąsiadują z progiem 14 776 —
     odrobinę mniejsze, żeby na wąskim ekranie zostawić między nimi odstęp. */
  .kraniec {
    font-size: 11px;
  }

  @media (min-width: 30rem) {
    .kraniec {
      font-size: 7.5px;
    }
  }

  /* Kreski mają zostać włosowe niezależnie od tego, jak mocno SVG się rozciągnie. */
  .os,
  .siatka,
  .prowadnica,
  .krzywa {
    vector-effect: non-scaling-stroke;
    fill: none;
  }

  .os {
    stroke: var(--linia);
    stroke-width: 1;
  }

  .siatka {
    stroke: var(--linia);
    stroke-width: 1;
  }

  .przerywana {
    stroke-dasharray: 3 3;
  }

  .obszar {
    fill: color-mix(in srgb, var(--akcent) 12%, transparent);
    stroke: none;
  }

  .krzywa {
    stroke: var(--akcent);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .prowadnica {
    stroke: var(--akcent);
    stroke-width: 1;
    opacity: 0.45;
  }

  .znacznik {
    fill: var(--akcent);
    stroke: var(--tlo);
    stroke-width: 2;
  }

  /* Wszystkie warianty w jednej komórce — wysokość to maksimum z nich, liczone
     przez przeglądarkę przy każdej szerokości, bez mierzenia czegokolwiek w JS. */
  .stos {
    display: grid;
  }

  .stos > * {
    grid-area: 1 / 1;
  }

  .poza {
    margin: 0.5rem 0 0;
    font-size: 0.8125rem;
    color: var(--tekst-cichy);
  }
</style>
