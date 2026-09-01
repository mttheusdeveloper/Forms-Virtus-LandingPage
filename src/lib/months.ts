import { ACTIVE_MONTH_KEYS, CURRENT_MONTH_LIMIT_INDEX, MONTHS, MONTH_CHART_COLORS } from './constants';
import { CHART_THEME } from './constants';
import { normKey } from './parse';
import type { MonthConfig } from '../types';

export function isActiveMonthIndex(index: number): boolean {
  return index >= 0 && index <= CURRENT_MONTH_LIMIT_INDEX;
}

export function monthIdx(label: unknown): number {
  if (!label) return -1;
  const s = normKey(label).slice(0, 3);
  const map: Record<string, number> = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
  return s in map ? map[s] : -1;
}

export function monthCfg(keyOrLabel: unknown): MonthConfig | null {
  const idx = monthIdx(keyOrLabel);
  return idx >= 0 ? MONTHS[idx] : null;
}

export function isActiveMonthKey(key: unknown): boolean {
  return ACTIVE_MONTH_KEYS.has(monthCfg(key)?.key || String(key || '').toLowerCase());
}

export function currentDashboardMonthIndex(): number {
  // Para não mostrar ROI negativo de mês futuro por causa de célula vazia/zero.
  return Math.min(11, Math.max(0, new Date().getMonth()));
}

export function monthLabel(keyOrLabel: unknown): string {
  const cfg = monthCfg(keyOrLabel);
  return cfg ? cfg.label : String(keyOrLabel || '');
}

export function monthShort(keyOrLabel: unknown): string {
  const cfg = monthCfg(keyOrLabel);
  return cfg ? cfg.short : String(keyOrLabel || '').slice(0, 3);
}

export function monthChartColor(keyOrLabel: unknown): string {
  const cfg = monthCfg(keyOrLabel);
  return (cfg && MONTH_CHART_COLORS[cfg.key]) || CHART_THEME.muted;
}

export function clampAnualRange(mMin: number, mMax: number): { mMin: number; mMax: number } {
  let nextMin = Math.min(Math.max(Number(mMin) || 0, 0), CURRENT_MONTH_LIMIT_INDEX);
  let nextMax = Math.min(Math.max(Number(mMax) || CURRENT_MONTH_LIMIT_INDEX, 0), CURRENT_MONTH_LIMIT_INDEX);
  if (nextMin > nextMax) nextMin = nextMax;
  return { mMin: nextMin, mMax: nextMax };
}

export function defaultMonthKey(mesesDisp: string[]): string {
  const current = ACTIVE_MONTH_KEYS.has(MONTHS[CURRENT_MONTH_LIMIT_INDEX]?.key)
    ? MONTHS[CURRENT_MONTH_LIMIT_INDEX]?.key
    : undefined;
  if (current && mesesDisp.includes(current)) return current;
  return mesesDisp[mesesDisp.length - 1] || '';
}
