<script lang="ts">
  import Kalkulator from './lib/Kalkulator.svelte';
  import Udostepnij from './lib/Udostepnij.svelte';
  import { kwota } from './lib/format';
  import { SKALA } from './tax/constants';
  import { BRUTTO_POCZATEK_KORZYSCI } from './tax/engine';

  const MODEL = 'https://github.com/mkondratek/pit-2027/blob/main/model.md';

  /**
   * Liczby w odpowiedzi o próg czytamy ze stałych, a nie wpisujemy z ręki.
   *
   * FAQ mówi o **mechanizmie** („skąd w ogóle bierze się próg w złotówkach"),
   * więc podaje jeden przykład, a nie wartość dla bieżących ustawień — te są
   * w kalkulatorze wyżej i zmieniają się z każdą opcją. Nawet przykład ma
   * jednak przestać być prawdziwy razem z modelem, a nie przeżyć go w tekście:
   * dzisiejsza poprawka odliczenia składek przesunęła próg z ulgą z 20 139 zł
   * na 19 007 zł i każda liczba wklepana gdziekolwiek w prozie stała się przez
   * to podejrzana.
   */
  const PROG_DZIS = SKALA[2026][0].do;

  let faqOtwarte = $state(false);
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
      koszty uzyskania przychodu 250 zł (albo 300 zł poza miejscowością zakładu pracy), wpłaty PPK
      2% pracownika i 1,5% pracodawcy, kwota zmniejszająca 300 zł miesięcznie, zaokrąglenia
      wg art. 63 §1 Ordynacji podatkowej. Model odtwarza kwoty, które przy tej zapowiedzi
      opublikowały Bankier i money.pl — jeśli któraś się nie zgadza, to mój błąd i chętnie go
      poprawię.
    </p>
  </section>

  <!-- FAQ zbiera pytania, które wracają z LinkedIna, ale nie może rozdąć strony,
       której siłą jest jeden ekran. Stąd jeden `details` na całą sekcję zamiast
       pięciu osobnych: w stanie zwiniętym to jeden wiersz, a po otwarciu pięć
       krótkich odpowiedzi czyta się ciągiem — na telefonie osobne rozwijaki
       kazałyby stukać pięć razy, żeby przeczytać ekran tekstu. Nagłówek siedzi
       w `summary`, więc h2 zostaje w konspekcie strony także zwinięty. -->
  <details class="faq" bind:open={faqOtwarte}>
    <summary>
      <span class="znacznik" aria-hidden="true"></span>
      <h2>Częste pytania</h2>
      <!-- Stan i tak ogłasza czytnik ekranu przez samo details — to wyłącznie
           wizualna zachęta do kliknięcia, jak przy „Skąd ta liczba?". -->
      <span class="podpowiedz" aria-hidden="true">{faqOtwarte ? 'ukryj' : 'pokaż'}</span>
    </summary>

    <h3>Dlaczego u mnie wychodzi zero?</h3>
    <p>
      Zapowiedź podnosi granicę pierwszego progu, więc z definicji zmienia coś tylko tym, którzy
      ten próg przekraczali — niżej podatek zostaje dokładnie taki sam. Warto przy tym pamiętać,
      że z wypłaty najwięcej zabierają składki ZUS i zdrowotna, przy niższych zarobkach
      wielokrotnie większe od samego PIT, a ich reforma nie rusza w ogóle.
    </p>

    <h3>Skąd się biorą progi podane w złotówkach brutto?</h3>
    <p>
      Zmiana zaczyna działać powyżej {kwota(PROG_DZIS)} rocznego <em>dochodu</em>, bo tam kończy
      się dzisiejszy pierwszy próg. Na umowie o pracę, bez ulg i bez PPK, po doliczeniu składek
      i kosztów uzyskania przychodu wychodzi z tego mniej więcej
      {kwota(BRUTTO_POCZATEK_KORZYSCI)} brutto miesięcznie. To przykład jednej drogi od dochodu
      do wynagrodzenia, a nie stała: ulga dla młodych, umowa zlecenia i PPK przesuwają tę kwotę
      o tysiące złotych, więc próg dla Twoich ustawień podaje kalkulator wyżej. Całe wyprowadzenie
      jest w <a href={MODEL}>model.md</a>, a źródła samej skali w sekcji „Na czym to się opiera”
      wyżej.
    </p>

    <h3>A co z B2B, podatkiem liniowym i ryczałtem?</h3>
    <p>
      Ta strona liczy wyłącznie zmianę skali podatkowej, a ta obejmuje umowę o pracę, zlecenie
      i emeryturę. Na podatku liniowym 19% sama skala nie zmienia nic i tej formy kalkulator
      nie liczy.
      <!-- Zdanie stało tu wcześniej w brzmieniu „zapowiedź dotyczy wyłącznie skali podatkowej",
           co było po prostu nieprawdą i przeczyło własnemu silnikowi: `constants.ts` modeluje
           daninę 4% → 5% i nazywa ją składnikiem *pakietu*. Czytelnik, który chce ocenić tę
           reformę całościowo, potrzebuje wiedzieć, że skala to jej część, a nie całość. -->
      Zapowiedziany pakiet jest jednak szerszy niż sama skala. Obejmuje też podniesienie CIT
      z 19% na 22% dla firm o przychodach powyżej 50 mln euro i dla podatkowych grup
      kapitałowych, przywrócenie limitu 250 tys. euro dla ryczałtu, zmianę ulgi IP Box oraz
      wzrost daniny solidarnościowej z 4% na 5%. Z tego wszystkiego kalkulator uwzględnia
      wyłącznie daninę, bo jako jedyna dotyczy osób rozliczających się według skali.
      Do liczenia podatków na B2B, umowie o pracę i zleceniu w ogóle, łącznie z porównaniem
      form opodatkowania, dobrym narzędziem jest
      <a href="https://ladnepodatki.pl">ladnepodatki.pl</a>.
    </p>

    <h3>Czy to już pewne?</h3>
    <p>
      Nie. Jest komunikat rządowy z 19 sierpnia 2026 r., nie ma projektu ustawy — kształt skali
      może się jeszcze zmienić, a reforma może nie wejść w życie wcale. To samo mówi ramka na
      górze strony, ale pytanie wraca zbyt często, żeby je tu pominąć.
    </p>

    <h3>Kto to policzył i skąd mam wiedzieć, że dobrze?</h3>
    <p>
      Stronę napisał Mikołaj Kondratek — programista, nie doradca podatkowy, więc nie trzeba mu
      wierzyć na słowo. <a href="https://github.com/mkondratek/pit-2027">Kod jest otwarty</a>,
      model opisany krok po kroku, a testy pilnują, żeby wyliczenia odtwarzały kwoty, które przy
      tej zapowiedzi opublikowały Bankier i money.pl.
    </p>
  </details>

  <footer>
    <p>
      <!-- Wyliczanie, co się przełącza w wierszu założeń, stało tu kiedyś obok
           listy parametrów w „Na czym to się opiera" — a przede wszystkim obok
           samego wiersza założeń, który wypisuje bieżące ustawienia i ma przy
           sobie „zmień". Zdanie tłumaczyło więc rzecz widoczną na ekranie.
           Zostaje to, czego nie mówi nic innego: status porady i skala roku. -->
      Wyliczenia mają charakter poglądowy i nie są poradą podatkową. Model zakłada złożony PIT-2
      i liczy w skali roku, więc może różnić się o kilka złotych od sumy dwunastu zaliczek.
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
    <Udostepnij />

    <p class="podpis">
      Autorem strony jest Mikołaj Kondratek — programista, nie doradca podatkowy ·
      <a href="https://www.linkedin.com/in/mkondratek/">LinkedIn</a> ·
      <a href="https://github.com/mkondratek">GitHub</a>
    </p>
  </footer>
