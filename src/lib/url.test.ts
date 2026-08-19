import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Sztuczne `window` — tylko to, czego moduł faktycznie dotyka. Testy ładują
 * moduł na świeżo (`resetModules`), bo pamięć o „czystym wejściu" żyje w
 * module i między scenariuszami musi znikać.
 */
function ustawWindow(href: string) {
  const stan = { href };

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: {
      get location() {
        return new URL(stan.href);
      },
      history: {
        replaceState(_dane: unknown, _tytul: string, url: unknown) {
          stan.href = String(url);
        },
      },
    },
  });

  return stan;
}

async function zaladujModul() {
  vi.resetModules();
  return await import('./url');
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
});

describe('odczytajBrutto', () => {
  it('oddaje wartość domyślną, gdy w adresie nie ma parametru', async () => {
    ustawWindow('https://pit.example/');
    const { odczytajBrutto } = await zaladujModul();

    expect(odczytajBrutto(12_000)).toBe(12_000);
  });

  it('odtwarza kwotę z adresu', async () => {
    ustawWindow('https://pit.example/?brutto=13000');
    const { odczytajBrutto } = await zaladujModul();

    expect(odczytajBrutto(12_000)).toBe(13_000);
  });

  it('ignoruje śmieci i kwoty niedodatnie', async () => {
    ustawWindow('https://pit.example/?brutto=abc');
    const { odczytajBrutto } = await zaladujModul();

    expect(odczytajBrutto(12_000)).toBe(12_000);
  });
});

describe('zapis stanu na czystym adresie', () => {
  it('nie dopisuje parametru przy zapisie inicjalizującym', async () => {
    const stan = ustawWindow('https://pit.example/');
    const { odczytajBrutto, zapiszStan } = await zaladujModul();

    const startowe = odczytajBrutto(12_000);
    zapiszStan(startowe, null);

    expect(stan.href).toBe('https://pit.example/');
  });

  it('dopisuje parametr po zmianie kwoty', async () => {
    const stan = ustawWindow('https://pit.example/');
    const { odczytajBrutto, zapiszStan } = await zaladujModul();

    zapiszStan(odczytajBrutto(12_000), null);
    zapiszStan(15_000, null);

    expect(stan.href).toBe('https://pit.example/?brutto=15000');
  });

  it('zapisuje też powrót dokładnie do wartości domyślnej', async () => {
    const stan = ustawWindow('https://pit.example/');
    const { odczytajBrutto, zapiszStan } = await zaladujModul();

    zapiszStan(odczytajBrutto(12_000), null);
    zapiszStan(15_000, null);
    zapiszStan(12_000, null);

    expect(stan.href).toBe('https://pit.example/?brutto=12000');
  });

  it('milczy przy powtórzonych zapisach wartości domyślnej (blur bez zmiany)', async () => {
    const stan = ustawWindow('https://pit.example/');
    const { odczytajBrutto, zapiszStan } = await zaladujModul();

    const startowe = odczytajBrutto(12_000);
    zapiszStan(startowe, null);
    zapiszStan(startowe, null);

    expect(stan.href).toBe('https://pit.example/');
  });
});

describe('zapis stanu na udostępnionym linku', () => {
  it('zostawia parametr w adresie, gdy link go już niósł', async () => {
    const stan = ustawWindow('https://pit.example/?brutto=13000');
    const { odczytajBrutto, zapiszStan } = await zaladujModul();

    const startowe = odczytajBrutto(12_000);
    zapiszStan(startowe, null);

    expect(startowe).toBe(13_000);
    expect(stan.href).toBe('https://pit.example/?brutto=13000');
  });

  it('nadpisuje kwotę z linku po zmianie', async () => {
    const stan = ustawWindow('https://pit.example/?brutto=13000');
    const { odczytajBrutto, zapiszStan } = await zaladujModul();

    zapiszStan(odczytajBrutto(12_000), null);
    zapiszStan(9_000, null);

    expect(stan.href).toBe('https://pit.example/?brutto=9000');
  });

  it('nie tłumi zapisu, gdy w adresie jest sam małżonek', async () => {
    const stan = ustawWindow('https://pit.example/?malzonek=4000');
    const { odczytajBrutto, odczytajMalzonka, zapiszStan } = await zaladujModul();

    // Tak wywołuje to aplikacja: obie wartości naraz, odczytane z adresu.
    zapiszStan(odczytajBrutto(12_000), odczytajMalzonka());

    expect(stan.href).toBe('https://pit.example/?malzonek=4000&brutto=12000');
  });
});

describe('zapiszStan', () => {
  it('nie brudzi czystego adresu zapisem inicjalizującym', async () => {
    const stan = ustawWindow('https://pit.example/');
    const { odczytajBrutto, odczytajMalzonka, zapiszStan } = await zaladujModul();

    zapiszStan(odczytajBrutto(12_000), odczytajMalzonka());

    expect(stan.href).toBe('https://pit.example/');
  });

  it('zapisuje po zmianie kwoty, także przy powrocie do domyślnej', async () => {
    const stan = ustawWindow('https://pit.example/');
    const { odczytajBrutto, odczytajMalzonka, zapiszStan } = await zaladujModul();

    zapiszStan(odczytajBrutto(12_000), odczytajMalzonka());
    zapiszStan(15_000, null);
    expect(stan.href).toBe('https://pit.example/?brutto=15000');

    zapiszStan(12_000, null);
    expect(stan.href).toBe('https://pit.example/?brutto=12000');
  });

  it('włączenie małżonka przy domyślnej kwocie też jest interakcją', async () => {
    const stan = ustawWindow('https://pit.example/');
    const { odczytajBrutto, odczytajMalzonka, zapiszStan } = await zaladujModul();

    zapiszStan(odczytajBrutto(12_000), odczytajMalzonka());
    zapiszStan(12_000, 4_000);

    expect(stan.href).toBe('https://pit.example/?brutto=12000&malzonek=4000');
  });

  it('udostępniony link zostaje w adresie', async () => {
    const stan = ustawWindow('https://pit.example/?brutto=13000&malzonek=4000');
    const { odczytajBrutto, odczytajMalzonka, zapiszStan } = await zaladujModul();

    zapiszStan(odczytajBrutto(12_000), odczytajMalzonka());

    expect(stan.href).toBe('https://pit.example/?brutto=13000&malzonek=4000');
  });
});
