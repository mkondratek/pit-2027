/**
 * Wejście dla renderowania po stronie serwera — używane wyłącznie przy
 * budowaniu, przez `scripts/prerender.mjs`.
 *
 * Renderuje tę samą `App.svelte`, którą dostaje przeglądarka, w stanie
 * domyślnym: `url.ts` przy braku `window` oddaje wartości wyjściowe, więc
 * powstaje dokładnie ta strona, którą widzi ktoś wchodzący na czysty adres.
 * To jest też jedyny stan, jaki ma sens dla robota — parametry w adresie są
 * cechą udostępnionego linku, nie treścią do zaindeksowania.
 */
import { render } from 'svelte/server';
import App from './App.svelte';

export function renderujStrone(): { head: string; body: string } {
  const { head, body } = render(App);
  return { head, body };
}
