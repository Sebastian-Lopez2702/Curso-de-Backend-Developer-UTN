// redondeo de numero a dos decimales
export const round2 = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};
