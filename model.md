# PIT 2027 — "trzeci próg podatkowy" + kompletny model wynagrodzenia netto (UoP i zlecenie)

Dokument roboczy. Stan wiedzy na **19.08.2026** (zapowiedź rządowa z tego dnia);
część F (umowa zlecenia) dopisana **20.08.2026**.
Cel: dane wystarczające do napisania kalkulatora netto dla stanu prawnego **2026** oraz
scenariusza **2027 (proponowanego)**.

> Części A–E opisują umowę o pracę i samą zmianę skali. **Część F** (na końcu, po
> otwartych pytaniach) opisuje umowę zlecenia — literę dobrano tak, żeby nie
> przenumerowywać odwołań, które istniejący kod i testy już mają do części B, C, D i E.

## Legenda oznaczeń

| Znacznik | Znaczenie |
|---|---|
| `[PEWNE]` | Obowiązujące prawo (2026) albo liczba potwierdzona w oficjalnym komunikacie rządowym |
| `[ZAPOWIEDŹ]` | Deklaracja polityczna z 19.08.2026 — brak tekstu przepisu, brak projektu ustawy |
| `[USTALONE]` | Rozstrzygnięte w źródle wtórnym o mocy niższej niż przepis — interpretacja indywidualna, objaśnienia MF, konstrukcja formularza. Doprecyzowanie w nawiasie mówi, ile z tego jest ustaleniem, a ile wnioskowaniem (np. `[USTALONE, ale z rozbieżnością orzeczniczą]`) |
| `[NIEJASNE]` | Brak danych w źródłach; wnioskowanie z konstrukcji ustawy albo po prostu niewiadoma |

> ⚠️ **Nadrzędne zastrzeżenie do całej części 2027**: na dzień 19.08.2026 **nie istnieje projekt ustawy**
> zmieniającej skalę podatkową. Jest konferencja prasowa premiera i ministra finansów oraz komunikaty
> na gov.pl. Wszystkie parametry 2027 poniżej to `[ZAPOWIEDŹ]`, nawet jeśli są w komunikacie MF.

---

# CZĘŚĆ A — Zapowiadana zmiana od 2027 r.

## A.1. Co dokładnie ogłoszono i kiedy

`[PEWNE co do faktu ogłoszenia]`
Konferencja prasowa **19 sierpnia 2026 r.**, premier **Donald Tusk** i minister finansów **Andrzej Domański**.

Źródła oficjalne (wszystkie datowane 19.08.2026):
- MF: <https://www.gov.pl/web/finanse/korzystne-zmiany-w-systemie-podatkowym>
- KPRM: <https://www.gov.pl/web/premier/sprawiedliwy-system-podatkowy--propozycje-zmian>
- KPRM: <https://www.gov.pl/web/premier/sprawiedliwsze-podatki-i-wiecej-w-portfelach-polek-i-polakow>

## A.2. Proponowana skala podatkowa

`[ZAPOWIEDŹ]` — źródło: gov.pl/web/finanse + gov.pl/web/premier, 19.08.2026

### Skala 2026 (obowiązująca) — `[PEWNE]`

| Podstawa obliczenia podatku (dochód, zł) | Podatek |
|---|---|
| do 120 000 | 12% minus 3 600 zł |
| ponad 120 000 | 14 400 zł + 32% nadwyżki ponad 120 000 |

### Skala 2027 (proponowana) — `[ZAPOWIEDŹ]`

| Podstawa obliczenia podatku (dochód, zł) | Podatek |
|---|---|
| do 130 000 | 12% minus 3 600 zł |
| ponad 130 000 do 150 000 | 15 600 zł + 24% nadwyżki ponad 130 000, minus 3 600 zł |
| ponad 150 000 | 20 400 zł + 32% nadwyżki ponad 150 000, minus 3 600 zł |

Zmiany względem 2026:
1. Górna granica I przedziału: **120 000 → 130 000 zł** (stawka 12% bez zmian).
2. **Nowa stawka pośrednia 24%** na przedziale **130 000 – 150 000 zł**.
3. Stawka **32%** — bez zmian, ale próg jej stosowania przesuwa się **120 000 → 150 000 zł**.

> Uwaga terminologiczna: media nazywają to „trzecim progiem", ale formalnie to
> **trzeci przedział skali** — progów (granic) nadal są dwa: 130 tys. i 150 tys.
> Dodatkowo w mediach „I próg" / „II próg" bywa używane niespójnie (raz o kwocie wolnej
> 30 tys., raz o granicy 120 tys.). W kodzie używaj granic, nie nazw.

## A.3. Kwota wolna i kwota zmniejszająca podatek

`[PEWNE]` — **bez zmian**: kwota wolna **30 000 zł**, kwota zmniejszająca **3 600 zł/rok**.

Premier wprost potwierdził, że podniesienie kwoty wolnej do 60 000 zł (obietnica z 2023 r.)
**nie nastąpi w 2027 ani 2028 r.** — koszt szacowany na **58,6 mld zł**, niemożliwy przy wydatkach
obronnych ~5% PKB.
Źródło: <https://www.bankier.pl/wiadomosc/Podatkowa-rewolucja-Tuska-Takie-zmiany-czekaja-PIT-9184270.html> (19.08.2026)

`[NIEJASNE — wnioskowanie]` Skoro stawka I przedziału pozostaje 12%, a kwota zmniejszająca 3 600 zł,
to kwota wolna wychodzi 3 600 / 0,12 = 30 000 zł — spójne. Miesięczna kwota zmniejszająca zaliczkę
(PIT-2) powinna pozostać **300 zł**. Żadne źródło tego wprost nie potwierdza, ale nic innego nie
byłoby wewnętrznie spójne.

## A.4. Danina solidarnościowa

`[ZAPOWIEDŹ]` Stawka **4% → 5%** (wzrost o 1 p.p.), próg **1 000 000 zł dochodu** — bez zmian.
Źródło: gov.pl/web/finanse i gov.pl/web/premier, 19.08.2026.

`[NIEJASNE]` Nie podano, od dochodów którego roku (2027 czy rozliczenie za 2027 płacone w 2028).

Konstrukcja samej daniny (podstawa, odliczenia, wspólne rozliczenie, zwolnienia PIT-0) jest
zweryfikowana i opisana w **B.8** — zapowiedź zmienia w niej wyłącznie stawkę.

Osobny, **wcześniejszy** wątek — projekt **UD116** (patrz A.7): rozszerzenie podstawy daniny
o dochody z **IP Box** (art. 30ca). Wersja z marca 2026 to zawierała; wersja z lipca 2026 —
według relacji — wycofała się z rozszerzenia. Stan niepewny.
Źródła: <https://www.prawo.pl/podatki/wplywy-z-daniny-solidarnosciowej-co-sie-zmieni-w-2027-roku,1542720.html>,
<https://www.ey.com/pl_pl/insights/tax/zmiany-cit-pit-w-2027-projekt-ustawy>

Kontekst: wpływy z daniny **2024: 2,1 mld zł**, **2025: 1,9 mld zł** (spadek — ucieczka na ryczałt).

## A.5. Kogo dotyczy zmiana skali

`[PEWNE]` Zmiana dotyczy **wyłącznie skali podatkowej** (art. 27 ust. 1 ustawy o PIT), czyli:
- umowa o pracę, umowa zlecenia, umowa o dzieło,
- emerytury i renty,
- działalność gospodarcza opodatkowana **na zasadach ogólnych**,
- inne dochody rozliczane skalą.

**Nie dotyczy**:
- `[PEWNE]` **podatku liniowego 19%** — stawka bez zmian, nie wymieniona w komunikatach,
- **ryczałtu ewidencjonowanego** — stawki nie zmieniane tą reformą (ale patrz A.6 — limit wejścia),
- **karty podatkowej**.

Liczby MF `[ZAPOWIEDŹ / szacunek MF]`:
- **~3,5 mln podatników** skorzysta (głównie pracownicy),
- maksymalna korzyść **3 600 zł rocznie** = **300 zł miesięcznie**,
- odsetek podatników na skali płacących 32% spadnie z **14,0% → 7,2%**.

## A.6. Pozostałe elementy pakietu (kontekst, nie wpływa na model netto UoP)

`[ZAPOWIEDŹ]` — wszystko z komunikatów gov.pl 19.08.2026:

| Element | Stan 2026 | Propozycja 2027 |
|---|---|---|
| CIT stawka podstawowa | 19% | **22%** dla podmiotów o przychodach > 50 mln EUR (~200 mln zł) oraz dla PGK |
| Danina solidarnościowa | 4% > 1 mln zł | **5%** > 1 mln zł |
| Limit wejścia na ryczałt | 2 mln EUR | **250 tys. EUR** (powrót do limitu sprzed 2021) |
| IP Box | 5% PIT | modyfikacja preferencji (patrz UD116) |

Szacowany wpływ podwyżki CIT: **~8,6 mld zł/rok**. Minister Domański: zmiany mają się bilansować.
Źródło: <https://www.bankier.pl/wiadomosc/Podatkowa-rewolucja-Tuska-Takie-zmiany-czekaja-PIT-9184270.html>

> Sprostowanie do artykułu inFakt (punkt wyjścia zadania): inFakt podaje koszt reformy PIT
> „ok. 3–4 mld zł rocznie". Ta liczba **nie występuje w komunikatach gov.pl** — traktować jako
> szacunek redakcyjny/ekspercki, nie dane MF.

## A.7. Status legislacyjny — najważniejsze

`[PEWNE]` **Na 19.08.2026 nie ma projektu ustawy wprowadzającego stawkę 24% i progi 130/150 tys. zł.**
Jest wyłącznie zapowiedź polityczna + komunikaty prasowe MF/KPRM. Brak numeru UD, brak wpisu w RCL,
brak druku sejmowego dla tej konkretnej zmiany.

W obiegu są **trzy różne, mylone ze sobą rzeczy**:

1. **Zapowiedź rządowa z 19.08.2026** (130/150 tys., 24%) — `[ZAPOWIEDŹ]`, brak projektu.
   Deklarowane wejście w życie: **1 stycznia 2027 r.**, tj. dochody od 1.01.2027.
   Rząd musi zamknąć legislację w 2026 r., by weszło od 2027.

2. **Poselski projekt Polska 2050** — złożony w Sejmie **14.04.2026**, podnosi II próg
   **120 000 → 140 000 zł** (bez nowej stawki 24%), wejście **1.01.2027**, koszt do **~9 mld zł/rok**.
   Konsultacje zakończone 15.05.2026 (>93% poparcia). **Inna propozycja niż rządowa.**
   Prezydent Nawrocki poparł ten kierunek publicznie.
   Źródło: <https://www.infor.pl/prawo/nowosci-prawne/7562441,korzystniejszy-pit-dla-lepiej-zarabiajacych-32-podatku-od-dochodow-ponad-140-tys-zl-od-2027-roku-projekt-ustawy-zlozyli-w-sejmie-poslowie-koalicji-rzadowej.html>

3. **Projekt UD116** — „uszczelniający" projekt nowelizacji PIT/CIT/ryczałt, opublikowany na RCL
   **17.03.2026**, kolejna wersja **lipiec 2026**, wciąż na etapie opiniowania/konsultacji.
   Wejście: **1.01.2027**. Zawiera: warunek 3 etatowców dla IP Box, zmiany stawek ryczałtu
   (15% dla usług bez pracowników > 100 tys. zł), daninę od IP Box, minimalny CIT, ograniczenie
   ulgi mieszkaniowej. **NIE zawiera zmiany skali podatkowej.**
   Źródła: <https://www.ey.com/pl_pl/insights/tax/zmiany-cit-pit-w-2027-projekt-ustawy>,
   <https://www.vatax.pl/blog/projekt-ustawy-ud116-zmiany-w-pit-i-cit>

### Ryzyko polityczne

`[PEWNE — relacjonowane]` Premier Tusk publicznie wyraził obawę o **weto prezydenta Karola Nawrockiego**.
Szef gabinetu prezydenta Paweł Szefernaker skrytykował rozwiązanie jako „skomplikowane" i promuje
prezydencką alternatywę **„PIT Zero"**: próg 140 000 zł dla wszystkich + zerowy PIT dla rodziców
z 2+ dzieci. Minister Domański: weto „szkodzi Polsce i może pogorszyć rating".
Źródło: <https://www.bankier.pl/wiadomosc/Podatkowa-rewolucja-Tuska-Takie-zmiany-czekaja-PIT-9184270.html>

**Wniosek dla kodu**: scenariusz 2027 traktować jako opcję konfiguracyjną (feature flag), nie default.

---

# CZĘŚĆ B — Model wynagrodzenia netto z umowy o pracę

Stan prawny **2026**; różnice dla scenariusza 2027 oznaczone inline.

## B.1. Stałe

```
# ---- Składki społeczne pracownika (finansowane przez pracownika) ----
RATE_EMERYTALNA        = 0.0976   # 9,76%
RATE_RENTOWA           = 0.0150   # 1,50%
RATE_CHOROBOWA         = 0.0245   # 2,45%
RATE_SPOLECZNE_SUMA    = 0.1371   # 13,71%   [PEWNE]

# ---- Składka zdrowotna ----
RATE_ZDROWOTNA         = 0.09     # 9%, NIEODLICZALNA od podatku (od 2022)  [PEWNE]

# ---- Roczny limit podstawy składek emerytalnej i rentowej (30-krotność) ----
LIMIT_30X_2026         = 282_600  # 30 × 9 420 zł            [PEWNE]
LIMIT_30X_2027         = 299_130  # 30 × 9 971 zł (PROGNOZA) [NIEJASNE]

# ---- Koszty uzyskania przychodu (pracownicze, miesięcznie) ----
KUP_PODSTAWOWE_MIES    = 250      # jedno miejsce pracy
KUP_PODWYZSZONE_MIES   = 300      # zamieszkanie poza miejscowością zakładu pracy
KUP_PODSTAWOWE_ROK_1   = 3_000    # jeden stosunek pracy
KUP_PODSTAWOWE_ROK_N   = 4_500    # wiele stosunków pracy (limit roczny)
KUP_PODWYZSZONE_ROK_1  = 3_600
KUP_PODWYZSZONE_ROK_N  = 5_400

# ---- 50% KUP (prawa autorskie) ----
KUP_50_LIMIT_2026      = 120_000  # art. 22 ust. 9a — "górna granica I przedziału skali"
KUP_50_LIMIT_2027      = 130_000  # [NIEJASNE — wnioskowanie, patrz B.4]

# ---- Kwota zmniejszająca podatek ----
KWOTA_WOLNA            = 30_000
KWOTA_ZMNIEJSZAJACA_ROK  = 3_600
KWOTA_ZMNIEJSZAJACA_MIES = 300    # = 1/12; PIT-2 pozwala też na 1/24 (150) lub 1/36 (100)

# ---- Skala podatkowa ----
# 2026 [PEWNE]
PROG_1_2026 = 120_000 ; STAWKA_1 = 0.12 ; STAWKA_TOP = 0.32
# 2027 [ZAPOWIEDŹ]
PROG_1_2027 = 130_000 ; PROG_2_2027 = 150_000 ; STAWKA_SREDNIA_2027 = 0.24

# ---- Ulgi PIT-0 (wspólny limit) ----
LIMIT_PIT_ZERO         = 85_528   # [PEWNE] wspólny dla wszystkich ulg PIT-0

# ---- PPK (domyślne) ----
PPK_PRACOWNIK_PODST    = 0.02     # 0,5%–2% jeśli zarobki < 1,2× min. wynagrodzenia
PPK_PRACOWNIK_DODATK   = 0.00     # do 2%
PPK_PRACODAWCA_PODST   = 0.015    # 1,5%
PPK_PRACODAWCA_DODATK  = 0.00     # do 2,5%

# ---- Płaca minimalna (kontekst, nie wchodzi wprost do wzoru) ----
MIN_WYNAGRODZENIE_2026 = 4_806    # [PEWNE]
MIN_WYNAGRODZENIE_2027 = 4_950    # [NIEJASNE — patrz Otwarte pytania]

# ---- Danina solidarnościowa (art. 30h; szczegóły w B.8) ----
DANINA_PROG          = 1_000_000  # [PEWNE] bez zmian w 2027
DANINA_STAWKA_2026   = 0.04       # [PEWNE]
DANINA_STAWKA_2027   = 0.05       # [ZAPOWIEDŹ] jedyny parametr, w którym 2027 jest GORSZY
```

