import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [svelte()],
  test: {
    // Drzewa robocze gita trzymane w .claude/ zawierają własną kopię testów.
    // Bez tego `vitest run` liczy je razem z naszymi i podaje zawyżony wynik.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  },
})
