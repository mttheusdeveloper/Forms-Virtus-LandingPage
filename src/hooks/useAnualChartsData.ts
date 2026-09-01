import { useMemo } from 'react';
import { ACTIVE_MONTHS, MESES } from '../lib/constants';
import { num } from '../lib/parse';
import type { AnualFilterState } from '../types';
import type { AnualDerived } from './useAnualDerived';

export interface AnualChartsData {
  labels: string[];
  fb: number[];
  fl: number[];
  caixa: number[];
  eb: number[];
  custosLabels: string[];
  custosData: number[];
  custosKeys: string[];
  investKeys: string[];
  investSeries: number[];
  roiSeries: Array<number | null>;
  lucro: number[];
  cresc: number[];
  kpis: { totFB: number; totFL: number; totEB: number; totInv: number; totRoi: number; lucroAvg: number };
}

// Porta da parte de dados de renderAnual() (script.js:1917-2009) — fatia o
// balde de 12 meses (byMonth) pela janela [mMin, mMax] selecionada na aba Anual.
export function useAnualChartsData(anualDerived: AnualDerived, anualFilters: AnualFilterState): AnualChartsData {
  return useMemo(() => {
    const { mMin, mMax } = anualFilters;
    const byMonth = anualDerived.byMonth;
    const sliceIdx = <T,>(arr: T[]) => arr.slice(mMin, mMax + 1);
    const labels = sliceIdx(MESES);

    const fb = sliceIdx(byMonth.map((b) => b.fb));
    const fl = sliceIdx(byMonth.map((b) => b.fl));
    const caixa = sliceIdx(byMonth.map((b) => b.caixa));
    const eb = sliceIdx(byMonth.map((b) => b.eb));
    const custos = sliceIdx(byMonth.map((b) => b.custos));
    const inv = sliceIdx(byMonth.map((b) => b.inv));
    const roiDelta = sliceIdx(byMonth.map((b) => b.roiDelta));
    const lucro = sliceIdx(byMonth.map((b) => b.lucro));
    const cresc = sliceIdx(byMonth.map((b) => b.cresc));

    const totFB = fb.reduce((a, b) => a + b, 0);
    const totFL = fl.reduce((a, b) => a + b, 0);
    const totEB = eb.reduce((a, b) => a + b, 0);
    const totInv = inv.reduce((a, b) => a + b, 0);
    const totRoi = roiDelta.reduce((a: number, b) => a + num(b), 0);
    const active = fb.filter((_, i) => byMonth[mMin + i]?._count).length || 1;
    const lucroAvg = lucro.reduce((a, b) => a + b, 0) / active;

    const custoTotalAnual = custos.reduce((acc, v) => acc + Math.abs(num(v)), 0);
    const custosLabels = [...labels, 'Total'];
    const custosData = [...custos.map((v) => Math.abs(v)), custoTotalAnual];
    const custosKeys = [...ACTIVE_MONTHS.slice(mMin, mMax + 1).map((m) => m.key), 'total'];

    const investKeys = ACTIVE_MONTHS.slice(mMin, mMax + 1).map((m) => m.key);
    const investSeries = inv.map((v) => Math.abs(v));

    return {
      labels,
      fb,
      fl,
      caixa,
      eb,
      custosLabels,
      custosData,
      custosKeys,
      investKeys,
      investSeries,
      roiSeries: roiDelta,
      lucro,
      cresc,
      kpis: { totFB, totFL, totEB, totInv, totRoi, lucroAvg },
    };
  }, [anualDerived, anualFilters]);
}
