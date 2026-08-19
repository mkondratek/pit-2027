/**
 * Stan w adresie URL. To jest mechanizm udostępniania, nie wygoda —
 * link z konkretną kwotą jest tym, co ludzie wklejają znajomym.
 */

const PARAM = 'brutto';

export function odczytajBrutto(fallback: number): number {
  if (typeof window === 'undefined') return fallback;

  const surowe = new URLSearchParams(window.location.search).get(PARAM);
  if (surowe === null) return fallback;

  const liczba = Number(surowe);
  return Number.isFinite(liczba) && liczba > 0 ? Math.round(liczba) : fallback;
}

export function zapiszBrutto(brutto: number): void {
  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, String(brutto));
  window.history.replaceState(null, '', url);
}
