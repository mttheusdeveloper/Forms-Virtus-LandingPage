export const fmtBRL = (v: number): string =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export const fmtBRL2 = (v: number): string =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

export const fmtPct = (v: number): string => (Number(v) || 0).toFixed(1) + '%';

export const fmtK = (v: number): string => {
  const a = Math.abs(v);
  if (a >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (a >= 1e3) return (v / 1e3).toFixed(1) + 'k';
  return v.toFixed(0);
};
