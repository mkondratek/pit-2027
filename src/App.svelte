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
    <p class="zakres">
      Zmiana obejmuje wyłącznie skalę podatkową — umowę o pracę, zlecenie, emeryturę. Kalkulator
      liczy umowę o pracę; podatku liniowego 19% ani ryczałtu zapowiedź nie zmienia.
    </p>
  </header>

  <Kalkulator />

  <section class="zrodla">
    <h2>Na czym to się opiera</h2>

    <p>
      Kształt zapowiadanej skali pochodzi z komunikatów rządowych z 19 sierpnia 2026 r., nie
      z doniesień prasowych:
    </p>

    <ul>
      <li>
        <a href="https://www.gov.pl/web/finanse/korzystne-zmiany-w-systemie-podatkowym">
          Ministerstwo Finansów — Korzystne zmiany w systemie podatkowym
        </a>
      </li>
      <li>
        <a href="https://www.gov.pl/web/premier/sprawiedliwy-system-podatkowy--propozycje-zmian">
          KPRM — Sprawiedliwy system podatkowy: propozycje zmian
        </a>
      </li>
      <li>
        <a
          href="https://www.gov.pl/web/premier/sprawiedliwsze-podatki-i-wiecej-w-portfelach-polek-i-polakow"
        >
          KPRM — Sprawiedliwsze podatki i więcej w portfelach Polek i Polaków
        </a>
      </li>
    </ul>

    <p>
      W chwili publikacji nie istnieje projekt ustawy — nie ma go ani w wykazie prac
      legislacyjnych, ani na RCL, ani jako druk sejmowy. Dlatego kalkulator pokazuje, co
      wynikałoby z zapowiedzi, a nie co obowiązuje.
    </p>

    <p>
      Sam sposób liczenia wynagrodzenia jest zwykłą listą płac: składki 13,71%, zdrowotna 9%,
      koszty uzyskania przychodu 250 zł, kwota zmniejszająca 300 zł miesięcznie, zaokrąglenia
      wg art. 63 §1 Ordynacji podatkowej. Model odtwarza kwoty, które przy tej zapowiedzi
      opublikowały Bankier i money.pl — jeśli któraś się nie zgadza, to mój błąd i chętnie go
      poprawię.
    </p>
  </section>

  <footer>
    <p>
      Wyliczenia mają charakter poglądowy i nie są poradą podatkową. Model zakłada
      podstawowe koszty uzyskania przychodu, złożony PIT-2, brak ulg i brak PPK. Liczy w skali roku,
      więc może różnić się o kilka złotych od sumy dwunastu zaliczek.
    </p>
    <p>
      Wszystko liczy się w Twojej przeglądarce — żadne dane nie są nigdzie wysyłane.
      <a href="https://github.com/mkondratek/pit-2027">Kod źródłowy jest otwarty</a>, więc sposób
      wyliczeń można sprawdzić samemu.
      <a href="/polityka-prywatnosci">Polityka prywatności</a>.
    </p>
    <p>
      Coś się nie zgadza?
      <a href="https://github.com/mkondratek/pit-2027/issues/new">Zgłoś błąd</a> — przepisy wokół tej
      zmiany dopiero powstają, więc poprawki są mile widziane.
    </p>
    <p class="podpis">
      Autorem strony jest Mikołaj Kondratek — programista, nie doradca podatkowy ·
      <a href="https://www.linkedin.com/in/mkondratek/">LinkedIn</a> ·
      <a href="https://github.com/mkondratek">GitHub</a>
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
    margin: 0 0 0.6rem;
    max-width: 34rem;
  }

  .zakres {
    color: var(--tekst-cichy);
    font-size: 0.875rem;
    margin: 0 0 1.75rem;
    max-width: 34rem;
  }

  .zrodla {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--linia);
    font-size: 0.875rem;
    color: var(--tekst-cichy);
  }

  .zrodla h2 {
    font-size: 0.9375rem;
    color: var(--tekst);
    margin: 0 0 0.75rem;
  }

  .zrodla p {
    margin: 0 0 0.75rem;
  }

  .zrodla ul {
    margin: 0 0 0.75rem;
    padding-left: 1.1rem;
  }

  .zrodla li {
    margin-bottom: 0.25rem;
  }

  footer {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--linia);
    font-size: 0.8125rem;
    color: var(--tekst-cichy);
  }

  footer p {
    margin: 0 0 0.75rem;
  }

  .podpis {
    margin-top: 1.25rem;
    color: var(--tekst);
  }

  a {
    color: inherit;
  }
</style>
