<script lang="ts">
  import { tick } from 'svelte';

  /**
   * Udostępnianie strony.
   *
   * Link jest **czysty** — bez kwoty i bez ustawień. To sedno, nie
   * niedoróbka: nikt nie rozsyła znajomym własnej pensji. Ludzie polecają
   * narzędzie („sprawdź sobie"), a nie swój wynik.
   *
   * Przy okazji zamyka to nieprzyjemną dziurę: pasek adresu **niesie** wpisaną
   * kwotę, więc dotąd jedyna droga udostępnienia — skopiowanie adresu —
   * wysyłała czyjeś zarobki razem z linkiem. Kto chce podzielić się konkretnym
   * scenariuszem, nadal może skopiować adres ręcznie; to świadomy wyjątek.
   */
  const ADRES = 'https://pit.kondratek.pl/';

  let skopiowano = $state(false);
  let awaryjnie = $state(false);
  let poleAdresu: HTMLInputElement | undefined = $state();
  let licznikPowrotu: ReturnType<typeof setTimeout> | undefined;

  async function udostepnij() {
    // Na telefonie natywny arkusz — jedno dotknięcie do Messengera czy
    // WhatsAppa, czyli tam, gdzie te linki naprawdę krążą.
    //
    // Samo `navigator.share` nie wystarczy do rozpoznania telefonu: Chrome na
    // macOS i Windowsie też je ma, a wywołanie na desktopie otwiera systemowy
    // arkusz zamiast po prostu skopiować link — czego nikt tam nie oczekuje.
    // `pointer: coarse` pyta o to, o co naprawdę chodzi: czy to palec.
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      // Anulowanie arkusza rzuca wyjątkiem i nie jest błędem — użytkownik
      // właśnie powiedział „nie", nie ma o czym informować.
      try {
        await navigator.share({ title: document.title, url: ADRES });
      } catch {
        /* rozmyślił się */
      }
      return;
    }

    try {
      // Wyścig z zegarem, bo `writeText` potrafi **wisieć**, a nie odmówić —
      // tak zachowuje się, gdy przeglądarka czeka na zgodę na schowek, której
      // nie ma jak pokazać. Samo `await` zostawiłoby przycisk bez żadnej
      // odpowiedzi: `catch` nigdy nie zadziała, bo nic nie zostało odrzucone.
      // Przy działającym schowku zapis trwa milisekundy.
      await Promise.race([
        navigator.clipboard?.writeText(ADRES) ?? Promise.reject(new Error('brak schowka')),
        new Promise((_, odrzuc) => setTimeout(() => odrzuc(new Error('brak odpowiedzi')), 1500)),
      ]);
      skopiowano = true;
      clearTimeout(licznikPowrotu);
      licznikPowrotu = setTimeout(() => (skopiowano = false), 3000);
    } catch {
      // Schowek bywa niedostępny (starsza przeglądarka, odmowa uprawnienia,
      // brak odpowiedzi). Zamiast komunikatu o błędzie, z którym nikt nic nie
      // zrobi, pokazujemy zaznaczony adres — zostaje Ctrl+C.
      awaryjnie = true;
      await tick();
      poleAdresu?.select();
      poleAdresu?.focus();
    }
  }
</script>

<!-- Zdanie, nie widget: stopka jest ciągiem zwykłych akapitów z linkami, więc
     przycisk wygląda i zachowuje się jak link. `button`, a nie `a`, bo to
     czynność, nie przejście — czytnik ekranu ma o tym wiedzieć. -->
<p>
  Przydało się?
  <!-- Obie wersje podpisu w jednej komórce siatki, żeby podmiana po
       skopiowaniu nie przesuwała reszty zdania. -->
  <span class="stos">
    <button type="button" onclick={udostepnij}>
      {skopiowano ? 'Skopiowano' : 'Skopiuj link'}
    </button>
    <span class="duch" aria-hidden="true">Skopiuj link</span>
  </span>
  i podeślij dalej — nie zawiera Twojej kwoty.
</p>

{#if awaryjnie}
  <!-- Pojawia się wyłącznie, gdy schowek zawiódł i jest to jedyna droga. -->
  <p>
    <input bind:this={poleAdresu} value={ADRES} readonly aria-label="Adres kalkulatora" />
  </p>
{/if}

<style>
  .stos {
    display: inline-grid;
    vertical-align: bottom;
  }

  .stos > * {
    grid-area: 1 / 1;
  }

  .duch {
    visibility: hidden;
  }

  /* Wygląda jak sąsiednie linki w stopce — bo w tym miejscu jest jednym
     z nich. Reset dotyczy tego, co przeglądarka narzuca przyciskom. */
  button {
    font: inherit;
    color: inherit;
    background: none;
    border: none;
    padding: 0;
    text-align: left;
    text-decoration: underline;
    cursor: pointer;
  }

  input {
    font: inherit;
    width: min(100%, 20rem);
    padding: 0.3rem 0.5rem;
  }
</style>
