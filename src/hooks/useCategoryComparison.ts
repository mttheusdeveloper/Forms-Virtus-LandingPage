import { useMemo } from 'react';
import { monthlyRowInfo, categoryChartName } from '../lib/rows';
import { dreRevenueCategoryMap } from '../lib/dre';
import { selectedMonthData } from '../lib/selectors';
import { monthChartColor } from '../lib/months';
import type { MensalFilterState, RawRow } from '../types';
import type { MensalDerived } from './useMensalDerived';

export interface CategorySeriesEntry {
  name: string;
  key: string;
  data: number[];
}

export interface CategoryComparisonData {
  catList: string[];
  series: CategorySeriesEntry[];
  colors: string[];
}

// Porta do bloco de comparação de categorias de renderMensal() (script.js:1192-1293).
// Mistura valores vindos da Caixa com valores vindos da DRE (Mentorias, Tráfego,
// etc.) sem duplicar quando a categoria já existe na Caixa daquele mês.
export function useCategoryComparison(mensalFilters: MensalFilterState, mensalDerived: MensalDerived, dreRows: RawRow[]): CategoryComparisonData {
  return useMemo(() => {
    const categoriaChartRows = (rows: RawRow[]) =>
      rows.filter((r) => {
        const info = monthlyRowInfo(r);
        if (!info.valid) return false;
        if (mensalFilters.conta !== 'all' && info.conta !== mensalFilters.conta) return false;
        if (mensalFilters.dayMin != null && info.day != null && info.day < mensalFilters.dayMin) return false;
        if (mensalFilters.dayMax != null && info.day != null && info.day > mensalFilters.dayMax) return false;
        if (mensalFilters.valMin != null && info.value < mensalFilters.valMin) return false;
        if (mensalFilters.valMax != null && info.value > mensalFilters.valMax) return false;
        return true;
      });

    const categoriaValorTotal = (r: RawRow) => {
      const info = monthlyRowInfo(r);
      return Math.abs(info.ent || 0) + Math.abs(info.sai || 0);
    };

    let mesesData = selectedMonthData(mensalFilters, mensalDerived.valid, false)
      .map((m) => ({ ...m, rows: categoriaChartRows(m.rows) }))
      .filter((m) => m.rows.length > 0);

    if (mesesData.length === 0) {
      mesesData = [{ key: '', label: 'Sem dados', short: 'Sem dados', rows: [] }];
    }

    const caixaCatByMonth: Record<string, Record<string, number>> = {};
    const catTot: Record<string, number> = {};

    mesesData.forEach((mesObj) => {
      const mesKey = mesObj.key || '';
      caixaCatByMonth[mesKey] = caixaCatByMonth[mesKey] || {};
      mesObj.rows.forEach((r) => {
        const valor = categoriaValorTotal(r);
        if (valor <= 0) return;
        const k = categoryChartName(r);
        caixaCatByMonth[mesKey][k] = (caixaCatByMonth[mesKey][k] || 0) + valor;
        catTot[k] = (catTot[k] || 0) + valor;
      });
    });

    const monthKeysForDre = mesesData.map((m) => m.key).filter(Boolean);
    const dreCatByMonth = dreRevenueCategoryMap(dreRows, monthKeysForDre);

    monthKeysForDre.forEach((mesKey) => {
      const dreCats = dreCatByMonth[mesKey] || {};
      Object.entries(dreCats).forEach(([cat, val]) => {
        if (val <= 0) return;
        const caixaVal = (caixaCatByMonth[mesKey] && caixaCatByMonth[mesKey][cat]) || 0;
        if (caixaVal > 0) return; // evita duplicar receita que já veio da Caixa
        catTot[cat] = (catTot[cat] || 0) + val;
      });
    });

    let catList = Object.keys(catTot)
      .filter((k) => (catTot[k] || 0) > 0)
      .sort((a, b) => (catTot[b] || 0) - (catTot[a] || 0));
    if (catList.length === 0) catList = ['Sem dados'];

    let series: CategorySeriesEntry[] = mesesData.map((mesObj) => ({
      name: mesObj.label,
      key: mesObj.key || '',
      data: catList.map((c) => {
        const mesKey = mesObj.key || '';
        const caixaVal = (caixaCatByMonth[mesKey] && caixaCatByMonth[mesKey][c]) || 0;
        if (caixaVal > 0) return caixaVal;
        return (dreCatByMonth[mesKey] && dreCatByMonth[mesKey][c]) || 0;
      }),
    }));

    if (series.length === 0) {
      series = [{ name: 'Sem dados', key: '', data: [0] }];
    } else {
      series.forEach((s) => {
        if (!s.data || s.data.length === 0) s.data = [0];
      });
    }

    const colors = series.map((s) => monthChartColor(s.key || s.name));

    return { catList, series, colors };
  }, [mensalFilters, mensalDerived, dreRows]);
}
