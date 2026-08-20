<script lang="ts">
  import {
    DANINA_PROG,
    DANINA_STAWKA,
    type FormaZatrudnienia,
    KUP_PODSTAWOWE_MIES,
    KUP_PODWYZSZONE_MIES,
    KUP_ZLECENIE_STAWKA,
    LIMIT_PIT_ZERO,
    PLACA_MINIMALNA,
    PPK_PRACODAWCA_PODSTAWOWY,
    PPK_PRACOWNIK_PODSTAWOWY,
    RATE_CHOROBOWA,
    RATE_EMERYTALNA,
    RATE_RENTOWA,
    SKALA,
  } from '../tax/constants';
  import {
    BRUTTO_PELNA_KORZYSC,
    BRUTTO_PELNA_KORZYSC_ULGA,
    BRUTTO_PELNA_KORZYSC_ZLECENIE,
    BRUTTO_POCZATEK_KORZYSCI,
    BRUTTO_POCZATEK_KORZYSCI_ULGA,
    BRUTTO_POCZATEK_KORZYSCI_ZLECENIE,
    MAKSYMALNA_KORZYSC_ROCZNA,
    MAKSYMALNA_KORZYSC_WSPOLNA,
    type Opcje,
    type OpcjeWspolne,
    type Porownanie,
    type PorownanieWspolne,
    porownaj,
    porownajWspolnie,
    progiIndywidualne,
    progiWspolne,
  } from '../tax/engine';
  import WykresZysku from './WykresZysku.svelte';
  import { kwota, kwotaDokladna, zeZnakiem } from './format';
  import { kwotaZSuwaka, wZakresie } from './suwak';
  import {
    odczytajBezChorobowej,
    odczytajBrutto,
    odczytajForme,
    odczytajMalzonka,
    odczytajPodwyzszoneKoszty,
    odczytajPpk,
    odczytajStudenta,
    odczytajUlge,
    odczytajUlgeMalzonka,
    zapiszStan,
  } from './url';

  // Suwak obejmuje zakres, w którym cokolwiek się dzieje. Wpisać z ręki można
  // znacznie więcej, bo powyżej suwaka zysk wprawdzie stoi w miejscu, ale netto
  // rośnie dalej — przycięcie kwoty pokazywałoby komuś cudzą wypłatę jako jego.
  const MIN_SUWAK = 3_000;
  const MAX_SUWAK = 30_000;
  const MIN_POLE = 1_000;
  const MAX_POLE = 100_000;

  const startowe = wZakresiePola(odczytajBrutto(12_000));
  const startowyMalzonek = odczytajMalzonka();
  const startowaUlga = odczytajUlge();
  const startowaUlgaMalzonka = odczytajUlgeMalzonka();
  const startowePpk = odczytajPpk();
  const startoweKoszty = odczytajPodwyzszoneKoszty();
  const startowaForma = odczytajForme();
  const startowaBezChorobowej = odczytajBezChorobowej();
  const startowyStudent = odczytajStudenta();

  /** Kwota, na której liczy silnik — zawsze skończona liczba, nigdy pusta. */
  let brutto = $state(startowe);

  /**
   * Treść pola trzymana osobno od kwoty: w trakcie pisania wolno jej być pustej
   * albo spoza zakresu, bo „1", „12", „123" to etapy wpisywania 13 000, a nie
   * błędy do naprawienia.
   */
  let pole = $state(String(startowe));

  /**
   * Wspólne rozliczenie z małżonkiem. Domyślnie wyłączone: rozliczenie
   * indywidualne zostaje scenariuszem podstawowym, a wspólne pojawia się dopiero
   * na świadome kliknięcie — razem z drugim polem.
   */
  let wspolne = $state(startowyMalzonek !== null);

  /**
   * Zero jest tu poprawną i najczęstszą odpowiedzią, nie brakiem odpowiedzi:
   * para z jednym żywicielem to główny powód, dla którego wspólne rozliczenie
   * w ogóle istnieje. Dlatego jest wartością startową i dolną granicą pola.
   */
  let bruttoMalzonka = $state(startowyMalzonek ?? 0);
  let poleMalzonka = $state(String(startowyMalzonek ?? 0));

  /**
   * Ulga dla młodych — dwie niezależne flagi, bo silnik jej nie dziedziczy:
   * wiek jest cechą konkretnej osoby, a nie ustawieniem gospodarstwa. Stąd też
   * rozmieszczenie w układzie: każdy przełącznik stoi przy wynagrodzeniu tej
   * osoby, której dotyczy, zamiast tworzyć osobną grupę „ulgi" z dwoma polami,
   * przy której trzeba by dopiero czytać, kto jest kto.
   */
  let ulga = $state(startowaUlga);
  let ulgaMalzonka = $state(startowaUlgaMalzonka);

  /**
   * PPK — jedna flaga, nie dwie stawki: interfejs oferuje wpłaty **podstawowe**
   * (2% pracownika i 1,5% pracodawcy), bo tyle płaci każdy, kogo automatyczny
   * zapis wciągnął do programu i kto nic z tym dalej nie robił. Silnik bierze
   * ułamki, więc gdyby kiedyś doszły wpłaty dodatkowe, zmieni się tu tylko typ
   * stanu, a nie sposób podawania opcji.
   */
  let ppk = $state(startowePpk);

  /** Zamieszkanie poza miejscowością zakładu pracy — KUP 300 zł zamiast 250 zł. */
  let podwyzszoneKoszty = $state(startoweKoszty);

  /**
   * Forma zatrudnienia. Nie jest to kolejna opcja obok PPK czy kosztów: zmienia
   * drogę od brutto do dochodu (koszty 20% zamiast 250 zł/mies, chorobowa
   * dobrowolna, zwolnienie studenckie), a razem z nią progi korzyści, oś
   * wykresu i połowa objaśnień na stronie. Dlatego stoi nad kwotą, jako pytanie
   * ramujące wszystko poniżej, a nie wśród przełączników pod suwakiem.
   */
  let forma = $state<FormaZatrudnienia>(startowaForma);
  const zlecenie = $derived(forma === 'zlecenie');

  /**
   * Rezygnacja z dobrowolnej chorobowej — trzymana „od tyłu" (domyślnie
   * `false` = składka opłacana), bo tak brzmi etykieta i tak samo działa
   * adres: parametr pojawia się wyłącznie przy odstępstwie od stanu
   * domyślnego, którym jest chorobowa opłacana (patrz `Opcje` w silniku).
   */
  let bezChorobowej = $state(startowaBezChorobowej);

  /** Uczeń lub student do 26 lat na zleceniu — zero składek ZUS i zdrowotnej. */
  let student = $state(startowyStudent);

  let rozwiniete = $state(false);

  /**
   * Panel opcji. Zwinięty pokazuje same przyjęte założenia (patrz `zalozenia`),
   * rozwinięty — kontrolki, którymi się je zmienia.
   *
   * Otwarty od razu, gdy link niesie którekolwiek z tych ustawień: wynik jest
   * wtedy inny niż domyślny i trzeba widzieć czym się różni, a nie tylko że się
   * różni. Kwota (`?brutto=`) i forma (`?forma=`) panelu nie otwierają — obie
   * mają na stronie własną, zawsze widoczną kontrolkę, która pokazuje swój stan
   * sama.
   */
  let opcjeOtwarte = $state(
    startowyMalzonek !== null ||
      startowaUlga ||
      startowaUlgaMalzonka ||
      startowePpk ||
      startoweKoszty ||
      startowaBezChorobowej ||
      startowyStudent,
  );

  /**
   * Wiek zostaje jednym założeniem także przy wspólnym rozliczeniu, choć osób
   * jest wtedy dwie i każda ma własną ulgę. Drugi kawałek tekstu byłby gorszy
   * niż dłuższy pierwszy: „26 lat lub więcej · małżonek poniżej 26 lat" czyta
   * się jak zaprzeczenie samego siebie, dopóki nie domyślisz się, że pierwsze
   * mówiło wyłącznie o Tobie. Zdanie o dwojgu tej luki nie zostawia, a wiersz
   * i tak zostaje trzyczłonowy.
   */
  const wiek = $derived.by(() => {
    if (!wspolne) return ulga ? 'mniej niż 26 lat' : '26 lat lub więcej';
    if (ulga && ulgaMalzonka) return 'oboje poniżej 26 lat';
    if (ulga) return 'tylko Ty poniżej 26 lat';
    if (ulgaMalzonka) return 'tylko małżonek poniżej 26 lat';
    return 'oboje 26 lat lub więcej';
  });

  /**
   * Przyjęte założenia, po jednym kawałku tekstu — treść zwiniętego panelu.
   *
   * Zwinięty panel nie ma prawa milczeć. Ktoś w PPK, kto go nie rozwinie,
   * zobaczyłby netto zawyżone o ponad 300 zł miesięcznie, student na zleceniu
   * zaniżone o jedną piątą — i nie mieliby skąd wiedzieć dlaczego. Dlatego
   * opcje ważące setki złotych mają tu swój kawałek tekstu **w obu stanach**:
   * „bez PPK" jest dokładnie tak samo ważną informacją jak „z PPK".
   *
   * Drobiazgi — koszty dojazdu, rezygnacja z chorobowej — dopisują się dopiero
   * włączone. Gdyby stały tu zawsze, wiersz rósłby z każdą nową opcją o rzecz,
   * której nikt nie szukał, a to jego długość decyduje, czy da się go przeczytać
   * jednym rzutem oka. Ten sam podział przebiega w panelu: nad kreską opcje
   * stąd, pod kreską te dopisywane warunkowo.
   *
   * Formy zatrudnienia tu nie ma świadomie — jako jedyna ma nad kwotą własną
   * kontrolkę, która swój stan pokazuje zawsze i bez rozwijania. Wiersz istnieje
   * dla ustawień, których niezaznaczony przełącznik nie umie powiedzieć;
   * podświetlony segment mówi „umowa zlecenia" sam, a powtórzenie zjadałoby
   * szerokość, której na 375 px nie ma.
   *
   * Sformułowania są bezosobowe („rozliczenie indywidualne", nie „rozliczam się
   * sam"): jedno obok drugiego czytają się jak dane, a nie jak zdania, i nie
   * zakładają rodzaju gramatycznego czytelnika, którego nie znamy.
   */
  const zalozenia = $derived([
    wiek,
    // Zwolnienie studenckie zdejmuje ~22% wynagrodzenia — najcięższa opcja
    // w kalkulatorze, więc na zleceniu stoi w wierszu tak samo w obu stanach.
    // Przy etacie nie istnieje i nie ma o czym pisać.
    ...(zlecenie ? [student ? 'student do 26 lat' : 'bez statusu studenta'] : []),
    ppk ? 'z PPK' : 'bez PPK',
    wspolne ? 'rozliczenie wspólne' : 'rozliczenie indywidualne',
    ...(bezChorobowej ? ['bez chorobowej'] : []),
    ...(podwyzszoneKoszty ? ['dojazd spoza miejscowości'] : []),
  ]);

  /** Czy w bieżącym scenariuszu ktokolwiek korzysta ze zwolnienia. */
  const jakasUlga = $derived(ulga || (wspolne && ulgaMalzonka));

  /**
   * Ustawienia, które w silniku dziedziczą się na małżonka — forma
   * zatrudnienia, chorobowa, PPK i koszty uzyskania przychodu. Wyłączone znaczy
   * dokładnie tyle co ich brak (`ppkPracownik: 0` = domyślne zero,
   * `kupPodwyzszone: false` = koszty podstawowe), więc przy wszystkich
   * przełącznikach wyłączonych wynik jest co do grosza taki jak przed ich
   * dodaniem.
   *
   * Status studenta tu **nie** wchodzi — to cecha konkretnej osoby, jak wiek,
   * i silnik jej nie dziedziczy. Stoi więc obok `ulgaDlaMlodych` w `opcje`.
   */
  const opcjeOsoby: Opcje = $derived({
    forma,
    chorobowaDobrowolna: !bezChorobowej,
    kupPodwyzszone: podwyzszoneKoszty,
    ppkPracownik: ppk ? PPK_PRACOWNIK_PODSTAWOWY : 0,
    ppkPracodawca: ppk ? PPK_PRACODAWCA_PODSTAWOWY : 0,
  });

  /**
   * Opcje dla silnika. `malzonek` podajemy zawsze wprost, bo bez tego
   * `porownajWspolnie` zeruje małżonkowi ulgę — dokładnie po to, żeby nie
   * zwolnić po cichu obojga (patrz `OpcjeWspolne`). Przy rozliczeniu
   * indywidualnym pole jest po prostu ignorowane.
   *
   * Skoro jednak podajemy je wprost, trzeba w nim powtórzyć całą resztę:
   * `malzonek` zastępuje dziedziczenie, więc bez `...opcjeOsoby` małżonek
   * dostałby koszty podstawowe i zero PPK niezależnie od przełączników.
   * Kierunek jest tu odwrotny niż przy uldze i celowo: wiek jest cechą osoby,
   * a PPK i dojazdy przyjmujemy za ustawienie gospodarstwa — jeden przełącznik
   * zamiast dwóch, kosztem pary, w której tylko jedno jest w PPK. Interfejs
   * mówi o tym wprost przy włączonym wspólnym rozliczeniu.
   */
  const opcje: OpcjeWspolne = $derived({
    ...opcjeOsoby,
    ulgaDlaMlodych: ulga,
    studentDo26: student,
    malzonek: { ...opcjeOsoby, ulgaDlaMlodych: ulgaMalzonka },
  });

  const wynik = $derived(
    wspolne ? porownajWspolnie(brutto, bruttoMalzonka, opcje) : porownaj(brutto, opcje),
  );
  const zyskuje = $derived(wynik.zyskRocznie > 0);

  const maksymalnyZysk = $derived(
    wspolne ? MAKSYMALNA_KORZYSC_WSPOLNA : MAKSYMALNA_KORZYSC_ROCZNA,
  );

  /**
   * Progi korzyści na ustawieniach, dla których model ma wyprowadzoną parę
   * stałych — albo `null`, gdy trzeba ich poszukać.
   *
   * Stałe pokrywają trzy najczęstsze scenariusze: etat, etat z ulgą dla młodych
   * (pierwsze 85 528 zł przychodu jest wolne od podatku, więc nowa skala rusza
   * dopiero od 20 139 zł brutto) i zlecenie z opłacaną chorobową (koszty 20%
   * zjadają jedną piątą przychodu, więc próg idzie w górę do 14 487 zł).
   * Wszystko poza nimi — PPK, podwyższone koszty, brak chorobowej, status
   * studenta i ich kombinacje — stałych nie ma i mieć nie powinno: to byłyby
   * dziesiątki par zamiast trzech.
   *
   * Dlaczego w ogóle stałe, skoro `progiIndywidualne` policzy każdy przypadek:
   * bo wyszukiwanie daje 11 879 zł tam, gdzie cała strona (nagłówek, FAQ,
   * model.md) mówi 11 878 zł. Różnica bierze się z tego, że stała jest ostatnim
   * brutto **przed** progiem, a wyszukiwanie pierwszym **po** nim; obie liczby
   * są poprawne, ale w interfejsie ma stać ta, którą reszta strony tłumaczy.
   */
  const progiStale = $derived.by(() => {
    if (ppk || podwyzszoneKoszty) return null;
    if (zlecenie) {
      if (ulga || student || bezChorobowej) return null;

      return {
        poczatek: BRUTTO_POCZATEK_KORZYSCI_ZLECENIE,
        pelna: BRUTTO_PELNA_KORZYSC_ZLECENIE,
      };
    }

    return ulga
      ? { poczatek: BRUTTO_POCZATEK_KORZYSCI_ULGA, pelna: BRUTTO_PELNA_KORZYSC_ULGA }
      : { poczatek: BRUTTO_POCZATEK_KORZYSCI, pelna: BRUTTO_PELNA_KORZYSC };
  });

  /**
   * Progi korzyści. Przy wspólnym rozliczeniu przesuwają się wraz z zarobkami
   * małżonka, bo liczy się połowa łącznego dochodu — przy małżonku bez dochodu
   * obie granice skali działają podwójnie i próg wypada mniej więcej dwa razy
   * wyżej; `progiWspolne` dostaje te same opcje co reszta wyliczenia, więc ulgi
   * i forma zatrudnienia są w nich uwzględnione.
   *
   * Poza stałymi próg wyszukuje silnik (`progiIndywidualne`) — zysk jest
   * niemalejący względem wynagrodzenia aż do daniny solidarnościowej, więc
   * kilkanaście wywołań wystarcza. Przeliczenie zachodzi po zmianie opcji,
   * a nie przy ruchu suwaka: `brutto` w tym wyrażeniu nie występuje.
   */
  const progi = $derived(
    wspolne
      ? progiWspolne(bruttoMalzonka, opcje)
      : (progiStale ?? progiIndywidualne(opcje)),
  );

  /**
   * Górny kraniec osi wykresu. Dobierany tak, żeby próg pełnej korzyści wypadał
   * mniej więcej w dwóch trzecich szerokości — tak jak przy rozliczeniu
   * indywidualnym bez ulgi, gdzie 14 776 zł leży w tym miejscu osi kończącej się
   * na 20 000 zł. Widełki pilnują, żeby oś nie zrobiła się absurdalnie ciasna,
   * gdy małżonek zarabia tyle, że para ma pełną korzyść niemal od razu.
   *
   * Ulga przesuwa oba załamania w górę (23 036 zł indywidualnie, prawie 36 000 zł
   * przy małżonku bez dochodu), więc sufit 40 000 zł ścinałby wtedy podpis progu
   * przy krawędzi. Podnosimy go tylko w scenariuszach z ulgą — bez niej oś
   * zostaje co do złotówki taka jak dotąd.
   *
   * Zlecenie przesuwa je podobnie, choć słabiej (18 108 zł zamiast 14 776 zł):
   * na osi do 20 000 zł podpis pełnej korzyści wypadałby tuż przy prawym
   * krańcu, więc i tu oś dobieramy do progów zamiast zostawiać stałą.
   */
  const gornaOsi = $derived(
    wspolne || jakasUlga || zlecenie
      ? Math.min(
          jakasUlga ? 55_000 : 40_000,
          Math.max(12_000, Math.ceil((MIN_SUWAK + (progi.pelna - MIN_SUWAK) / 0.69) / 1_000) * 1_000),
        )
      : 20_000,
  );

  /**
   * Suwak sięga co najmniej tam, gdzie oś wykresu, bo wykres jest jego drugim
   * sterownikiem — inaczej przeciągnięcie w prawy koniec zatrzymywałoby znacznik
   * w połowie gestu.
   *
   * Sufit **nie** idzie za wpisaną kwotą i to jest świadomy wybór. Suwak, który
   * kończy się dokładnie na bieżącej wartości, przy przeciąganiu w lewo od razu
   * obniżyłby własny sufit i uciekł spod palca — sprzężenie zwrotne zamiast
   * sterowania. Kwoty spoza zakresu obsługujemy więc tak, jak dzieje się to od
   * początku przy 100 000 zł: uchwyt stoi przypięty do krawędzi (`value` niżej),
   * a wynik i tak liczy się z pełnej kwoty. Ceną jest to, że przeciąganie zaczyna
   * się wtedy od krawędzi, a nie od miejsca, którego na tej osi nie ma.
   */
  const maxSuwak = $derived(Math.max(MAX_SUWAK, gornaOsi));

  const doProgu = $derived(Math.max(0, progi.poczatek - brutto));
  const ponizejMinimalnej = $derived(brutto < PLACA_MINIMALNA);

  /**
   * Stawki PPK piszemy z tych samych stałych, na których liczy silnik — inaczej
   * zmiana wpłaty podstawowej rozjechałaby tekst z wynikiem. `pl-PL` daje „2%"
   * i „1,5%", czyli dokładnie tak, jak się to czyta po polsku.
   */
  const procent = (ulamek: number, cyfry = 1) =>
    ulamek.toLocaleString('pl-PL', { style: 'percent', maximumFractionDigits: cyfry });

  /**
   * Łączna stawka składek społecznych w bieżącym scenariuszu — do zdania
   * o dochodzie. Liczona ze stałych, na których liczy silnik, bo inaczej
   * rezygnacja z chorobowej zostawiłaby w tekście 13,71% obok liczby
   * policzonej z 11,26%.
   */
  const stawkaSkladek = $derived(
    RATE_EMERYTALNA + RATE_RENTOWA + (zlecenie && bezChorobowej ? 0 : RATE_CHOROBOWA),
  );

  /** Miesięczne wpłaty PPK — obie strony osobno, bo o tym właśnie jest nota. */
  const wplatyPpk = $derived({
    pracownik: wynik.po.ppk / 12,
    pracodawca: wynik.po.ppkPracodawcy / 12,
    razem: (wynik.po.ppk + wynik.po.ppkPracodawcy) / 12,
  });

  /**
   * Czy PPK faktycznie się nalicza — a nie tylko „czy przełącznik jest
   * zaznaczony". Student na zleceniu nie jest „osobą zatrudnioną" w rozumieniu
   * ustawy o PPK, więc silnik zeruje mu wpłaty mimo podanych stawek; bez tego
   * rozróżnienia strona obiecywałaby „0 zł miesięcznie na rachunek PPK".
   * Przy wspólnym rozliczeniu wystarczy jedna osoba ze składkami, bo kwoty
   * w rozbiciu są sumą obojga.
   */
  const ppkDziala = $derived(wynik.po.ppk > 0 || wynik.po.ppkPracodawcy > 0);

  /**
   * O ile więcej zabiera danina w 2027 r. niż w 2026 — czyli o ile mniejszy
   * jest z jej powodu zysk z reformy.
   *
   * Podstawa daniny jest w obu latach ta sama (silnik liczy dochód bez oglądania
   * się na rok), więc różnica bierze się wyłącznie z podniesienia stawki z 4%
   * na 5% i jest dokładnie tym, co zjada zysk z nowej skali: przy 100 000 zł
   * brutto 1 358 zł z 3 600 zł.
   */
  const wiecejDaniny = $derived(wynik.po.danina - wynik.przed.danina);

  /**
   * Czy wynik jest wynikiem pary, a więc czy da się z niego wyjąć składniki
   * każdego z małżonków osobno.
   *
   * `wspolne` mówi to samo, ale mówi to stanowi interfejsu, nie systemowi
   * typów: `porownaj` i `porownajWspolnie` w wyrażeniu warunkowym są ścinane
   * do wspólnego nadtypu `Porownanie`, więc bez tego predykatu `osoby` po
   * prostu nie istnieją dla sprawdzania typów.
   */
  function zRozbiciemNaOsoby(w: Porownanie): w is PorownanieWspolne {
    return 'osoby' in w.po;
  }

  /**
   * Podstawy i daniny obu małżonków — albo `null` przy rozliczeniu
   * indywidualnym, gdzie rozbijać nie ma czego.
   *
   * Danina jest indywidualna, więc przy wspólnym rozliczeniu wiersz w tabeli
   * niesie sumę dwóch liczb policzonych od dwóch różnych podstaw, a żadnej
   * z tych podstaw nie ma w `Wynik` — i to jest w silniku świadome: podstawa
   * gospodarstwa jako jedna liczba byłaby dokładnie tą, której pod próg
   * 1 000 000 zł podstawiać nie wolno. Dlatego sięgamy do `osoby`.
   */
  const daninyOsob = $derived(
    zRozbiciemNaOsoby(wynik)
      ? wynik.po.osoby.map((osoba) => ({
          podstawa: osoba.podstawaDaniny,
          danina: osoba.danina,
        }))
      : null,
  );

  /**
   * Kwota odejmowana w rozbiciu. Zero pisze się bez znaku, bo „−0,00 zł"
   * wygląda na usterkę — a u studenta na zleceniu zerowe są naraz obie składki
   * i podatek, czyli trzy wiersze z rzędu.
   */
  const odjac = (x: number) => (x > 0 ? `−${kwotaDokladna(x)}` : kwotaDokladna(x));

  /**
   * Najdłuższe możliwe brzmienie noty o PPK — duch trzymający jej wysokość,
   * jak w panelu wyniku. Wpłaty rosną z wynagrodzeniem, a te zmieniają się przy
   * przeciąganiu suwaka, więc bez rezerwacji nota potrafiłaby na wąskim ekranie
   * dołożyć sobie wiersz w środku gestu i podskoczyłaby reszta strony.
   */
  const maksymalnePpk = $derived.by(() => {
    const podstawa = MAX_POLE * (wspolne ? 2 : 1);
    const pracownik = podstawa * PPK_PRACOWNIK_PODSTAWOWY;
    const pracodawca = podstawa * PPK_PRACODAWCA_PODSTAWOWY;

    return { pracownik, pracodawca, razem: pracownik + pracodawca };
  });

  /**
   * Progi z zapowiedzi w jednostce, w której są napisane: **roczny dochód**.
   * Czytane ze skali, a nie wpisane drugi raz z ręki — inaczej podniesienie
   * granicy w `constants.ts` rozjechałoby liczby ze zdaniem obok nich.
   */
  const PROG_DZIS = SKALA[2026][0].do;
  const PROG_NOWY = SKALA[2027][0].do;
  const PROG_NOWY_GORNY = SKALA[2027][1].do;

  /**
   * Liczba, którą wolno postawić obok progów skali.
   *
   * Silnik liczy dochód identycznie dla obu lat — `skladniki` w ogóle nie zna
   * roku, bo zapowiedź zmienia stawki, a nie sposób dojścia do podstawy — więc
   * `przed.podstawaOpodatkowania` i `po.podstawaOpodatkowania` są tą samą
   * kwotą i wolno wziąć jedną na obie strony porównania. Bierzemy `po`, bo to
   * o skali z 2027 r. mówi tekst obok.
   *
   * Przy wspólnym rozliczeniu skalę stosuje się do **połowy** łącznego dochodu
   * (art. 6 ust. 2 ustawy o PIT), więc to ona, a nie suma, stoi po tej samej
   * stronie porównania co progi. Pokazanie tu sumy byłoby liczbą, która w tym
   * trybie po prostu kłamie: para z łącznym dochodem 240 000 zł nie płaci
   * dziś od nadwyżki 32%, bo skala widzi u niej 120 000 zł.
   *
   * Ulga dla młodych nie wymaga tu niczego dodatkowego: zwolniony przychód jest
   * już odjęty w `podstawaOpodatkowania`, więc porównywana liczba sama z siebie
   * jest odpowiednio niższa (przy pełnym zwolnieniu — zerowa).
   */
  const dochod = $derived(
    wspolne ? wynik.po.podstawaOpodatkowania / 2 : wynik.po.podstawaOpodatkowania,
  );

  // Jednorazowo po wczytaniu, żeby adres dało się skopiować, zanim ktoś dotknie
  // pola. Później zapisują już tylko zakończona edycja i puszczony suwak —
  // zapis na każdym znaku wpisywał do adresu wartości pośrednie.
  $effect(() => {
    zapiszStan(startowe, startowyMalzonek, {
      forma: startowaForma,
      ulga: startowaUlga,
      ulgaMalzonka: startowaUlgaMalzonka,
      ppk: startowePpk,
      podwyzszoneKoszty: startoweKoszty,
      bezChorobowej: startowaBezChorobowej,
      student: startowyStudent,
    });
  });

  /**
   * Adres ma nieść cały scenariusz, także ten wspólny — patrz `url.ts`. Stan
   * wyłączonej sekcji do adresu nie idzie: przy rozliczeniu indywidualnym nie ma
   * małżonka, więc nie ma też jego ulgi.
   */
  function zapisz() {
    zapiszStan(brutto, wspolne ? bruttoMalzonka : null, {
      forma,
      ulga,
      ulgaMalzonka: wspolne && ulgaMalzonka,
      ppk,
      podwyzszoneKoszty,
      bezChorobowej,
      student,
    });
  }

  function wZakresiePola(wartosc: number): number {
    return Math.min(MAX_POLE, Math.max(MIN_POLE, Math.round(wartosc)));
  }

  function wZakresieSuwaka(wartosc: number): number {
    return wZakresie(wartosc, MIN_SUWAK, maxSuwak);
  }

  /** Pisanie w polu: wynik idzie za tym, co widać, ale bez domykania do zakresu. */
  function pisz(surowe: string) {
    pole = surowe;

    const liczba = Number(surowe);
    // Pusto albo śmieć — zostaje ostatnia sensowna kwota, żeby wynik się nie wywrócił.
    if (surowe.trim() === '' || !Number.isFinite(liczba) || liczba < 0) return;

    brutto = Math.round(liczba);
  }

  /** Koniec edycji (blur albo Enter) — dopiero tu domykamy do zakresu suwaka. */
  function zakoncz() {
    brutto = wZakresiePola(brutto);
    pole = String(brutto);
    zapisz();
  }

  /** To samo dla pola małżonka, tyle że tu wolno wpisać zero. */
  function piszMalzonka(surowe: string) {
    poleMalzonka = surowe;

    const liczba = Number(surowe);
    if (surowe.trim() === '' || !Number.isFinite(liczba) || liczba < 0) return;

    bruttoMalzonka = Math.round(liczba);
  }

  function zakonczMalzonka() {
    bruttoMalzonka = Math.min(MAX_POLE, Math.max(0, bruttoMalzonka));
    poleMalzonka = String(bruttoMalzonka);
    zapisz();
  }

  function przelaczWspolne(wlaczone: boolean) {
    wspolne = wlaczone;
    zapisz();
  }

  function przelaczUlge(wlaczone: boolean) {
    ulga = wlaczone;
    zapisz();
  }

  function przelaczUlgeMalzonka(wlaczone: boolean) {
    ulgaMalzonka = wlaczone;
    zapisz();
  }

  function przelaczPpk(wlaczone: boolean) {
    ppk = wlaczone;
    zapisz();
  }

  function przelaczKoszty(wlaczone: boolean) {
    podwyzszoneKoszty = wlaczone;
    zapisz();
  }

  function przelaczChorobowa(wlaczone: boolean) {
    bezChorobowej = wlaczone;
    zapisz();
  }

  function przelaczStudenta(wlaczone: boolean) {
    student = wlaczone;
    zapisz();
  }

  /**
   * Zmiana formy zatrudnienia gasi ustawienia, których w nowej formie nie ma.
   *
   * Silnik i tak je ignoruje (`kupPodwyzszone` przy zleceniu,
   * `chorobowaDobrowolna` i `studentDo26` przy etacie), więc na wynik to nie
   * wpływa — ale opcja, która zniknęła z ekranu i wciąż siedzi w stanie, wraca
   * po przełączeniu formy z powrotem i zmienia wynik bez ani jednego
   * kliknięcia. Gaszenie zamyka też drogę do adresu opisującego scenariusz,
   * którego interfejs nie umie pokazać.
   *
   * Kwoty nie dotykamy: forma zmienia progi, więc i zakres suwaka, ale wpisana
   * kwota jest daną użytkownika (patrz `suwak.ts`).
   */
  function ustawForme(nowa: FormaZatrudnienia) {
    forma = nowa;

    if (nowa === 'zlecenie') podwyzszoneKoszty = false;
    else {
      bezChorobowej = false;
      student = false;
    }

    zapisz();
  }

  /**
   * Suwak nie ma stanów pośrednich, więc klamruje od razu — a `null` znaczy
   * „to nie był gest, tylko domknięcie uchwytu po zmianie zakresu" i wtedy nie
   * rusza się nic. Cała reguła razem z uzasadnieniem siedzi w `suwak.ts`, bo
   * tylko tam da się ją przetestować bez przeglądarki.
   *
   * Cena jest jedna i mała: pierwsze zdarzenie gestu zaczętego dokładnie na
   * przypiętej krawędzi przepada. Każdy następny ruch wychodzi poza nią, więc
   * po drgnieniu myszy wszystko działa jak dotąd.
   */
  function przesun(wartosc: number) {
    const nowa = kwotaZSuwaka(wartosc, brutto, MIN_SUWAK, maxSuwak);
    if (nowa === null) return;

    brutto = nowa;
    pole = String(brutto);
  }