### Źródła stałych

- 30-krotność 2026 = 282 600 zł: <https://www.pit.pl/aktualnosci/zus-zabierze-wiecej-najlepiej-zarabiajacym-w-2026-roku-wzrosnie-limit-skladek-emerytalnej-i-rentowej>
- 30-krotność 2027 ≈ 299 130 zł (30 × 9 971 zł, „Wieloletnie założenia makroekonomiczne 2026–2030",
  przyjęte przez RM 28.04.2026 — kwota ostateczna zależy od ustawy budżetowej na 2027):
  <https://www.pit.pl/aktualnosci/limit-30-krotnosci-skladek-zus-zmiany-w-2027-roku> (11.06.2026)
- KUP 250/300 zł i limity roczne: <https://www.pit.pl/koszty-uzyskania-przychodu-pit/>
- 50% KUP limit 120 000 zł (art. 22 ust. 9a): <https://www.e-pity.pl/autorskie-koszty-uzyskania-przychodu/>
- Limit PIT-0 85 528 zł (wspólny): <https://www.podatki.gov.pl/ulgi-i-odliczenia/ulga-dla-rodzin-4plus-pit>
- Składka zdrowotna 9% od (brutto − społeczne): <https://biznes.interia.pl/praca/news-skladka-zdrowotna-w-2026-r-ile-placi-pracownik-ile-osoba-na,nId,22600850>
- Zaokrąglenia (art. 63 §1 Ordynacji podatkowej): <https://lexlege.pl/ordynacja-podatkowa/art-63/>

## B.2. Kolejność operacji — miesięczna zaliczka (lista płac)

Kolejność jest **istotna** i nieprzemienna. Krok po kroku:

```
KROK 0 — Przychód brutto miesiąca
  P = wynagrodzenie zasadnicze + premie + dodatki
      + wartość świadczeń nieodpłatnych (np. pakiet medyczny)
      + wpłata pracodawcy do PPK z POPRZEDNIEGO miesiąca
        (przychód podatkowy pracownika, ale NIE podstawa ZUS)

KROK 1 — Podstawa składek społecznych
  P_ZUS = P − (wpłata pracodawcy do PPK)      # PPK pracodawcy nie oskładkowane
  # zastosuj limit 30-krotności narastająco:
  pozostały_limit = LIMIT_30X − suma_podstaw_emer_rent_od_początku_roku
  P_ER = min(P_ZUS, max(0, pozostały_limit))  # podstawa emerytalnej i rentowej
  P_CH = P_ZUS                                 # chorobowa BEZ limitu 30-krotności

KROK 2 — Składki społeczne pracownika (zaokrąglane do groszy)
  S_emer  = round2(P_ER × 0.0976)
  S_rent  = round2(P_ER × 0.0150)
  S_chor  = round2(P_CH × 0.0245)
  S_spol  = S_emer + S_rent + S_chor

KROK 3 — Podstawa i składka zdrowotna
  P_ZDR   = P_ZUS − S_spol
  S_zdrow = round2(P_ZDR × 0.09)
  # Uwaga: składka zdrowotna liczona od podstawy PO odjęciu społecznych,
  #        ale PRZED odjęciem KUP. Nieodliczalna od podatku (od 2022).
  # Kap art. 83 ustawy zdrowotnej — patrz B.5.

KROK 4 — Koszty uzyskania przychodu
  KUP = 250 (lub 300 jeśli dojeżdżający — oświadczenie pracownika)
  # albo 50% KUP dla honorarium autorskiego — patrz B.4

KROK 5 — Podstawa opodatkowania
  PODSTAWA = P − S_spol − KUP
  # jeśli pracownik korzysta ze zwolnienia PIT-0, najpierw odejmij przychód zwolniony (B.6)
  PODSTAWA = round_do_pelnych_zlotych(PODSTAWA)     # art. 63 §1 OP

KROK 6 — Podatek wg skali (narastająco od początku roku!)
  # Płatnik stosuje wyższą stawkę od miesiąca, w którym DOCHÓD NARASTAJĄCO
  # przekroczył granicę przedziału.
  zaliczka_brutto = podatek_wg_skali(dochód_narastająco)
                    − podatek_pobrany_w_poprzednich_miesiącach

KROK 7 — Kwota zmniejszająca podatek
  if złożono PIT-2:
      zaliczka_brutto −= 300     # albo 150 (1/24) albo 100 (1/36)
  zaliczka_brutto = max(0, zaliczka_brutto)

KROK 8 — Zaokrąglenie zaliczki
  ZALICZKA = round_do_pelnych_zlotych(zaliczka_brutto)   # art. 63 §1 OP

KROK 9 — PPK pracownika
  PPK_prac = round2(P_ZUS × (PPK_PRACOWNIK_PODST + PPK_PRACOWNIK_DODATK))
  # potrącane z NETTO, po podatku

KROK 10 — Netto
  NETTO = P − S_spol − S_zdrow − ZALICZKA − PPK_prac
  # UWAGA: wpłata pracodawcy do PPK zwiększyła P w kroku 0 tylko dla celów
  #        podatkowych — nie jest fizycznie wypłacana, więc odejmij ją tutaj,
  #        jeśli była doliczona.
```

### Zaokrąglenia — reguła

`[PEWNE]` **art. 63 §1 Ordynacji podatkowej**: podstawy opodatkowania i kwoty podatków zaokrągla się
do pełnych złotych — końcówki < 50 gr pomija się, ≥ 50 gr podwyższa do pełnego złotego.
Stosuje się **osobno dla każdego pracownika** i osobno dla podstawy i dla zaliczki.

```
def round_do_pelnych_zlotych(x):
    return floor(x + 0.5)      # HALF_UP, nie bankers rounding
```

**Składki ZUS (społeczne i zdrowotna) NIE są zaokrąglane do pełnych złotych** — zostają w groszach
(`round2` = HALF_UP do 2 miejsc).

## B.3. Funkcja podatku wg skali

```
def podatek_roczny(dochod, rok):
    if rok <= 2026:
        # [PEWNE]
        if dochod <= 120_000:
            t = dochod * 0.12
        else:
            t = 14_400 + (dochod - 120_000) * 0.32
    else:
        # [ZAPOWIEDŹ] — scenariusz 2027
        if dochod <= 130_000:
            t = dochod * 0.12
        elif dochod <= 150_000:
            t = 15_600 + (dochod - 130_000) * 0.24
        else:
            t = 20_400 + (dochod - 150_000) * 0.32
    return max(0, t - 3_600)          # kwota zmniejszająca
```

Kwoty stałe w progach (do weryfikacji w kodzie):
- 2026: 120 000 × 12% = **14 400**
- 2027: 130 000 × 12% = **15 600**; 15 600 + 20 000 × 24% = **20 400**

## B.4. 50% koszty uzyskania przychodu (prawa autorskie)

`[PEWNE]` art. 22 ust. 9 pkt 1–3 i ust. 9a ustawy o PIT.

```
podstawa_50KUP = honorarium_autorskie − składki_społeczne_potrącone_w_tym_miesiącu
                                        (proporcjonalnie do honorarium)
KUP_50 = 0.50 × podstawa_50KUP
# limit roczny narastająco:
KUP_50_rok ≤ KUP_50_LIMIT
```

`[NIEJASNE — wnioskowanie]` Ustawa definiuje limit 50% KUP jako **„kwotę stanowiącą górną granicę
pierwszego przedziału skali podatkowej, o której mowa w art. 27 ust. 1"** — czyli jest to **odesłanie
dynamiczne**, nie liczba wpisana wprost. Jeśli od 2027 górna granica I przedziału to 130 000 zł,
limit 50% KUP **automatycznie** wzrósłby do 130 000 zł, bez osobnej nowelizacji.
**Żadne źródło tego nie potwierdza ani nie zaprzecza** — to wniosek z konstrukcji przepisu.
Jest to jednak zależne od tego, jak zredagowana zostanie nowa trzyprzedziałowa skala.
→ w kodzie zrobić z tego parametr, nie hardkodować.

Historycznie: limit wynosił 85 528 zł do 2021 r., od 2022 r. 120 000 zł — czyli w przeszłości limit
faktycznie podążał za granicą I przedziału.

## B.5. Kap składki zdrowotnej (art. 83 ustawy zdrowotnej)

`[PEWNE]` Jeżeli składka zdrowotna 9% jest **wyższa** od zaliczki na PIT obliczonej **wg przepisów
obowiązujących na 31.12.2021**, składkę obniża się do wysokości tej hipotetycznej zaliczki
(art. 83 ust. 1 w zw. z ust. 2b).

Hipotetyczna zaliczka „2021" liczona jest z:
- KUP 250 zł (lub 300 zł),
- **stawka 17%** (w 2021 r. powyżej 85 528 zł dochodu było 32% — patrz uwaga niżej),
- miesięczna kwota zmniejszająca **43,76 zł** (= 525,12 zł rocznie, czyli 1/12 kwoty zmniejszającej
  z 2021 r.); przysługiwała **wyłącznie po złożeniu PIT-2** i tylko u jednego płatnika. Silnik
  zakłada PIT-2 wszędzie, tak jak w reszcie modelu,
- **bez** odliczania składki zdrowotnej (w 2021 r. odliczalne było 7,75% podstawy, ale w tym
  rachunku się tego nie stosuje — inaczej definicja byłaby cykliczna).

### ⚠️ Przy zwolnieniach PIT-0 zaliczkę liczy się tak, JAKBY zwolnienia nie było

