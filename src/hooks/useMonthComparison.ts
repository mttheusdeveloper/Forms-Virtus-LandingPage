import { useMemo } from 'react';
import { A } from '../lib/constants';
import { monthIdx, isActiveMonthIndex } from '../lib/months';
import { selectedMonthKeys } from '../lib/selectors';
import type { MensalFilterState, RawRow } from '../types';

export interface MonthComparisonData {
  consolAll: RawRow[];
  cur: RawRow | null;
  prev: RawRow | null;
}

// Porta de getMonthRowsForComparison() (script.js:2654-2667) — acha o "mês
// atual" (último mês selecionado com dados) e o mês anterior a ele, usados
// pelos cards Comparativo automático e Semáforo financeiro.
export function useMonthComparison(mensalFilters: MensalFilterState, anualRows: RawRow[]): MonthComparisonData {
  return useMemo(() => {
    const selIdx = new Set(selectedMonthKeys(mensalFilters).map(monthIdx).filter(isActiveMonthIndex));
    const consolAll = anualRows.filter((r) => isActiveMonthIndex(monthIdx(r[A.mes]))).sort((a, b) => monthIdx(a[A.mes]) - monthIdx(b[A.mes]));

    const valid = consolAll.filter((r) => monthIdx(r[A.mes]) >= 0);
    if (!valid.length) return { consolAll, cur: null, prev: null };

    const selectedIdxs = [...selIdx].filter((i) => i >= 0).sort((a, b) => a - b);
    const currentIdx = selectedIdxs.length ? selectedIdxs[selectedIdxs.length - 1] : monthIdx(valid[valid.length - 1][A.mes]);
    const cur = valid.find((r) => monthIdx(r[A.mes]) === currentIdx) || valid[valid.length - 1];
    const prev = valid.filter((r) => monthIdx(r[A.mes]) < monthIdx(cur[A.mes])).pop() || null;

    return { consolAll, cur, prev };
  }, [mensalFilters, anualRows]);
}
