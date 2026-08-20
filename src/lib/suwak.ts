/**
 * Reguła suwaka: co robić z wartością, którą przysyła pole `input[type=range]`.
 *
 * Osobny moduł, bo to jedyny kawałek zachowania suwaka, który da się sprawdzić
 * bez przeglądarki — a sprawdzić trzeba, bo raz już się wywrócił: przełącznik
 * potrafił podmienić ręcznie wpisaną kwotę na sufit suwaka.
 */

/** Domknięcie do zakresu suwaka; krok suwaka to pełne złote. */
export function wZakresie(wartosc: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(wartosc)));
}

/**
 * Kwota, na jaką suwak ma ustawić stan — albo `null`, gdy zdarzenia nie wolno
 * wziąć za decyzję użytkownika.
 *
 * Pole tekstowe przyjmuje kwoty, których na suwaku nie ma (sięga 100 000 zł,
 * suwak nie), a suwak pokazuje wtedy uchwyt przypięty do krawędzi zakresu.
 * Krawędź rusza się przy każdym przełączniku, bo zakres suwaka idzie za osią
 * wykresu, a ta za progami korzyści — i przeglądarka sama domyka wtedy wartość
 * pola `range` do nowego `max` albo `min`. Takie domknięcie jest nieodróżnialne
 * od gestu wykonanego dokładnie na krawędzi, a w niektórych przeglądarkach
 * przychodzi razem ze zdarzeniem `input`. Skutek bez tej reguły: włączenie
 * wspólnego rozliczenia przy wpisanych 66 333 zł podmieniało kwotę na 40 000 zł,
 * bez dotknięcia pola ani suwaka.
 *
 * Rozstrzygnięcie: wpisana kwota jest daną użytkownika, a suwak — sterownikiem
 * pomocniczym, więc to on ustępuje. Wartość równa przypiętej krawędzi jest
 * ignorowana **tylko wtedy**, gdy kwota leży poza zakresem, czyli dokładnie
 * w sytuacji, w której uchwyt i tak stoi w tym miejscu i gest nic by nie zmienił.
 * Kiedy kwota mieści się w zakresie (czyli prawie zawsze), reguła jest martwa.
 */
export function kwotaZSuwaka(
  wartosc: number,
  brutto: number,
  min: number,
  max: number,
): number | null {
  const przypietaKrawedz = wZakresie(brutto, min, max);
  if (wartosc === przypietaKrawedz && przypietaKrawedz !== brutto) return null;

  return wZakresie(wartosc, min, max);
}
