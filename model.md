# PIT 2027 — "trzeci próg podatkowy" + kompletny model wynagrodzenia netto (UoP)

Dokument roboczy. Stan wiedzy na **19.08.2026** (zapowiedź rządowa z tego dnia).
Cel: dane wystarczające do napisania kalkulatora netto dla stanu prawnego **2026** oraz
scenariusza **2027 (proponowanego)**.

## Legenda oznaczeń

| Znacznik | Znaczenie |
|---|---|
| `[PEWNE]` | Obowiązujące prawo (2026) albo liczba potwierdzona w oficjalnym komunikacie rządowym |
| `[ZAPOWIEDŹ]` | Deklaracja polityczna z 19.08.2026 — brak tekstu przepisu, brak projektu ustawy |
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
obowiązujących na 31.12.2021**, składkę obniża się do wysokości tej hipotetycznej zaliczki.

Hipotetyczna zaliczka „2021" liczona jest z:
- KUP 250 zł (lub 300 zł),
- **stawka 17%**,
- miesięczna kwota zmniejszająca **43,76 zł**,
- **bez** odliczania składki zdrowotnej.

```
def kap_zdrowotnej(P_ZUS, S_spol, KUP, ma_PIT2):
    podstawa_2021 = round_do_pelnych_zlotych(P_ZUS - S_spol - KUP)
    zal_2021 = podstawa_2021 * 0.17
    if ma_PIT2:
        zal_2021 -= 43.76
    return max(0, zal_2021)

S_zdrow = min(round2(P_ZDR * 0.09), kap_zdrowotnej(...))
```

Praktycznie dotyczy tylko **bardzo niskich wynagrodzeń** oraz przypadków, gdzie przychód jest
zwolniony z PIT (ulga dla młodych!) — wtedy zaliczka wynosi 0, więc **składka zdrowotna spada do 0**
dla tej części przychodu. To istotny, często pomijany szczegół.

Źródło: <https://www.pit.pl/podatek-dochodowy/obnizanie-skladki-zdrowotnej-do-wysokosci-zaliczki-na-pdof-1007182>

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

# KUP stosuje się TYLKO do części opodatkowanej
# Składki społeczne i zdrowotna nalicza się od CAŁOŚCI (zwolnienie jest podatkowe, nie składkowe)
# ale zdrowotna podlega kapowi z B.5 → dla przychodu w całości zwolnionego spada do 0
```

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

## B.8. Danina solidarnościowa

`[PEWNE dla 2026]` art. 30h ustawy o PIT.

```
podstawa_daniny = (Σ dochodów: art. 27 (skala) + art. 30b (kapitały)
                   + art. 30c (liniowy) + art. 30f (CFC))
                  − składki społeczne
                  − inne odliczenia z art. 30h ust. 2
danina = max(0, podstawa_daniny - 1_000_000) * STAWKA
```

- `STAWKA_2026 = 0.04` `[PEWNE]`
- `STAWKA_2027 = 0.05` `[ZAPOWIEDŹ]`
- Próg **1 000 000 zł** — bez zmian `[ZAPOWIEDŹ potwierdza brak zmiany]`
- `[NIEJASNE]` czy podstawa obejmie dochody z **IP Box** (art. 30ca) — wersje UD116 się różnią.

Termin: deklaracja **DSF-1** do 30 kwietnia roku następnego. Danina jest **poza** zaliczkami
miesięcznymi — nie wchodzi do modelu listy płac.

---

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
    s_chor = brutto_rok  * 0.0245          # BEZ limitu
    s_spol = s_emer + s_rent + s_chor

    # --- zdrowotna ---
    s_zdrow = (brutto_rok - s_spol) * 0.09  # + kap art. 83 (B.5)

    # --- KUP ---
    kup = (300 if opcje.kup_podwyzszone else 250) * 12

    # --- zwolnienie PIT-0 ---
    zwolniony = min(brutto_rok, 85_528) if opcje.ulga_pit0 else 0

    # --- podstawa opodatkowania ---
    podstawa = round_pln(max(0, brutto_rok - zwolniony - s_spol - kup))

    # --- podatek ---
    podatek = round_pln(podatek_roczny(podstawa, rok))   # patrz B.3

    # --- PPK ---
    ppk = brutto_rok * opcje.ppk_pracownik

    return brutto_rok - s_spol - s_zdrow - podatek - ppk
```

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
   Komunikaty nie precyzują.
5. **Czy danina obejmie IP Box** — wersja marcowa UD116 tak, lipcowa podobno nie. Stan nierozstrzygnięty.
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

## Dotyczące parametrów technicznych

12. **30-krotność 2027 (299 130 zł)** — prognoza z założeń makroekonomicznych z kwietnia 2026,
    kwota ostateczna z ustawy budżetowej na 2027. Może się zmienić.
13. **Płaca minimalna 2027** — źródła podają rozbieżnie: **4 950 zł** (Infor, rp.pl — „opublikowano
    rozporządzenie", „mniejsza niż 5 tys. zł") vs **5 103 zł** (nagłówek PIT.pl). Prawdopodobnie
    5 103 zł to wcześniejsza propozycja, 4 950 zł wersja przyjęta — **nie zweryfikowano ostatecznie**.
    Nie jest to parametr krytyczny dla modelu (wpływa tylko na próg obniżonej wpłaty PPK 0,5%).
14. **Kwota 43,76 zł** (miesięczna kwota zmniejszająca wg stanu na 31.12.2021, używana w kapie
    składki zdrowotnej) — potwierdzona, ale warto sprawdzić w źródle pierwotnym przy implementacji.

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
