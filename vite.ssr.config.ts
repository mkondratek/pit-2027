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
export default defineConfig({
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
