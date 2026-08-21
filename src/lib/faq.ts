/**
 * Treść „Częstych pytań" w jednym miejscu, żeby strona i dane strukturalne
 * dla wyszukiwarek nie mogły się rozjechać. Liczby biorą się z silnika, a nie
 * z przepisanego tekstu — to ten sam powód, dla którego próg reformy czyta się
 * z `progiIndywidualne`, a nie z prozy.
 *
 * Wersja tutaj jest skrócona do samej odpowiedzi: schema.org chce zwięzłego
 * tekstu bez odsyłaczy, a strona i tak pokazuje pełne akapity z linkami.
 */
import { kwota } from './format';
import { SKALA } from '../tax/constants';
import { BRUTTO_POCZATEK_KORZYSCI } from '../tax/engine';

const PROG_DZIS = SKALA[2026][0].do;

export type Pytanie = { pytanie: string; odpowiedz: string };

export const FAQ: Pytanie[] = [
  {
    pytanie: 'Dlaczego u mnie wychodzi zero?',
    odpowiedz:
      'Zapowiedź podnosi granicę pierwszego progu, więc z definicji zmienia coś tylko tym, ' +
      'którzy ten próg przekraczali — niżej podatek zostaje dokładnie taki sam. Z wypłaty ' +
      'najwięcej zabierają składki ZUS i zdrowotna, przy niższych zarobkach wielokrotnie ' +
      'większe od samego PIT, a ich reforma nie rusza w ogóle.',
  },
  {
    pytanie: 'Skąd się biorą progi podane w złotówkach brutto?',
    odpowiedz:
      `Zmiana zaczyna działać powyżej ${kwota(PROG_DZIS)} rocznego dochodu, bo tam kończy się ` +
      'dzisiejszy pierwszy próg. Na umowie o pracę, bez ulg i bez PPK, po doliczeniu składek ' +
      `i kosztów uzyskania przychodu wychodzi z tego mniej więcej ${kwota(BRUTTO_POCZATEK_KORZYSCI)} ` +
      'brutto miesięcznie. To przykład jednej drogi od dochodu do wynagrodzenia, a nie stała: ' +
      'ulga dla młodych, umowa zlecenia i PPK przesuwają tę kwotę o tysiące złotych.',
  },
  {
    pytanie: 'A co z B2B, podatkiem liniowym i ryczałtem?',
    odpowiedz:
      'Ta strona liczy wyłącznie zmianę skali podatkowej, a ta obejmuje umowę o pracę, ' +
      'zlecenie i emeryturę. Na podatku liniowym 19% sama skala nie zmienia nic. Zapowiedziany ' +
      'pakiet jest jednak szerszy: obejmuje też CIT z 19% na 22% dla firm o przychodach ponad ' +
      '50 mln euro, przywrócenie limitu 250 tys. euro dla ryczałtu, zmianę ulgi IP Box oraz ' +
      'wzrost daniny solidarnościowej z 4% na 5%. Kalkulator uwzględnia z tego tylko daninę.',
  },
  {
    pytanie: 'Czy to już pewne?',
    odpowiedz:
      'Nie. Jest komunikat rządowy z 19 sierpnia 2026 r., nie ma projektu ustawy — kształt ' +
      'skali może się jeszcze zmienić, a reforma może nie wejść w życie wcale.',
  },
  {
    pytanie: 'Kto to policzył i skąd mam wiedzieć, że dobrze?',
    odpowiedz:
      'Stronę napisał Mikołaj Kondratek — programista, nie doradca podatkowy, więc nie trzeba ' +
      'mu wierzyć na słowo. Kod jest otwarty, model opisany krok po kroku, a testy pilnują, ' +
      'żeby wyliczenia odtwarzały kwoty opublikowane przy tej zapowiedzi przez Bankier i money.pl.',
  },
];
