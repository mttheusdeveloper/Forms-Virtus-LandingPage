import { monthCfg, monthIdx, monthLabel, monthShort } from './months';
import { applyFilter } from './filters';
import type { MensalFilterState, RawRow } from '../types';

export function selectedMonthKeys(filters: MensalFilterState): string[] {
  const keys = [...filters.mesesSel].filter((k) => monthCfg(k)).sort((a, b) => monthIdx(a) - monthIdx(b));
  return keys.length ? keys : filters.mesesDisp.slice();
}

export interface SelectedMonthEntry {
  key: string;
  label: string;
  short: string;
  rows: RawRow[];
}

export function selectedMonthData(
  filters: MensalFilterState,
  validByMonth: Record<string, RawRow[]>,
  filtered = true,
): SelectedMonthEntry[] {
  return selectedMonthKeys(filters).map((key) => ({
    key,
    label: monthLabel(key),
    short: monthShort(key),
    rows: filtered ? applyFilter(validByMonth[key] || [], key, filters) : validByMonth[key] || [],
  }));
}
