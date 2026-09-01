import { CHART_THEME, LUCRO_META } from './constants';
import { num } from './parse';

export function moneyClass(v: number, forceOutflow = false): string {
  if (forceOutflow) return 'money-neg';
  return num(v) < 0 ? 'money-neg' : 'money-pos';
}

export function moneyColor(v: number, forceOutflow = false): string {
  if (forceOutflow) return 'var(--money-neg)';
  return num(v) < 0 ? 'var(--money-neg)' : 'var(--money-pos)';
}

export function lucratividadeClass(v: number): string {
  return num(v) >= LUCRO_META ? 'money-pos' : 'money-neg';
}

export function lucratividadeColor(v: number): string {
  return num(v) >= LUCRO_META ? CHART_THEME.positive : CHART_THEME.negative;
}

export function lucroMetaLabel(): string {
  return `Meta ${String(LUCRO_META).replace('.', ',')}%`;
}
