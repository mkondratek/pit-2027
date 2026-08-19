<script lang="ts">
  import {
    BRUTTO_PELNA_KORZYSC,
    BRUTTO_POCZATEK_KORZYSCI,
    MAKSYMALNA_KORZYSC_ROCZNA,
    porownaj,
  } from '../tax/engine';
  import { kwota } from './format';

  let {
    brutto,
    onZmiana,
  }: {
    brutto: number;
    /**
     * Wykres nie tylko rysuje — wskazanie miejsca na nim ustawia wynagrodzenie.
     * `zakonczone` mówi, czy gest już się skończył: rodzic ma wtedy zapisać adres
     * URL, dokładnie tak jak suwak robi to na `onchange`, a nie na każdym ruchu.
     */
    onZmiana?: (wartosc: number, zakonczone: boolean) => void;
  } = $props();

  /**
   * Zakres osi poziomej. Dół to minimum suwaka, góra jest dobrana tak, żeby oba
   * załamania wypadły mniej więcej w połowie i w dwóch trzecich szerokości, a za
   * nimi został widoczny kawałek płaskowyżu. Wpisać można do 100 000 zł, ale
   * rozciąganie osi aż tam spłaszczyłoby całą treść wykresu do jednego piksela —
   * powyżej 20 000 zł krzywa i tak jest pozioma, więc znacznik dostawiamy do
   * krawędzi i mówimy o tym wprost pod wykresem.
   */
  const MIN_X = 3_000;
  const MAX_X = 20_000;
  const ZYSK_MAX = MAKSYMALNA_KORZYSC_ROCZNA / 12;

  /**
   * Najszersza kwota, jaka może trafić do notki pod wykresem — tyle, ile
   * najwyżej przyjmuje pole wynagrodzenia. Nie jest częścią rysunku: służy
   * wyłącznie do zarezerwowania wysokości tej notki (patrz `.stos` w znaczniku).
   */

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

  const skalaX = (b: number) => L + ((b - MIN_X) / (MAX_X - MIN_X)) * (R - L);
  const skalaY = (z: number) => B - (Math.min(z, ZYSK_MAX) / ZYSK_MAX) * (B - T);

  /**
   * Krzywa nie zależy od tego, co użytkownik wpisał — to ta sama funkcja dla
   * wszystkich — więc liczy się raz przy tworzeniu komponentu, a nie w $derived
   * przy każdym ruchu suwaka. Krok 100 zł wystarcza na gładką linię; oba progi
   * dokładamy osobno, żeby załamania były ostre, a nie ścięte próbkowaniem.
   */
  const krzywa = (() => {
    const punkty = new Set<number>([BRUTTO_POCZATEK_KORZYSCI, BRUTTO_PELNA_KORZYSC]);
    for (let b = MIN_X; b <= MAX_X; b += 100) punkty.add(b);

    return [...punkty]
      .sort((a, b) => a - b)
      .map((b) => `${skalaX(b).toFixed(1)},${skalaY(porownaj(b).zyskMiesiecznie).toFixed(1)}`)
      .join(' ');
  })();

  const obszar = `${L},${B} ${krzywa} ${R},${B}`;

  const progX = skalaX(BRUTTO_POCZATEK_KORZYSCI);
  const pelnyX = skalaX(BRUTTO_PELNA_KORZYSC);

  const zysk = $derived(porownaj(brutto).zyskMiesiecznie);
  const pozaZakresem = $derived(brutto > MAX_X ? 'prawo' : brutto < MIN_X ? 'lewo' : null);
  const znacznikX = $derived(skalaX(Math.min(MAX_X, Math.max(MIN_X, brutto))));
  const znacznikY = $derived(skalaY(zysk));

  // `useGrouping: always`, bo domyślnie pl-PL nie grupuje liczb czterocyfrowych
  // i na osi obok „11 878" wypadałoby „3000".
  const liczba = new Intl.NumberFormat('pl-PL', {
    maximumFractionDigits: 0,
    useGrouping: 'always',
  });

  const opis = $derived(
    `Wykres zysku miesięcznego w zależności od wynagrodzenia brutto, od ${liczba.format(MIN_X)} do ` +
      `${liczba.format(MAX_X)} zł. Do ${kwota(BRUTTO_POCZATEK_KORZYSCI)} brutto zysk wynosi zero, ` +
      `potem rośnie, a od ${kwota(BRUTTO_PELNA_KORZYSC)} zatrzymuje się na ${kwota(ZYSK_MAX)} ` +
      `miesięcznie. Dla ${kwota(brutto)} brutto zysk wynosi ${kwota(zysk)} miesięcznie.`,
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
    const surowe = MIN_X + ((x - L) / (R - L)) * (MAX_X - MIN_X);

    return Math.min(MAX_X, Math.max(MIN_X, Math.round(surowe / KROK) * KROK));
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
  <figcaption>
    Jak zysk zmienia się z zarobkami
    <!-- Podpowiedź o geście jest bez treści dla kogoś, kto steruje klawiaturą
         albo czytnikiem ekranu — dla nich kwotę ustawia suwak wyżej. -->
    <span class="podpowiedz" aria-hidden="true">— kliknij lub przeciągnij, żeby zmienić kwotę</span>
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

    <line class="siatka przerywana" x1={progX} y1={T} x2={progX} y2={B} />
    <line class="siatka przerywana" x1={pelnyX} y1={T} x2={pelnyX} y2={B} />

    <polygon class="obszar" points={obszar} />
    <polyline class="krzywa" points={krzywa} />

    <line class="prowadnica" x1={znacznikX} y1={B} x2={znacznikX} y2={znacznikY} />
    <circle class="halo" cx={znacznikX} cy={znacznikY} r="12" />
    <circle class="znacznik" cx={znacznikX} cy={znacznikY} r="5" />
    <!-- Niewidoczny uchwyt: sam w sobie nic nie łapie (cały SVG reaguje na
         wskaźnik), ale daje kursor „przeciągnij" dokładnie nad kropką. -->
    <circle class="chwyt" cx={znacznikX} cy={znacznikY} r="16" />

    <text class="skala" x={L} y={B + 16} text-anchor="middle">{liczba.format(MIN_X)}</text>
    <text class="prog" x={progX} y={B + 16} text-anchor="middle">
      {liczba.format(BRUTTO_POCZATEK_KORZYSCI)}
    </text>
    <text class="prog" x={pelnyX} y={B + 16} text-anchor="middle">
      {liczba.format(BRUTTO_PELNA_KORZYSC)}
    </text>
    <text class="skala" x={R} y={B + 16} text-anchor="end">{liczba.format(MAX_X)}</text>

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
  {kwota(kwotaPoza)} nie mieści się na osi — powyżej {kwota(MAX_X)} krzywa jest już płaska, więc
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

  figcaption {
    font-size: 0.875rem;
    color: var(--tekst-cichy);
    margin-bottom: 0.375rem;
  }

  .podpowiedz {
    color: color-mix(in srgb, var(--tekst-cichy) 75%, transparent);
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
