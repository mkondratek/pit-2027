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

export default defineConfig({
  plugins: [svelte(), daneStrukturalne()],
  test: {
    // Drzewa robocze gita trzymane w .claude/ zawierają własną kopię testów.
    // Bez tego `vitest run` liczy je razem z naszymi i podaje zawyżony wynik.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  },
})