`[PEWNE]` To jest ten fragment, na którym łatwo się przejechać — i na którym silnik przejechał się
do 2026-08-20 (patrz „Historia poprawek" niżej). **Art. 83 ust. 2a**:

> W przypadku gdy składka na ubezpieczenie zdrowotne obliczona od przychodu wolnego od podatku
> dochodowego na podstawie art. 21 ust. 1 pkt 148 i 152–154 ustawy z dnia 26 lipca 1991 r.
> o podatku dochodowym od osób fizycznych jest wyższa od kwoty ustalonej zgodnie z ust. 2b,
> **którą płatnik obliczyłby, gdyby przychód ubezpieczonego nie był zwolniony od podatku
> dochodowego na podstawie tego przepisu**, składkę obliczoną za poszczególne miesiące obniża się
> do wysokości tej kwoty.

Czyli: przychodu zwolnionego w hipotetycznej zaliczce **nie zdejmuje się** — liczy się ją od całości,
z pełnymi KUP. Ust. 2a jest przepisem szczególnym wobec ust. 2 („nieobliczanie zaliczki ⇒ składkę
obniża się do 0 zł"), więc **ogólna zasada „nie ma zaliczki, nie ma składki" do ulg PIT-0 się nie
stosuje**. Przy realnych wynagrodzeniach kap wtedy w ogóle nie wiąże i składka zdrowotna osoby
z ulgą jest **taka sama jak osoby bez ulgi**.

Dotyczy to **wszystkich czterech ulg PIT-0** — przepis wymienia pkt 148 (młodzi), 152 (na powrót),
153 (rodziny 4+) i 154 (pracujący seniorzy) jednym tchem. Silnik modeluje je jedną flagą
`ulgaDlaMlodych`, więc poprawka obejmuje je wszystkie automatycznie.

```
def kap_zdrowotnej(P_podatkowy, S_spol, KUP_roczne, ma_PIT2):
    # UWAGA: P_podatkowy to CAŁY przychód, także część zwolniona z PIT (art. 83 ust. 2a)
    kup = min(KUP_roczne, max(0, P_podatkowy - S_spol))
    podstawa_2021 = round_do_pelnych_zlotych(max(0, P_podatkowy - S_spol - kup))
    zal_2021 = podstawa_2021 * 0.17
    if ma_PIT2:
        zal_2021 -= 525.12                     # 12 × 43,76 zł
    return max(0, zal_2021)

S_zdrow = min(round2(P_ZDR * 0.09), kap_zdrowotnej(...))
```

Praktycznie kap wiąże więc tylko przy **bardzo niskich wynagrodzeniach** — poniżej ok. 1 250 zł/mies
brutto, czyli ćwiartki płacy minimalnej (składka 9% to ~7,8% brutto, a kap rośnie szybciej:
~14,7% brutto − 1 035 zł). Ulga PIT-0 tego progu **nie przesuwa**, bo hipotetyczna zaliczka jej nie
widzi.

> **Umowa zlecenia**: te same przepisy, dwie różnice w parametrach — koszty 20% zamiast 250 zł/mies
> i `ma_PIT2 = False`. Powód nie jest ten, że zleceniobiorca nie mógł w 2021 r. złożyć PIT-2 (choć
> nie mógł), tylko że **przepis o jego zaliczce kwoty zmniejszającej w ogóle nie zna**: art. 41
> ust. 1 każe wziąć „najniższą stawkę podatkową" od świadczenia po kosztach i składkach, a 1/12
> kwoty zmniejszającej dawał wyłącznie art. 32 ust. 3 — „jeżeli **pracownik** […] złoży **zakładowi
> pracy** oświadczenie". Skutek: kap wychodzi 17% × 80% = 13,6% podstawy i **nie wiąże przy żadnej
> kwocie brutto**, więc progu 1 250 zł tam nie ma — ale nie jest to skutek żaden: to właśnie brak
> kwoty zmniejszającej trzyma kap powyżej składki (F.6). Szczegóły — F.6 i część E.

**Dwa świadome uproszczenia w silniku:**

1. **Stawka płaska 17%**, bez drugiego progu z 2021 r. (32% powyżej 85 528 zł dochodu). 17% zaniża
   kap, więc uproszczenie może go tylko „przedwcześnie" zacisnąć — a wiąże on dopiero poniżej
   1 250 zł/mies, o dwa rzędy wielkości od tego progu. Bezpieczne.
2. ~~**Bez ulgi silnik kapu w ogóle nie stosuje.**~~ **Naprawione 2026-08-20** — kap jest
   stosowany zawsze, tak jak każe ust. 1. Wcześniej silnik wchodził w kap tylko przy
   `przychod_zwolniony > 0`, co bez ulgi **zawyżało** składkę poniżej ~1 250 zł/mies brutto
   (przy 1 000 zł/mies: 931,93 zł zamiast 725,23 zł rocznie, czyli o 206,70 zł za dużo).
   Uzasadnieniem było „ćwiartka płacy minimalnej jest poza zakresem kalkulatora" — nieprawda:
   `MIN_POLE = 1 000` pilnuje tylko pola głównego, pole małżonka przy wspólnym rozliczeniu
   przyjmuje kwoty od zera, a `oblicz` jest funkcją publiczną. Zawyżenie działało na niekorzyść
   podatnika, więc zniknęło mimo że łamie zasadę „bez ulgi wyniki bit w bit jak dotąd" —
   w paśmie 0–1 372 zł/mies i wyłącznie na składce zdrowotnej (w dół).

Źródła:
- art. 83 ust. 1, 2, 2a i 2b:
  <https://lexlege.pl/ustawa-o-swiadczeniach-opieki-zdrowotnej-finansowanych-ze-srodkow-publicznych/art-83/>
- sposób liczenia hipotetycznej zaliczki (17%, KUP, 43,76 zł, bez 7,75%):
  <https://www.pit.pl/podatek-dochodowy/obnizanie-skladki-zdrowotnej-do-wysokosci-zaliczki-na-pdof-1007182>
- interpretacja ZUS wprost o uldze dla młodych:
  <https://edgp.gazetaprawna.pl/kadry-i-place/ubezpieczenia/artykuly/11249487,przy-uldze-dla-mlodych-skladka-zdrowotna-nie-jest-automatycznie-reduko.html>

### Historia poprawek

**2026-08-20 (druga poprawka tego dnia)** — kap przestał być stosowany warunkowo. Do tej chwili
silnik nakładał go wyłącznie na osoby z ulgą PIT-0, więc bez ulgi składka zdrowotna poniżej
~1 250 zł/mies brutto była zawyżona (o 206,70 zł rocznie przy 1 000 zł/mies). Szczegóły
w uproszczeniu 2 wyżej.

**2026-08-20** — do tego dnia B.5 i silnik twierdziły, że przy przychodzie w całości zwolnionym
z PIT składka zdrowotna spada do zera. Było to czytanie samego ust. 2 z pominięciem ust. 2a.
Skutek na produkcji: zawyżone netto każdemu, kto włączył ulgę dla młodych — przy 5 000 zł/mies
o 4 659,66 zł rocznie (388,30 zł miesięcznie).

## B.6. Ulgi PIT-0

`[PEWNE]` Cztery zwolnienia dzielą **jeden wspólny limit 85 528 zł rocznie**:

| Ulga | Warunek | Podstawa |
|---|---|---|
| **Ulga dla młodych** | do ukończenia 26. roku życia | art. 21 ust. 1 pkt 148 |
| **Ulga na powrót** | przeniesienie rezydencji do PL po 31.12.2021; **4 kolejne lata** | art. 21 ust. 1 pkt 152 |
| **Ulga dla rodzin 4+** | wychowywanie ≥ 4 dzieci; limit **na każdego rodzica** osobno | art. 21 ust. 1 pkt 153 |
| **Ulga dla pracujących seniorów** | K > 60 lat, M > 65 lat, **niepobierający emerytury** | art. 21 ust. 1 pkt 154 |

```
LIMIT_PIT_ZERO = 85_528     # SUMA wszystkich ulg PIT-0 u jednego podatnika
```

Zakres przychodów objętych: stosunek pracy, umowa zlecenia, zasiłek macierzyński, działalność
gospodarcza (wg skali / liniowo / ryczałt / IP Box). **Nie obejmuje** umowy o dzieło.

**Kumulacja z kwotą wolną**: rodzic 4+ nie płaci PIT do **115 528 zł** (85 528 zwolnienia + 30 000
kwoty wolnej). Analogicznie dla pozostałych ulg PIT-0.

### Implementacja miesięczna

```
przychod_zwolniony_msc = min(P, max(0, LIMIT_PIT_ZERO - zwolnione_narastajaco))
przychod_opodatkowany  = P - przychod_zwolniony_msc

# KUP stosuje się TYLKO do części opodatkowanej, i najwyżej do jej wysokości
# (art. 22 ust. 3b) — w silniku do jej wysokości POMNIEJSZONEJ o składki
# Składki społeczne i zdrowotna nalicza się od CAŁOŚCI (zwolnienie jest podatkowe, nie składkowe)
# …ale ODLICZA się tylko część przypadającą na przychód opodatkowany — patrz niżej
# Zdrowotna podlega kapowi z B.5, ale kap liczy się od podstawy SPRZED zwolnienia
# (art. 83 ust. 2a) → przy przychodzie w całości zwolnionym składka NIE spada do 0
```

### ⚠️ Składki od przychodu zwolnionego nie podlegają odliczeniu

`[PEWNE]` **Art. 26 ust. 1 pkt 2 ustawy o PIT**, część wspólna po wyliczeniu: odliczeniu nie
podlegają składki, „których podstawę wymiaru stanowi dochód (przychód) zwolniony od podatku na
podstawie ustawy". Składki naliczają się od całości brutto, ale ta ich część, której podstawą był
przychód objęty ulgą PIT-0, **z odliczenia wypada**.

Które to konkretnie składki, przesądza **data uzyskania przychodu**. Zwolnienie nie jest udziałem
w rocznym przychodzie, tylko obejmuje przychody uzyskiwane **od początku roku**, aż limit się
wyczerpie — więc nieodliczalne są składki potrącone od **pierwszych 85 528 zł** przychodu,
a odliczalne wyłącznie te potrącone od nadwyżki ponad limit:

```
podstawa_zwolniona = przychod_zwolniony * (brutto_rok / przychod_podatkowy)   # bez PPK = przychod_zwolniony
s_spol_nieodliczalne = min(podstawa_zwolniona, podstawa_er)   * (0.0976 + 0.0150)
                     + min(podstawa_zwolniona, podstawa_chor) *  0.0245
s_spol_odliczalne    = s_spol - s_spol_nieodliczalne
```

Dotyczy wyłącznie osób z ulgą PIT-0 zarabiających powyżej 85 528 zł rocznie — poniżej limitu cały
przychód jest zwolniony i nie ma czego odliczać. Przy zleceniu ta sama kwota wchodzi do wzoru dwa
razy, bo pomniejsza również podstawę kosztów 20% (F.1).

**Dlaczego wzór, a nie pętla miesięczna.** Limit 85 528 zł jest zawsze niższy od 30-krotności
(282 600 / 299 130 zł), więc zanim zwolnienie się wyczerpie, żadna składka nie zdążyła urwać się
o swój limit — od pierwszych 85 528 zł przychodu naliczają się **pełną stawką**. Rachunek
narastający miesiąc po miesiącu daje więc co do grosza tę samą liczbę (sprawdzone również dla
podstawy kosztów 20% przy zleceniu, gdzie przepis jest miesięczny — F.1 pkt 4), a model pozostaje
rocznym. `min(...)` w obu wierszach jest zabezpieczeniem dla wariantów, w których dana podstawa jest
mniejsza albo zerowa: zlecenie bez dobrowolnej chorobowej, zwolnienie studenckie, podstawiony
z zewnątrz mniejszy `limit30x`. Przy wspólnym rozliczeniu limit przysługuje każdemu małżonkowi
osobno, więc rachunek jest indywidualny — tak jak składki.

**Poniżej 30-krotności obie metody dają tę samą liczbę**, bo składki są tam stałym procentem
przychodu (13,71%; przy zleceniu bez chorobowej 11,26%) — proporcja i chronologia się pokrywają,
także przy wpłacie pracodawcy do PPK. Rozjeżdżają się dopiero powyżej **23 550 zł/mies**, gdzie
emerytalna i rentowa przestają rosnąć i średnia stawka roczna spada poniżej stawki z początku roku.

### Metoda proporcjonalna jest zastępcza — i jest w tym spór

`[USTALONE, ale z rozbieżnością orzeczniczą]` **MF w objaśnieniach z 14.04.2020**, punkt 7, podaje
proporcję:

> „odliczeniu podlega tylko część z ogółu zapłaconych składek, która odpowiada **udziałowi
> przychodów podlegających opodatkowaniu** w sumie przychodów objętych ulgą dla młodych oraz
> przychodów podlegających opodatkowaniu"

Wyjaśnienia praktyczne (13) z tego samego punktu: przy 85 000 zł przychodu, z czego 35 000 zł
objęte ulgą, odliczyć wolno **58,82%** ogółu składek (50 000 ÷ 85 000). Nie jest to jednak metoda
pierwszego wyboru — cytowane zdanie zaczyna się od warunku, który zwykle się urywa przy cytowaniu:

> „**Jeżeli podatnik nie zna kwoty składek pobranych przez płatnika od przychodów objętych ulgą dla
> młodych**, a wyłącznie dysponuje ogólną kwotą zapłaconych składek […], odliczeniu podlega tylko
> część z ogółu zapłaconych składek, która odpowiada udziałowi […]"

— i przykład MF domyka to wprost: „**o ile zatem pracodawca nie wyodrębnił w informacji PIT-11
kwoty tych składek**". Wyodrębnia je: **PIT-11 poz. 97** to „składki […], których podstawę wymiaru
stanowi przychód zwolniony na podstawie art. 21 ust. 1 pkt 148 oraz 152–154 ustawy", a przypis do
poz. 95 zabrania wykazywać je wśród odliczalnych. Konstrukcja formularza jest więc **kwotowa
i faktyczna**, nie proporcjonalna — proporcja jest awaryjnym oszacowaniem dla podatnika, który tej
kwoty nie zna.

Metodę chronologiczną potwierdza **interpretacja KIS 0113-KDIPT2-3.4011.224.2026.3.KKA
z 19.05.2026** — stan faktyczny niemal identyczny z modelowanym tutaj (688 439 zł przychodu,
składki pobrane tylko do 260 190 zł, zwolnienie 85 528 zł); dotyczy ulgi dla pracujących seniorów
(art. 21 ust. 1 pkt 154), ale limit i art. 26 ust. 1 pkt 2 są dla wszystkich czterech ulg PIT-0
wspólne, więc rozstrzygnięcie przenosi się na ulgę dla młodych wprost. Stanowisko podatnika
o odliczeniu całości uznano za **nieprawidłowe**:

> „Okoliczność, że uzyskiwane przez podatnika przychody korzystają ze zwolnienia do wysokości
> określonego limitu oznacza, że to **data ich uzyskania** przesądza o tym, do których konkretnie
> przychodów ma zastosowanie zwolnienie. […] Zwolnione od podatku powinny być te przychody, które
> zostały uzyskane przez podatnika **od początku roku**, a więc te, od których pobierane były
> składki na ubezpieczenie społeczne: emerytalne i rentowe. […] prawo do odliczenia ogranicza się
> wyłącznie do **składek potrąconych od nadwyżki ponad limit** ww. zwolnienia."

<https://eureka.mf.gov.pl/informacje/podglad/692554>

> ⚠️ **Rozbieżność orzeczniczą trzeba znać.** Wcześniejsza interpretacja
> **0113-KDIPT2-2.4011.586.2024.1.ST z 16.10.2024** (ta sama ulga dla seniora, to samo przekroczenie
> 30-krotności) rozstrzygnęła **odwrotnie**: stanowisko o odliczeniu **całości** składek uznano za
> prawidłowe. Zrobiła to trzecią metodą — ulokowała przychód zwolniony w transzy **ponad**
> 30-krotnością, czyli tej, od której składek już nie pobierano („ma Pani prawo do zastosowania
> ulgi […] do tej części osiągniętych przez Panią przychodów, które przekraczają kwotę
> 208 050 zł"), więc żadna składka nie przypadła na przychód zwolniony. Jest to dokładne
> przeciwieństwo reguły „od początku roku".
>
> Model przyjmuje nowszą — jest spójna z chronologicznym stosowaniem samej ulgi (limit konsumują
> przychody w kolejności uzyskania, a nie ułamek każdej wypłaty ani jej ostatnia transza)
> i z kwotową konstrukcją PIT-11. Ale jawnie: **własne uzasadnienie interpretacji z 2026 r. jest
> jednozdaniowe** i nie wskazuje przepisu, z którego reguła „od początku roku" miałaby wynikać,
> a stany faktyczne nie są identyczne (w sprawie z 2024 r. zwolnienie ograniczał zbieg z 50% KUP do
> 69 999,37 zł). Stan bezsporny to nie jest.
> <https://eureka.mf.gov.pl/informacje/podglad/609227>

**Historia poprawek**

**2026-08-20 (trzecia poprawka tego dnia)** — silnik przeszedł z proporcji na metodę
chronologiczną opisaną wyżej. Do tej chwili liczył nieodliczalną część jako
`s_spol × (przychod_opodatkowany / przychod_podatkowy)`, co **poniżej 23 550 zł/mies daje tę samą
liczbę**, a powyżej ją zaniża — bo dzieli przez roczną średnią stawkę składek, zamiast wziąć pełną
stawkę z początku roku. Skutek na produkcji: zawyżone netto osobom z ulgą PIT-0 zarabiającym ponad
23 550 zł/mies — 179 zł/rok przy 25 000 zł/mies, 662 zł przy 30 000 zł, 2 650 zł przy 100 000 zł
(umowa o pracę). Przy zleceniu poprawka wchodzi dwa razy i drugie wejście działa w przeciwną stronę
(wyższa podstawa kosztów 20%), więc netto spada o 80% pierwszego efektu: 2 295 zł/rok przy
100 000 zł/mies z chorobową, 1 885 zł bez niej. Nieodliczalna część nie zależy już od wysokości
zarobków — przy pełnym wykorzystaniu limitu to zawsze 13,71% z 85 528 zł, czyli **11 725,89 zł**
(11,26% ⇒ 9 630,45 zł przy zleceniu bez chorobowej, mniej przy wpłacie pracodawcy do PPK, która
zużywa część limitu, sama nie będąc oskładkowana).

**2026-08-20** — do tego dnia silnik (i część C) odejmowały od podstawy **całość** składek
społecznych, także tę przypadającą na przychód zwolniony. Skutek na produkcji: zaniżony podatek,
czyli zawyżone netto, każdemu z ulgą PIT-0 powyżej 85 528 zł rocznie — 1 407 zł/rok przy 12 000
i 15 000 zł/mies, 3 466 zł przy 20 000 zł/mies, 3 090 zł przy 30 000 zł/mies. Przy zleceniu błąd
wchodził dwa razy, ale drugie wejście działało w przeciwną stronę (zaniżone koszty), więc netto
było zawyżone o 80% pierwszego efektu, a nie o 200%.

Źródła:
- <https://www.pit.pl/pit-0-dla-mlodych/>
- <https://www.podatki.gov.pl/ulgi-i-odliczenia/ulga-na-powrot-pit>
- <https://www.pit.pl/ulga-dla-seniora/>
- <https://www.podatki.gov.pl/ulgi-i-odliczenia/ulga-dla-rodzin-4plus-pit>

## B.7. PPK — szczegóły

`[PEWNE]`

| Strona | Podstawowa | Dodatkowa | Uwagi |
|---|---|---|---|
| Pracownik | **2%** | do 2% | 0,5%–2% jeśli wynagrodzenie < 1,2 × min. wynagrodzenia |
| Pracodawca | **1,5%** | do 2,5% | — |

Traktowanie:
- podstawa: **wynagrodzenie stanowiące podstawę składek emerytalno-rentowych**,
- wpłata **pracownika** — potrącana z **netto** (po podatku i po ZUS), nie pomniejsza podstawy podatku,
- wpłata **pracodawcy** — **przychód podatkowy** pracownika (doliczany do podstawy PIT w miesiącu
  **przekazania**, czyli zwykle miesiąc później), ale **nieoskładkowana** ZUS-em.

Źródło: <https://serwiskadrowego.pl/2026/03/listy-plac-2026-rozliczenie-pracownika-uwzgledniajace-zasilek-ppk-pakiet-medyczny-i-mieszkanie/>

### Odwzorowanie w modelu rocznym

Obie wpłaty są w silniku osobnymi opcjami (`ppkPracownik`, `ppkPracodawca`), obie domyślnie
**zerowe** — brak opcji znaczy brak PPK. Skutki są przeciwne i nie wolno ich mylić:

| | podstawa ZUS | podstawa zdrowotnej | podstawa PIT | potrącane z netto |
|---|---|---|---|---|
| Wpłata pracownika | nie | nie | nie | **tak** |
| Wpłata pracodawcy | **nie** | **nie** | **tak** | nie |

Wpłata pracodawcy kosztuje pracownika **wyłącznie podatek od niej** — sama kwota trafia na jego
rachunek PPK. Model wystawia ją osobno (`ppkPracodawcy`), żeby dało się to pokazać w rozbiciu jako
przysporzenie, a nie jako stratę wynikającą z wyższego podatku.

Skoro jest przychodem ze stosunku pracy, to **wchodzi pod zwolnienie PIT-0** i zużywa wspólny limit
85 528 zł na równi z wynagrodzeniem — u osoby z ulgą zwolnienie zdejmuje więc `wynagrodzenie
+ wpłata` do wysokości limitu, a nie samo wynagrodzenie. Podstawą składek wpłata nie jest ani przed
zwolnieniem, ani po nim, więc na część nieodliczalną składek wpływa tylko przez to, że przyspiesza
wyczerpanie limitu (B.6). Rozstrzygnięcie i jego skutek złotówkowy — część E.

Dwa świadome uproszczenia:

1. **Moment opodatkowania.** Wpłata pracodawcy jest przychodem w miesiącu *przekazania*, czyli
   zwykle miesiąc później (krok 0 w B.2). W modelu **rocznym** przesunięcie znika — różnica
   pojawiłaby się tylko na styku lat i przy zmianie wynagrodzenia w grudniu.
2. **Podstawa wpłat.** Model liczy obie wpłaty od pełnego brutto, a nie od `min(brutto, 30-krotność)`:
   wpłat PPK nie ogranicza limit 30-krotności, więc dla zarabiających powyżej niego brutto jest
   właściwą podstawą, a nie `podstawa_er` z kroku 1.

## B.8. Danina solidarnościowa

`[PEWNE dla 2026]` art. 30h ustawy o PIT. **Zweryfikowane w źródłach 2026-08-20** — wcześniejsza
wersja tej sekcji była szkicem; poniżej jest stan po sprawdzeniu, z rozstrzygnięciem czterech
pytań, które przy implementacji okazały się nieoczywiste.

```
podstawa_daniny = (Σ dochodów: art. 27 ust. 1, 9 i 9a (skala) + art. 30b (kapitały)
                   + art. 30c (liniowy) + art. 30f (CFC))
                  − składki społeczne (art. 26 ust. 1 pkt 2 i 2a, art. 30c ust. 2 pkt 2)
                  − kwoty z art. 30f ust. 5 (dywidendy już opodatkowane w CFC)
danina = max(0, podstawa_daniny − 1_000_000) × STAWKA
```

- `STAWKA_2026 = 0.04` `[PEWNE]` — art. 30h ust. 1
- `STAWKA_2027 = 0.05` `[ZAPOWIEDŹ]` — konferencja prasowa 19.08.2026, brak projektu ustawy
- Próg **1 000 000 zł** — bez zmian `[ZAPOWIEDŹ potwierdza brak zmiany]`

Termin: deklaracja **DSF-1** do 30 kwietnia roku następnego. Danina jest **poza** zaliczkami
miesięcznymi — nie wchodzi do modelu listy płac, ale w modelu **rocznym** musi być, bo zapłacić
trzeba. Zaokrąglenie do pełnych złotych: art. 30i odsyła do Ordynacji podatkowej, więc art. 63 §1
stosuje się tak jak do podatku. `[PEWNE]`

Źródła: <https://lexlege.pl/ustawa-o-podatku-dochodowym-od-osob-fizycznych/art-30h/>,
<https://przepisy.gofin.pl/przepisy,3,13,13,700,460398,20250409,art-30h-30i-danina-solidarnosciowa.html>,
<https://rachunkowosc.com.pl/ustalenie-podstawy-obliczenia-daniny-solidarnosciowej>

### Próg jest punktem przełamania, nie bramką

`[PEWNE]` Opodatkowana jest **nadwyżka** ponad 1 000 000 zł, a nie całość dochodu po jego
przekroczeniu. Podatnik z podstawą 1 000 013 zł płaci **1 zł**, nie 40 000 zł. Konstrukcja jest
ta sama co w skali podatkowej i tak samo łatwo ją pomylić — stąd osobny test na krawędzi.

### Co wchodzi do podstawy — a czego kalkulator nie widzi

`[PEWNE]` Katalog źródeł jest zamknięty i obejmuje dochody ze **skali** (art. 27), z **kapitałów
pieniężnych** (art. 30b), z działalności na **liniowym** (art. 30c) i z **zagranicznych jednostek
kontrolowanych** (art. 30f). **Nie** wchodzą: ryczałt ewidencjonowany, sprzedaż nieruchomości poza
działalnością, odsetki i **dywidendy** (opodatkowane zryczałtowanym podatkiem z art. 30a).

Konsekwencja dla kalkulatora: liczy on wyłącznie dochody ze skali, więc pokazywana danina
**zaniża, nigdy nie zawyża**. Kto ma dochody z pozostałych trzech źródeł, zapłaci więcej — i może
przekroczyć próg, choć z samej wypłaty by go nie przekroczył. Wystawione jest to w komentarzu przy
polu `danina`; interfejs powinien to powiedzieć wprost przy kwotach zbliżonych do progu.

### Odliczenia — katalog zamknięty, w praktyce same składki społeczne

`[PEWNE]` Podstawę pomniejszają **wyłącznie** dwie pozycje z art. 30h ust. 2: składki społeczne
(art. 26 ust. 1 pkt 2 i 2a oraz art. 30c ust. 2 pkt 2) i kwoty z art. 30f ust. 5. Nic poza tym.
Zgodnie z interpretacjami KIS katalog jest zamknięty, więc podstawy **nie** pomniejszają:
kwota wolna od PIT, ulgi (IP Box, B+R, na złe długi), IKZE, darowizny, ulga rehabilitacyjna ani
ulga termomodernizacyjna. Składka **zdrowotna** też nie — nie ma jej w katalogu, a od 2022 r. nie
odlicza się jej nigdzie.

Straty z lat ubiegłych: `[NIEJASNE]` — organy podatkowe i sądy administracyjne mówią różnie.
Bez znaczenia dla tego kalkulatora (model nie zna strat).

W modelu wynagrodzenia oznacza to, że **podstawa daniny = podstawa opodatkowania**: droga od
przychodu (minus KUP, minus składki społeczne) jest w obu rachunkach ta sama. Nie jest to jednak
tożsamość, na której wolno się oprzeć bez zastanowienia — patrz punkt o małżonkach niżej.

### ⚠️ Wspólne rozliczenie małżonków — danina jest INDYWIDUALNA

`[PEWNE]` **To jest najważniejsze ustalenie tej sekcji.** Objaśnienia podatkowe MF z **28.08.2019**:
każdy z małżonków bierze pod uwagę **wyłącznie swoje dochody**, niezależnie od tego, czy rozliczają
się wspólnie. Dochodów małżonków **ani się nie sumuje, ani nie dzieli na pół**. Każdy z osobna musi
przekroczyć 1 000 000 zł, żeby daninę zapłacić, i płaci ją tylko od swojej nadwyżki.

Wspólne rozliczenie **nie jest więc żadną tarczą** przed daniną — i odwrotnie, nie wciąga do niej
pary, które razem przekraczają milion.

Dwa błędy, wobec siebie przeciwstawne, i oba dają liczby nie do obrony:

| Błędne podejście | Skutek |
|---|---|
| podstawa = **suma** dochodów pary | para 2 × 550 479 zł płaci 4 038 zł, choć żadne progu nie dotknęło |
| podstawa = **połowa** sumy (jak przy podatku) | osoba z dochodem 1 135 779 zł i niepracującym małżonkiem nie płaci nic |

Prawidłowo: pierwsza para płaci **0 zł**, druga osoba **5 431 zł** — dokładnie tyle, ile
zapłaciłaby rozliczając się samotnie.

W silniku danina liczy się w `skladniki()`, osobno dla każdego małżonka — tak jak składki, koszty
uzyskania przychodu, składka zdrowotna, wpłaty PPK i limit PIT-0 — a na poziomie gospodarstwa jest
już tylko sumowana. `WynikWspolny.podstawaOpodatkowania` jest **łączna** i podstawiać jej pod próg
1 000 000 zł nie wolno; właściwa liczba to `osoby[i].podstawaDaniny`. Dlatego `Wynik` celowo nie
wystawia pola `podstawaDaniny`: u pary musiałoby ono nieść sumę gospodarstwa, czyli dokładnie tę
liczbę, której użyć nie można.

Źródła: <https://poradnikprzedsiebiorcy.pl/-danina-solidarnosciowa-przy-rozliczeniu-z-malzonkiem-a-zaplata-podatku>,
<https://www.pit.pl/aktualnosci/danina-solidarnosciowa-w-pit-za-2022-rok-kto-musi-ja-zaplacic-do-kiedy-i-od-jakich-dochodow-1008103>

### Zwolnienia PIT-0 (ulga dla młodych) nie wchodzą do podstawy

`[PEWNE]` Art. 30h ust. 2 mówi o dochodach **„podlegających opodatkowaniu"**, a przychód zwolniony
z art. 21 ust. 1 pkt 148 opodatkowaniu z definicji nie podlega — tak samo jak inne zwolnienia
przedmiotowe, o których organy wypowiedziały się wprost (np. art. 21 ust. 1 pkt 63a i 63b, strefy
ekonomiczne). Podstawa daniny spada więc o wykorzystany limit 85 528 zł, ani o grosz więcej.

W silniku wychodzi to samo z siebie, bo `dochod` liczy się od `przychodOpodatkowany` — i dobrze,
bo to jedyny element tego rachunku, który łatwo byłoby zrobić odwrotnie. Praktyczne znaczenie jest
znikome (osoba poniżej 26. roku życia z dochodem ponad milion to rzadkość, a różnica sięga najwyżej
85 528 × 5% ≈ 4 276 zł), ale kierunek musi być właściwy.

Uwaga na mylące skróty w piśmiennictwie: bywa napisane, że „ulga dla młodych nie zwalnia z daniny".
To prawda i nie przeczy powyższemu — zwolniony przychód **nie wchodzi do podstawy**, ale reszta
dochodu owszem, i od niej danina się należy.

### To jedyne miejsce, w którym 2027 jest gorszy niż 2026

Cała reszta pakietu (nowa skala) daje wyłącznie zysk albo zero. Ten jeden składnik idzie w drugą
stronę i przy dostatecznie wysokich zarobkach przeważa. Dla etatowca bez ulg (KUP podstawowe,
chorobowa opłacana):

| Brutto/mies | Podstawa daniny | Danina 2026 | Danina 2027 | Zysk z reformy |
|---:|---:|---:|---:|---:|
| 80 000 | 901 659 | 0 | 0 | **+3 600** |
| 88 401 | 1 000 001 | 0 | 0 | **+3 600** |
| 88 402 | 1 000 013 | 1 | 1 | **+3 600** |
| 90 000 | 1 018 719 | 749 | 936 | **+3 413** |
| 100 000 | 1 135 779 | 5 431 | 6 789 | **+2 242** |
| 119 156 | 1 360 019 | 14 401 | 18 001 | **0** |
| 119 157 | 1 360 031 | 14 401 | 18 002 | **−1** |
| 200 000 | 2 306 379 | 52 255 | 65 319 | **−9 464** |

Danina wchodzi od **88 402 zł/mies** brutto, a od **119 157 zł/mies** zapowiedź oznacza dla
etatowca realną **podwyżkę**. Granice przesuwają się w górę tam, gdzie dochód rośnie wolniej od
kwoty brutto: przy zleceniu (koszty 20%) zysk staje się ujemny dopiero od **144 899 zł/mies**,
przy uldze dla młodych od **126 465 zł/mies**.

Obecne pole kwoty przyjmuje najwyżej 100 000 zł/mies, więc **ujemnego zysku interfejs dziś nie
pokaże** — pokaże zysk topniejący z 3 600 zł do 2 242 zł. Granica 119 157 zł jest przypięta
liczbowo w testach właśnie po to, żeby ewentualne podniesienie limitu pola nie przeszło
niezauważone.

# CZĘŚĆ C — Pseudokod zbiorczy (roczny)

```python
def netto_roczne(brutto_miesieczne, rok, opcje):
    """
    opcje: pit2, kup_podwyzszone, ppk_pracownik, ulga_pit0, honorarium_50kup
    Zwraca: netto roczne + rozbicie
    """
    LIMIT_30X = 282_600 if rok <= 2026 else 299_130   # [NIEJASNE dla 2027]

    brutto_rok = brutto_miesieczne * 12

    # --- składki społeczne z limitem 30-krotności ---
    podstawa_er = min(brutto_rok, LIMIT_30X)
    s_emer = podstawa_er * 0.0976
    s_rent = podstawa_er * 0.0150
    # Chorobowa pracownika jest OBOWIĄZKOWA i jej podstawy nic nie ogranicza.
    # Przy zleceniu jest dobrowolna i ma WŁASNY limit — 250% przeciętnego
    # miesięcznie, co w modelu rocznym schodzi się do 30-krotności (F.2).
    # Ten pseudokod jest etatowy; wariant zleceniowy liczy F.3.
    s_chor = brutto_rok  * 0.0245
    s_spol = s_emer + s_rent + s_chor

    # --- zdrowotna ---
    # Kap art. 83 (B.5) liczy się od podstawy SPRZED zwolnienia PIT-0, więc przy
    # realnych wynagrodzeniach nie wiąże — także u osoby z ulgą. Stosuje się go
    # ZAWSZE, również bez ulgi; poniżej ~1 250 zł/mies brutto realnie obniża
    # składkę. Podstawą kapu jest podstawa policzona tak, jakby zwolnienia nie
    # było — z PEŁNYM odliczeniem składek i pełnymi KUP (ust. 2a).
    s_zdrow = min((brutto_rok - s_spol) * 0.09, kap_zdrowotnej(...))

    # --- zwolnienie PIT-0 (B.6) ---
    zwolniony   = min(brutto_rok, 85_528) if opcje.ulga_pit0 else 0
    opodatkowany = brutto_rok - zwolniony

    # --- odliczalna część składek (art. 26 ust. 1 pkt 2) ---
    # Składki naliczyły się od CAŁOŚCI brutto (zwolnienie jest podatkowe, nie
    # składkowe), ale odliczyć wolno tylko tę część, której podstawą nie był
    # przychód zwolniony. Zwolnienie obejmuje przychody OD POCZĄTKU ROKU, więc
    # nieodliczalne są składki od pierwszych 85 528 zł przychodu — naliczone
    # pełną stawką, bo limit zwolnienia wyczerpuje się na długo przed
    # 30-krotnością (B.6). Bez ulgi zwolniony = 0 i odliczalna jest całość.
    s_spol_nieodlicz = (min(zwolniony, podstawa_er) * (0.0976 + 0.0150)
                        + min(zwolniony, brutto_rok) * 0.0245)
    s_spol_odlicz = s_spol - s_spol_nieodlicz

    # --- KUP ---
    # Stosuje się je WYŁĄCZNIE do części opodatkowanej i najwyżej do tego, co
    # z niej zostało po składkach (B.6, art. 22 ust. 3b). Przy przychodzie
    # w całości zwolnionym nie ma ich wcale.
    kup_roczne = (300 if opcje.kup_podwyzszone else 250) * 12
    kup = min(kup_roczne, max(0, opodatkowany - s_spol_odlicz))

    # --- podstawa opodatkowania ---
    podstawa = round_pln(max(0, opodatkowany - s_spol_odlicz - kup))

    # --- podatek ---
    podatek = round_pln(podatek_roczny(podstawa, rok))   # patrz B.3

    # --- danina solidarnościowa (B.8) ---
    # Podstawą jest ta sama liczba co podstawa opodatkowania (dochód po składkach
    # i po KUP), bo art. 30h ust. 2 pomniejsza sumę dochodów o składki z art. 26
    # ust. 1 pkt 2 — czyli o dokładnie tę odliczalną część, którą policzono
    # wyżej. Płatna poza zaliczkami, do 30 kwietnia — ale zapłacona, więc
    # w modelu ROCZNYM od netto odchodzi.
    STAWKA_DANINY = 0.04 if rok <= 2026 else 0.05     # [ZAPOWIEDŹ dla 2027]
    danina = round_pln(max(0, podstawa - 1_000_000) * STAWKA_DANINY)

    # --- PPK ---
    ppk = brutto_rok * opcje.ppk_pracownik

    return brutto_rok - s_spol - s_zdrow - podatek - danina - ppk
```

> ⚠️ Przy **wspólnym rozliczeniu** daninę liczy się każdemu małżonkowi osobno, od jego własnej
> podstawy — dochodów ani się nie sumuje, ani nie dzieli na pół (B.8). Wspólna jest tylko podstawa
> **podatku**; podstawa daniny zostaje indywidualna, tak jak składki, KUP i limit PIT-0.

> Powyższy pseudokod pomija **wpłatę pracodawcy do PPK** — patrz B.7. Jeśli jest niezerowa,
> wchodzi do przychodu podatkowego przed zwolnieniem PIT-0 i przed KUP, ale **nie** do podstawy
> składek (te zostają liczone od `brutto_rok`) i **nie** do odejmowania w netto:
>
> ```python
> ppk_firmy    = brutto_rok * opcje.ppk_pracodawca     # 0, jeśli brak PPK
> przychod     = brutto_rok + ppk_firmy                # tylko dla celów podatkowych
> zwolniony    = min(przychod, 85_528) if opcje.ulga_pit0 else 0
> opodatkowany = przychod - zwolniony
> # Limit zwolnienia konsumuje przychód PODATKOWY (z wpłatą pracodawcy), a
> # składki liczą się od brutto — więc na okres zwolnienia przypada tylko ta
> # część brutto, która w nim zmieściła się obok wpłaty. Wpłata pracodawcy
> # zużywa limit na równi z wynagrodzeniem; to rozstrzygnięcie, nie ustalenie,
> # patrz część E i B.7.
> podstawa_zwolniona   = zwolniony * (brutto_rok / przychod)
> s_spol_nieodlicz     = (min(podstawa_zwolniona, podstawa_er) * (0.0976 + 0.0150)
>                         + min(podstawa_zwolniona, brutto_rok) * 0.0245)
> s_spol_odlicz = s_spol - s_spol_nieodlicz
> kup           = min(kup_roczne, max(0, opodatkowany - s_spol_odlicz))
> podstawa      = round_pln(max(0, opodatkowany - s_spol_odlicz - kup))
> # s_spol, s_zdrow i netto liczą się dalej od brutto_rok — bez ppk_firmy
> ```

> ⚠️ Model roczny ≠ suma 12 zaliczek miesięcznych, bo zaokrąglenia zachodzą co miesiąc.
> Różnica to zwykle kilka–kilkanaście złotych rocznie, rozliczana w zeznaniu.
> Do prezentacji „ile zyskam" model roczny wystarcza; do listy płac trzeba pętli miesięcznej z B.2.

---

# CZĘŚĆ D — Walidacja modelu

Model z części B/C **odtwarza dokładnie** liczby publikowane przez MF i media.
Założenia: KUP podstawowe 250 zł, PIT-2 złożony, brak PPK, brak ulg, dochód < 30-krotności.

| Brutto/mies | Dochód roczny | Podatek 2026 | Podatek 2027 | Zysk/rok | Zysk/mies | Zgodność ze źródłem |
|---|---|---|---|---|---|---|
| 11 878 zł | 120 000 | 10 800 | 10 800 | **0** | 0 | próg opłacalności ≈ 11 880 zł (Kozłowski, Bankier) ✔ |
| 12 000 zł | 121 258 | 11 203 | 10 951 | **252** | 21 | Bankier: „+21 zł/mies" ✔ |
| 13 000 zł | 131 612 | 14 516 | 12 387 | **2 129** | 177 | Bankier: „+178 zł/mies", money.pl: „2 129 zł/rok" ✔ |
| 14 776 zł | 150 000 | 20 143 | 16 543 | **3 600** | 300 | pełna korzyść od ≈ 14 800 zł ✔ |
| 15 000 zł | 152 322 | 21 143 | 17 543 | **3 600** | 300 | money.pl: „3 600 zł/rok" ✔ |
| 20 000 zł | 204 096 | 37 711 | 34 111 | **3 600** | 300 | maks. korzyść ✔ (wiersz poprawiony — patrz niżej) |

> **Sprostowanie wiersza 20 000 zł** (wprowadzone przy implementacji silnika, 19.08.2026).
> Pierwotnie w tabeli stało: dochód 203 748 zł, podatek 2026 37 623 zł. Ten wiersz był
> wewnętrznie sprzeczny — z brutto 240 000 zł po odjęciu składek (13,71%) i KUP 3 000 zł
> wychodzi **204 096 zł**, a z podanego dochodu 203 748 zł wychodziłby podatek 37 599 zł,
> czyli ani jedno, ani drugie się nie spinało. Wiersze 12 000 / 13 000 / 15 000 zł trafiają
> co do złotówki, więc błąd był w tym jednym wierszu, nie w modelu. Wartości poprawione.

**Wnioski analityczne** (wyprowadzone, nie z prasy):
- Maksymalna korzyść = 10 000 × (0,32 − 0,12) + 20 000 × (0,32 − 0,24) = 2 000 + 1 600 = **3 600 zł**.
- Korzyść zaczyna się przy dochodzie > 120 000 zł ⇒ brutto ≈ **11 878 zł/mies**.
- Pełna korzyść od dochodu ≥ 150 000 zł ⇒ brutto ≈ **14 776 zł/mies**.
- Wzór na brutto z dochodu (KUP 250, poniżej 30-krotności): `brutto_rok = (dochód + 3000) / 0,8629`.
- **Nikt nie traci** na samej zmianie skali — funkcja podatku 2027 jest ≤ funkcji 2026 dla każdego
  dochodu. Tracą wyłącznie osoby objęte innymi elementami pakietu (danina 5%, limit ryczałtu, CIT).
- Ciekawostka: maksymalna korzyść 3 600 zł przypadkowo równa się kwocie zmniejszającej podatek —
  to zbieg okoliczności, nie zależność.

Źródła liczb porównawczych:
<https://www.bankier.pl/wiadomosc/Podatkowa-rewolucja-Tuska-Takie-zmiany-czekaja-PIT-9184270.html>,
<https://www.money.pl/podatki/podatki-po-nowemu-premier-potwierdza-kto-skorzysta-oto-wyliczenia-7320115792447680a.html>

---

# CZĘŚĆ E — Otwarte pytania

Rzeczy, których **nie udało się ustalić** — nie zgadywać w kodzie, wystawić jako parametry.

## Dotyczące zmiany 2027

1. **Brak tekstu przepisu.** Nie ma projektu ustawy, więc nie wiadomo, jak literalnie zostanie
   zredagowana trzyprzedziałowa skala w art. 27 ust. 1. Kwoty stałe (15 600 / 20 400) to moje
   wyprowadzenie z podanych stawek i progów, nie cytat.
2. **Czy limit 50% KUP wzrośnie do 130 000 zł?** Zależy od redakcji przepisu (odesłanie dynamiczne
   do „górnej granicy I przedziału"). Brak jakiejkolwiek wzmianki w źródłach.
3. **Miesięczna kwota zmniejszająca 300 zł** — nigdzie nie potwierdzona wprost dla 2027, choć
   wynika logicznie z niezmienionej kwoty wolnej 30 000 zł i stawki 12%.
4. **Od kiedy danina solidarnościowa 5%** — od dochodów 2027 (płatna 2028) czy od dochodów 2026?
   Komunikaty nie precyzują. Model przypisuje stawkę 5% **dochodom roku 2027**, bo cała reszta
   porównania jest zbudowana wokół „ile dałaby nowa skala od dochodów 2027"; gdyby okazało się, że
   stawka wchodzi rok wcześniej, porównanie 2026 vs 2027 stałoby się w tym jednym składniku puste
   (obie strony po 5%), a nie błędne.
5. **Czy danina obejmie IP Box** (art. 30ca) — wersja marcowa UD116 tak, lipcowa podobno nie, a
   relacje z konferencji 19.08.2026 znów wspominają o rozszerzeniu. Stan nierozstrzygnięty.
   Dla kalkulatora bez znaczenia: nie liczy dochodów z IP Box.
5a. **Dochody spoza skali w podstawie daniny** — kalkulator zna wyłącznie dochody ze skali, a do
   podstawy wchodzą także art. 30b, 30c i 30f (B.8). Nie jest to niewiadoma prawna, tylko **świadome
   ograniczenie zakresu**: pokazywana danina zaniża i nigdy nie zawyża. Otwarte pozostaje, czy i jak
   powiedzieć to w interfejsie osobom blisko progu — decyzja produktowa, nie modelowa.
5b. **Straty z lat ubiegłych a podstawa daniny** — organy podatkowe i sądy administracyjne
   wypowiadają się rozbieżnie. Poza zakresem modelu (nie zna strat), odnotowane, żeby nie zostało
   przeoczone przy ewentualnym rozszerzeniu o działalność gospodarczą.
6. **Czy zmieni się kwota graniczna dla wspólnego rozliczenia małżonków / rozliczenia z dzieckiem** —
   brak wzmianek, prawdopodobnie bez zmian (mechanizm jest niezależny od progów).
7. **Ulgi PIT-0 (85 528 zł)** — brak jakiejkolwiek wzmianki o zmianie. Zakładam bez zmian.
8. **Skala dla emerytur i rent** — technicznie ta sama skala, ale komunikaty mówią wyłącznie
   o „pracownikach"; brak potwierdzenia, że nie planuje się wyłączeń.
9. **Koszt budżetowy reformy PIT** — MF nie podało liczby. inFakt podaje „3–4 mld zł", brak
   potwierdzenia w źródłach oficjalnych. Dla porównania projekt Polska 2050 (do 140 tys.) wyceniono
   na ~9 mld zł, a podwyżka CIT ma dać ~8,6 mld zł.
10. **Harmonogram legislacyjny** — brak dat skierowania projektu do RCL/Sejmu. Rząd deklaruje
    zamknięcie w 2026 r., ale nie podał kamieni milowych.
11. **Ryzyko weta prezydenckiego** jest realne i publicznie artykułowane przez obie strony.
    Prezydencka alternatywa „PIT Zero" ma zupełnie inną konstrukcję (próg 140 tys. + zerowy PIT
    dla rodziców 2+), co przy kompromisie dałoby jeszcze inne parametry.

## Dotyczące ulgi dla młodych (PIT-0)

**Czy składki społeczne odlicza się w całości, gdy część przychodu jest zwolniona?**
**ROZSTRZYGNIĘTE — nie.** Art. 26 ust. 1 pkt 2 wyłącza z odliczenia składki, „których podstawę
wymiaru stanowi dochód (przychód) zwolniony od podatku na podstawie ustawy".

**Którą metodą — proporcją czy chronologicznie? ROZSTRZYGNIĘTE — chronologicznie, i silnik tak
liczy od 2026-08-20.** Nieodliczalne są składki potrącone od **pierwszych 85 528 zł** przychodu,
bo to data uzyskania przychodu przesądza, których przychodów dotyczy zwolnienie — tak KIS
w interpretacji **0113-KDIPT2-3.4011.224.2026.3.KKA z 19.05.2026** na niemal identycznym stanie
faktycznym (<https://eureka.mf.gov.pl/informacje/podglad/692554>; sprawa dotyczy ulgi dla seniora,
ale limit i art. 26 ust. 1 pkt 2 są dla wszystkich ulg PIT-0 wspólne). Proporcja z objaśnień MF
z 14.04.2020 pkt 7 jest metodą **zastępczą** — te same objaśnienia dopuszczają ją tylko, „jeżeli
podatnik nie zna kwoty składek pobranych przez płatnika […], o ile zatem pracodawca nie wyodrębnił
w informacji PIT-11 kwoty tych składek". Wyodrębnia je — PIT-11 poz. 97. Poniżej 23 550 zł/mies
obie metody dają tę samą liczbę; powyżej proporcja zaniżała część nieodliczalną, czyli **zawyżała
netto** (przy 100 000 zł/mies wychodziło z niej 4 363 zł zamiast 11 726 zł). Pełny opis, wzór
i historia poprawki — w **B.6**.

⚠️ **Nie jest to stan bezsporny:** wcześniejsza interpretacja
**0113-KDIPT2-2.4011.586.2024.1.ST z 16.10.2024** orzekła **odwrotnie** — na materialnie tym samym
problemie (ulga PIT-0 + przekroczenie 30-krotności) uznała odliczenie **całości** składek za
prawidłowe, lokując przychód zwolniony w transzy ponad 30-krotnością
(<https://eureka.mf.gov.pl/informacje/podglad/609227>). Przyjmujemy nowszą — spójną
z chronologicznym stosowaniem samej ulgi i z kwotową konstrukcją PIT-11 — ale jej własne
uzasadnienie jest jednozdaniowe, więc rozbieżność zostaje odnotowana: dotyczy kwot rzędu tysięcy
złotych rocznie.

<https://podatki-arch.mf.gov.pl/media/5974/obja%C5%9Bnienia-podatkowe-ulga-dla-m%C5%82odych-14-kwietnia-2020-r.pdf>
(strona MF: <https://www.gov.pl/web/finanse/objasnienia-podatkowe-z-dnia-14-kwietnia-2020-r-dot-nowej-preferencji-w-podatku-dochodowym-od-osob-fizycznych-dla-mlodych-osob>)

**Czy to samo dotyczy podstawy kosztów 20% przy zleceniu?**
`[USTALONE co do zasady, wnioskowanie co do składu podstawy]` Silnik przyjmuje, że **tak** —
art. 22 ust. 9 pkt 4 zawęża podstawę kosztów tym samym zwrotem („składki [...], których podstawę
wymiaru stanowi **ten** przychód"), a MF potwierdza w pkt 6 tych samych objaśnień, że koszty
procentowe „są obliczane wyłącznie od przychodów podlegających opodatkowaniu". Chronologiczne
stosowanie ulgi KIS potwierdziła trzykrotnie (sygnatury i linki — F.1 pkt 4), co współgra
z miesięczną redakcją przepisu. Interpretacji **wprost o składzie tej podstawy** nie ma —
przeszukano cały korpus eureka.mf.gov.pl (1069 dokumentów) — więc ostatni krok pozostaje
wnioskowaniem z brzmienia przepisu. Szczegóły — F.1 pkt 4.

**Czy wpłata pracodawcy do PPK jest objęta zwolnieniem PIT-0?**
**ROZSTRZYGNIĘTE — tak, jest objęta i zużywa limit; silnik liczy zgodnie.** Zwolnienie z art. 21
ust. 1 pkt 148 działa na **źródle** przychodu, a nie na jego poszczególnych składnikach:
objaśnienia MF z 14.04.2020 pkt 4.1 mówią o katalogu **zamkniętym**, ograniczonym do przychodów ze
stosunku pracy i z umowy zlecenia, a przychodem ze stosunku pracy są także „świadczenia pieniężne
ponoszone za pracownika" — czyli właśnie wpłata pracodawcy, i to jest jedyny powód, dla którego
w ogóle podlega opodatkowaniu. Katalog wyłączeń spod limitu w **art. 21 ust. 39** jest zamknięty
i wpłat PPK nie obejmuje. Interpretacji KIS wprost o tym nie znaleziono, ale konstrukcja przepisów
nie zostawia tu miejsca na drugie czytanie.

Konsekwencja: wpłata **zużywa wspólny limit 85 528 zł** na równi z wynagrodzeniem, przez co osobie
zarabiającej tuż poniżej limitu potrafi go przekroczyć (przy 7 100 zł/mies samo wynagrodzenie to
85 200 zł, a z wpłatą 1,5% już 86 478 zł).

**Kierunek i skutek — obie rzeczy stały tu wcześniej odwrotnie, niż jest.** Nasze „tak" daje
przychód opodatkowany `max(0, W + PPK − 85 528)`; czytanie „nie" (wpłata opodatkowana od pierwszej
złotówki, limit zostaje dla wynagrodzenia) dałoby `PPK + max(0, W − 85 528)`, czyli **zawsze co
najmniej tyle samo**. Nasze rozstrzygnięcie **nigdy nie działa na niekorzyść podatnika** — tak samo
jak przy pytaniu o składki wyżej, a nie odwrotnie. Skutek złotówkowy wynosi przy tym **0 zł przy
każdej kwocie**: poniżej limitu nadwyżka z czytania „nie" mieści się w kwocie wolnej, a powyżej oba
czytania są tożsame. Sprawdzone przemiataniem silnika (oba lata, obie formy, wpłaty pracodawcy
0,5–4%, brutto 1–130 000 zł/mies): różnica w podatku i w netto **zero** we wszystkich 2 080 000
przypadków.

**Czy składka zdrowotna przy uldze PIT-0 spada do zera?** **ROZSTRZYGNIĘTE — nie.**
Pytanie postawione przy pisaniu części F, zamknięte tego samego dnia: art. 83 ust. 2a jest
przepisem szczególnym wobec ust. 2 i każe liczyć hipotetyczną zaliczkę tak, jakby zwolnienia
nie było. Pełny opis, cytat przepisu i historia poprawki — w **B.5**. Rozstrzygnięcie
dotyczy tak samo zlecenia (F.6).

**Zbieg ulg PIT-0.** Limit 85 528 zł jest wspólny dla ulgi dla młodych, ulgi na powrót,
ulgi dla rodzin 4+ i ulgi dla pracujących seniorów. Silnik przyjmuje, że limit jest
w całości niewykorzystany — nie modeluje sytuacji, w której komuś przysługuje więcej
niż jedna z nich.

**Miesięczne narastanie limitu.** Model jest roczny, więc nie odwzorowuje momentu
w trakcie roku, w którym limit się wyczerpuje i zaliczki zaczynają być pobierane.
To ta sama granica dokładności, co przy zwykłym rozliczeniu (patrz uwaga w części C).

## Dotyczące umowy zlecenia (część F)

**Czy koszty 20% liczy się od przychodu pomniejszonego o składki *przypadające na część
opodatkowaną*, czy o całość składek?**
`[USTALONE co do zasady, wnioskowanie co do składu podstawy]`
Silnik odejmuje **tę samą, chronologicznie wyliczoną część** (od 2026-08-20; wcześniej
proporcjonalną) w obu miejscach, w których składki wchodzą do wzoru zlecenia — raz jako odliczenie
od dochodu (tam jest to pewne, patrz wyżej), raz jako pomniejszenie podstawy kosztów (tam jest to
wnioskowanie z identycznego zwrotu w art. 22 ust. 9 pkt 4; interpretacji wprost o składzie tej
podstawy nie ma, choć samo chronologiczne stosowanie ulgi KIS potwierdziła trzykrotnie — F.1
pkt 4). Dotyczy wyłącznie zleceniobiorców z ulgą PIT-0 zarabiających powyżej 85 528 zł rocznie.
Uwaga na kierunek: te dwa wejścia działają przeciwnie — mniejsze odliczenie podnosi dochód, ale
wyższa podstawa kosztów go obniża, więc netto efekt to 80% pierwszego (przy 100 000 zł/mies
z chorobową: 2 295 zł/rok, a nie 2 869 zł).

**Czy wpłata pracodawcy do PPK dostaje przy zleceniu koszty 20%?** `[NIEJASNE]`
Silnik przyjmuje, że tak: wpłata jest przychodem z tego samego źródła (art. 13 pkt 8),
więc liczy się jej te same zryczałtowane koszty; sama nie jest oskładkowana, więc podstawy
kosztów nie pomniejsza. Żadne źródło się do tego nie odnosi. Skutek jest wąski — dotyczy
zleceniobiorców z PPK i wynosi 20% wpłaty razy stawka podatku (przy 1,5% i 10 000 zł/mies
to ok. 43 zł rocznie).

**Czy hipotetyczna zaliczka „z 31.12.2021" ma przy zleceniu kwotę zmniejszającą?**
**ROZSTRZYGNIĘTE — nie ma jej; silnik liczy poprawnie.** Mocny argument nie jest ten o PIT-2,
tylko o **braku mechanizmu w przepisie**: zaliczkę od umowy zlecenia pobierało się według
**art. 41 ust. 1** ustawy o PIT w brzmieniu z 31.12.2021, a ten każe zastosować „najniższą stawkę
podatkową" do świadczenia pomniejszonego o koszty i o składki — **kwoty zmniejszającej nie zawiera
w ogóle**. Jedną dwunastą kwoty zmniejszającej dawał wyłącznie **art. 32 ust. 3**, i to pod
warunkiem, że „**pracownik** […] złoży **zakładowi pracy** oświadczenie" — dwa słowa, których do
zleceniobiorcy nie da się naciągnąć. Argument z PIT-2 (zastrzeżonego wtedy dla pracowników,
zleceniobiorcy składają go od 2023 r. — F.5) jest tego skutkiem, nie podstawą.

Źródło: tekst ustawy w brzmieniu obowiązującym 31.12.2021 —
<https://api.sejm.gov.pl/eli/acts/DU/2021/1128/text.pdf>. Do samego PIT-2:
<https://www.podatki.gov.pl/poradniki-i-informatory/pit-2-pit-2a-pit-3-zasady-skladania-oswiadczen-o-stosowaniu-pomniejszenia-zaliczki-o-kwote-zmniejszajaca-podatek-112-124-lub-136>

**Skutek praktyczny — nie „żaden".** Stało tu wcześniej, że rozstrzygnięcie nic nie zmienia, bo kap
przy zleceniu i tak nie wiąże. Jest to rozumowanie w kółko: kap nie wiąże **właśnie dlatego**, że
kwoty zmniejszającej nie stosujemy. Gdyby przysługiwała, hipotetyczna zaliczka spadłaby o 525,12 zł
rocznie i kap wiązałby przy zleceniu **poniżej ok. 1 100 zł/mies** brutto (dokładnie: do
1 102 zł/mies włącznie) — przy 1 000 zł/mies składka zdrowotna byłaby niższa o **48,77 zł/rok**,
przy 500 zł o **286,95 zł**, a przy 300 zł spadłaby **do zera**. Pasmo wąskie, ale niepuste: pole
małżonka przy wspólnym rozliczeniu przyjmuje kwoty od zera (ta sama uwaga, co przy poprawce kapu
w B.5).

**Płaca minimalna i minimalna stawka godzinowa 2026.** `[NIEJASNE]`
Źródła podają dla stawki godzinowej rozbieżnie **30,50 zł** i **31,40 zł**. Nie wchodzi do
modelu (kalkulator pyta o kwotę brutto, nie o godziny), ale gdyby kiedyś miało trafić do
ostrzeżenia w interfejsie — najpierw trzeba to rozstrzygnąć.

## Dotyczące parametrów technicznych

12. **30-krotność 2027 (299 130 zł)** — prognoza z założeń makroekonomicznych z kwietnia 2026,
    kwota ostateczna z ustawy budżetowej na 2027. Może się zmienić.
13. **Płaca minimalna 2027** — źródła podają rozbieżnie: **4 950 zł** (Infor, rp.pl — „opublikowano
    rozporządzenie", „mniejsza niż 5 tys. zł") vs **5 103 zł** (nagłówek PIT.pl). Prawdopodobnie
    5 103 zł to wcześniejsza propozycja, 4 950 zł wersja przyjęta — **nie zweryfikowano ostatecznie**.
    Nie jest to parametr krytyczny dla modelu (wpływa tylko na próg obniżonej wpłaty PPK 0,5%).
14. ~~**Kwota 43,76 zł** (miesięczna kwota zmniejszająca wg stanu na 31.12.2021, używana w kapie
    składki zdrowotnej) — potwierdzona, ale warto sprawdzić w źródle pierwotnym przy
    implementacji.~~ **ROZSTRZYGNIĘTE 2026-08-20.** Kwota potwierdzona (525,12 zł rocznie, 1/12
    miesięcznie), przysługuje **po złożeniu PIT-2** i tylko u jednego płatnika. Przy okazji
    potwierdzone całe otoczenie rachunku: stawka 17%, KUP 250/300 zł, **bez** odliczania składki
    zdrowotnej 7,75% — oraz to, że przy uldze PIT-0 zaliczkę liczy się tak, **jakby zwolnienie nie
    przysługiwało** (art. 83 ust. 2a; patrz B.5, gdzie jest cytat przepisu i opis poprawki).
    Źródło: <https://www.pit.pl/podatek-dochodowy/obnizanie-skladki-zdrowotnej-do-wysokosci-zaliczki-na-pdof-1007182>

## Rekomendacja dla implementacji

Trzymać skalę podatkową jako **dane konfiguracyjne** (lista progów + stawek + kwota zmniejszająca
per rok), nie jako logikę warunkową. Scenariusz 2027 oznaczyć w UI jako **propozycję**, nie
obowiązujące prawo, z datą stanu wiedzy 19.08.2026.

```python
SKALE = {
    2026: {"status": "obowiązująca",
           "progi": [(120_000, 0.12), (None, 0.32)],
           "kwota_zmniejszajaca": 3_600},
    2027: {"status": "ZAPOWIEDŹ 19.08.2026 — brak projektu ustawy",
           "progi": [(130_000, 0.12), (150_000, 0.24), (None, 0.32)],
           "kwota_zmniejszajaca": 3_600},
}
```

---

# CZĘŚĆ F — Umowa zlecenia

Dopisane **20.08.2026**. Stan prawny **2026**; scenariusz 2027 różni się wyłącznie skalą.

## F.0. Dlaczego to w ogóle tu jest

`[PEWNE]` Zapowiadana zmiana dotyczy **skali podatkowej z art. 27 ust. 1**, a skalą
rozlicza się nie tylko etat — część A.5 wymienia wprost „umowa o pracę, umowa zlecenia,
umowa o dzieło". Zleceniobiorca jest więc objęty reformą dokładnie tak samo jak pracownik,
tylko dochodzi do tej samej skali inną drogą.

Różnic jest **trzy** i tylko trzy:

| | umowa o pracę | umowa zlecenia |
|---|---|---|
| Koszty uzyskania przychodu | 250 zł/mies (300 zł dojeżdżający) | **20% przychodu po składkach** |
| Składka chorobowa | obowiązkowa, bez limitu podstawy | **dobrowolna**, limit 250% przeciętnego/mies |
| Uczeń/student do 26 lat | bez znaczenia | **zwolnienie ze wszystkich składek** |

Wszystko pozostałe — stawki emerytalnej, rentowej i zdrowotnej, limit 30-krotności,
kwota zmniejszająca, ulga dla młodych, wspólne rozliczenie, PPK, zaokrąglenia — jest
wspólne. Wypadkową finansuje zleceniodawca, więc netto zleceniobiorcy nie dotyka
(tak samo jak u pracownika).

## F.1. Koszty uzyskania przychodu — 20%

`[PEWNE]` **art. 22 ust. 9 pkt 4 ustawy o PIT**, cytat dosłowny:

> „z tytułów określonych w art. 13 pkt 2, 4–6 i 8 — w wysokości 20% uzyskanego przychodu,
> **z tym że koszty te oblicza się od przychodu pomniejszonego o potrącone przez płatnika
> w danym miesiącu składki na ubezpieczenia emerytalne i rentowe oraz na ubezpieczenie
> chorobowe**, o których mowa w art. 26 ust. 1 pkt 2 lit. b, których podstawę wymiaru
> stanowi ten przychód"

```
KUP_zlecenie = 0.20 × (przychód − składki_społeczne_potrącone)
```

Trzy rzeczy, na których łatwo się przejechać:

1. **Podstawą nie jest brutto.** To najczęstszy błąd internetowych kalkulatorów zlecenia:
   20% od 5 000 zł to 1 000 zł, a prawidłowo 20% × 4 314,50 zł = **862,90 zł**. Różnica
   137,10 zł kosztów miesięcznie to ~16 zł zaniżonego podatku — mało, ale w złą stronę.
2. **Nie ma limitu rocznego.** Limit z art. 22 ust. 9a („kwota stanowiąca górną granicę
   pierwszego przedziału skali") dotyczy wyłącznie ust. 9 **pkt 1–3**, czyli kosztów 50%.
   Koszty 20% rosną z przychodem bez końca. Uwaga: to znaczy też, że wnioskowanie z B.4
   o podniesieniu limitu do 130 000 zł w 2027 r. **nie dotyczy** kosztów 20%.
3. **Przy uldze PIT-0 kosztów nie ma od części zwolnionej.** podatki.gov.pl wprost:
   „Od przychodów objętych ulgą nie obliczasz 20% kosztów uzyskania przychodów". Ta sama
   zasada, co przy etacie (B.6), tylko widoczniejsza, bo koszty są proporcjonalne. Potwierdza
   to MF w objaśnieniach z 14.04.2020, pkt 6: art. 22 ust. 3b „nie ma zastosowania do kosztów
   zryczałtowanych procentowych, które są **obliczane wyłącznie od przychodów podlegających
   opodatkowaniu**".
4. **Składki pomniejszające tę podstawę też są tylko te „od tego przychodu".** Przepis mówi
   o składkach, „których podstawę wymiaru stanowi **ten** przychód" — a skoro koszty liczy się
   wyłącznie od części opodatkowanej, to i pomniejsza się ją wyłącznie o składki przypadające
   na tę część, tak samo jak przy odliczeniu z art. 26 ust. 1 pkt 2 (B.6). Przy zleceniu ta sama
   kwota wchodzi więc do wzoru dwa razy:

   ```
   s_spol_odliczalne = s_spol - s_spol_nieodliczalne      # metoda chronologiczna, B.6
   KUP_zlecenie      = 0.20 * (przychod_opodatkowany - s_spol_odliczalne)
   dochod            = przychod_opodatkowany - s_spol_odliczalne - KUP_zlecenie
   ```

   `[USTALONE co do zasady, wnioskowanie co do składu podstawy]` Chronologiczne stosowanie ulgi —
   limit konsumują przychody w kolejności uzyskania, a nie ułamek każdej wypłaty — KIS potwierdziła
   trzykrotnie: **0114-KDIP3-2.4011.176.2025.2.MN**
   (<https://eureka.mf.gov.pl/informacje/podglad/636049>), **0112-KDIL2-1.4011.636.2025.1.KF**
   (<https://eureka.mf.gov.pl/informacje/podglad/656671>) i **0112-KDIL2-1.4011.617.2023.1.MKA**
   (<https://eureka.mf.gov.pl/informacje/podglad/559895>). Współgra to z miesięczną redakcją samego
   przepisu („potrącone […] w danym miesiącu […] których podstawę wymiaru stanowi ten przychód"):
   w miesiącach objętych zwolnieniem kosztów nie ma wcale, a w pozostałych podstawę pomniejszają
   składki tych właśnie miesięcy. Suma dwunastu miesięcy schodzi się do wzoru wyżej — sprawdzone
   rachunkiem narastającym (B.6).

   Czego nadal nie ma: **interpretacji wprost o składzie tej podstawy** przy uldze PIT-0. Przeszukano
   cały korpus eureka.mf.gov.pl (1069 dokumentów) — bez trafienia, więc ostatni krok pozostaje
   wnioskowaniem z identycznego zwrotu w art. 22 ust. 9 pkt 4 i art. 26 ust. 1 pkt 2. Kierunek:
   gdyby prawidłowe było pomniejszanie o całość składek, koszty byłyby niższe, a podatek wyższy —
   czyli obecne rozwiązanie działa na korzyść podatnika. Odnotowane w części E.

Konsekwencja arytmetyczna, którą warto mieć z tyłu głowy: przy zleceniu
**dochód = 0,8 × (przychód − składki)**, czyli okrągłe 80%. Dla etatu poniżej
30-krotności dochód = 0,8629 × brutto − 3 000; dla zlecenia = 0,69032 × brutto.
Granica, powyżej której koszty zlecenia biją pracownicze 3 000 zł rocznie, wypada przy
**1 449 zł/mies brutto** — czyli praktycznie zawsze, ale nie zawsze.

`[PEWNE]` Podatnik może zamiast 20% wykazać **koszty faktyczne**, jeśli je udowodni
(art. 22 ust. 10), a przy honorarium autorskim — 50% z limitem (B.4). Model liczy
wyłącznie wariant zryczałtowany 20% (patrz F.7).

Źródła: <https://lexlege.pl/ustawa-o-podatku-dochodowym-od-osob-fizycznych/art-22/>,
<https://arslege.pl/wykaz-kosztow-uzyskania-przychodow/k71/a18859/>,
<https://www.podatki.gov.pl/pit/osoba-nieprowadzaca-dzialalnosci-gospodarczej/rozliczenie-osob-26-60/rozliczenie-z-dochodow-z-umowy-zlecenia-lub-o-dzielo/>

## F.2. Składki — zlecenie jako jedyny tytuł

`[PEWNE]` Zakładamy, że zlecenie jest **jedynym tytułem do ubezpieczeń** (zbieg — patrz F.7).

| Składka | Stawka | Kto finansuje | Obowiązkowa? | Limit podstawy |
|---|---|---|---|---|
| Emerytalna | 9,76% | zleceniobiorca | tak | 30-krotność (rocznie) |
| Rentowa | 1,50% | zleceniobiorca | tak | 30-krotność (rocznie) |
| Chorobowa | 2,45% | zleceniobiorca | **nie — dobrowolna** | **250% przeciętnego (miesięcznie)** |
| Wypadkowa | ~1,67% | **zleceniodawca** | tak | brak |
| Zdrowotna | 9% | zleceniobiorca | tak | brak |

Wypadkowej w modelu nie ma, bo nie pomniejsza wypłaty — tak samo jak przy etacie.

### Chorobowa: dobrowolna i z własnym limitem

`[PEWNE]` **art. 20 ust. 3 ustawy o systemie ubezpieczeń społecznych**: podstawa wymiaru
składki na **dobrowolne** ubezpieczenie chorobowe nie może przekraczać **miesięcznie
250% prognozowanego przeciętnego wynagrodzenia**. W 2026 r. to **23 550 zł** (250% ×
9 420 zł). Pracownika ten limit nie dotyczy — u niego chorobowa jest obowiązkowa i liczy
się od całości.

Ciekawa tożsamość, na której opiera się model roczny: **12 × 250% = 30 × przeciętnego
wynagrodzenia**, więc roczna granica podstawy chorobowej wychodzi liczbowo równa
30-krotności (282 600 zł w 2026 r.), mimo że to inny przepis i inne uzasadnienie. W modelu
o dwunastu równych miesiącach obie podstawy schodzą się do jednej liczby; przy nierównych
wypłatach miesięczny limit obcinałby więcej. Silnik ma na tę tożsamość osobny test, żeby
nie rozjechała się po cichu, gdyby prognoza trafiła kiedyś tylko do jednej z dwóch stałych.

**Skutek dla wysoko zarabiających**: zleceniobiorca z 30 000 zł/mies płaci składek
o 1 896,30 zł rocznie **mniej** niż etatowiec z tą samą kwotą — o 2,45% od nadwyżki ponad
30-krotność, której etatowej chorobowej nikt nie obcina.

**Domyślne założenie modelu: chorobowa opłacana.** To wybór prezentacyjny, nie prawny —
dzięki niemu porównanie etatu ze zleceniem przy tej samej kwocie brutto pokazuje wyłącznie
różnicę w kosztach, a nie sumę dwóch niezależnych różnic. Zleceniobiorca, który do
chorobowej nie przystąpił, ma o 2,45% brutto wyższe netto.

Źródła: <https://wskazniki.gofin.pl/wskaznik/259/ograniczenie-podstawy-wymiaru-skladki-na-dobrowolne-ubezpieczenie-chorobowe>,
<https://www.pit.pl/ograniczenia-skladek-zus/>,
<https://www.zus.pl/en/-/umowy-cywilnoprawne-w-ubezpieczeniach-spolecznych>

### Uczeń i student do ukończenia 26 lat — zero składek

`[PEWNE]` **art. 6 ust. 4 ustawy o systemie ubezpieczeń społecznych**. Uczeń szkoły
ponadpodstawowej lub student, który nie ukończył 26 lat, wykonujący umowę zlecenia,
**nie podlega ubezpieczeniom społecznym ani zdrowotnemu** z tego tytułu. ZUS ujmuje to
krótko: „jeżeli jesteś studentem i nie ukończyłeś 26 lat, twój zleceniodawca nie płaci
żadnych składek od umowy zlecenia". Do ubezpieczenia zdrowotnego student jest zgłaszany
przez rodzica albo uczelnię — dlatego **zdrowotnej też nie ma**, a nie tylko społecznych.

To największa pojedyncza różnica w całym modelu: z brutto znika ~22%, więc netto studenta
jest o kilkadziesiąt procent wyższe niż etatowca z tą samą kwotą.

Warunki i granice `[PEWNE]`:
- status studenta liczy się **od dnia immatrykulacji** (nie od przyjęcia na studia);
- **doktoranci nie są studentami** w tym rozumieniu — zwolnienie im nie przysługuje;
- zwolnienie **nie działa**, gdy zlecenie zawarto z **własnym pracodawcą** albo jest
  wykonywane na jego rzecz (wtedy jest to zbieg, składki jak przy etacie);
- kończy się z dniem ukończenia 26 lat albo utraty statusu — co nastąpi wcześniej.

**To zwolnienie jest składkowe, nie podatkowe.** Podatek znika osobno, przez ulgę dla
młodych (F.4), i te dwie rzeczy są niezależne: 30-letni student ma zwolnienie ze składek
bez ulgi podatkowej, 24-letni absolwent — odwrotnie. Typowy student ma oba, i wtedy netto
potrafi się równać brutto co do grosza. Silnik trzyma je jako dwie osobne opcje właśnie
dlatego.

Źródła: <https://www.zus.pl/en/-/umowy-cywilnoprawne-w-ubezpieczeniach-spolecznych>,
<https://www.zus.pl/en/-/zwolnienie-z-obowiazku-naliczania-skladek-od-umow-cywilnoprawnych>,
<https://www.biznes.gov.pl/pl/portal/0098>

## F.3. Kolejność operacji (roczna)

Ta sama, co w części C, z podmienionym krokiem kosztów:

```python
def netto_roczne_zlecenie(brutto_mies, rok, opcje):
    brutto_rok = brutto_mies * 12

    if opcje.student_do_26:                      # F.2 — zero składek, zero zdrowotnej
        s_spol = 0.0
        s_zdrow = 0.0
    else:
        podstawa_er   = min(brutto_rok, LIMIT_30X)
        podstawa_chor = min(brutto_rok, LIMIT_30X) if opcje.chorobowa else 0   # 12 × 250%
        s_spol  = podstawa_er * (0.0976 + 0.0150) + podstawa_chor * 0.0245
        s_zdrow = (brutto_rok - s_spol) * 0.09   # + kap art. 83, patrz F.6

    zwolniony  = min(brutto_rok, 85_528) if opcje.ulga_pit0 else 0     # F.4
    opodatk    = brutto_rok - zwolniony
    kup        = 0.20 * max(0, opodatk - s_spol)                       # F.1
    podstawa   = round_pln(max(0, opodatk - s_spol - kup))
    podatek    = round_pln(podatek_roczny(podstawa, rok))              # ta sama skala, B.3

    return brutto_rok - s_spol - s_zdrow - podatek - ppk
```

Zaokrąglenia bez zmian (art. 63 §1 OP): podstawa i podatek do pełnych złotych, składki
i koszty do groszy.

## F.4. Kwota zmniejszająca podatek i PIT-2

`[PEWNE]` Kwota zmniejszająca **przysługuje zleceniobiorcy tak samo jak pracownikowi** —
to cecha skali podatkowej (art. 27 ust. 1), a nie stosunku pracy. Różnica dotyczy wyłącznie
**zaliczek w trakcie roku**:

- **do 2022 r. włącznie** zleceniobiorca nie mógł złożyć PIT-2 wcale — płatnik pobierał
  zaliczkę bez pomniejszenia, a podatnik odzyskiwał całość w zeznaniu rocznym;
- **od 2023 r.** może złożyć oświadczenie i płatnik stosuje 1/12 kwoty zmniejszającej
  (300 zł, albo 1/24 = 150 zł, albo 1/36 = 100 zł, u maksymalnie trzech płatników łącznie).

**Dla modelu rocznego to nie ma znaczenia**: kwota zmniejszająca wchodzi raz w roku i tyle.
PIT-2 nie jest więc parametrem silnika — ani przy etacie, ani przy zleceniu. Ma znaczenie
tylko w jednym miejscu, i to pośrednio: w hipotetycznej zaliczce „z 31.12.2021" używanej
do kapu składki zdrowotnej (F.6).

Ma natomiast znaczenie **prezentacyjne**: zleceniobiorca bez PIT-2 zobaczy na przelewach
kwoty niższe niż to, co pokazuje kalkulator, i odzyska różnicę dopiero w zeznaniu. Warto
mu to napisać.

Źródło: <https://www.podatki.gov.pl/poradniki-i-informatory/pit-2-pit-2a-pit-3-zasady-skladania-oswiadczen-o-stosowaniu-pomniejszenia-zaliczki-o-kwote-zmniejszajaca-podatek-112-124-lub-136>

## F.5. Ulga dla młodych obejmuje zlecenie

`[PEWNE]` **art. 21 ust. 1 pkt 148** wymienia wśród objętych źródeł, obok stosunku pracy
i zasiłku macierzyńskiego, wprost **„umów zlecenia, o których mowa w art. 13 pkt 8"**.
Ten sam wspólny limit **85 528 zł** przychodu rocznie (B.6), te same zasady:

- zwolnienie dotyczy **przychodu**, nie dochodu;
- składki nalicza się od **całości** — zwolnienie jest podatkowe, nie składkowe;
- koszty 20% przysługują **tylko od części opodatkowanej** (F.1 pkt 3);
- limit jest wspólny ze wszystkimi ulgami PIT-0 i wspólny dla wszystkich źródeł: student
  pracujący pół roku na etacie i pół na zleceniu ma **jeden** limit na oba, nie dwa.
  Silnik tego nie modeluje (liczy jedno źródło naraz) — tak samo jak przy etacie.

**Umowa o dzieło zwolnieniem objęta NIE jest** (B.6) — i to jest jeden z powodów, dla
których model jej nie obejmuje (F.7).

## F.6. Kap składki zdrowotnej przy zleceniu

`[PEWNE co do zasady]` Art. 83 ustawy zdrowotnej dotyczy „płatnika, o którym mowa w art. 85
ust. 1–13", więc obejmuje i zleceniodawcę. Hipotetyczna zaliczka liczy się „wg przepisów
obowiązujących na dzień 31.12.2021" — a te dla zlecenia oznaczają: stawka **17%**, koszty
**20%**, i `[USTALONE]` **bez** miesięcznej kwoty zmniejszającej 43,76 zł.

Podstawa jest mocniejsza niż sam PIT-2: zaliczkę od zlecenia pobierało się wtedy według **art. 41
ust. 1**, który każe zastosować „najniższą stawkę podatkową" do świadczenia pomniejszonego
o koszty i składki — **kwoty zmniejszającej ten przepis nie zawiera w ogóle**. Jedną dwunastą
kwoty dawał wyłącznie **art. 32 ust. 3**, i to „jeżeli **pracownik** […] złoży **zakładowi pracy**
oświadczenie". To, że zleceniobiorca nie mógł w 2021 r. złożyć PIT-2 (F.4), jest konsekwencją tej
konstrukcji, a nie samodzielnym argumentem. Tekst ustawy w brzmieniu z 31.12.2021:
<https://api.sejm.gov.pl/eli/acts/DU/2021/1128/text.pdf>

Ustalenie o kwocie zmniejszającej dotyczy **sposobu** liczenia hipotetycznej zaliczki, a nie
jej podstawy, więc poprawka z art. 83 ust. 2a (B.5, 20.08.2026) niczego w nim nie zmieniła —
te dwie rzeczy są od siebie niezależne i obie obowiązują naraz.

Praktyczna konsekwencja jest wygodna: **przy zleceniu kap nie wiąże nigdy**, przy żadnej
kwocie brutto i niezależnie od ulg. Hipotetyczna zaliczka to 17% od 80% podstawy, czyli
13,6% tego, od czego składka bierze 9% — a brak kwoty zmniejszającej jeszcze ją podnosi.
Stąd trzy wnioski:

- etatowego progu ~1 250 zł/mies (B.5) przy zleceniu **nie ma**;
- uproszczenie „bez ulgi silnik kapu nie stosuje" nic tu nie kosztuje, bo nie ma kwoty,
  przy której cokolwiek by zmieniło;
- z ulgą PIT-0 składka zdrowotna zleceniobiorcy jest **identyczna** jak bez ulgi, przy
  każdej kwocie brutto — co jest po prostu mocniejszą wersją tego, co B.5 mówi o etacie
  (tam identyczna dopiero powyżej 1 250 zł/mies). Silnik ma na to sweep w testach.

⚠️ Te trzy wnioski **wiszą na rozstrzygnięciu o kwocie zmniejszającej**, więc nie wolno ich czytać
jako dowodu, że rozstrzygnięcie jest bez znaczenia. Gdyby kwota zmniejszająca przy zleceniu
przysługiwała, hipotetyczna zaliczka spadłaby o 525,12 zł rocznie i kap **zacząłby wiązać** poniżej
ok. 1 100 zł/mies brutto (dokładnie: do 1 102 zł/mies): przy 1 000 zł/mies składka byłaby niższa
o 48,77 zł/rok, przy 500 zł o 286,95 zł, a przy 300 zł spadłaby do zera. Kap nie wiąże **właśnie
dlatego**, że kwoty zmniejszającej nie stosujemy — a nie niezależnie od tego.

Uwaga praktyczna: dla **studenta do 26 lat** cała ta arytmetyka jest bezprzedmiotowa — on
nie ma z tego tytułu ubezpieczenia zdrowotnego w ogóle, więc nie ma czego obniżać. Warto to
odróżniać od kapu: zerowa składka studenta bierze się ze **zwolnienia ze składki** (F.2),
a nie ze zbicia kapem, i dlatego działa także wtedy, gdy ulga dla młodych nie przysługuje.
Silnik odzwierciedla to wprost — przy zwolnieniu studenckim składka jest ustawiana na zero
przed kapem, a nie przez niego.

## F.7. Czego model NIE obejmuje — i dlaczego

Wypisane wprost, żeby nikt nie wziął tych przypadków za policzone:

1. **Zbieg tytułów do ubezpieczeń.** `[PEWNE co do reguły, świadomie poza modelem]`
   Kto ma etat u jednego podmiotu z wynagrodzeniem co najmniej minimalnym i zlecenie
   u drugiego, płaci z tego zlecenia **wyłącznie składkę zdrowotną** — społeczne są
   z niego dobrowolne. Reguła jest jasna, ale model jej nie liczy z innego powodu:
   kalkulator przyjmuje **jedną kwotę brutto**, a przy zbiegu dochody z obu tytułów
   sumują się w jednym zeznaniu i dzielą jedną kwotę wolną oraz jedne granice przedziałów.
   Pokazanie „netto z samego zlecenia" przy istniejącym etacie byłoby liczbą nieprawdziwą
   — zawyżoną o drugą kwotę zmniejszającą i o niższy przedział skali. Do tego trzeba
   silnika z dwoma źródłami przychodu, nie flagi.
   Źródła: <https://www.biznes.gov.pl/pl/portal/001785>,
   <https://poradnikprzedsiebiorcy.pl/-zbieg-tytulow-ubezpieczen-umowa-o-prace-a-umowa-zlecenie-u-innego-pracodawcy>
2. **Zlecenie z własnym pracodawcą.** Traktowane składkowo jak etat (i unieważnia
   zwolnienie studenckie) — czyli „policz to jako umowę o pracę".
3. **Umowy do 200 zł.** `[PEWNE]` Art. 30 ust. 1 pkt 5a: płatnik pobiera **zryczałtowany
   podatek 12% od przychodu**, bez kosztów i bez kwoty zmniejszającej, a przychodu nie
   wykazuje się w zeznaniu. Zupełnie inna konstrukcja; poza zakresem kalkulatora liczącego
   wynagrodzenie miesięczne.
4. **Koszty 50% (honorarium autorskie) i koszty faktyczne.** Ta sama luka co przy etacie
   (B.4 opisuje 50% KUP, ale silnik ich nie liczy).
5. **Umowa o dzieło.** Inne koszty (20%, ale od całego przychodu — składek nie ma),
   brak ubezpieczeń, **brak ulgi dla młodych**. Osobna forma, nie wariant zlecenia.
6. **Minimalna stawka godzinowa.** Model pyta o kwotę brutto, nie o godziny; a sama
   wartość na 2026 r. jest w źródłach sporna (patrz E).

## F.8. Walidacja — i dlaczego nie ma tu tabeli z prasy

W przeciwieństwie do części D, **nie ma opublikowanych wyliczeń dla zlecenia, którym można
zaufać**. Kalkulatory internetowe różnią się między sobą o kilkaset złotych miesięcznie,
bo milcząco przyjmują różne założenia — a niektóre po prostu liczą źle:

| Źródło (dostęp 20.08.2026) | 5 000 zł brutto → netto | Co przyjęto |
|---|---|---|
| wyliczenie z przepisów (niżej) | **3 812,19 zł** | chorobowa **tak**, PIT-2 **tak**, koszty od przychodu po składkach |
| <https://znajdzprace.plus/kalkulator-wynagrodzen/5000-brutto/> | 3 625,23 zł | chorobowa **nie**, PIT-2 **nie** (składki: 488 + 75 + zdrowotna 399,33; zaliczka 412,44) |

Same założenia bywają nieopisane, więc dwie liczby różniące się o 187 zł miesięcznie
wyglądają jak sprzeczność, a są po prostu odpowiedziami na dwa różne pytania. Do tego
dochodzi błąd, który przy zleceniu widuje się najczęściej: **koszty 20% liczone od całego
brutto** zamiast od brutto po składkach (1 000 zł zamiast 862,90 zł) — niezgodne z art. 22
ust. 9 pkt 4 i zaniżające podatek. Nie da się z zewnątrz stwierdzić, który kalkulator to
robi, bo rozbicia zwykle nie pokazują.

Zamiast przepisywać którąkolwiek z tych liczb, silnik jest sprawdzany **drugą, niezależną
drogą**: testy zawierają osobną implementację pętli dwunastu zaliczek z kroków B.2, z
miesięcznymi zaokrągleniami, napisaną od zera i nie dzielącą kodu z silnikiem. Dla
5 000 zł/mies daje ona:

```
składki społeczne  488,00 + 75,00 + 122,50            =   685,50 zł
koszty 20%         0,20 × (5 000 − 685,50)            =   862,90 zł
podstawa           round_pln(5 000 − 685,50 − 862,90) = 3 452     zł
zaliczka           round_pln(3 452 × 12% − 300)       =   114     zł
zdrowotna          0,09 × (5 000 − 685,50)            =   388,31 zł
NETTO              5 000 − 685,50 − 388,31 − 114      = 3 812,19 zł
```

Model roczny daje **3 812,03 zł/mies** — o 1,94 zł rocznie mniej, czyli dokładnie tyle,
ile część C zapowiada jako różnicę z zaokrągleń (jedno roczne zamiast dwunastu
miesięcznych). Test pilnuje tej zgodności dla sześciu kwot brutto i obu lat.

### Progi opłacalności reformy dla zlecenia

Wyprowadzone z modelu (dochód = 0,69032 × brutto_rok, chorobowa opłacana, bez ulg):

| | umowa o pracę | umowa zlecenia | zlecenie + ulga dla młodych |
|---|---|---|---|
| Zysk rusza z zera przy | 11 879 zł/mies | **14 487 zł/mies** | 22 746 zł/mies |
| Pełne 3 600 zł/rok od | 14 776 zł/mies | **18 108 zł/mies** | 25 981 zł/mies |

Sens dla interfejsu: **zleceniobiorca zyskuje na zmianie skali dopiero od zarobków
wyraźnie wyższych niż etatowiec** — bo koszty 20% wpychają go w niższe przedziały. Za to
przy tej samej kwocie brutto ma dziś **wyższe** netto. Kalkulator ma pokazać jedno i drugie,
a nie obiecywać zysk tam, gdzie go nie ma. Maksymalna korzyść jest ta sama — 3 600 zł
rocznie, bo skala jest ta sama.

### Rząd wielkości różnicy między formami (2026, chorobowa opłacana)

| Brutto/mies | Etat netto/mies | Zlecenie netto/mies | Student ≤26 netto/mies |
|---|---|---|---|
| 5 000 | 3 738,45 | 3 812,03 | 5 000,00 |
| 8 000 | 5 783,50 | 5 919,16 | 8 000,00 |
| 13 000 | 8 998,44 | 9 431,19 | 12 736,25 |

(Kolumna „student" zakłada zwolnienie ze składek **i** ulgę dla młodych — czyli typowy
przypadek studenta poniżej 26. roku życia. Przy 13 000 zł/mies limit 85 528 zł już nie
starcza na cały rok, więc podatek się pojawia.)

---

# CZĘŚĆ G — Rozkład wynagrodzeń (dane porównawcze)

Ta część **nie należy do modelu podatkowego**. Opisuje dane, na których stoi jedno zdanie
w interfejsie — to pod polem kwoty, mówiące „Zarabiasz więcej niż ok. 75% zatrudnionych".
Implementacja: `src/lib/rozklad.ts` (osobno od `src/tax/`, bo zmiana skali tych liczb nie
rusza, a nowy odczyt GUS-u rusza je bez żadnej zmiany w prawie).

## G.1. Źródło

`[PEWNE]` GUS, **„Rozkład wynagrodzeń w gospodarce narodowej w lutym 2026 r."**, informacja
sygnalna opublikowana **5 sierpnia 2026 r.**

- Strona publikacji:
  <https://stat.gov.pl/obszary-tematyczne/rynek-pracy/pracujacy-zatrudnieni-wynagrodzenia-koszty-pracy/rozklad-wynagrodzen-w-gospodarce-narodowej-w-lutym-2026-r-,32,26.html>
- Liczby wzięte z **tablicy 15** („Decyle wynagrodzeń miesięcznych brutto w gospodarce
  narodowej według płci"), kolumna **Ogółem**, z pliku `..._tab.xlsx` — nie z prasy.

Miesiąc odniesienia: **luty 2026**. To najnowszy dostępny odczyt; seria wychodzi miesięcznie
z około półrocznym opóźnieniem.

## G.2. Decyle — dane wejściowe

| Decyl | Percentyl | Brutto/mies |
|---|---|---|
| 1 | 10 | 4 806,00 zł |
| 2 | 20 | 5 278,84 zł |
| 3 | 30 | 6 010,65 zł |
| 4 | 40 | 6 802,04 zł |
| **5 (mediana)** | **50** | **7 690,82 zł** |
| 6 | 60 | 8 820,00 zł |
| 7 | 70 | 10 257,14 zł |
| 8 | 80 | 12 598,55 zł |
| 9 | 90 | 17 111,00 zł |

Przeciętne wynagrodzenie w tym samym miesiącu: 9 966,32 zł — o 22,8% wyżej od mediany.
Rozkład jest silnie prawoskośny i to jest właśnie powód, dla którego samo „średnia krajowa"
nikomu nie mówi, gdzie stoi.

**Pierwszy decyl wypada dokładnie na płacy minimalnej 2026 (4 806 zł)** i nie jest to zbieg
okoliczności: na tej jednej kwocie stoi tak duża grupa, że rozkład ma w tym miejscu pionową
ścianę. Konsekwencja w G.4.

## G.3. Populacja — z kim właściwie się porównujemy

`[PEWNE]` Z objaśnień do tablic: źródłem są **systemy informacyjne ZUS**, a „wynagrodzenie"
to wypłaty **z tytułu stosunku pracy lub stosunku służbowego**, uwzględniane w podstawie
wymiaru składek, wypłacone **w danym miesiącu**.

W praktyce grupa odniesienia to **osoby zatrudnione na umowę o pracę**, i to znaczy:

- **są** w niej etaty pełne **i niepełne** (stąd pierwszy decyl na płacy minimalnej, a nie
  poniżej) — to inna, szersza populacja niż w GUS-owskim *badaniu struktury wynagrodzeń*,
  które obejmuje wyłącznie pełnozatrudnionych;
- **nie ma** w niej samodzielnych umów zlecenia, umów o dzieło ani działalności
  gospodarczej. Zlecenie wchodzi do rachunku **tylko** wtedy, gdy zawarto je z tym samym
  pracodawcą, u którego dana osoba jest już zatrudniona na etacie;
- **nie ma** emerytów, osób pracujących część roku ani nikogo, kto akurat w lutym 2026 r.
  nie dostał wypłaty.

Dlatego etykieta w interfejsie mówi **„zatrudnionych"**, a nie „Polaków", „pracujących" ani
„podatników" — każde z tych trzech słów znaczyłoby coś innego i nieprawdę. Zastrzeżenie
dotyczy też użytkownika kalkulatora będącego na zleceniu: porównanie nadal jest sensowne
(„na tle etatowców"), ale on sam w tej populacji nie występuje, i wyjaśnienie pod znakiem
zapytania to mówi.

## G.4. Metoda i jej dokładność

**Interpolacja liniowa między dwoma sąsiednimi decylami**, wynik zaokrąglony **do 5 punktów**.

Wybór liniowej, nie log-liniowej: rozkład płac jest prawoskośny, więc log-liniowa jest
teoretycznie właściwsza. Została policzona na wszystkich ośmiu przedziałach i różni się od
liniowej **najwyżej o 0,38 punktu** (najgorzej przy 14 740 zł). To mniej niż ziarno, które
i tak deklarujemy — ale różnica **nie znika bez śladu**: spośród 12 306 pełnych złotych
z zakresu D1–D9 dla **482 kwot (3,9%)** obie metody wypadają po dwóch stronach granicy
zaokrąglenia i pokazują wynik różniący się o jeden krok, czyli 5 punktów.

Innymi słowy: obie metody mieszczą się we własnej niepewności i wybór między nimi jest
wyborem, a nie rachunkiem. Pada na liniową, bo czytelnik sprawdzi ją w pamięci, mając przed
sobą tablicę 15. Obie są dokładne w punktach źródłowych, więc żaden decyl na tym nie traci,
a żadna z czterech kwot kontrolnych poniżej nie zależy od tego wyboru (dla 11 878 zł: 76,9
liniowo wobec 77,1 log-liniowo — obie dają 75).

Zaokrąglenie do 5 punktów jest **oświadczeniem o niepewności**, nie kosmetyką: między dwoma
decylami nie wiemy o kształcie rozkładu nic poza tym, że rośnie. Jeden punkt po przecinku
byłby dokładnością zmyśloną.

**Poza siatką decyli nie zgadujemy.** Powyżej dziewiątego decyla rozkład ma długi, nieznany
nam ogon — dociąganie go do 100. percentyla przy 100 000 zł byłoby czystą fikcją. Poniżej
pierwszego tak samo, tylko krócej. W obu przypadkach zdanie **zmienia formę** na przedziałową
(„Jesteś w 10% najlepiej zarabiających"), zamiast podawać oszacowanie punktowe, którego nie
mamy. Kształt zdania niesie więc informację o tym, jak pewna jest liczba.

**Na płacy minimalnej** (4 806 zł = pierwszy decyl) wychodzi równo 10% i należy to czytać jako
**górną granicę**: skoro na tej jednej kwocie stoi kilkuprocentowa grupa, „więcej niż ok. 10%"
jest najżyczliwszym prawdziwym zdaniem, jakie da się powiedzieć.

**Luty jest miesiącem hojnym.** W tej serii luty wychodzi wyraźnie wyżej od stycznia
(9 966 zł wobec 9 353 zł przeciętnego) — wchodzą w niego premie roczne. Percentyl policzony
na lutowym rozkładzie jest więc dla użytkownika **odrobinę zaniżony** względem miesiąca
typowego. Skala efektu nie została zmierzona; przy podmianie danych na inny miesiąc warto
o tym pamiętać.

### Wyliczone percentyle — punkty kontrolne

| Brutto/mies | Percentyl | Skąd |
|---|---|---|
| 4 806 zł | **10** | punkt źródłowy (decyl 1) |
| 7 691 zł | **50** | mediana zaokrąglona; dokładna to 7 690,82 zł = decyl 5 |
| 11 878 zł | **75** | interpolacja D7→D8; dokładnie 76,9 |
| 17 111 zł | **90** | punkt źródłowy (decyl 9) |

## G.5. Próg reformy a „co dziesiąty podatnik"

Próg korzyści przy umowie o pracę (11 878 zł brutto, patrz A.5 i część D) wypada koło
**75. percentyla** tego rozkładu — tyle albo więcej zarabia **ok. 25% zatrudnionych**.

To **nie przeczy** zapowiedzi MF, że reforma dotyczy „mniej więcej co dziesiątego podatnika"
(~3,5 mln podatników, A.5). Obie liczby są prawdziwe, bo liczą co innego:

| | percentyl z części G | „co dziesiąty podatnik" (MF) |
|---|---|---|
| Populacja | zatrudnieni na umowę o pracę | **wszyscy** rozliczający PIT — z emerytami, zleceniobiorcami, przedsiębiorcami, osobami pracującymi część roku |
| Podstawa | wynagrodzenie z **jednego miesiąca** | **roczny dochód** |

Populacja podatników jest znacznie liczniejsza i uboższa od populacji etatowców, więc ten sam
próg wypada w niej dużo wyżej niż na 75. percentylu. Kierunek różnicy jest więc dokładnie
taki, jakiego należy oczekiwać, a nie sprzeczny.

`[NIEJASNE]` Nie udało się ustalić rozkładu **rocznego dochodu wszystkich podatników PIT**,
który pozwoliłby podać percentyl progu w tej samej populacji, o której mówi MF. Dopóki go nie
ma, strona nie twierdzi, że reforma dotyczy „co czwartego" — mówi tylko, ilu **zatrudnionych**
tyle zarabia, i wprost zaznacza, że to inna grupa niż w zapowiedzi.

## G.6. Czego z tych danych NIE wolno wyczytać

- **Nie mówią, ilu ludzi skorzysta na reformie.** Próg dotyczy rocznego dochodu; ktoś, kto
  w lutym zarobił 12 000 zł, ale przepracował pół roku, do progu nie dojdzie.
- **Nie mówią nic o gospodarstwie domowym.** Percentyl liczymy wyłącznie z pensji osoby
  czytającej, także przy wspólnym rozliczeniu — suma dochodów pary nie jest niczyim
  wynagrodzeniem, więc w rozkładzie wynagrodzeń indywidualnych nie ma czego szukać. Połowa
  łącznego dochodu (liczba rządząca progiem, patrz `DECYZJE.md`) tym bardziej nie.
- **Nie są prognozą na 2027 r.** To pomiar z lutego 2026 r. Płace rosną; przy odczycie za
  2027 r. ta sama kwota wypadnie niżej.
- **Nie dzielą dokładniej ogonów.** Poniżej 4 806 zł i powyżej 17 111 zł mamy przedział, nie
  punkt.

## G.7. Kiedy to odświeżyć

Seria wychodzi co miesiąc, z około półrocznym opóźnieniem. Podmiana danych to zmiana jednej
tablicy `DECYLE` i stałej `ROZKLAD_MIESIAC` w `src/lib/rozklad.ts` — testy w
`src/lib/rozklad.test.ts` pilnują, że decyle zostają rosnące i że każdy z nich nadal wypada
równo na swoim percentylu. Trzy rzeczy warto przy tym sprawdzić:

1. czy pierwszy decyl nadal równa się płacy minimalnej (jeśli nie, uwaga o „górnej granicy"
   z G.4 przestaje obowiązywać i trzeba ją poprawić tu oraz w komentarzu w kodzie);
2. czy próg 11 878 zł nadal wypada na 75. percentylu — zdanie w interfejsie liczy to samo
   z `DECYLE`, więc poprawi się samo, ale tabela w G.4 i akapit G.5 już nie;
3. czy miesiąc odniesienia nie jest premiowy (patrz uwaga o lutym w G.4).
