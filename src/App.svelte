<script lang="ts">
  import Kalkulator from './lib/Kalkulator.svelte';
</script>

<main>
  <header>
    <p class="zastrzezenie">
      <strong>To zapowiedź, nie obowiązujące prawo.</strong> Rząd ogłosił zmianę 19 sierpnia 2026 r.
      Projektu ustawy jeszcze nie ma, więc kształt reformy może się zmienić albo może ona nie wejść
      w życie wcale.
    </p>

    <h1>Ile zyskasz na zmianie PIT od 2027&nbsp;r.?</h1>
    <p class="podtytul">
      Nowa skala podatkowa ma podnieść pierwszy próg ze 120&nbsp;000 do 130&nbsp;000&nbsp;zł i wstawić
      pośrednią stawkę 24% do 150&nbsp;000&nbsp;zł. Sprawdź, co to znaczy dla Twojej wypłaty.
    </p>
  </header>

  <Kalkulator />

  <footer>
    <p>
      Wyliczenia mają charakter poglądowy i nie są poradą podatkową. Model zakłada umowę o pracę,
      podstawowe koszty uzyskania przychodu, złożony PIT-2, brak ulg i brak PPK. Liczy w skali roku,
      więc może różnić się o kilka złotych od sumy dwunastu zaliczek.
    </p>
    <p>
      Wszystko liczy się w Twojej przeglądarce — żadne dane nie są nigdzie wysyłane.
      <a href="https://github.com/mkondratek/pit-2027">Kod źródłowy na GitHubie</a>.
      <a href="/polityka-prywatnosci">Polityka prywatności</a>.
    </p>
  </footer>
</main>

<style>
  main {
    max-width: 46rem;
    margin: 0 auto;
    padding: 2rem 1.25rem 4rem;
  }

  .zastrzezenie {
    background: var(--neutralny-tlo);
    border: 1px solid color-mix(in srgb, var(--neutralny) 30%, transparent);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    color: var(--neutralny);
    margin: 0 0 2rem;
  }

  h1 {
    font-size: clamp(1.75rem, 5vw, 2.5rem);
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin: 0 0 0.75rem;
  }

  .podtytul {
    color: var(--tekst-cichy);
    margin: 0 0 2.5rem;
    max-width: 34rem;
  }

  footer {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--linia);
    font-size: 0.8125rem;
    color: var(--tekst-cichy);
  }

  footer p {
    margin: 0 0 0.75rem;
  }

  a {
    color: inherit;
  }
</style>
