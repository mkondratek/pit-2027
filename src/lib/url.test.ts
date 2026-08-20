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

describe('ulga dla młodych w adresie', () => {
  it('czyta obie ulgi z linku', async () => {
    ustawWindow('https://pit.example/?brutto=15000&malzonek=4000&ulga=1&ulga-malzonka=1');
    const { odczytajUlge, odczytajUlgeMalzonka } = await zaladujModul();

    expect(odczytajUlge()).toBe(true);
    expect(odczytajUlgeMalzonka()).toBe(true);
  });

  it('nie czyta ulgi małżonka, gdy w adresie nie ma małżonka', async () => {
    ustawWindow('https://pit.example/?brutto=15000&ulga-malzonka=1');
    const { odczytajUlge, odczytajUlgeMalzonka } = await zaladujModul();

    expect(odczytajUlge()).toBe(false);
    expect(odczytajUlgeMalzonka()).toBe(false);
  });

  it('traktuje link z samą ulgą jak udostępniony, a nie jak czyste wejście', async () => {
    const stan = ustawWindow('https://pit.example/?ulga=1');
    const { odczytajBrutto, odczytajMalzonka, odczytajUlge, zapiszStan } = await zaladujModul();

    zapiszStan(odczytajBrutto(12_000), odczytajMalzonka(), { ulga: odczytajUlge() });

    expect(stan.href).toBe('https://pit.example/?ulga=1&brutto=12000');
  });

  it('włączenie ulgi przy domyślnej kwocie jest interakcją', async () => {
    const stan = ustawWindow('https://pit.example/');
    const { odczytajBrutto, odczytajMalzonka, odczytajUlge, zapiszStan } = await zaladujModul();

    zapiszStan(odczytajBrutto(12_000), odczytajMalzonka(), { ulga: odczytajUlge() });
    zapiszStan(12_000, null, { ulga: true });

    expect(stan.href).toBe('https://pit.example/?brutto=12000&ulga=1');
  });

  it('wyłączona ulga znika z adresu zamiast zapisywać się jako zero', async () => {
    const stan = ustawWindow('https://pit.example/?brutto=15000&ulga=1');
    const { zapiszStan } = await zaladujModul();

    zapiszStan(15_000, null);

    expect(stan.href).toBe('https://pit.example/?brutto=15000');
  });

  it('ulga małżonka nie zostaje w adresie po wyłączeniu wspólnego rozliczenia', async () => {
    const stan = ustawWindow('https://pit.example/?brutto=15000&malzonek=4000&ulga-malzonka=1');
    const { zapiszStan } = await zaladujModul();

    // Tak wywołuje to aplikacja: wyłączone wspólne rozliczenie zeruje oba pola naraz.
    zapiszStan(15_000, null);

    expect(stan.href).toBe('https://pit.example/?brutto=15000');
  });
});

describe('PPK i podwyższone koszty w adresie', () => {
  it('czyta obie flagi z linku', async () => {
    ustawWindow('https://pit.example/?brutto=13000&ppk=1&koszty=1');
    const { odczytajPpk, odczytajPodwyzszoneKoszty } = await zaladujModul();

    expect(odczytajPpk()).toBe(true);
    expect(odczytajPodwyzszoneKoszty()).toBe(true);
  });

  it('traktuje link z samym PPK jak udostępniony, a nie jak czyste wejście', async () => {
    const stan = ustawWindow('https://pit.example/?ppk=1');
    const { odczytajBrutto, odczytajMalzonka, odczytajPpk, zapiszStan } = await zaladujModul();

    zapiszStan(odczytajBrutto(12_000), odczytajMalzonka(), { ppk: odczytajPpk() });

    expect(stan.href).toBe('https://pit.example/?ppk=1&brutto=12000');
  });

  it('traktuje link z samymi kosztami jak udostępniony', async () => {
    const stan = ustawWindow('https://pit.example/?koszty=1');
    const { odczytajBrutto, odczytajMalzonka, odczytajPodwyzszoneKoszty, zapiszStan } =
      await zaladujModul();

    zapiszStan(odczytajBrutto(12_000), odczytajMalzonka(), {
      podwyzszoneKoszty: odczytajPodwyzszoneKoszty(),
    });

    expect(stan.href).toBe('https://pit.example/?koszty=1&brutto=12000');
  });

  it('włączenie PPK przy domyślnej kwocie jest interakcją', async () => {
    const stan = ustawWindow('https://pit.example/');
    const { odczytajBrutto, odczytajMalzonka, zapiszStan } = await zaladujModul();

    zapiszStan(odczytajBrutto(12_000), odczytajMalzonka());
    zapiszStan(12_000, null, { ppk: true });

    expect(stan.href).toBe('https://pit.example/?brutto=12000&ppk=1');
  });

  it('wyłączone opcje znikają z adresu zamiast zapisywać się jako zero', async () => {
    const stan = ustawWindow('https://pit.example/?brutto=15000&ppk=1&koszty=1');
    const { zapiszStan } = await zaladujModul();

    zapiszStan(15_000, null, { ppk: false, podwyzszoneKoszty: false });

    expect(stan.href).toBe('https://pit.example/?brutto=15000');
  });
});

