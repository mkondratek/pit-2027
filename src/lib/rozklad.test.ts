import { describe, expect, it } from 'vitest';
import { DECYLE, MEDIANA, pozycjaWRozkladzie, zdaniePozycji } from './rozklad';

describe('decyle GUS', () => {
  it('są rosnące — inaczej interpolacja dzieliłaby przez zero albo szła w tył', () => {
    for (let i = 1; i < DECYLE.length; i++) {
      expect(DECYLE[i]).toBeGreaterThan(DECYLE[i - 1]);
    }
  });

  it('to dziewięć punktów, po jednym na decyl', () => {
    expect(DECYLE).toHaveLength(9);
  });

  it('mediana to piąty decyl', () => {
    expect(MEDIANA).toBe(7690.82);
  });

  // Pierwszy decyl równy płacy minimalnej to nie literówka, tylko kształt
  // rozkładu — gdyby kiedyś przestało się zgadzać po aktualizacji danych,
  // trzeba przemyśleć zdanie o „górnej granicy" w dokumentacji modułu.
  it('pierwszy decyl stoi dokładnie na płacy minimalnej 2026', () => {
    expect(DECYLE[0]).toBe(4806);
  });
});

describe('pozycjaWRozkladzie — punkty źródłowe', () => {
  // Każdy decyl musi wypaść równo na swoim percentylu. To jest test tego, że
  // interpolacja nie przesuwa danych, na których stoi.
  it.each(DECYLE.map((wartosc, i) => [wartosc, (i + 1) * 10] as const))(
    '%d zł to dokładnie %d. percentyl',
    (wartosc, percentyl) => {
      expect(pozycjaWRozkladzie(wartosc)).toEqual({ percentyl, poza: null });
    },
  );
});

describe('pozycjaWRozkladzie — kwoty z zadania', () => {
  it('płaca minimalna 4806 zł → 10% (pierwszy decyl, punkt źródłowy)', () => {
    expect(pozycjaWRozkladzie(4806)).toEqual({ percentyl: 10, poza: null });
  });

  it('mediana zaokrąglona 7691 zł → 50%', () => {
    expect(pozycjaWRozkladzie(7691)).toEqual({ percentyl: 50, poza: null });
  });

  it('próg reformy 11 878 zł → 75%', () => {
    expect(pozycjaWRozkladzie(11_878)).toEqual({ percentyl: 75, poza: null });
  });

  it('dziewiąty decyl 17 111 zł → 90% (punkt źródłowy)', () => {
    expect(pozycjaWRozkladzie(17_111)).toEqual({ percentyl: 90, poza: null });
  });
});

describe('pozycjaWRozkladzie — interpolacja', () => {
  it('środek przedziału D7–D8 wypada w połowie między 70 a 80', () => {
    const srodek = (DECYLE[6] + DECYLE[7]) / 2;
    expect(pozycjaWRozkladzie(srodek).percentyl).toBe(75);
  });

  // 11 878 zł liczone „na piechotę": 70 + 10 * (11878 - 10257,14) / (12598,55 - 10257,14)
  // = 70 + 10 * 0,69226 = 76,92 → 75 po zaokrągleniu do pięciu punktów.
  it('próg reformy leży bliżej 80 niż 70, ale zaokrągla się w dół do 75', () => {
    const dokladny = 70 + (10 * (11_878 - DECYLE[6])) / (DECYLE[7] - DECYLE[6]);
    expect(dokladny).toBeGreaterThan(76);
    expect(dokladny).toBeLessThan(77);
    expect(pozycjaWRozkladzie(11_878).percentyl).toBe(75);
  });

  it('jest niemalejąca — wyższa pensja nigdy nie daje niższego percentyla', () => {
    let poprzedni = 0;
    for (let brutto = 1000; brutto <= 100_000; brutto += 137) {
      const { percentyl } = pozycjaWRozkladzie(brutto);
      expect(percentyl).toBeGreaterThanOrEqual(poprzedni);
      poprzedni = percentyl;
    }
  });

  it('zawsze zwraca wielokrotność pięciu', () => {
    for (let brutto = 1000; brutto <= 100_000; brutto += 97) {
      expect(pozycjaWRozkladzie(brutto).percentyl % 5).toBe(0);
    }
  });

  it('nigdy nie wychodzi poza 10–90', () => {
    for (let brutto = 1; brutto <= 200_000; brutto += 311) {
      const { percentyl } = pozycjaWRozkladzie(brutto);
      expect(percentyl).toBeGreaterThanOrEqual(10);
      expect(percentyl).toBeLessThanOrEqual(90);
    }
  });
});

describe('pozycjaWRozkladzie — poza siatką decyli', () => {
  it('poniżej płacy minimalnej oznacza kwotę jako spoza zakresu', () => {
    expect(pozycjaWRozkladzie(4805)).toEqual({ percentyl: 10, poza: 'ponizej' });
    expect(pozycjaWRozkladzie(1000)).toEqual({ percentyl: 10, poza: 'ponizej' });
  });

  it('powyżej dziewiątego decyla nie zgaduje ogona', () => {
    expect(pozycjaWRozkladzie(17_112)).toEqual({ percentyl: 90, poza: 'powyzej' });
    expect(pozycjaWRozkladzie(100_000)).toEqual({ percentyl: 90, poza: 'powyzej' });
  });

  // Granica należy do zakresu: dokładnie na decylu mamy odczyt, nie oszacowanie.
  it('dokładnie na krańcach siatki nie ma flagi `poza`', () => {
    expect(pozycjaWRozkladzie(4806).poza).toBeNull();
    expect(pozycjaWRozkladzie(17_111).poza).toBeNull();
  });
});

describe('zdaniePozycji', () => {
  it('w środku rozkładu podaje percentyl i nazywa grupę odniesienia', () => {
    expect(zdaniePozycji(pozycjaWRozkladzie(11_878))).toBe(
      'Zarabiasz więcej niż ok. 75% zatrudnionych',
    );
    expect(zdaniePozycji(pozycjaWRozkladzie(7691))).toBe(
      'Zarabiasz więcej niż ok. 50% zatrudnionych',
    );
  });

  // Kształt zdania jest nośnikiem niepewności — na ogonach nie wolno mu
  // wyglądać na oszacowanie punktowe, bo nim nie jest.
  it('na ogonach zmienia formę na przedział, bez słowa „ok."', () => {
    expect(zdaniePozycji(pozycjaWRozkladzie(3000))).toBe('Jesteś w 10% najmniej zarabiających');
    expect(zdaniePozycji(pozycjaWRozkladzie(60_000))).toBe('Jesteś w 10% najlepiej zarabiających');
  });

  it('złotówka powyżej dziewiątego decyla zmienia formę zdania', () => {
    // Dziewiąty decyl to punkt źródłowy, więc zdanie środkowe — ale już złotówka
    // wyżej wychodzimy poza dane i forma musi to pokazać.
    expect(zdaniePozycji(pozycjaWRozkladzie(17_111))).toBe(
      'Zarabiasz więcej niż ok. 90% zatrudnionych',
    );
    expect(zdaniePozycji(pozycjaWRozkladzie(17_112))).toBe('Jesteś w 10% najlepiej zarabiających');
  });

  it('nigdy nie jest puste w całym zakresie pola', () => {
    for (let brutto = 1000; brutto <= 100_000; brutto += 53) {
      expect(zdaniePozycji(pozycjaWRozkladzie(brutto))).not.toBe('');
    }
  });
});
