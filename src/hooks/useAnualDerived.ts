import { useMemo } from 'react';
import { A } from '../lib/constants';
import { num } from '../lib/parse';
import { monthIdx, isActiveMonthIndex } from '../lib/months';
import { annualRoiRaw, visibleRoiDelta } from '../lib/roi';
import { annualRowHasRealFinancialData } from '../lib/rows';
import type { AnualMonthBucket, RawRow } from '../types';

export interface AnualDerived {
  rows: RawRow[];
  byMonth: AnualMonthBucket[];
}

function emptyBucket(): AnualMonthBucket {
  return { fb: 0, fl: 0, caixa: 0, eb: 0, custos: 0, inv: 0, roiRaw: 0, roiDelta: null, roi: 0, endiv: 0, lucro: 0, cresc: 0, _count: 0, _hasValue: false };
}

// Porta de rebuildAnualCache(): agrega a tabela Financeiro 2026 em um balde por
// mês (0-11) e calcula o delta de ROI mês contra mês.
export function useAnualDerived(anualRows: RawRow[]): AnualDerived {
  return useMemo(() => {
    const rows = (anualRows || []).slice().sort((a, b) => monthIdx(a[A.mes]) - monthIdx(b[A.mes]));
    const byMonth: AnualMonthBucket[] = Array.from({ length: 12 }, emptyBucket);

    rows.forEach((r) => {
      const i = monthIdx(r[A.mes]);
      if (!isActiveMonthIndex(i)) return;
      const b = byMonth[i];
      b.fb += num(r[A.fb]);
      b.fl += num(r[A.fl]);
      b.caixa += num(r[A.caixa]);
      b.eb += num(r[A.eb]);
      b.custos += num(r[A.custos]);
      b.inv += num(r[A.inv]);
      const roiFinanceiro2026 = annualRoiRaw(r);
      b.roiRaw += roiFinanceiro2026;
      b.roi += roiFinanceiro2026;
      b.endiv += num(r[A.endiv]);
      b.lucro += num(r[A.lucro]);
      b.cresc += num(r[A.cresc]);
      b._count++;
      b._hasValue = b._hasValue || annualRowHasRealFinancialData(r);
    });

    byMonth.forEach((b, idx) => {
      const prevRaw = idx > 0 ? byMonth[idx - 1].roiRaw : 0;
      b.roiDelta = visibleRoiDelta(b.roiRaw, prevRaw, idx);
    });

    const activeRows = rows.filter((r) => isActiveMonthIndex(monthIdx(r[A.mes])));
    return { rows: activeRows, byMonth };
  }, [anualRows]);
}
