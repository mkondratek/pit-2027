import { hydrate } from 'svelte'
import './app.css'
import App from './App.svelte'

/**
 * `hydrate`, a nie `mount`: build wkleja do `index.html` gotowy HTML strony
 * (patrz `scripts/prerender.mjs`), więc przeglądarka ma go już na ekranie,
 * zanim ruszy JavaScript. `mount` wyrzuciłby tę treść i zbudował ją od zera —
 * widocznym mignięciem i bez potrzeby. `hydrate` przejmuje istniejące węzły
 * i tylko podpina do nich stan i zdarzenia.
 */
const app = hydrate(App, {
  target: document.getElementById('app')!,
})

export default app
