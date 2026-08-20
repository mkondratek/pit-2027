# pit.kondratek.pl — kalkulator zmiany PIT od 2027 r.

Jednoekranowy kalkulator pokazujący, jak zapowiadana 19 sierpnia 2026 r. zmiana skali
podatkowej wpłynęłaby na wynagrodzenie netto z umowy o pracę. Wpisujesz kwotę brutto,
widzisz wypłatę według obecnych przepisów, według zapowiedzianych i różnicę między nimi.

Zapowiedź to trzy rzeczy naraz: pierwszy próg rośnie ze 120 000 do 130 000 zł, między
130 000 a 150 000 zł pojawia się nowa stawka 24%, a stawka 32% zaczyna się od
150 000 zł dochodu. Maksymalna korzyść wychodzi z tego 3 600 zł rocznie, a jakikolwiek zysk
zaczyna się przy zarobkach około 11 900 zł brutto miesięcznie — poniżej tej kwoty zmiana nie
daje nic i kalkulator to wprost pokazuje.

Strona: <https://pit.kondratek.pl>

## To zapowiedź, nie obowiązujące prawo

W chwili powstania tego repozytorium **nie istniał projekt ustawy** wprowadzającej tę skalę
— nie było go ani w wykazie prac legislacyjnych, ani na RCL, ani jako druk sejmowy. Są
wystąpienie premiera i ministra finansów oraz komunikaty prasowe. Kalkulator liczy więc to,
co *wynikałoby* z zapowiedzi, gdyby weszła w życie w ogłoszonym kształcie, a nie to, co
obowiązuje. Reforma może się zmienić w trakcie prac albo nie wejść w życie wcale.

To samo zastrzeżenie niesie sama strona — nie jest schowane w dokumentacji.

## Skąd te liczby

Parametry zapowiadanej skali pochodzą z komunikatów rządowych z 19 sierpnia 2026 r., nie
z relacji prasowych:

- [Ministerstwo Finansów — Korzystne zmiany w systemie podatkowym](https://www.gov.pl/web/finanse/korzystne-zmiany-w-systemie-podatkowym)
- [KPRM — Sprawiedliwy system podatkowy: propozycje zmian](https://www.gov.pl/web/premier/sprawiedliwy-system-podatkowy--propozycje-zmian)
- [KPRM — Sprawiedliwsze podatki i więcej w portfelach Polek i Polaków](https://www.gov.pl/web/premier/sprawiedliwsze-podatki-i-wiecej-w-portfelach-polek-i-polakow)

Pełny model podatkowy — skala, kolejność operacji na liście płac, składki, koszty uzyskania
przychodu, zaokrąglenia z art. 63 §1 Ordynacji podatkowej, limit 30-krotności, źródło każdej
stałej — jest opisany w [`model.md`](model.md). Każde twierdzenie jest tam oznaczone jako
pewne (obowiązujące prawo), zapowiedziane (deklaracja bez tekstu przepisu) albo niejasne
(wnioskowanie z konstrukcji ustawy). Osobna sekcja wylicza to, czego ustalić się nie dało.

Jeśli chcesz sprawdzić, czy wyliczeniom można ufać, `model.md` jest właściwym miejscem —
nie kod.

Osobno, w [`DECYZJE.md`](DECYZJE.md), spisane są rozstrzygnięcia dotyczące samej strony:
co świadomie odrzuciliśmy i dlaczego. Warto tam zajrzeć przed zaproponowaniem zmiany —
część pomysłów została już zbudowana, obejrzana i odrzucona z konkretnych powodów.

## Walidacja silnika

Silnik podatkowy jest zamknięty w [`src/tax/engine.ts`](src/tax/engine.ts) i pokryty testami
w [`src/tax/engine.test.ts`](src/tax/engine.test.ts) — obecnie **51 testów**; aktualną liczbę
wypisze `npm test`.

Część z nich to testy właściwości (nowa skala nigdy nie jest gorsza od obecnej, zysk rośnie
monotonicznie, zatrzymuje się na 3 600 zł), a część odtwarza konkretne kwoty opublikowane
przy tej zapowiedzi przez Bankiera i money.pl: +21 zł miesięcznie przy 12 000 zł brutto,
2 129 zł rocznie przy 13 000 zł, 3 600 zł rocznie od 15 000 zł. Jeśli któryś z tych testów
pęknie, to znaczy, że zmiana w silniku rozjechała się z rzeczywistością.

Przy pisaniu silnika jeden wiersz tabeli walidacyjnej w `model.md` (brutto 20 000 zł) okazał
się wewnętrznie sprzeczny — podany dochód nie wynikał z podanego brutto, a podatek nie
wynikał z podanego dochodu. Pozostałe wiersze trafiały co do złotówki, więc błąd był
w tabeli, nie w modelu; wiersz został sprostowany, a sprostowanie opisane w `model.md`
razem z uzasadnieniem. Jest też na to osobny test.

## Uruchomienie lokalne

Potrzebny Node 20.19+ albo 22.12+ (wymaganie Vite 8).

```
npm install
npm run dev      # serwer deweloperski na http://localhost:5173
npm test         # testy silnika podatkowego (vitest)
npm run check    # svelte-check + typy
npm run build    # produkcyjny build do dist/
```

Cała logika wykonuje się w przeglądarce — nie ma backendu, żadne wpisane kwoty nigdzie nie
wychodzą.

## Zgłaszanie błędów i własne przypadki

Przepisy wokół tej zmiany dopiero powstają, a lista płac ma więcej wariantów, niż obejmuje
dziś kalkulator. Poprawki są mile widziane.

- **Coś się nie zgadza w wyliczeniu** — [zgłoś issue](https://github.com/mkondratek/pit-2027/issues/new)
  i podaj kwotę brutto, wynik, którego się spodziewasz, oraz skąd on pochodzi (własna lista
  płac, inny kalkulator, przepis). Rozbieżność z konkretną liczbą jest znacznie łatwiejsza
  do sprawdzenia niż „chyba źle liczy".
- **Chcesz dołożyć swój przypadek** — najkrótsza droga to test w
  [`src/tax/engine.test.ts`](src/tax/engine.test.ts). Pojedynczy przypadek z komentarzem,
  skąd wzięła się oczekiwana kwota, jest pełnoprawnym wkładem, nawet bez zmian w kodzie.
- **Gdzie co leży**: [`src/tax/engine.ts`](src/tax/engine.ts) to cała logika podatkowa,
  [`src/tax/constants.ts`](src/tax/constants.ts) to stałe i skale (progi jako dane, nie jako
  `if`-y), reszta `src/` to interfejs.
- **Czego lepiej nie ruszać bez testu**: silnika. Jest zwalidowany na opublikowanych kwotach
  i to jest jedyny powód, dla którego wynikom można wierzyć — każda zmiana w nim powinna
  przyjść razem z testem, który pokazuje, dlaczego nowa wartość jest poprawna. Zmiana
  parametru podatkowego powinna też mieć odzwierciedlenie w `model.md`, ze źródłem.

Zmiany w samym interfejsie nie mają takiego wymogu.

## Licencja i zastrzeżenie

MIT — patrz [`LICENSE`](LICENSE).

Wyliczenia mają charakter poglądowy i **nie są poradą podatkową**. Model liczy w skali roku
(nie miesiąc po miesiącu), więc może różnić się o kilka złotych od sumy dwunastu zaliczek,
i zakłada typowy przypadek: podstawowe koszty uzyskania przychodu, złożony PIT-2, brak ulg
PIT-0 i brak PPK. Autorem jest programista, nie doradca podatkowy.