</main>

<style>
  main {
    /* Dwie świadome krawędzie łamania w nagłówku:
       - krawędź konstrukcyjna = pełna szerokość kolumny (46rem minus padding),
         trzyma ją zastrzeżenie, h1 oraz cała treść poniżej;
       - miara prozy = ok. 2/3 kolumny, trzyma ją lid pod tytułem.
       Wcięcie jest celowo wyraźne (~69% kolumny), żeby czytało się jako
       osobna kolumna tekstu, a nie jako niedociągnięta krawędź. */
    --miara-prozy: 30rem;

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

  /* Dwa stopnie pisma o dwóch rolach: pytanie (h1) i wyjaśnienie (.podtytul).
     Duży tekst dostaje ciaśniejszą interlinię, mniejszy luźniejszą — stąd
     1.15 i 1.5. */
  h1 {
    font-size: clamp(1.75rem, 5vw, 2.5rem);
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin: 0 0 0.75rem;
    text-wrap: balance;
  }

  /* Lid: skaluje się razem z tytułem (16 px na telefonie, 18 px od ~736 px,
     czyli od szerokości, na której kolumna przestaje rosnąć). Pełny kontrast
     tekstu — to treść główna, nie przypis, i jedyny akapit między tytułem
     a kalkulatorem. */
  .podtytul {
    max-width: var(--miara-prozy);
    font-size: clamp(1rem, 0.85rem + 0.6vw, 1.125rem);
    line-height: 1.5;
    color: var(--tekst);
    /* Odstęp do kalkulatora, nie do akapitu pod spodem: lid jest teraz
       ostatnią rzeczą w nagłówku, więc bierze na siebie tyle marginesu,
       ile stało pod zniesionym zastrzeżeniem o zakresie. */
    margin: 0 0 1.5rem;
    text-wrap: pretty;
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

  /* Wygląd rozwijaka jest świadomą kopią „Skąd ta liczba?" z Kalkulator.svelte,
     nie przypadkiem: obie rzeczy otwierają dodatkową treść, więc mają wyglądać
     na rodzeństwo. Kopia, a nie wspólna reguła w app.css, bo style Svelte są
     zakresowane do komponentu — wyniesienie ich globalnie znaczyłoby albo
     zostawić w Kalkulatorze martwe duplikaty (nie wolno go ruszać, a i tak
     wygrywałyby specyficznością), albo globalnie przestylować każdy `summary`
     na stronie, co jest większym zasięgiem niż potrzeba na jedną sekcję. */
  .faq {
    margin-top: 1.5rem;
    font-size: 0.875rem;
    color: var(--tekst-cichy);
  }

  .faq summary {
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
    /* Własny znacznik zamiast systemowego trójkąta: `list-style` gasi go
       w Firefoksie i nowym Chrome, `::-webkit-details-marker` w Safari. */
    list-style: none;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;
  }

  .faq summary::-webkit-details-marker {
    display: none;
  }

  /* Nagłówek siedzi w `summary` tylko po to, żeby hierarchia h1 → h2 była
     zachowana bez dokładania osobnego wiersza nad rozwijakiem — wizualnie ma
     być etykietą przycisku, a nie tytułem sekcji, stąd stopień i grubość jak
     w „Skąd ta liczba?". */
  .faq summary h2 {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--tekst);
  }

  .faq summary:hover {
    background: var(--akcent-tlo);
    border-color: color-mix(in srgb, var(--akcent) 40%, var(--linia));
  }

  .faq summary:focus-visible {
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

  .faq[open] .znacznik {
    transform: rotate(45deg);
  }

  .faq summary:hover .znacznik,
  .faq summary:focus-visible .znacznik {
    color: var(--akcent);
  }

  .podpowiedz {
    margin-left: auto;
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--tekst-cichy);
  }

  .faq summary:hover .podpowiedz {
    color: var(--akcent);
  }

  /* Pytania czytają się jako lista, więc odstęp nad pytaniem jest wyraźnie
     większy niż pod nim — para pytanie-odpowiedź trzyma się razem. */
  .faq h3 {
    margin: 1.25rem 0 0.375rem;
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.45;
    color: var(--tekst);
  }

  .faq p {
    margin: 0;
    text-wrap: pretty;
  }

  /* Płynne rozwijanie bez mierzenia wysokości w JS — tylko tam, gdzie
     przeglądarka umie animować do `auto`. Gdzie nie umie, otwiera się skokowo. */
  @supports (interpolate-size: allow-keywords) and (selector(::details-content)) {
    .faq {
      interpolate-size: allow-keywords;
    }

    .faq::details-content {
      block-size: 0;
      overflow: hidden;
      opacity: 0;
      transition:
        block-size 0.25s ease,
        opacity 0.2s ease,
        content-visibility 0.25s allow-discrete;
    }

    .faq[open]::details-content {
      block-size: auto;
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .faq summary,
    .znacznik,
    .faq::details-content {
      transition: none;
    }
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
