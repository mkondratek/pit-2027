<script lang="ts">
  import { PLACA_MINIMALNA } from '../tax/constants';
  import {
    BRUTTO_PELNA_KORZYSC,
    BRUTTO_POCZATEK_KORZYSCI,
    MAKSYMALNA_KORZYSC_ROCZNA,
    porownaj,
  } from '../tax/engine';
  import WykresZysku from './WykresZysku.svelte';
  import { kwota, kwotaDokladna, zeZnakiem } from './format';
  import { odczytajBrutto, zapiszBrutto } from './url';

  // Suwak obejmuje zakres, w którym cokolwiek się dzieje. Wpisać z ręki można
  // znacznie więcej, bo powyżej suwaka zysk wprawdzie stoi w miejscu, ale netto
  // rośnie dalej — przycięcie kwoty pokazywałoby komuś cudzą wypłatę jako jego.
  const MIN_SUWAK = 3_000;
  const MAX_SUWAK = 30_000;
  const MIN_POLE = 1_000;
  const MAX_POLE = 100_000;

  const startowe = wZakresiePola(odczytajBrutto(12_000));

  /** Kwota, na której liczy silnik — zawsze skończona liczba, nigdy pusta. */
  let brutto = $state(startowe);

  /**
   * Treść pola trzymana osobno od kwoty: w trakcie pisania wolno jej być pustej
   * albo spoza zakresu, bo „1", „12", „123" to etapy wpisywania 13 000, a nie
   * błędy do naprawienia.
   */
  let pole = $state(String(startowe));

  let rozwiniete = $state(false);

  const wynik = $derived(porownaj(brutto));
  const zyskuje = $derived(wynik.zyskRocznie > 0);
  const doProgu = $derived(Math.max(0, BRUTTO_POCZATEK_KORZYSCI - brutto));
  const naPlaskowyzu = $derived(brutto > BRUTTO_PELNA_KORZYSC);
  const ponizejMinimalnej = $derived(brutto < PLACA_MINIMALNA);

  // Jednorazowo po wczytaniu, żeby adres dało się skopiować, zanim ktoś dotknie
  // pola. Później zapisują już tylko zakończona edycja i puszczony suwak —
  // zapis na każdym znaku wpisywał do adresu wartości pośrednie.
  $effect(() => {
    zapiszBrutto(startowe);
  });

  function wZakresiePola(wartosc: number): number {
    return Math.min(MAX_POLE, Math.max(MIN_POLE, Math.round(wartosc)));
  }

  function wZakresieSuwaka(wartosc: number): number {
    return Math.min(MAX_SUWAK, Math.max(MIN_SUWAK, Math.round(wartosc)));
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
    zapiszBrutto(brutto);
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
    max={MAX_SUWAK}
    step="100"
    aria-label="Wynagrodzenie brutto miesięcznie"
    value={Math.min(brutto, MAX_SUWAK)}
    oninput={(e) => przesun(e.currentTarget.valueAsNumber)}
    onchange={() => zapiszBrutto(brutto)}
  />
</section>

<section class="wynik" class:zyskuje aria-live="polite">
  {#if zyskuje}
    <p class="etykieta">Na rękę dostaniesz miesięcznie</p>
    <p class="liczba">{zeZnakiem(wynik.zyskMiesiecznie)}</p>
    <p class="rocznie">
      To {kwota(wynik.zyskRocznie)} przez cały rok
      {#if wynik.zyskRocznie === MAKSYMALNA_KORZYSC_ROCZNA}
        — czyli maksimum, jakie ta zmiana daje komukolwiek
      {/if}
    </p>
  {:else}
    <p class="etykieta">Dla Ciebie ta zmiana oznacza</p>
    <p class="liczba">0 zł</p>
    <p class="rocznie">
      Nowa skala zmienia wynagrodzenie od {kwota(BRUTTO_POCZATEK_KORZYSCI)} brutto —
      brakuje {kwota(doProgu)} podwyżki. Reforma dotyczy mniej więcej co dziesiątego
      podatnika.
    </p>
  {/if}
</section>

<section class="porownanie">
  <div>
    <p class="rok">dziś</p>
    <p class="netto">{kwota(wynik.przed.nettoMiesiecznie)}</p>
    <p class="opis">netto miesięcznie</p>
  </div>

  <div class="strzalka" aria-hidden="true">→</div>

  <div>
    <p class="rok">od 2027</p>
    <p class="netto" class:wyroznione={zyskuje}>{kwota(wynik.po.nettoMiesiecznie)}</p>
    <p class="opis">netto miesięcznie</p>
  </div>
</section>

<WykresZysku {brutto} />

{#if naPlaskowyzu}
  <p class="uwaga">
    Powyżej {kwota(BRUTTO_PELNA_KORZYSC)} brutto sam zysk już nie rośnie — wyższa pensja oznacza
    wyższe netto, ale ta konkretna zmiana daje zawsze te same {kwota(MAKSYMALNA_KORZYSC_ROCZNA)}
    rocznie.
  </p>
{:else if ponizejMinimalnej}
  <p class="uwaga">
    To mniej niż płaca minimalna ({kwota(PLACA_MINIMALNA)} w 2026 r.), która obowiązuje przy pełnym
    etacie. Przy niepełnym taka kwota jest jak najbardziej możliwa i wyliczenie pozostaje poprawne.
  </p>
{/if}

<details bind:open={rozwiniete}>
  <summary>
    <span class="znacznik" aria-hidden="true"></span>
    Skąd ta liczba
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
  </p>
</details>

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
    margin-top: 1rem;
    accent-color: var(--akcent);
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

  .rocznie {
    margin: 0.75rem auto 0;
    max-width: 28rem;
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
