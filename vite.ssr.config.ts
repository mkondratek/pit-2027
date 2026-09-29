import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

/**
 * Osobna konfiguracja dla budowania wersji serwerowej.
 *
 * Nie dziedziczy z `vite.config.ts` celowo: tamta wstrzykuje JSON-LD do
 * `index.html`, którego ten build w ogóle nie dotyka, i wciąga wtyczkę
 * testową. Tu potrzebny jest jeden moduł Node'a i nic poza nim — style
 * pomijamy, bo arkusz powstaje już w buildzie klienckim.
 */
/**
 * Data zbudowania strony, wstrzykiwana przy kompilacji.
 *
 * Data wpisana w prozie zestarzałaby się po cichu — a właśnie to przydarzyło się
 * zdaniu „projektu ustawy nie ma", które przez pięć tygodni mówiło nieprawdę.
 * Build powstaje tylko wtedy, gdy coś zmieniamy, więc ta data jest uczciwym
 * przybliżeniem ostatniej aktualizacji treści i nie wymaga pamiętania o niej.
 */
const dataBudowy = new Intl.DateTimeFormat('pl-PL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date())

export default defineConfig({
  define: { __DATA_BUDOWY__: JSON.stringify(dataBudowy) },
  plugins: [svelte({ compilerOptions: { css: 'external' } })],
  build: {
    ssr: 'src/entry-server.ts',
    outDir: 'dist-ssr',
    emptyOutDir: true,
    // Prerender czyta ten plik raz, w Node, tuż po zbudowaniu — minifikacja
    // tylko utrudniłaby czytanie go przy diagnozowaniu.
    minify: false,
  },
})
