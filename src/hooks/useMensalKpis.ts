import { useMemo } from 'react';
import { A, ACTIVE_MONTHS } from '../lib/constants';
import { num } from '../lib/parse';
import { monthIdx, isActiveMonthIndex } from '../lib/months';
import { monthlyRowInfo } from '../lib/rows';
import { selectedMonthData, selectedMonthKeys } from '../lib/selectors';
import type { MensalFilterState, RawRow } from '../types';
import type { MensalDerived } from './useMensalDerived';

export interface MensalKpis {
  eTot: number;
  sTot: number;
  caixaMes: number;
  caixaMesSub: string;
  lucrAvg: number;
  crescimentoMes: number;
  crescimentoMesSub: string;
  caixaAno: number;
  entPill: string;
  saiPill: string;
  sparkEnt: number[];
  sparkSai: number[];
}

// Porta da parte de KPIs de renderMensal() (script.js:884-938).
export function useMensalKpis(mensalFilters: MensalFilterState, mensalDerived: MensalDerived, anualRows: RawRow[]): MensalKpis {
  return useMemo(() => {
    const mesesFiltrados = selectedMonthData(mensalFilters, mensalDerived.valid, true);
    const all = mesesFiltrados.flatMap((m) => m.rows);

    const sumInfo = (rows: RawRow[], field: 'ent' | 'sai') => rows.reduce((a, r) => a + monthlyRowInfo(r)[field], 0);
    const eTot = sumInfo(all, 'ent');
    const sTot = sumInfo(all, 'sai');

    const selIdx = new Set(selectedMonthKeys(mensalFilters).map(monthIdx).filter(isActiveMonthIndex));
    const consolAll = anualRows
      .filter((r) => isActiveMonthIndex(monthIdx(r[A.mes])))
      .sort((a, b) => monthIdx(a[A.mes]) - monthIdx(b[A.mes]));
    const consol = selIdx.size ? consolAll.filter((r) => selIdx.has(monthIdx(r[A.mes]))) : consolAll;

    const caixaAno = consolAll.reduce((a, r) => a + num(r[A.caixa]), 0);
    const lucrAtivos = consol.filter((r) => num(r[A.lucro]) !== 0);
    const lucrAvg = lucrAtivos.length ? lucrAtivos.reduce((a, r) => a + num(r[A.lucro]), 0) / lucrAtivos.length : 0;

    const comDados = consol.filter((r) => num(r[A.caixa]) !== 0);
    const mesRow = comDados[comDados.length - 1] || consol[consol.length - 1];
    const caixaMes = mesRow ? num(mesRow[A.caixa]) : 0;
    const crescimentoMes = mesRow ? num(mesRow[A.cresc]) : 0;
    const mesRowLabel = mesRow ? String(mesRow[A.mes]) : '';

    const monthTotals = mesesFiltrados.map((m) => ({ ...m, entradas: sumInfo(m.rows, 'ent'), saidas: sumInfo(m.rows, 'sai') }));
    const refMonth = [...monthTotals].reverse().find((m) => m.rows.length) || monthTotals[monthTotals.length - 1];
    const entPill = refMonth && eTot ? `${Math.round((refMonth.entradas / (eTot || 1)) * 100)}% ${refMonth.short.toUpperCase()}` : '—';
    const saiPill = refMonth && sTot ? `${Math.round((refMonth.saidas / (sTot || 1)) * 100)}% ${refMonth.short.toUpperCase()}` : '—';

    const sparkEnt = Array(31).fill(0);
    const sparkSai = Array(31).fill(0);
    all.forEach((r) => {
      const info = monthlyRowInfo(r);
      if (info.day) {
        sparkEnt[info.day - 1] += info.ent;
        sparkSai[info.day - 1] += info.sai;
      }
    });

    return {
      eTot,
      sTot,
      caixaMes,
      caixaMesSub: mesRow ? `Caixa de ${mesRowLabel}` : 'Sem dados',
      lucrAvg,
      crescimentoMes,
      crescimentoMesSub: mesRow ? `Crescimento de ${mesRowLabel}` : 'Sem dados',
      caixaAno,
      entPill,
      saiPill,
      sparkEnt,
      sparkSai,
    };
  }, [mensalFilters, mensalDerived, anualRows]);
}

export interface CaixaChartItem {
  key: string;
  short: string;
  label: string;
  faturamentoBruto: number;
  custoOperacional: number;
}

// Porta de caixaMensalAll/caixaTotalAll (script.js:943-963) — dados dos dois
// gráficos principais (Faturamento Bruto / Custo Operacional), que mostram
// SEMPRE todos os meses ativos + "Total", independente dos filtros.
export function useCaixaChartItems(mensalDerived: MensalDerived): CaixaChartItem[] {
  return useMemo(() => {
    const monthly: CaixaChartItem[] = ACTIVE_MONTHS.map((m) => {
      const totals = mensalDerived.totals[m.key] || { entradas: 0, saidas: 0, faturamentoBruto: 0, custoOperacional: 0 };
      return { key: m.key, short: m.short, label: m.label, faturamentoBruto: totals.faturamentoBruto, custoOperacional: totals.custoOperacional };
    });
    const total: CaixaChartItem = {
      key: 'total',
      short: 'Total',
      label: 'Total',
      faturamentoBruto: monthly.reduce((a, m) => a + m.faturamentoBruto, 0),
      custoOperacional: monthly.reduce((a, m) => a + m.custoOperacional, 0),
    };
    return [...monthly, total];
  }, [mensalDerived]);
}
