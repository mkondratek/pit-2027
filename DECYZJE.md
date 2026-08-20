# Decyzje projektowe

Rzeczy rozstrzygnięte świadomie, razem z powodem. Zapisane, żeby nie wracały jako
„a może by tak…" — także po to, by ktoś, kto chce dołożyć swoje, wiedział, co już
zostało sprawdzone i odrzucone.

Model podatkowy i jego niepewności są opisane osobno, w [`model.md`](model.md).

## Wykres pokazuje zysk, nie wynagrodzenie

Netto rośnie monotonicznie i nie niesie żadnej historii. Cała treść reformy jest
w kształcie krzywej zysku: płasko zero, rampa, płaskowyż.

Wariant z netto jako drugą serią został zbudowany i zmierzony: różnica między 2026
a 2027 to **1,7 piksela** na desktopie i **0,84** na telefonie (300 zł na kilkunastu
tysiącach to około 2%), więc obie linie zlewają się w jedną. Wykres rósł przy tym
o 43% i wymagał przypisu o 90-krotnym powiększeniu, żeby dało się go odczytać.
Szczegóły w [#7](https://github.com/mkondratek/pit-2027/issues/7).

## Nie ma przełącznika „miesięcznie / rocznie"

Progi reformy są roczne, pensje myśli się miesięcznie — kuszące jest więc dać wybór
jednostki. Zbudowaliśmy to i odrzucili.

W widoku rocznym na jednym ekranie stawały trzy roczne liczby o trzech znaczeniach:
pole 156 000 zł (brutto), sekcja dochodu 133 952 zł, oś wykresu 142 536 zł — przy
nagłówku mówiącym o progu 130 000 zł. Czytelnik zestawia 156 000 ze 130 000 i wychodzi
mu 26 000 nadwyżki zamiast prawdziwych 3 952.

W widoku miesięcznym przed tym błędem chroni sama różnica rzędu wielkości: nikt nie
porówna 13 000 ze 130 000. Przełącznik jednostki tę barierę zdejmuje.

Zamiast tego jest sekcja „Twój dochód roczny", która pokazuje **dochód** — czyli tę
liczbę, której naprawdę dotyczą progi — i wyjaśnia, czym różni się od brutto.

## Opcje wpływające na poprawność zostają widoczne

Kryterium jest jedno: **czy niewłączenie opcji sprawi, że pokażemy komuś nieprawdę
o setki złotych.**

Uczestnik PPK, który nie kliknie, zobaczyłby netto zawyżone o 322 zł miesięcznie.
Prostszy ekran nie jest wart pokazywania ludziom nieprawdziwych liczb.

Same przełączniki są jednak zwinięte, a widoczny jest **wiersz przyjętych założeń** —
„26 lat lub więcej · bez PPK · rozliczenie indywidualne" — który je rozwija.
Kryterium powyżej rozstrzyga nie o tym, czy kontrolka jest na wierzchu, tylko czy
założenie jest **wypowiedziane**: opcje ważące setki złotych (wspólne rozliczenie,
ulga dla młodych, PPK, status studenta) mają w wierszu swój człon w obu stanach, bo
„bez PPK" jest równie ważną informacją jak „z PPK". Drobiazgi — podwyższone koszty
dojazdu (kilka złotych) i rezygnacja z dobrowolnej chorobowej — dopisują się dopiero
włączone i w panelu stoją pod kreską; przy wyłączonych mówi o nich wyjaśnienie
w panelu, nie wiersz.

Rząd niezaznaczonych przełączników nie mówił nic o tym, na czym policzyliśmy wynik —
trzeba go było odczytać z wygaszonych suwaczków. Wiersz mówi to wprost i dlatego
wolno mu je zwinąć; samego „Więcej opcji", które chowałoby założenia bez ich
wypowiedzenia, na tej stronie nie ma.

Forma zatrudnienia jest wyjątkiem podwójnym: stoi **nad kwotą**, bo jest ramą
wyliczenia, a nie modyfikatorem gotowego wyniku, i nie ma swojego członu w wierszu,
bo jako jedyna pokazuje swój stan sama — podświetlony segment mówi „umowa zlecenia"
bez niczyjej pomocy, a niezaznaczony przełącznik nie mówi nic.

## Wyświetlany próg to 11 878 zł, choć zysk zaczyna się od 11 879

11 878 zł to zaokrąglona odwrotność progu 120 000 zł dochodu; przy tej kwocie dochód
wynosi 119 994 zł, więc zysk to jeszcze zero. Pierwsza kwota z realnym zyskiem to
11 879 zł.

Wyświetlamy 11 878, bo ta liczba jest już w obiegu — na karcie podglądu, na osi wykresu
i w tekstach o tej stronie. Zamiast zmieniać liczbę, obsłużyliśmy krawędź: dokładnie na
progu strona mówi „jesteś dokładnie na granicy", a nie „brakuje 0 zł".

## Przy wspólnym rozliczeniu pokazujemy połowę łącznego dochodu

Skalę stosuje się do połowy sumy dochodów małżonków (art. 6 ust. 2), więc to ta liczba
decyduje o progu. Suma dochodów pary jest liczbą, której do progu podstawiać nie wolno,
i właśnie dlatego jej nie pokazujemy.

Danina solidarnościowa jest odwrotnie — indywidualna, liczona każdemu osobno.

## Kwota w adresie jest zawsze miesięczna

Jednostka jest sprawą prezentacji, nie stanu. Gdyby adres niósł raz jedną, raz drugą,
wcześniej wysłane linki zaczęłyby pokazywać kwoty dwunastokrotnie inne.

## Model liczy w skali roku, nie dwunastu zaliczek

Zaokrąglenia zachodzą raz, a nie dwanaście razy, więc wynik może różnić się o kilka
złotych od sumy miesięcznych zaliczek. Do pytania „ile zyskam" to wystarcza; do listy
płac trzeba pętli miesięcznej, opisanej w `model.md`.

## Bez reklam i bez banera zgody

Strona nie zapisuje plików cookie w celach analitycznych ani marketingowych, więc nie
musi o nic pytać. Statystyki są bezcookie'owe. Kalkulator wypuszczony dzień po zapowiedzi
rządowej z reklamami spaliłby wiarygodność szybciej, niż zdążyłby zebrać ruch — a
formalności wokół rozliczania takich przychodów są nieproporcjonalne do kwot.

## Kod jest otwarty, a model opisany

To jest odpowiedź na pytanie „skąd mam wiedzieć, że dobrze liczy". Najbliższy
odpowiednik tej strony jest anonimowy i nie ma publicznego kodu, przez co wraca przy nim
pytanie, czy można mu ufać. Dlatego [`model.md`](model.md) wymienia źródła każdej stałej
i **osobno wypisuje to, czego nie udało się ustalić**.