describe('forma zatrudnienia w adresie', () => {
  it('czyta zlecenie z linku', async () => {
    ustawWindow('https://pit.example/?brutto=15000&forma=zlecenie');
    const { odczytajForme } = await zaladujModul();

    expect(odczytajForme()).toBe('zlecenie');
  });

  it('czyta etat, gdy parametru nie ma albo niesie coś nieznanego', async () => {
    ustawWindow('https://pit.example/?brutto=15000&forma=dzielo');
    const { odczytajForme } = await zaladujModul();

    expect(odczytajForme()).toBe('umowaOPrace');
  });

  it('traktuje link z samą formą jak udostępniony, a nie jak czyste wejście', async () => {
    const stan = ustawWindow('https://pit.example/?forma=zlecenie');
    const { odczytajBrutto, odczytajForme, odczytajMalzonka, zapiszStan } = await zaladujModul();

    zapiszStan(odczytajBrutto(12_000), odczytajMalzonka(), { forma: odczytajForme() });

    expect(stan.href).toBe('https://pit.example/?forma=zlecenie&brutto=12000');
  });

  it('nie brudzi czystego adresu formą domyślną', async () => {
    const stan = ustawWindow('https://pit.example/');
    const { odczytajBrutto, odczytajForme, odczytajMalzonka, zapiszStan } = await zaladujModul();

    zapiszStan(odczytajBrutto(12_000), odczytajMalzonka(), { forma: odczytajForme() });

    expect(stan.href).toBe('https://pit.example/');
  });

  it('przełączenie na zlecenie przy domyślnej kwocie jest interakcją', async () => {
    const stan = ustawWindow('https://pit.example/');
    const { odczytajBrutto, odczytajMalzonka, zapiszStan } = await zaladujModul();

    zapiszStan(odczytajBrutto(12_000), odczytajMalzonka(), { forma: 'umowaOPrace' });
    zapiszStan(12_000, null, { forma: 'zlecenie' });

    expect(stan.href).toBe('https://pit.example/?brutto=12000&forma=zlecenie');
  });

  it('powrót na etat usuwa formę z adresu', async () => {
    const stan = ustawWindow('https://pit.example/?brutto=15000&forma=zlecenie');
    const { zapiszStan } = await zaladujModul();

    zapiszStan(15_000, null, { forma: 'umowaOPrace' });

    expect(stan.href).toBe('https://pit.example/?brutto=15000');
  });
});

describe('opcje zależne od formy w adresie', () => {
  it('czyta chorobową i status studenta razem ze zleceniem', async () => {
    ustawWindow('https://pit.example/?brutto=8000&forma=zlecenie&bez-chorobowej=1&student=1');
    const { odczytajBezChorobowej, odczytajStudenta } = await zaladujModul();

    expect(odczytajBezChorobowej()).toBe(true);
    expect(odczytajStudenta()).toBe(true);
  });

  it('nie czyta ich bez zlecenia w adresie', async () => {
    ustawWindow('https://pit.example/?brutto=8000&bez-chorobowej=1&student=1');
    const { odczytajBezChorobowej, odczytajStudenta } = await zaladujModul();

    expect(odczytajBezChorobowej()).toBe(false);
    expect(odczytajStudenta()).toBe(false);
  });

  it('nie czyta podwyższonych kosztów przy zleceniu', async () => {
    ustawWindow('https://pit.example/?brutto=8000&forma=zlecenie&koszty=1');
    const { odczytajPodwyzszoneKoszty } = await zaladujModul();

    expect(odczytajPodwyzszoneKoszty()).toBe(false);
  });

  it('traktuje link z samym studentem jak udostępniony', async () => {
    const stan = ustawWindow('https://pit.example/?forma=zlecenie&student=1');
    const { odczytajBrutto, odczytajForme, odczytajMalzonka, odczytajStudenta, zapiszStan } =
      await zaladujModul();

    zapiszStan(odczytajBrutto(12_000), odczytajMalzonka(), {
      forma: odczytajForme(),
      student: odczytajStudenta(),
    });

    expect(stan.href).toBe('https://pit.example/?forma=zlecenie&student=1&brutto=12000');
  });

  it('opcje zleceniowe nie zostają w adresie po powrocie na etat', async () => {
    const stan = ustawWindow(
      'https://pit.example/?brutto=8000&forma=zlecenie&bez-chorobowej=1&student=1',
    );
    const { zapiszStan } = await zaladujModul();

    // Tak wywołuje to aplikacja: zmiana formy gasi opcje, których w niej nie ma.
    zapiszStan(8_000, null, { forma: 'umowaOPrace', bezChorobowej: false, student: false });

    expect(stan.href).toBe('https://pit.example/?brutto=8000');
  });

  it('nie zapisuje opcji zleceniowych przy umowie o pracę, nawet gdy je podano', async () => {
    const stan = ustawWindow('https://pit.example/?brutto=8000');
    const { zapiszStan } = await zaladujModul();

    zapiszStan(8_000, null, { forma: 'umowaOPrace', bezChorobowej: true, student: true });

    expect(stan.href).toBe('https://pit.example/?brutto=8000');
  });

  it('nie zapisuje podwyższonych kosztów przy zleceniu', async () => {
    const stan = ustawWindow('https://pit.example/?brutto=8000');
    const { zapiszStan } = await zaladujModul();

    zapiszStan(8_000, null, { forma: 'zlecenie', podwyzszoneKoszty: true });

    expect(stan.href).toBe('https://pit.example/?brutto=8000&forma=zlecenie');
  });
});
