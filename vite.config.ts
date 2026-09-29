import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig, type Plugin } from 'vite'

/**
 * Wstrzykuje JSON-LD do `index.html` na etapie budowania.
 *
 * Znacznik musi stać w statycznym HTML-u, bo robot czyta go zanim wykona
 * JavaScript. Zarazem nie może być wpisany z ręki — liczby w odpowiedziach
 * pochodzą z silnika i już raz rozjechały się z prozą. Import w tym miejscu
 * daje jedno i drugie: statyczny znacznik, ale zbudowany z tych samych stałych
 * co strona, więc zmiana modelu przelicza go przy najbliższym buildzie.
 */
function daneStrukturalne(): Plugin {
  return {
    name: 'dane-strukturalne',
    async transformIndexHtml(html) {
      const { daneStrukturalne } = await import('./src/lib/daneStrukturalne.ts')
      return html.replace(
        '</head>',
        `  <script type="application/ld+json">${daneStrukturalne()}</script>\n  </head>`,
      )
    },
  }
}

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
  plugins: [svelte(), daneStrukturalne()],
  test: {
    // Drzewa robocze gita trzymane w .claude/ zawierają własną kopię testów.
    // Bez tego `vitest run` liczy je razem z naszymi i podaje zawyżony wynik.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  },
})
