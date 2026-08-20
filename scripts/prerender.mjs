/**
 * Wkleja wyrenderowaną stronę do `dist/index.html`.
 *
 * Powód: bez tego robot wyszukiwarki dostaje pusty `<div id="app">` i musi
 * uruchomić JavaScript, żeby cokolwiek zobaczyć. Google to potrafi, ale robi
 * to z opóźnieniem i zawodnie, a Bing i wyszukiwarki AI często wcale.
 *
 * Skrypt jest celowo nieustępliwy — każdy nieoczekiwany kształt wejścia kończy
 * się błędem, a nie cichym pominięciem. Prerender, który po zmianie w buildzie
 * przestaje działać i nikomu tego nie mówi, jest gorszy niż jego brak: strona
 * dalej wygląda dobrze w przeglądarce, więc nikt nie zauważy, że wróciliśmy do
 * 151 znaków dla robota.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const STRONA = 'dist/index.html';
const PUSTY_KONTENER = '<div id="app"></div>';

// Poniżej tego progu coś się wyraźnie nie wyrenderowało. Sama strona ma dziś
// ~8 000 znaków tekstu; próg stoi nisko, bo ma łapać awarię (pusty render,
// wyjątek połknięty przez Svelte), a nie pilnować objętości treści.
const MINIMUM_TEKSTU = 3000;

const { renderujStrone } = await import('../dist-ssr/entry-server.js');
const { head, body } = renderujStrone();

const tekst = body
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
if (tekst.length < MINIMUM_TEKSTU) {
  throw new Error(
    `Prerender oddał ${tekst.length} znaków tekstu, oczekiwano ponad ${MINIMUM_TEKSTU}. ` +
      'Render się nie udał albo strona nagle schudła — nie podmieniam index.html.',
  );
}

const html = readFileSync(STRONA, 'utf8');
if (!html.includes(PUSTY_KONTENER)) {
  throw new Error(
    `Nie znalazłem ${PUSTY_KONTENER} w ${STRONA}. ` +
      'Zmienił się szablon albo kolejność kroków builda — prerender nie ma gdzie wstawić treści.',
  );
}

let wynik = html.replace(PUSTY_KONTENER, `<div id="app">${body}</div>`);
if (head.trim()) wynik = wynik.replace('</head>', `  ${head}\n  </head>`);

writeFileSync(STRONA, wynik);
console.log(`prerender: ${tekst.length} znaków tekstu wstawione do ${STRONA}`);
