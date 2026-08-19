<script lang="ts">
  import {
    BRUTTO_PELNA_KORZYSC,
    BRUTTO_POCZATEK_KORZYSCI,
    MAKSYMALNA_KORZYSC_ROCZNA,
    porownaj,
  } from '../tax/engine';
  import { kwota } from './format';

  let { brutto }: { brutto: number } = $props();

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
</script>

<figure>
  <figcaption>Jak zysk zmienia się z zarobkami</figcaption>

  <svg viewBox="0 0 {W} {H}" role="img" aria-labelledby="opis-wykresu">
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
    <circle class="znacznik" cx={znacznikX} cy={znacznikY} r="5" />

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

  {#if pozaZakresem === 'prawo'}
    <p class="poza">
      {kwota(brutto)} nie mieści się na osi — powyżej {kwota(MAX_X)} krzywa jest już płaska, więc
      znacznik stoi przy prawej krawędzi.
    </p>
  {:else if pozaZakresem === 'lewo'}
    <p class="poza">
      {kwota(brutto)} nie mieści się na osi — poniżej {kwota(MIN_X)} zysk wciąż wynosi zero, więc
      znacznik stoi przy lewej krawędzi.
    </p>
  {/if}
</figure>

<style>
  figure {
    margin: 0 0 1.75rem;
  }

  figcaption {
    font-size: 0.875rem;
    color: var(--tekst-cichy);
    margin-bottom: 0.375rem;
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
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

  .poza {
    margin: 0.5rem 0 0;
    font-size: 0.8125rem;
    color: var(--tekst-cichy);
  }
</style>