</script>

<section class="wejscie">
  <!-- Forma zatrudnienia stoi nad kwotą, bo nie jest opcją do kwoty, tylko
       ramą dla wszystkiego pod nią: zmienia koszty uzyskania przychodu z 250 zł
       miesięcznie na 20% przychodu, czyni chorobową dobrowolną i przesuwa próg
       korzyści o ponad 2 500 zł. Czyta się więc jak pytanie pierwsze — „na
       czym pracujesz", potem „za ile" — a nie jak dopowiedzenie pod suwakiem,
       gdzie siedzą przełączniki modyfikujące gotowe już wyliczenie.

       Dwie równorzędne możliwości, więc grupa dwóch pól radio, a nie
       przełącznik włącz/wyłącz: przełącznik ma stan domyślny i odstępstwo,
       a tu nie ma czego „włączyć" — zlecenie nie jest etatem z dodatkiem.
       Etykieta „Pracuję na zleceniu" przy suwaczku sugerowałaby dokładnie to,
       a przy okazji zostawiała pytanie, co znaczy pozycja wyłączona: brak
       zlecenia czy etat.

       Pola radio są prawdziwe, tylko niewidoczne (patrz `.segment input`
       w stylach) — strzałki, Home/End, ogłaszanie „1 z 2" i grupowanie po
       `name` dostajemy od przeglądarki. Segment kliknięty w dowolnym miejscu
       trafia w input, bo etykieta go otacza. -->
  <fieldset class="forma">
    <legend>Forma zatrudnienia</legend>

    <div class="segmenty">
      <label class="segment">
        <input
          type="radio"
          name="forma"
          value="umowaOPrace"
          checked={!zlecenie}
          onchange={() => ustawForme('umowaOPrace')}
        />
        <span>Umowa o pracę</span>
      </label>
      <label class="segment">
        <input
          type="radio"
          name="forma"
          value="zlecenie"
          checked={zlecenie}
          onchange={() => ustawForme('zlecenie')}
        />
        <span>Umowa zlecenia</span>
      </label>
    </div>
  </fieldset>

  <!-- Forma dziedziczy się w silniku na małżonka (inaczej niż wiek i status
       studenta), więc przy wspólnym rozliczeniu trzeba to powiedzieć wprost —
       tak samo jak przy PPK. -->
  {#if wspolne}
    <p class="wskazowka forma-nota">
      Przy wspólnym rozliczeniu liczymy tę samą formę obojgu małżonkom.
    </p>
  {/if}

  <label for="brutto">Twoje wynagrodzenie brutto</label>

  <div class="pole">
    <input
      id="brutto"
      type="number"
      inputmode="numeric"
      min={MIN_POLE}
      max={MAX_POLE}
      step="100"
      value={pole}
      oninput={(e) => pisz(e.currentTarget.value)}
      onblur={zakoncz}
      onkeydown={(e) => {
        if (e.key === 'Enter') zakoncz();
      }}
    />
    <span class="jednostka">zł / mies.</span>
  </div>

  <!-- `value` jest przycięte do zakresu, `aria-valuetext` nie: uchwyt pokazuje
       krawędź, ale czytnik ekranu ma czytać kwotę, na której naprawdę liczymy.
       Poza zakresem obie liczby się rozjeżdżają i tak ma być — patrz `maxSuwak`
       oraz wyjątek w `przesun`, który pilnuje, żeby domknięcie uchwytu nie
       podmieniło wpisanej kwoty. -->
  <input
    class="suwak"
    type="range"
    min={MIN_SUWAK}
    max={maxSuwak}
    step="100"
    aria-label="Wynagrodzenie brutto miesięcznie"
    aria-valuetext="{kwota(brutto)} miesięcznie"
    value={wZakresieSuwaka(brutto)}
    oninput={(e) => przesun(e.currentTarget.valueAsNumber)}
    onchange={zapisz}
  />

  <!-- Zamiast rzędu pełnowymiarowych przełączników — jeden wiersz z przyjętymi
       założeniami, który je rozwija. Powód jest podwójny.

       Miejsce: pasek z ramką na każdą opcję czytał się przy trzech opcjach jak
       formularz przed wynikiem, a przy zleceniu opcji jest pięć — zrobiłaby się
       z tego ankieta przed liczbą, po którą się tu przyszło. Siłą tej strony
       jest jeden ekran i jedna liczba.

       Ważniejsze jednak, że rząd niezaznaczonych przełączników wcale nie mówił,
       na czym policzyliśmy wynik: trzeba było przeczytać kilka wygaszonych
       suwaczków i samemu wyciągnąć z nich wniosek. Wiersz mówi to wprost i
       dlatego wolno mu zwinąć kontrolki — schowane zostaje ustawianie opcji,
       a nie to, co przyjęliśmy. Samego „Więcej opcji" tu nie ma i być nie może:
       uczestnik PPK, który nie kliknie, ma przeczytać „z PPK" albo „bez PPK",
       a nie zobaczyć netto zawyżone o 322 zł miesięcznie.

       Wzór rozwijania ten sam co przy „Skąd ta liczba?" — `details` ze
       znacznikiem i podpowiedzią przy prawej krawędzi, trzeciego sposobu strona
       nie potrzebuje. Cały wiersz jest celem kliknięcia, więc osobnego przycisku
       „zmień" nie ma; „zmień" to sama podpowiedź, dokładnie jak „pokaż rozbicie"
       niżej.

       Wiersz i kontrolki stoją pod suwakiem, bo wszystkie te pytania mają sens
       dopiero po podaniu własnej pensji — inaczej niż forma zatrudnienia, która
       jest ramą wyliczenia i dlatego stoi nad kwotą. Treść pojawia się na
       kliknięcie, nie w trakcie przeciągania, więc zmiana wysokości strony jest
       odpowiedzią na decyzję użytkownika, a nie drganiem układu — i dlatego
       wolno jej być animacją, a nie przeskokiem. -->
  <details class="opcje" bind:open={opcjeOtwarte}>
    <summary>
      <span class="znacznik" aria-hidden="true"></span>
      <!-- Wzrokiem widać po miejscu i kroju, że to lista przyjętych założeń;
           czytnik ekranu przeczytałby ciąg oderwanych fraz, więc dostaje jedno
           słowo wprowadzenia. Napis widoczny zostaje w całości częścią nazwy
           kontrolki, więc sterowanie głosem działa jak dotąd. -->
      <span class="tylko-czytnik">Założenia:</span>
      <span class="zalozenia">
        <!-- Spacja jest tu wypisana wprost, bo tę z wcięcia szablon zjada —
             a bez niej nazwa kontrolki brzmi „26 lat lub więcejbez PPK". -->
        {#each zalozenia as zalozenie}<span class="zalozenie">{zalozenie}</span>{' '}{/each}
      </span>
      <!-- Stan i tak ogłasza czytnik ekranu przez samo details — to wyłącznie
           wizualna zachęta do kliknięcia, jak przy „Skąd ta liczba?". -->
      <span class="podpowiedz" aria-hidden="true">{opcjeOtwarte ? 'ukryj' : 'zmień'}</span>
    </summary>

    <!-- Kontrolki zostają zwykłymi checkboxami (klawiatura, fokus i ogłaszanie
         stanu za darmo), tylko z wygaszonym wyglądem systemowym. Każda robi dwie
         rzeczy naraz: przełącza tryb obliczeń i otwiera dodatkową treść —
         pierwsze niesie `checked`, drugie `aria-expanded` z `aria-controls`.

         Etykieta mówi o wieku, nie o nazwie przepisu: „PIT-0" i „ulga dla
         młodych" to hasła dla kogoś, kto już wie, że mu przysługują, a ta
         kontrolka istnieje głównie dla tych, którzy nie wiedzą. Nazwa ulgi pada
         dopiero w wyjaśnieniu pod spodem i w rozbiciu. -->
    <label class="przelacznik">
      <input
        type="checkbox"
        checked={ulga}
        aria-expanded={ulga}
        aria-controls="ulga-wyjasnienie"
        onchange={(e) => przelaczUlge(e.currentTarget.checked)}
      />
      Mam mniej niż 26 lat
    </label>

    <div class="rozwijane" class:otwarte={ulga} id="ulga-wyjasnienie">
      <div class="klip" inert={!ulga}>
        <!-- Najważniejsze zdanie na tej stronie dla osoby poniżej 26 lat: zwolnienie
             obowiązuje już dziś, więc podnosi netto po obu stronach porównania i
             właśnie dlatego zysk z reformy zwykle zostaje zerowy. Bez tego wyższe
             netto przy zerowym zysku wygląda na błąd kalkulatora. -->
        <p class="wskazowka wyjasnienie">
          Zarobki do {kwota(LIMIT_PIT_ZERO)} rocznie są wtedy wolne od PIT. Ta ulga obowiązuje już
          dziś i zapowiedź jej nie zmienia — widać ją więc w netto po obu stronach, ale nie w zysku
          z reformy.
        </p>
      </div>
    </div>

    <!-- Status studenta zostaje widoczny, a nie ląduje w „Więcej opcji" razem
         z chorobową — z dokładnie tego powodu, dla którego widoczne jest PPK:
         o miejscu decyduje waga opcji, nie to, jak wielu ludzi jej użyje. Ta jest
         najcięższa w całym kalkulatorze — zdejmuje z brutto ~22% — więc schowana
         zostawiałaby każdemu studentowi liczbę wyraźnie za niską. Chorobowa
         (2,45%) jest w rozwijaku, bo waży tyle co podwyższone koszty.

         Miejsce zaraz pod ulgą dla młodych jest celowe: obie opcje mówią o wieku
         do 26 lat i łatwo je pomylić, więc mają stać obok siebie, gdzie różnicę
         widać (jedna zdejmuje podatek, druga składki), a nie na dwóch końcach
         formularza. Znika razem ze zleceniem — przy etacie status studenta nie
         zmienia niczego.

         Blok jest zwykłym `{#if}`, nie animowanym `.rozwijane`: to nie treść
         rozwijana przełącznikiem obok, tylko zmiana zestawu pytań po zmianie
         formy — a wewnątrz siedzi już jedno rozwinięcie, które trzeba móc
         animować osobno. -->
    {#if zlecenie}
      <label class="przelacznik">
        <input
          type="checkbox"
          checked={student}
          aria-expanded={student}
          aria-controls="student-wyjasnienie"
          onchange={(e) => przelaczStudenta(e.currentTarget.checked)}
        />
        Jestem studentem do 26 lat
      </label>

      <div class="rozwijane" class:otwarte={student} id="student-wyjasnienie">
        <div class="klip" inert={!student}>
          <!-- Bez tego zdania wynik wygląda na zepsuty kalkulator: przy 8 000 zł
               brutto z zaznaczoną obok ulgą dla młodych netto wychodzi równe
               8 000 zł, co czyta się jak brak wyliczenia, a nie jak wynik. -->
          <p class="wskazowka wyjasnienie">
            Uczeń i student do 26 lat nie płaci od zlecenia żadnych składek — ani społecznych, ani
            zdrowotnej — a z ulgą dla młodych powyżej znika też podatek, więc netto potrafi się
            wtedy równać brutto co do grosza.
            {#if wspolne}
              Liczymy to tylko Tobie: małżonek płaci składki jak zwykle.
            {/if}
          </p>
        </div>
      </div>
    {/if}

    <!-- PPK stoi tutaj, wśród widocznych przełączników, a nie w „Więcej opcji":
         do programu wciąga automatyczny zapis, więc siedzi w nim spora część
         pracowników — część nawet o tym nie pamiętając — a przy 13 000 zł brutto
         chodzi o ponad 300 zł miesięcznie różnicy w wypłacie. Schowana opcja
         o takiej wadze zostawiałaby większości z nich liczbę wyraźnie za dobrą.

         Etykieta mówi, co się dzieje („odkładam"), a nie tylko jak się to nazywa:
         skrót zna każdy, kto widział go na pasku wypłaty, ale nie każdy skojarzy
         go z odkładaniem. Czym to jest, tłumaczy zdanie pod spodem. -->
    <label class="przelacznik">
      <input
        type="checkbox"
        checked={ppk}
        aria-expanded={ppk}
        aria-controls="ppk-wyjasnienie"
        onchange={(e) => przelaczPpk(e.currentTarget.checked)}
      />
      Odkładam w PPK
    </label>

    <div class="rozwijane" class:otwarte={ppk} id="ppk-wyjasnienie">
      <div class="klip" inert={!ppk}>
        <!-- Najważniejsze zdanie dla kogoś w PPK: niższe netto to nie strata.
             Własna wpłata i dopłata pracodawcy trafiają na jego rachunek —
             realnym kosztem jest sam podatek od dopłaty. Pełne rozbicie siedzi
             w „Skąd ta liczba?", tu ma wystarczyć jedno zdanie. -->
        <p class="wskazowka wyjasnienie">
          Z wypłaty odchodzi wtedy {procent(PPK_PRACOWNIK_PODSTAWOWY)} na Twój rachunek PPK,
          a pracodawca dokłada {procent(PPK_PRACODAWCA_PODSTAWOWY)}. Netto spada o Twoją wpłatę
          i o podatek od dopłaty pracodawcy — ale obie kwoty zostają Twoje.
          {#if wspolne}
            Przy wspólnym rozliczeniu liczymy PPK obojgu małżonkom.
          {/if}
          <!-- Bez obowiązkowych składek emerytalno-rentowych zleceniobiorca nie
               jest „osobą zatrudnioną" w rozumieniu ustawy o PPK, więc silnik
               zeruje wpłaty. Gdyby to zdanie nie padło, przełącznik zostałby
               zaznaczony, a w rozbiciu nie byłoby po nim śladu. -->
          {#if student}
            Studenta na zleceniu PPK jednak nie obejmuje — nie ma obowiązkowych składek
            emerytalno-rentowych, więc {wspolne ? 'Twoich wpłat' : 'wpłat'} nie liczymy.
          {/if}
        </p>
      </div>
    </div>

    <label class="przelacznik">
      <input
        type="checkbox"
        checked={wspolne}
        aria-expanded={wspolne}
        aria-controls="malzonek"
        onchange={(e) => przelaczWspolne(e.currentTarget.checked)}
      />
      Rozliczam się wspólnie z małżonkiem
    </label>

    <!-- Blok zostaje w drzewie także zwinięty — to warunek animowania wysokości.
         Zwinięty jest jednak `inert` i `visibility: hidden`, więc wypada z
         kolejności fokusu i z drzewa dostępności dokładnie tak, jakby go nie
         było; wynik i tak liczy się z `wspolne`, nie z zawartości pola. -->
    <div class="rozwijane" class:otwarte={wspolne} id="malzonek">
      <div class="klip" inert={!wspolne}>
        <div class="malzonek">
          <label for="brutto-malzonka">Wynagrodzenie brutto małżonka</label>

          <div class="pole">
            <input
              id="brutto-malzonka"
              type="number"
              inputmode="numeric"
              min="0"
              max={MAX_POLE}
              step="100"
              value={poleMalzonka}
              oninput={(e) => piszMalzonka(e.currentTarget.value)}
              onblur={zakonczMalzonka}
              onkeydown={(e) => {
                if (e.key === 'Enter') zakonczMalzonka();
              }}
            />
            <span class="jednostka">zł / mies.</span>
          </div>

          <p class="wskazowka">
            Jeśli małżonek nie pracuje, zostaw 0 — to poprawny i najczęstszy przypadek, a zysk
            z reformy potrafi być wtedy dwa razy większy.
          </p>

          <!-- Druga, niezależna ulga stoi tutaj, przy wynagrodzeniu małżonka, a nie
               obok Twojej: wiek jest cechą osoby, więc przełącznik należy do tej
               samej grupki co pole, którego dotyczy. Wcięcie i pionowa kreska
               sekcji małżonka mówią to samo bez ani jednego dodatkowego słowa,
               dzięki czemu etykiety mogą zostać krótkie, a kontrolek jest tyle,
               ile osób — nie ich dwukrotność ze zdublowanym „Twoja / małżonka".
               Nic nie rozwija, więc bez `aria-expanded`: wyjaśnienie o zwolnieniu
               pada raz, wyżej, i dotyczy obojga. -->
          <label class="przelacznik">
            <input
              type="checkbox"
              checked={ulgaMalzonka}
              onchange={(e) => przelaczUlgeMalzonka(e.currentTarget.checked)}
            />
            Małżonek ma mniej niż 26 lat
          </label>
        </div>
      </div>
    </div>

    <!-- Kreska dzieli panel dokładnie tam, gdzie przebiega podział w wierszu
         założeń: nad nią opcje, które stoją w nim zawsze, bo ich niewłączenie
         pokazuje komuś nieprawdę o setki złotych; pod nią te, które dopisują
         się dopiero włączone, bo ważą kilka złotych albo dwa procent. Drugiego
         rozwijaka („Więcej opcji") już nie ma: zwinięty panel nikomu nie stoi na
         drodze do wyniku, więc jedyne, co dokładałby kolejny poziom, to jedno
         kliknięcie więcej dla kogoś, kto właśnie przyszedł tu coś ustawić. Sam
         podział na ważne i drugorzędne zostaje — niesie go wiersz założeń,
         a widać go w tej kresce.

         Wyjaśnienia pod obiema opcjami są widoczne od razu, a nie dopiero po
         zaznaczeniu jak wyżej: to jedyne miejsce, w którym pada, co przyjmujemy
         przy wyłączonym przełączniku („domyślnie liczymy chorobową opłacaną"),
         bo wiersz założeń o tych dwóch milczy, dopóki się ich nie włączy. -->
    <div class="drobne">
      <!-- Zawartość tej grupy zależy od formy, bo obie opcje, które w niej
           siedzą, istnieją tylko po jednej stronie: podwyższone koszty są
           pracownicze (przy zleceniu koszty są procentowe i wariantu „poza
           miejscowością" nie mają), a dobrowolność chorobowej to cecha zlecenia.
           Opcja z drugiej formy nie zostaje wyszarzona ani schowana ze stanem —
           `ustawForme` gasi jej wartość, żeby nie wracała przy przełączeniu
           formy tam i z powrotem. -->
      {#if zlecenie}
        <!-- Etykieta przeczy domyślnemu ustawieniu („nie płacę"), bo model
             zakłada chorobową opłacaną — a zaznacza się to, co jest odstępstwem.
             Odwrotna etykieta („Płacę dobrowolną chorobową") kazałaby odznaczyć
             coś, czego się nigdy nie zaznaczyło. -->
        <label class="przelacznik">
          <input
            type="checkbox"
            checked={bezChorobowej}
            onchange={(e) => przelaczChorobowa(e.currentTarget.checked)}
          />
          Nie płacę dobrowolnej składki chorobowej
        </label>

        <p class="wskazowka wyjasnienie">
          Przy zleceniu chorobowa ({procent(RATE_CHOROBOWA, 2)} brutto) jest dobrowolna. Bez niej
          wypłata jest o tyle wyższa, ale nie przysługuje zasiłek chorobowy ani macierzyński.
          Domyślnie liczymy ją opłacaną.
        </p>
      {:else}
        <!-- Etykieta o zamieszkaniu, nie o „podwyższonych KUP": warunek z ustawy
             brzmi „zamieszkanie poza miejscowością zakładu pracy", a nazwa kosztów
             nic nikomu nie mówi. Nazwa pada w zdaniu pod spodem i w rozbiciu. -->
        <label class="przelacznik">
          <input
            type="checkbox"
            checked={podwyzszoneKoszty}
            onchange={(e) => przelaczKoszty(e.currentTarget.checked)}
          />
          Mieszkam poza miejscowością, w której pracuję
        </label>

        <p class="wskazowka wyjasnienie">
          Koszty uzyskania przychodu są wtedy podwyższone do {kwota(KUP_PODWYZSZONE_MIES)}
          miesięcznie zamiast {kwota(KUP_PODSTAWOWE_MIES)} — w wypłacie to kilka złotych. Nie
          przysługują, jeśli pracodawca zwraca Ci koszty dojazdu, a zwrot jest wolny od podatku.
        </p>
      {/if}
    </div>
  </details>
</section>

<!-- Treść akapitu w jednym miejscu, bo obok wersji widocznej renderujemy jeszcze
     wersje-duchy, które rezerwują wysokość (patrz `.stos` niżej). -->
{#snippet tekstZysku(zyskRocznie: number, maksimum: number)}
  To {kwota(zyskRocznie)} przez cały rok.
  {#if zyskRocznie === maksimum}
    To maksimum — wyższa pensja da wyższe netto, ale z tej zmiany zawsze wychodzi tyle samo.
  {/if}
{/snippet}

{#snippet tekstBrakuZysku(prog: number, brakuje: number)}
  {#if brakuje < 1}
    Jesteś dokładnie na granicy — zysk zaczyna się kilka złotych wyżej. Reforma dotyczy
    mniej więcej co dziesiątego podatnika.
  {:else}
    Nowa skala zmienia wynagrodzenie od {kwota(prog)} brutto —
    brakuje {kwota(brakuje)} podwyżki. Reforma dotyczy mniej więcej co dziesiątego
    podatnika.
  {/if}
{/snippet}

<!-- Przy wspólnym rozliczeniu próg nie jest stałą z ustawy, tylko wynikiem
     zarobków małżonka — dlatego zdanie tłumaczy, skąd się bierze, zamiast podać
     liczbę bez wyjaśnienia. -->
{#snippet tekstBrakuZyskuWspolnie(prog: number, brakuje: number)}
  Liczy się połowa łącznego dochodu, więc przy zarobkach małżonka {kwota(bruttoMalzonka)}
  zmiana zaczyna się od {kwota(prog)} Twojego brutto — brakuje {kwota(brakuje)}.
{/snippet}

<section class="wynik" class:zyskuje aria-live="polite">
  <!-- Etykieta i sama liczba mieszczą się w jednym wierszu w obu wariantach
       (krótkie napisy, `line-height: 1` na liczbie), więc tu nic nie skacze. -->
  {#if zyskuje}
    <p class="etykieta">
      {wspolne ? 'Na rękę dostaniecie miesięcznie' : 'Na rękę dostaniesz miesięcznie'}
    </p>
    <p class="liczba">
      {#if wynik.zyskMiesiecznie < 1}
        &lt;&nbsp;1 zł
      {:else}
        {zeZnakiem(wynik.zyskMiesiecznie)}
      {/if}
    </p>
  {:else}
    <p class="etykieta">
      {wspolne ? 'Dla Was ta zmiana oznacza' : 'Dla Ciebie ta zmiana oznacza'}
    </p>
    <p class="liczba">0 zł</p>
  {/if}

  <!-- Skacze dopiero akapit pod liczbą: raz jeden wiersz, raz trzy. Zamiast
       zgadywać `min-height` w pikselach — który i tak zależy od szerokości,
       zawijania i kroju pisma — wkładamy wszystkie warianty w tę samą komórkę
       siatki. Wysokość komórki to maksimum z nich przy każdej szerokości.
       Duchy niosą najdłuższe możliwe brzmienie (największy zysk, największy
       brak), bo dłuższa kwota potrafi dołożyć wiersz zawijania. -->
  <div class="stos">
    <p class="rocznie">
      {#if zyskuje}
        {@render tekstZysku(wynik.zyskRocznie, maksymalnyZysk)}
      {:else if wspolne}
        {@render tekstBrakuZyskuWspolnie(progi.poczatek, doProgu)}
      {:else}
        {@render tekstBrakuZysku(progi.poczatek, doProgu)}
      {/if}
    </p>
    <!-- Duchy niosą najdłuższe brzmienie dla bieżącego trybu: największy możliwy
         zysk i największy możliwy brak (czyli cały próg). Obie te wartości
         zmieniają się wyłącznie przy przełączeniu trybu albo zmianie pensji
         małżonka — nigdy w trakcie przeciągania suwaka — więc rezerwacja
         wysokości trzyma się tak samo jak dotąd. -->
    <p class="rocznie duch" aria-hidden="true">
      {@render tekstZysku(maksymalnyZysk, maksymalnyZysk)}
    </p>
    <p class="rocznie duch" aria-hidden="true">
      {#if wspolne}
        {@render tekstBrakuZyskuWspolnie(progi.poczatek, progi.poczatek)}
      {:else}
        {@render tekstBrakuZysku(progi.poczatek, progi.poczatek)}
      {/if}
    </p>
  </div>
</section>

<section class="porownanie">
  <div>
    <p class="rok">dziś</p>
    <p class="netto">{kwota(wynik.przed.nettoMiesiecznie)}</p>
    <p class="opis">{wspolne ? 'łącznie netto miesięcznie' : 'netto miesięcznie'}</p>
  </div>

  <div class="strzalka" aria-hidden="true">→</div>

  <div>
    <p class="rok">od 2027</p>
    <p class="netto" class:wyroznione={zyskuje}>{kwota(wynik.po.nettoMiesiecznie)}</p>
    <p class="opis">{wspolne ? 'łącznie netto miesięcznie' : 'netto miesięcznie'}</p>
  </div>
</section>

<!-- Kwoty netto wyżej są o PPK niższe i tyle byłoby widać bez tego zdania —
     czyli kłamstwo w drugą stronę: że pieniądze przepadają. Nie przepadają,
     leżą na rachunku PPK, a pracodawca dokłada do nich swoje. Dlatego nota stoi
     tuż przy netto, a nie dopiero w rozbiciu, którego większość nie otworzy.
     Kosztu — podatku od dopłaty pracodawcy — tu nie rozbijamy: on już siedzi
     w pokazanym netto, a to jest miejsce na jedno zdanie, nie na wykład. -->
{#snippet notaPpk(razem: number, pracownik: number, pracodawca: number)}
  Do tego {kwota(razem)} miesięcznie trafia na {wspolne ? 'Wasze rachunki' : 'Twój rachunek'} PPK
  — {kwota(pracownik)} z pensji i {kwota(pracodawca)} od pracodawcy.
{/snippet}

{#if ppkDziala}
  <div class="stos ppk-obok">
    <p class="ppk-nota">
      {@render notaPpk(wplatyPpk.razem, wplatyPpk.pracownik, wplatyPpk.pracodawca)}
    </p>
    <!-- Duch z maksymalnymi wpłatami, jak w panelu wyniku: wysokość rezerwuje
         najdłuższe brzmienie, a nie bieżące. -->
    <p class="ppk-nota duch" aria-hidden="true">
      {@render notaPpk(maksymalnePpk.razem, maksymalnePpk.pracownik, maksymalnePpk.pracodawca)}
    </p>
  </div>
{/if}

<!-- Zapowiedź mówi wyłącznie o progach 120 000, 130 000 i 150 000 zł — a to są
     progi DOCHODU, podczas gdy strona pyta o brutto. Różnica jest ogromna i
     w jedną stronę: przy 11 878 zł brutto roczne wynagrodzenie to 142 536 zł,
     ale dochód dopiero 119 994 zł. Kto zobaczy samo roczne brutto, odruchowo
     zestawi je ze 120 000 zł i wyjdzie mu, że próg dawno ma za sobą. Ta sekcja
     podaje więc liczbę w tej samej jednostce, w której napisana jest reforma.

     Świadomie tekst, nie drugi pasek. Wykres niżej ma już oś „brutto",
     podpisane załamania i znacznik „tu jesteś"; pasek postawiony nad nim —
     w innej jednostce, z innymi progami, ale z tą samą gramatyką obrazka —
     byłby dokładnie tym pomyleniem jednostek, któremu ta sekcja ma zapobiegać.
     Zdania nie da się przy tym odczytać „mniej więcej" — albo mówi, ile
     brakuje, albo o ile próg jest przekroczony.

     Stąd miejsce PRZED wykresem, zaraz pod porównaniem netto: strona czyta się
     wtedy po kolei — ile zyskasz, ile będziesz mieć na rękę, dlaczego (czyli
     gdzie leżysz względem progów), jak to wygląda na krzywej, pełne rozbicie.
     Wyjaśnienie poprzedza ilustrację, zamiast po niej sprzątać, a ta sama
     kwota wraca niżej w tabeli jako „podstawa opodatkowania". -->
{#snippet wzglednieDoProgow(d: number)}
  {#if PROG_DZIS - d >= 1}
    Do pierwszego progu skali — {kwota(PROG_DZIS)} — brakuje {kwota(PROG_DZIS - d)}.
  {:else if d - PROG_DZIS < 1}
    To dokładnie granica pierwszego progu skali — {kwota(PROG_DZIS)}.
  {:else if d < PROG_NOWY}
    To {kwota(d - PROG_DZIS)} ponad dzisiejszy próg {kwota(PROG_DZIS)} — zapowiedź podnosi go
    do {kwota(PROG_NOWY)}.
  {:else if d < PROG_NOWY_GORNY}
    To {kwota(d - PROG_NOWY)} ponad {kwota(PROG_NOWY)}, ale poniżej {kwota(PROG_NOWY_GORNY)} —
    czyli w nowej stawce 24%.
  {:else}
    To powyżej wszystkich trzech progów — {kwota(PROG_DZIS)}, {kwota(PROG_NOWY)}
    i {kwota(PROG_NOWY_GORNY)}.
  {/if}
{/snippet}

<section class="dochod">
  <p class="dochod-etykieta">
    {wspolne ? 'Połowa Waszego łącznego dochodu' : 'Twój dochód roczny'}
  </p>
  <!-- Kwota i wiersz pod nią są jednolinijkowe w całym zakresie pól (przy
       100 000 zł brutto to wciąż siedem cyfr), więc nie potrzebują rezerwacji
       wysokości — inaczej niż zdanie niżej. -->
  <p class="dochod-kwota">{kwota(dochod)}</p>
  <p class="dochod-zrodlo">
    {#if wspolne}
      z łącznego dochodu {kwota(wynik.po.podstawaOpodatkowania)}
    {:else}
      z {kwota(wynik.po.bruttoRocznie)} brutto rocznie
    {/if}
  </p>

  <!-- Ta sama sztuczka co w panelu wyniku: wszystkie warianty zdania w jednej
       komórce siatki, widoczny jeden, reszta jako duchy trzymające wysokość.
       Bez tego przeciągnięcie suwaka przez próg potrafiłoby dołożyć zdaniu
       wiersz i podskoczyłaby cała reszta strony. Duchy dostają
       najdłuższe możliwe brzmienie każdego wariantu i są **stałymi** —
       120 000 zł brakującego dochodu, 9 999 zł i 19 999 zł nadwyżki — więc
       rezerwacja nie drga razem z kwotą. -->
  <div class="stos">
    <p class="dochod-polozenie">{@render wzglednieDoProgow(dochod)}</p>
    <p class="dochod-polozenie duch" aria-hidden="true">{@render wzglednieDoProgow(0)}</p>
    <p class="dochod-polozenie duch" aria-hidden="true">
      {@render wzglednieDoProgow(PROG_DZIS)}
    </p>
    <p class="dochod-polozenie duch" aria-hidden="true">
      {@render wzglednieDoProgow(PROG_NOWY - 1)}
    </p>
    <p class="dochod-polozenie duch" aria-hidden="true">
      {@render wzglednieDoProgow(PROG_NOWY_GORNY - 1)}
    </p>
    <p class="dochod-polozenie duch" aria-hidden="true">
      {@render wzglednieDoProgow(PROG_NOWY_GORNY)}
    </p>
  </div>

  <!-- Bez tego zdania liczba wyżej wygląda na pomyłkę kalkulatora („czemu mniej,
       niż zarabiam?"). Zdanie jest w całości stałe — dopowiedzenia zależą od
       trybu, a tryb zmienia się kliknięciem, nie przeciąganiem, więc wolno im
       zmienić wysokość. -->
  <p class="dochod-wyjasnienie">
    <!-- Stawka składek jest liczona ze stałych silnika, a nie wpisana: przy
         rezygnacji z dobrowolnej chorobowej to 11,26%, nie 13,71%, i zdanie ma
         się zgadzać z liczbą nad sobą także wtedy. -->
    {#if zlecenie && student && !wspolne}
      Dochód to brutto pomniejszone o same koszty uzyskania przychodu — przy
      zleceniu {procent(KUP_ZLECENIE_STAWKA)} przychodu. Składek nie ma: student do 26 lat nie
      płaci od zlecenia żadnych.
    {:else if zlecenie}
      Dochód to brutto pomniejszone o składki społeczne ({procent(stawkaSkladek, 2)}) i koszty
      uzyskania przychodu — przy zleceniu to {procent(KUP_ZLECENIE_STAWKA)} przychodu po
      składkach, a nie {kwota(KUP_PODSTAWOWE_MIES)} miesięcznie jak na etacie. Składka zdrowotna
      dochodu nie pomniejsza.
      {#if student}
        Twoich składek w tej sumie nie ma — student do 26 lat nie płaci od zlecenia żadnych — ale
        małżonek płaci je normalnie.
      {/if}
    {:else}
      Dochód to brutto pomniejszone o składki społeczne ({procent(stawkaSkladek, 2)}) i koszty
      uzyskania przychodu — składka zdrowotna go nie pomniejsza.
    {/if}
    Progi z zapowiedzi są progami dochodu, nie wynagrodzenia; w rozbiciu niżej ta sama liczba to
    „podstawa opodatkowania".
    {#if wspolne}
      Skalę stosuje się przy tym do połowy łącznego dochodu (art. 6 ust. 2 ustawy o PIT), więc to
      ona, a nie suma, stoi obok progów.
    {/if}
    {#if jakasUlga}
      Ulga dla młodych zwalnia z podatku przychód do {kwota(LIMIT_PIT_ZERO)} rocznie, więc dochód
      jest o tyle niższy.
    {/if}
    {#if ppkDziala}
      Wpłata pracodawcy do PPK jest przychodem pracownika, więc dochód jest o nią wyższy, choć
      w wypłacie jej nie widać. Twoja własna wpłata dochodu nie zmienia — potrąca się ją dopiero
      z netto.
    {/if}
    {#if podwyzszoneKoszty}
      Koszty uzyskania przychodu są tu podwyższone do {kwota(KUP_PODWYZSZONE_MIES)} miesięcznie
      zamiast {kwota(KUP_PODSTAWOWE_MIES)}, co obniża dochód każdej pracującej osoby
      o {kwota((KUP_PODWYZSZONE_MIES - KUP_PODSTAWOWE_MIES) * 12)} rocznie.
    {/if}
  </p>
</section>

<!-- Wykres jest drugim sterownikiem tej samej kwoty: `onZmiana` odpowiada
     `oninput` suwaka, a `zakonczone` jego `onchange` (zapis adresu na koniec
     gestu, nie na każdym drgnięciu). -->
<!-- Oś pozioma zostaje przy Twoim wynagrodzeniu także we wspólnym rozliczeniu —
     to nadal ta jedna kwota, którą gest przesuwa, więc przeciąganie znaczy
     dokładnie to samo co dotąd. Zmienia się treść krzywej: przy włączonym
     wspólnym rozliczeniu pokazuje łączny zysk pary przy zarobkach małżonka
     przyjętych za stałe, z dwukrotnie wyższym pułapem i przesuniętymi
     załamaniami. Osi „łączne zarobki obojga" celowo nie robimy: nie dałoby się
     jej przeciągać, bo z jednej sumy nie wynika, ile zarabia które z was. -->
<!-- Wykres dostaje gotowe `opcje`, a nie osobne flagi: krzywa ma być tą samą
     funkcją, którą policzono liczbę nad nią, więc obie strony muszą czytać
     ustawienia dokładnie tak samo. Przy dwóch flagach było to jeszcze do
     powtórzenia, przy pięciu byłoby to drugie miejsce, w którym trzeba pamiętać
     o dziedziczeniu na małżonka. -->
<WykresZysku
  {brutto}
  bruttoMalzonka={wspolne ? bruttoMalzonka : null}
  {opcje}
  {progi}
  maxX={gornaOsi}
  onZmiana={(wartosc, zakonczone) => {
    przesun(wartosc);
    if (zakonczone) zapisz();
  }}
/>

<details class="rozbicie" bind:open={rozwiniete}>
  <summary>
    <span class="znacznik" aria-hidden="true"></span>
    Skąd ta liczba?
    <!-- Stan i tak ogłasza czytnik ekranu przez samo details, więc podpowiedź
         jest wyłącznie wizualną zachętą do kliknięcia. -->
    <span class="podpowiedz" aria-hidden="true">{rozwiniete ? 'ukryj' : 'pokaż rozbicie'}</span>
  </summary>

  <table>
    <thead>
      <tr>
        <th scope="col">rocznie</th>
        <th scope="col">dziś</th>
        <th scope="col">od 2027</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Brutto</th>
        <td>{kwotaDokladna(wynik.przed.bruttoRocznie)}</td>
        <td>{kwotaDokladna(wynik.po.bruttoRocznie)}</td>
      </tr>
      <!-- Wpłata pracodawcy wchodzi do tabeli na plus i od razu za brutto, bo
           tak działa: nie jest wypłacana, ale jest przychodem, więc podstawa
           opodatkowania niżej jest o nią wyższa. Bez tego wiersza podatek przy
           PPK wyglądałby na policzony z niczego. -->
      {#if wynik.po.ppkPracodawcy > 0}
        <tr>
          <th scope="row">Wpłata pracodawcy do PPK</th>
          <td>+{kwotaDokladna(wynik.przed.ppkPracodawcy)}</td>
          <td>+{kwotaDokladna(wynik.po.ppkPracodawcy)}</td>
        </tr>
      {/if}
      <!-- Sedno ulgi dla młodych: bez tego wiersza z tabeli widać tylko, że
           podatek jest niższy, a nie dlaczego. Pokazujemy go wyłącznie, gdy
           coś rzeczywiście jest zwolnione — przy wyłączonej uldze tabela
           zostaje taka jak dotąd, co do wiersza. -->
      {#if wynik.przed.przychodZwolniony > 0 || wynik.po.przychodZwolniony > 0}
        <tr>
          <th scope="row">Przychód zwolniony z PIT</th>
          <td>{odjac(wynik.przed.przychodZwolniony)}</td>
          <td>{odjac(wynik.po.przychodZwolniony)}</td>
        </tr>
      {/if}
      <tr>
        <th scope="row">Składki społeczne</th>
        <td>{odjac(wynik.przed.skladkiSpoleczne)}</td>
        <td>{odjac(wynik.po.skladkiSpoleczne)}</td>
      </tr>
      <tr>
        <th scope="row">Składka zdrowotna</th>
        <td>{odjac(wynik.przed.skladkaZdrowotna)}</td>
        <td>{odjac(wynik.po.skladkaZdrowotna)}</td>
      </tr>
      <tr>
        <th scope="row">Koszty uzyskania przychodu</th>
        <td>{kwotaDokladna(wynik.przed.kup)}</td>
        <td>{kwotaDokladna(wynik.po.kup)}</td>
      </tr>
      <tr>
        <th scope="row">Podstawa opodatkowania</th>
        <td>{kwotaDokladna(wynik.przed.podstawaOpodatkowania)}</td>
        <td>{kwotaDokladna(wynik.po.podstawaOpodatkowania)}</td>
      </tr>
      <tr>
        <th scope="row">Podatek</th>
        <td>{odjac(wynik.przed.podatek)}</td>
        <td>{odjac(wynik.po.podatek)}</td>
      </tr>
      <!-- Danina wchodzi dopiero od ok. 88 400 zł brutto miesięcznie, ale bez
           tego wiersza ten, kto ten próg przekroczy, widzi po prostu niższe
           netto — i jedyne miejsce w całym kalkulatorze, w którym 2027 r. daje
           mniej niż 2026, wygląda na błąd rachunkowy.

           Stoi pod podatkiem, bo liczy się od tej samej podstawy, ale osobno od
           skali. Dopisek w nagłówku wiersza nie jest ozdobą: bez niego 6 789 zł
           obok podstawy 1 135 779 zł wygląda na policzone od całości, a jest
           policzone od 135 779 zł nadwyżki — i to jest właśnie ta rzecz,
           w której przy daninie najłatwiej się pomylić. -->
      {#if wynik.po.danina > 0}
        <tr>
          <th scope="row">
            Danina solidarnościowa
            <span class="dopisek">tylko od nadwyżki ponad {kwota(DANINA_PROG)}</span>
          </th>
          <td>{odjac(wynik.przed.danina)}</td>
          <td>{odjac(wynik.po.danina)}</td>
        </tr>
      {/if}
      <!-- Wpłata pracownika idzie na sam dół odejmowania, bo tam ją potrąca
           lista płac: po podatku i po składkach, z gotowej już wypłaty. -->
      {#if wynik.po.ppk > 0}
        <tr>
          <th scope="row">Wpłata pracownika do PPK</th>
          <td>{odjac(wynik.przed.ppk)}</td>
          <td>{odjac(wynik.po.ppk)}</td>
        </tr>
      {/if}
      <tr class="suma">
        <th scope="row">Netto</th>
        <td>{kwotaDokladna(wynik.przed.nettoRocznie)}</td>
        <td>{kwotaDokladna(wynik.po.nettoRocznie)}</td>
      </tr>
      <!-- Pod sumą, nie w niej — i to jest cała treść tego wiersza: te pieniądze
           nie są częścią wypłaty, ale też nie znikają. Obie wpłaty razem leżą na
           rachunku PPK, więc wiersz stoi za netto jak dopisek, a nie jak kolejny
           składnik odejmowania. -->
      {#if wynik.po.ppk > 0 || wynik.po.ppkPracodawcy > 0}
        <tr class="poza-suma">
          <th scope="row">Trafia na rachunek PPK</th>
          <td>{kwotaDokladna(wynik.przed.ppk + wynik.przed.ppkPracodawcy)}</td>
          <td>{kwotaDokladna(wynik.po.ppk + wynik.po.ppkPracodawcy)}</td>
        </tr>
      {/if}
    </tbody>
  </table>

  <p class="nota">
    Podstawa opodatkowania i podatek zaokrąglane do pełnych złotych zgodnie z art. 63 §1 Ordynacji
    podatkowej. Kwota wolna 30 000 zł i kwota zmniejszająca podatek 3 600 zł pozostają bez zmian —
    zmienia się wyłącznie skala.
    {#if wspolne}
      Wszystkie kwoty w tabeli są sumą obojga małżonków. Podatek to dwukrotność podatku od połowy
      łącznego dochodu (art. 6 ust. 2 ustawy o PIT), więc kwota zmniejszająca odlicza się dwa razy.
      Składki liczy każdy od swojego wynagrodzenia, z własnym limitem 30-krotności, a składka
      zdrowotna pozostaje indywidualna — wspólnemu rozliczeniu podlega sam podatek.
    {/if}
    {#if zlecenie}
      Przy zleceniu koszty uzyskania przychodu to {procent(KUP_ZLECENIE_STAWKA)} przychodu
      pomniejszonego o potrącone składki społeczne (art. 22 ust. 9 pkt 4 ustawy o PIT) i nie mają
      rocznego limitu — stąd w wierszu kosztów inna kwota niż pracownicze
      {kwota(KUP_PODSTAWOWE_MIES * 12)}. Składka chorobowa jest dobrowolna;
      {bezChorobowej
        ? `w tym wyliczeniu jej nie ma, więc składki społeczne są o ${procent(RATE_CHOROBOWA, 2)} brutto niższe`
        : 'liczymy ją opłacaną'}.
      {#if student}
        Uczeń i student do ukończenia 26 lat nie podlega z tytułu zlecenia ubezpieczeniom
        społecznym ani zdrowotnemu (art. 6 ust. 4 ustawy o systemie ubezpieczeń społecznych) —
        do zdrowotnego zgłasza go rodzic albo uczelnia. To zwolnienie jest składkowe, nie
        podatkowe: podatek znika osobno, ulgą dla młodych, i tylko do jej limitu.
      {/if}
    {/if}
    {#if wynik.przed.przychodZwolniony > 0}
      Ulga dla młodych (PIT-0, art. 21 ust. 1 pkt 148 ustawy o PIT) zwalnia z podatku przychód
      do {kwota(LIMIT_PIT_ZERO)} rocznie — limit przysługuje każdemu osobno i jest wspólny dla
      wszystkich zwolnień PIT-0. Składki ZUS naliczają się od całości wynagrodzenia, bo
      zwolnienie jest podatkowe, nie składkowe. Składka zdrowotna też się należy w pełnej
      wysokości: art. 83 ust. 2a ustawy zdrowotnej każe porównywać ją z zaliczką policzoną wg
      stanu na 31.12.2021 tak, jakby zwolnienie nie przysługiwało — więc wbrew częstej opinii
      nie spada przy uldze do zera.
    {/if}
    {#if ppkDziala}
      PPK: Twoja wpłata ({procent(PPK_PRACOWNIK_PODSTAWOWY)} wynagrodzenia) potrącana jest
      z gotowej wypłaty i podatku nie zmienia. Wpłata pracodawcy
      ({procent(PPK_PRACODAWCA_PODSTAWOWY)}) nie jest z wypłaty potrącana ani nie wchodzi do
      składek ZUS, ale jest przychodem pracownika — dlatego podnosi podstawę opodatkowania i to
      sam podatek od niej jest tu realnym kosztem. Obie kwoty trafiają na rachunek PPK, są
      własnością pracownika i dlatego stoją pod sumą, a nie w niej; wypłata przed 60. rokiem życia
      wiąże się jednak z potrąceniami.
    {/if}
    {#if podwyzszoneKoszty}
      Koszty uzyskania przychodu są podwyższone do {kwota(KUP_PODWYZSZONE_MIES)} miesięcznie
      ({kwota(KUP_PODWYZSZONE_MIES * 12)} rocznie) — tyle przysługuje osobie mieszkającej poza
      miejscowością, w której znajduje się zakład pracy.
    {/if}
  </p>

  <!-- Osobny akapit, a nie kolejne zdanie w nocie wyżej: tamta objaśnia rzeczy,
       o których czytelnik już wie, że go dotyczą (jego PPK, jego ulga), a ta
       tłumaczy pozycję, o której większość słyszy pierwszy raz — razem
       z jedynym miejscem na stronie, gdzie zapowiedź zabiera, zamiast dawać. -->
  {#if wynik.po.danina > 0}
    <p class="nota">
      Danina solidarnościowa (art. 30h ustawy o PIT) to osobny podatek, obok skali:
      {procent(DANINA_STAWKA[2026])} w 2026 r. i {procent(DANINA_STAWKA[2027])} w 2027 r., ale
      liczone <strong>wyłącznie od nadwyżki</strong> dochodu ponad {kwota(DANINA_PROG)}, a nie od
      całego dochodu — przy dochodzie {kwota(DANINA_PROG + 13)} wychodzi z niej złotówka, a nie
      czterdzieści tysięcy. Płaci się ją raz w roku, deklaracją DSF-1 do 30 kwietnia, poza
      miesięcznymi zaliczkami: w pasku wypłaty jej nie widać, ale w rachunku „ile zostaje na
      rękę" być musi.
      {#if wiecejDaniny > 0}
        To jedyna pozycja w tym rozliczeniu, w której 2027 r. zabiera więcej niż 2026: wyższa
        stawka kosztuje {kwotaDokladna(wiecejDaniny)} rocznie i dokładnie o tyle mniejszy jest
        zysk z nowej skali, pokazany na górze strony.
      {/if}
      {#if daninyOsob}
        Wspólne rozliczenie daniny nie dotyczy w ogóle (objaśnienia MF z 28.08.2019): każdy liczy
        ją od swojego dochodu — Ty od {kwotaDokladna(daninyOsob[0].podstawa)}, małżonek
        od {kwotaDokladna(daninyOsob[1].podstawa)} — a nie od połowy Waszej sumy, jak podatek.
        Dlatego nie da się jej odtworzyć z „podstawy opodatkowania" w tabeli: tam stoi łączny
        dochód gospodarstwa, którego pod próg {kwota(DANINA_PROG)} podstawiać nie wolno — para
        z dochodami po 700 000 zł nie płaci daniny w ogóle, choć razem ma 1 400 000 zł. W wierszu
        stoi suma obu: {kwotaDokladna(daninyOsob[0].danina)} Twojej daniny
        i {kwotaDokladna(daninyOsob[1].danina)} małżonka.
      {/if}
      Kalkulator liczy ją wyłącznie z wynagrodzenia, więc <strong>zaniża, nigdy nie zawyża</strong>:
      do podstawy wchodzą też m.in. dochody z kapitałów (art. 30b) i z działalności opodatkowanej
      liniowo (art. 30c), których ta strona nie zna.
    </p>
  {/if}
</details>

<!-- Na końcu treści: pojawienie się tej uwagi nic nie przesuwa, więc nie trzeba
     rezerwować na nią miejsca i nie zostaje pusty pas pod wykresem. -->
{#if ponizejMinimalnej}
  <p class="uwaga">
    To mniej niż płaca minimalna ({kwota(PLACA_MINIMALNA)} w 2026 r.), która obowiązuje przy pełnym
    etacie. Przy niepełnym taka kwota jest jak najbardziej możliwa i wyliczenie pozostaje poprawne.
  </p>
{/if}


<style>
  .wejscie {
    margin-bottom: 2.5rem;
  }

  label {
    display: block;
    font-size: 0.875rem;
    color: var(--tekst-cichy);
    margin-bottom: 0.5rem;
  }

  .pole {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  /* `fieldset` bierzemy dla `legend` — to jedyny sposób podpisania grupy pól
     radio, który czytnik ekranu ogłasza przy każdym z nich. Cały wygląd
     domyślny (ramka, wcięcia, marginesy) idzie do zera; ramkę ma dopiero tor
     segmentów w środku. */
  .forma {
    margin: 0 0 1.25rem;
    padding: 0;
    border: 0;
  }

  /* Wygląd i odstęp jak u `label` nad polem kwoty — to ten sam gatunek napisu:
     podpis kontrolki stojącej pod nim. `float` z wyzerowaniem jest starą
     sztuczką na `legend`, ale tu nie trzeba jej używać, bo `display: block`
     wystarcza wszystkim przeglądarkom, które obsługują `:has()` niżej. */
  .forma legend {
    display: block;
    padding: 0;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    color: var(--tekst-cichy);
  }

  /* Wspólny tor z dwiema komórkami po połowie, żeby przełączenie nie zmieniało
     szerokości segmentów — inaczej dłuższa etykieta („Umowa o pracę") ciągnęłaby
     ramkę i sąsiad skakałby przy każdym kliknięciu. */
  .segmenty {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem;
    padding: 0.25rem;
    border: 1px solid var(--linia);
    border-radius: 0.5rem;
    background: var(--tlo-karta);
  }

  /* Etykieta jest całym celem kliknięcia, więc nie `display: block` jak
     pozostałe etykiety w tym komponencie. Wysokość (~40 px + padding toru)
     daje wygodny cel dotykowy, tak jak przy `.przelacznik`. */
  .segment {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin: 0;
    padding: 0.5rem 0.75rem;
    border: 1px solid transparent;
    border-radius: 0.375rem;
    cursor: pointer;
    /* Wielokrotne przełączanie nie ma zaznaczać napisu. */
    user-select: none;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--tekst-cichy);
    text-align: center;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease;
  }

  /* Pole radio zostaje prawdziwe i klikalne — znika wyłącznie z obrazu.
     Rozciągnięte na cały segment zamiast `appearance: none`, bo tak samo
     zachowuje się kursor i cel dotykowy, a nie trzeba niczego dorysowywać:
     stan niesie tło segmentu. `opacity: 0` (nie `display: none`) zostawia je
     w kolejności fokusu i w drzewie dostępności. */
  .segment input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }

  .segment:hover {
    color: var(--tekst);
  }

  .segment:has(input:checked) {
    background: var(--akcent-tlo);
    border-color: color-mix(in srgb, var(--akcent) 40%, var(--linia));
    color: var(--akcent);
    font-weight: 600;
  }

  /* Obwódka na segmencie, nie na niewidocznym polu — inaczej fokus z klawiatury
     nie byłby widoczny w żadnym z motywów. */
  .segment:has(input:focus-visible) {
    outline: 2px solid var(--akcent);
    outline-offset: 2px;
  }

  /* Nota o dziedziczeniu formy należy do kontrolki nad sobą, a nie do pola
     kwoty pod spodem, więc podchodzi bliżej niej. */
  .forma-nota {
    margin: -0.75rem 0 1.25rem;
  }

  /* Szerokość liczona z najdłuższej dopuszczalnej wartości, nie zgadywana:
     `--cyfry` to jej liczba cyfr (100 000 zł = sześć), a reszta to obudowa
     pola — poziomy `padding`, ramka i pas, który Chrome rezerwuje w środku na
     strzałki `input[type=number]` (~15 px, niezależnie od stopnia pisma; stąd
     `rem`, a nie `ch`). Dzięki temu jedna reguła obsługuje oba pola mimo
     różnych krojów: to samo maksimum, każde w swoim stopniu pisma — wspólna
     szerokość w pikselach zmuszałaby mniejsze pole do rezerwy na cyfry, których
     w jego rozmiarze nie potrzebuje, i marnowała miejsce na wąskim ekranie.
     Wartość jest stała, więc pisanie ani przeciąganie suwaka nie rusza układu. */
  input[type='number'] {
    --cyfry: 6;
    font-size: 2rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    width: calc(var(--cyfry) * 1ch + 1rem + 2px + 1.125rem);
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--linia);
    border-radius: 0.375rem;
    background: var(--tlo-karta);
    color: inherit;
  }

  .jednostka {
    color: var(--tekst-cichy);
  }

  .suwak {
    width: 100%;
    margin-top: 0.5rem;
    /* Sam element ma ~16 px, a WCAG 2.2 chce 24 px celu dotykowego — brakującą
       wysokość dokłada padding, więc uchwyt zostaje wizualnie taki sam. */
    padding-block: 0.5rem;
    box-sizing: content-box;
    accent-color: var(--akcent);
  }

  /* Etykieta jest klikalnym celem razem z przełącznikiem, więc nie
     `display: block` jak pozostałe etykiety w tym komponencie. Cały wiersz
     dostaje ramkę i tło jak `summary` niżej: to też jest rzecz, która coś
     otwiera, więc ma wyglądać na rodzeństwo, a nie na inny gatunek kontrolki.
     Pełna szerokość (bez `fit-content`) daje przy okazji wygodny cel dotykowy
     wysokości ~44 px, mimo że sam suwaczek ma 20 px. */
  .przelacznik {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    margin: 1.25rem 0 0;
    padding: 0.6875rem 0.875rem;
    border: 1px solid var(--linia);
    border-radius: 0.5rem;
    background: var(--tlo-karta);
    cursor: pointer;
    /* Wielokrotne przełączanie nie ma zaznaczać napisu. */
    user-select: none;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--tekst);
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;
  }

  /* Drugi przełącznik pod pierwszym: ciaśniej niż odstęp od wiersza założeń,
     żeby oba czytały się jako jedna grupa pytań o Twoją sytuację. Kombinator
     ogólny (`~`, nie `+`), bo między nimi siedzi rozwijane wyjaśnienie ulgi. */
  .przelacznik ~ .przelacznik {
    margin-top: 0.5rem;
  }

  .przelacznik:hover {
    background: var(--akcent-tlo);
    border-color: color-mix(in srgb, var(--akcent) 40%, var(--linia));
  }

  /* Obwódka fokusu obejmuje cały wiersz, bo cały wiersz jest celem kliknięcia
     — tak samo jak przy `summary`. Systemowa obwódka samego kwadracika
     zostaje zgaszona, żeby nie było dwóch pierścieni naraz. */
  .przelacznik:has(input:focus-visible) {
    outline: 2px solid var(--akcent);
    outline-offset: 2px;
  }

  /* Wygaszony wygląd systemowy — element pozostaje checkboxem, zmienia się
     tylko obraz. Tor plus krążek: stan widać z odległości, a przejście
     krążka pokazuje kierunek zmiany. */
  .przelacznik input {
    appearance: none;
    flex: none;
    position: relative;
    width: 2.25rem;
    height: 1.25rem;
    margin: 0;
    padding: 0;
    border: 1px solid var(--linia);
    border-radius: 999px;
    /* Odrobinę ciemniejsze od karty, na której leży — samo `--tlo` ginęło na
       białym tle i tor czytał się jak pusta ramka. */
    background: color-mix(in srgb, var(--tekst-cichy) 12%, var(--tlo-karta));
    cursor: pointer;
    outline: none;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease;
  }

  .przelacznik input::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0.125rem;
    width: 0.875rem;
    height: 0.875rem;
    border-radius: 50%;
    background: var(--tekst-cichy);
    transform: translateY(-50%);
    transition:
      transform 0.2s ease,
      background-color 0.2s ease;
  }

  .przelacznik input:checked {
    background: var(--akcent);
    border-color: var(--akcent);
  }

  .przelacznik input:checked::before {
    background: var(--tlo-karta);
    transform: translate(1rem, -50%);
  }

  /* Płynne rozwinięcie bez mierzenia wysokości w JS — ten sam zamiar co przy
     „Skąd ta liczba?", ale innym narzędziem: `::details-content` istnieje
     wyłącznie dla `details`, a tu jest zwykły blok sterowany checkboxem.
     Odpowiednikiem jest tor siatki `0fr → 1fr`, który animuje do wysokości
     treści równie dobrze i działa też tam, gdzie `interpolate-size` jeszcze
     nie dojechało (stąd bez `@supports` — nie ma czego zabezpieczać).
     Czas i krzywa te same, żeby oba rozwinięcia czytały się jak jedno
     zachowanie strony. */
  .rozwijane {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.25s ease;
  }

  .rozwijane.otwarte {
    grid-template-rows: 1fr;
  }

  /* `min-height: 0` puszcza element poniżej jego wysokości minimalnej —
     bez tego tor 0fr i tak zostałby rozepchany treścią. `visibility`
     przełącza się dopiero na końcu zwijania (przejście trwa tyle co
     wysokość), więc treść nie znika w połowie gestu, a zwinięta wypada
     z fokusu i z drzewa dostępności. */
  .klip {
    overflow: hidden;
    min-height: 0;
    visibility: hidden;
    opacity: 0;
    transition:
      visibility 0.25s,
      opacity 0.2s ease;
  }

  .rozwijane.otwarte .klip {
    visibility: visible;
    opacity: 1;
  }

  .malzonek {
    margin-top: 1rem;
    padding-left: 1rem;
    border-left: 2px solid var(--linia);
  }

  /* Mniejsze od pola głównego: druga pensja jest dopowiedzeniem do pierwszej,
     nie drugim równorzędnym pytaniem. Szerokości nie trzeba tu poprawiać —
     wzór wyżej sam schodzi razem ze stopniem pisma, bo w `ch` liczy tylko
     cyfry. */
  .malzonek input[type='number'] {
    font-size: 1.5rem;
  }

  .wskazowka {
    margin: 0.5rem 0 0;
    font-size: 0.8125rem;
    color: var(--tekst-cichy);
  }

  /* Wcięcie równe poziomemu paddingowi przełącznika — wyjaśnienie ustawia się
     do krawędzi tekstu ramki nad sobą, a nie do krawędzi kolumny. */
  .wyjasnienie {
    padding: 0 0.875rem;
  }

  .wynik {
    background: var(--tlo-karta);
    border: 1px solid var(--linia);
    border-radius: 0.75rem;
    padding: 1.75rem;
    text-align: center;
  }

  .wynik.zyskuje {
    background: var(--akcent-tlo);
    border-color: color-mix(in srgb, var(--akcent) 35%, transparent);
  }

  .etykieta {
    margin: 0;
    font-size: 0.875rem;
    color: var(--tekst-cichy);
  }

  .liczba {
    margin: 0.25rem 0;
    font-size: clamp(2.5rem, 10vw, 4rem);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .wynik.zyskuje .liczba {
    color: var(--akcent);
  }

  /* Wszystkie dzieci lądują w tej samej komórce siatki, więc wysokość stosu to
     maksimum z ich wysokości — liczone przez przeglądarkę przy każdej
     szerokości, bez mierzenia czegokolwiek w JS. */
  .stos {
    display: grid;
  }

  .stos > * {
    grid-area: 1 / 1;
  }

  /* `visibility: hidden` zostawia pudełko w układzie, ale wycina je z obrazu,
     z drzewa dostępności i z kolejności fokusu (te akapity i tak nie mają
     niczego interaktywnego). `aria-hidden` w znaczniku to pas i szelki. */
  .duch {
    visibility: hidden;
  }

  /* Miara szersza, niż chciałoby się dla zwykłego akapitu, bo ten nie jest
     zwykły: wszystkie warianty leżą w jednej komórce `.stos`, więc najdłuższy
     z nich dyktuje wysokość panelu każdemu. Przy 28rem wariant bez zysku łamał
     się na trzy wiersze, z sierotą w ostatnim. Próg dwóch wierszy wypada przy
     ~32rem (mierzone na najdłuższym duchu, „brakuje 11 878 zł"); 35rem daje
     zapas na inny krój systemowy, a i tak zostaje wyraźnie węższe od panelu,
     więc akapit nadal czyta się jak wtrącenie pod liczbą, nie jak jej ramka. */
  .rocznie {
    margin: 0.75rem auto 0;
    max-width: 35rem;
    font-size: 0.9375rem;
    color: var(--tekst-cichy);
  }

  /* Nota o PPK należy do kwot netto nad nią, więc podchodzi do nich bliżej, niż
     wynikałby z odstępu między sekcjami (ujemny margines znosi część dolnego
     marginesu `.porownanie`). Wyśrodkowana i przygaszona jak podpisy pod
     kwotami: to dopowiedzenie do liczby, nie druga liczba. */
  .ppk-obok {
    margin: -1rem 0 1.75rem;
  }

  .ppk-nota {
    margin: 0 auto;
    max-width: 35rem;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--tekst-cichy);
    text-align: center;
    text-wrap: pretty;
  }

  .porownanie {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(1rem, 6vw, 3rem);
    margin: 1.75rem 0;
    text-align: center;
  }

  .rok {
    margin: 0;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--tekst-cichy);
  }

  .netto {
    margin: 0.125rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .netto.wyroznione {
    color: var(--akcent);
  }

  .opis {
    margin: 0;
    font-size: 0.75rem;
    color: var(--tekst-cichy);
  }

  .strzalka {
    font-size: 1.5rem;
    color: var(--tekst-cichy);
  }

  /* Celowo cicha: żadnej karty, żadnego tła — tylko pionowa kreska, ta sama co
     przy `.uwaga`. Sekcja odpowiada na to samo pytanie co wykres pod nią, tyle
     że w innej jednostce, więc gdyby dostała własną ramkę, dwie odpowiedzi
     biłyby się o wzrok zamiast się uzupełniać. Mocna jest w niej jedna rzecz —
     sama kwota, bo po nią się tu przychodzi.

     Marginesy pionowe zostają 1.75rem jak dotąd: `.porownanie` nad nią ma tyle
     samo (marginesy się zlewają), a `figure` wykresu wchodzi z zerowym górnym —
     więc oba odstępy wychodzą dokładnie takie same jak przed przeniesieniem. */
  .dochod {
    margin: 0 0 1.75rem;
    padding-left: 1rem;
    border-left: 2px solid var(--linia);
  }

  /* Wersaliki i rozstrzelenie jak w `.rok` nad kwotami netto: to rym, nie
     przypadek — oba wiersze podpisują liczbę stojącą pod nimi. */
  .dochod-etykieta {
    margin: 0;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--tekst-cichy);
  }

  /* Stopniem odpowiada kwotom netto z `.porownanie`, a nie liczbie zysku:
     to druga co do ważności kwota na stronie, nie pierwsza. */
  .dochod-kwota {
    margin: 0.125rem 0 0;
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }

  .dochod-zrodlo {
    margin: 0;
    font-size: 0.75rem;
    color: var(--tekst-cichy);
  }

  /* Miara jak w `.rocznie`: to samo, co tam — wszystkie warianty leżą w jednej
     komórce, więc najdłuższy dyktuje wysokość i warto trzymać go w ryzach. */
  .dochod-polozenie {
    margin: 0.5rem 0 0;
    max-width: 35rem;
    font-size: 0.875rem;
    color: var(--tekst);
  }

  .dochod-wyjasnienie {
    margin: 0.5rem 0 0;
    max-width: 35rem;
    font-size: 0.8125rem;
    color: var(--tekst-cichy);
    text-wrap: pretty;
  }

  .uwaga {
    margin: 0 0 1.75rem;
    padding: 0.75rem 1rem;
    border-left: 2px solid var(--linia);
    font-size: 0.875rem;
    color: var(--tekst-cichy);
  }

  /* Kreska nad rozbiciem oddziela je od treści strony; panel założeń żadnej nie
     dostaje, bo należy jeszcze do pola nad sobą. Wspólne dla obu zostaje to, co
     jest w nich tym samym: wygląd `summary` i znacznika. */
  .rozbicie {
    border-top: 1px solid var(--linia);
    padding-top: 1.25rem;
  }

  /* Ten sam odstęp od suwaka, jaki miał pierwszy przełącznik, gdy stał w tym
     miejscu — wiersz założeń zaczyna nową grupę, a nie ciąg dalszy pola. */
  .opcje {
    margin-top: 1.25rem;
  }

  /* Na wąskim ekranie zawijają się napisy, a nie wiersz: znacznik i podpowiedź
     zostają na swoich krawędziach, bo kurczy się kolumna ze środka. `min-width`
     jej na to pozwala — bez niego element `flex` nie schodzi poniżej swojej
     naturalnej szerokości i podpowiedź wyleciałaby poza ramkę.

     W środku zwykły tekst, nie druga siatka: odstępy między założeniami są
     wtedy prawdziwymi spacjami, więc czytnik ekranu czyta „26 lat lub więcej
     bez PPK", a nie „więcejbez" — nazwa kontrolki składa się z tego, co jest
     w treści, i sklejone pudełka skleiłyby też wyrazy. */
  .zalozenia {
    min-width: 0;
    /* Lżej od `summary`, w którym siedzi: to jest odczyt stanu, nie nagłówek. */
    font-weight: 400;
    text-wrap: pretty;
  }

  /* Kropka rozdzielająca rysowana, a nie wpisana w treść: to interpunkcja
     układu, więc nie ma jej w tekście, z którego składa się nazwa kontrolki,
     i przy zawijaniu zostaje przyklejona do swojego napisu — czyli na końcu
     wiersza, nigdy sama na początku następnego. */
  .zalozenie:not(:last-child)::after {
    content: '·';
    margin-left: 0.25rem;
    color: var(--tekst-cichy);
  }

  /* Schowane przed wzrokiem, czytane przez czytnik ekranu. */
  .tylko-czytnik {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* Pierwszy przełącznik odsuwa się od wiersza założeń mniej niż grupa od
     suwaka: to jego rozwinięcie, nie nowa sekcja. */
  .opcje > .przelacznik:first-of-type {
    margin-top: 1rem;
  }

  /* Kreska oddzielająca drobiazgi — ta sama linia co nad rozbiciem, bo robi to
     samo: mówi, że dalej jest treść innej wagi. */
  .drobne {
    margin-top: 1.25rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--linia);
  }

  /* Pod kreską przełącznik nie potrzebuje już odstępu — daje go padding grupy. */
  .drobne .przelacznik {
    margin-top: 0;
  }

  summary {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.6875rem 0.875rem;
    border: 1px solid var(--linia);
    border-radius: 0.5rem;
    background: var(--tlo-karta);
    cursor: pointer;
    /* Wielokrotne klikanie w rozwijanie nie ma zaznaczać napisu. */
    user-select: none;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--tekst);
    /* Własny znacznik zamiast systemowego trójkąta: `list-style` gasi go
       w Firefoksie i nowym Chrome, `::-webkit-details-marker` w Safari. */
    list-style: none;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary:hover {
    background: var(--akcent-tlo);
    border-color: color-mix(in srgb, var(--akcent) 40%, var(--linia));
  }

  summary:focus-visible {
    outline: 2px solid var(--akcent);
    outline-offset: 2px;
  }

  /* Kwadrat z dwoma bokami: obrócony o −45° to strzałka w prawo, o 45° w dół. */
  .znacznik {
    flex: none;
    width: 0.4375rem;
    height: 0.4375rem;
    margin-left: 0.125rem;
    border-right: 1.5px solid currentColor;
    border-bottom: 1.5px solid currentColor;
    color: var(--tekst-cichy);
    transform: rotate(-45deg);
    transition:
      transform 0.2s ease,
      color 0.15s ease;
  }

  details[open] .znacznik {
    transform: rotate(45deg);
  }

  summary:hover .znacznik,
  summary:focus-visible .znacznik {
    color: var(--akcent);
  }

  .podpowiedz {
    margin-left: auto;
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--tekst-cichy);
  }

  summary:hover .podpowiedz {
    color: var(--akcent);
  }

  /* Płynne rozwijanie bez mierzenia wysokości w JS — tylko tam, gdzie
     przeglądarka umie animować do `auto`. Gdzie nie umie, otwiera się skokowo. */
  @supports (interpolate-size: allow-keywords) and (selector(::details-content)) {
    details {
      interpolate-size: allow-keywords;
    }

    details::details-content {
      block-size: 0;
      overflow: hidden;
      opacity: 0;
      transition:
        block-size 0.25s ease,
        opacity 0.2s ease,
        content-visibility 0.25s allow-discrete;
    }

    details[open]::details-content {
      block-size: auto;
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    summary,
    .znacznik,
    details::details-content,
    .przelacznik,
    .przelacznik input,
    .przelacznik input::before,
    .segment,
    .rozwijane,
    .klip {
      transition: none;
    }
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    font-size: 0.875rem;
    font-variant-numeric: tabular-nums;
  }

  th[scope='col'] {
    text-align: right;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--tekst-cichy);
    font-weight: 500;
  }

  th[scope='col']:first-child,
  th[scope='row'] {
    text-align: left;
  }

  th[scope='row'] {
    font-weight: 400;
    color: var(--tekst-cichy);
  }

  /* Warunek dopisany pod nazwą pozycji, a nie obok niej: w tej kolumnie i tak
     się zawija, a złamanie w wybranym miejscu czyta się lepiej niż w losowym.
     Mniejszy stopień, bo to zastrzeżenie do nazwy, nie druga nazwa. */
  th[scope='row'] .dopisek {
    display: block;
    font-size: 0.75rem;
  }

  /* Odstęp od lewej, bo przy wąskim ekranie sąsiednie kwoty inaczej się stykają. */
  td,
  th[scope='col']:not(:first-child) {
    text-align: right;
    padding: 0.375rem 0 0.375rem 0.75rem;
  }

  th {
    padding: 0.375rem 0;
  }

  .suma th,
  .suma td {
    border-top: 1px solid var(--linia);
    font-weight: 600;
    color: var(--tekst);
  }

  /* Wiersz stojący poza odejmowaniem: mniejszy stopień i przygaszony kolor
     mówią, że to dopisek pod sumą, a nie jej kolejny składnik. */
  .poza-suma th,
  .poza-suma td {
    padding-top: 0.625rem;
    font-size: 0.8125rem;
    color: var(--tekst-cichy);
  }

  .nota {
    font-size: 0.75rem;
    color: var(--tekst-cichy);
    margin: 1rem 0 0;
  }

  @media (max-width: 30rem) {
    .porownanie {
      gap: 1rem;
    }

    .netto {
      font-size: 1.25rem;
    }

    table {
      font-size: 0.8125rem;
    }
  }
</style>
