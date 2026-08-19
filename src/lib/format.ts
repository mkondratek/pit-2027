const zl = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  maximumFractionDigits: 0,
});

const zlGrosze = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Kwota bez groszy — do liczb, które się czyta, nie sprawdza. */
export const kwota = (x: number) => zl.format(x);

/** Kwota z groszami — do rozbicia, gdzie ktoś może chcieć zweryfikować. */
export const kwotaDokladna = (x: number) => zlGrosze.format(x);

/** Kwota ze znakiem — dla różnicy, gdzie znak niesie treść. */
export const zeZnakiem = (x: number) => (x > 0 ? `+${zl.format(x)}` : zl.format(x));
