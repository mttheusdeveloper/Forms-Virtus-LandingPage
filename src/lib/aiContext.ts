import { A, ACTIVE_MONTHS, C } from './constants';
import { num } from './parse';
import { monthIdx, monthLabel, isActiveMonthIndex } from './months';
import { selectedMonthData, selectedMonthKeys } from './selectors';
import type { DreContext, MensalFilterState, RawRow } from '../types';
import type { MensalDerived } from '../hooks/useMensalDerived';

interface RowSummary {
  registros: number;
  entradas: number;
  saidas: number;
  faturamentoBruto: number;
  saldoEntradasMenosSaidas: number;
}

// Porta de aiSumRows() (script.js:3078-3089).
export function aiSumRows(rows: RawRow[]): RowSummary {
  return (rows || []).reduce(
    (acc: RowSummary, r) => {
      const entradas = num(r[C.ent]);
      const saidas = num(r[C.sai]);
      acc.registros += 1;
      acc.entradas += entradas;
      acc.saidas += saidas;
      acc.faturamentoBruto += entradas;
      acc.saldoEntradasMenosSaidas += entradas - saidas;
      return acc;
    },
    { registros: 0, entradas: 0, saidas: 0, faturamentoBruto: 0, saldoEntradasMenosSaidas: 0 },
  );
}

// Porta de buildDashboardAIContext() (script.js:3090-3177) — monta o payload
// enviado como contexto pra IA a cada pergunta.
export function buildDashboardAIContext(mensalFilters: MensalFilterState, mensalDerived: MensalDerived, dreContext: DreContext, anualRows: RawRow[]) {
  const selectedKeys = selectedMonthKeys(mensalFilters);
  const selectedLabels = selectedKeys.map(monthLabel);

  const mesesTodos = ACTIVE_MONTHS.map((m) => {
    const rows = mensalDerived.valid[m.key] || [];
    const totals = aiSumRows(rows);
    return { chave: m.key, mes: m.label, ...totals };
  });

  const mesesFiltradosData = selectedMonthData(mensalFilters, mensalDerived.valid, true);
  const mesesFiltrados = mesesFiltradosData.map((m) => {
    const totals = aiSumRows(m.rows);
    return { chave: m.key, mes: m.label, ...totals };
  });

  const allFilteredRows: RawRow[] = mesesFiltradosData.flatMap((m) => m.rows.map((r) => ({ ...r, _mes: m.label, _mesKey: m.key })));
  const resumoFiltrado = aiSumRows(allFilteredRows);

  const categorias: Record<string, { categoria: string; registros: number; entradas: number; saidas: number; faturamentoBruto: number }> = {};
  allFilteredRows.forEach((r) => {
    const key = String(r[C.cat] || 'Sem categoria').trim() || 'Sem categoria';
    if (!categorias[key]) categorias[key] = { categoria: key, registros: 0, entradas: 0, saidas: 0, faturamentoBruto: 0 };
    categorias[key].registros += 1;
    categorias[key].entradas += num(r[C.ent]);
    categorias[key].saidas += num(r[C.sai]);
    categorias[key].faturamentoBruto += num(r[C.ent]);
  });
  const topCategorias = Object.values(categorias)
    .sort((a, b) => Math.abs(b.faturamentoBruto) - Math.abs(a.faturamentoBruto))
    .slice(0, 12);

  const dre = dreContext.grupos.length
    ? {
        periodo: dreContext.periodoLabel,
        totalReceitas: dreContext.totalReceitas,
        grupos: dreContext.grupos.map((g) => ({
          grupo: g.label,
          valor: g.value,
          totalOriginal: g.totalItem ? g.totalItem.valorOriginal : g.value,
          detalhes: (g.detalhes || []).slice(0, 12).map((d) => ({ descricao: d.desc, valor: d.valorOriginal, percentual: d.pct || '' })),
        })),
      }
    : null;

  const financeiro2026 = (anualRows || [])
    .filter((r) => isActiveMonthIndex(monthIdx(r[A.mes])))
    .map((r) => ({
      mes: r[A.mes],
      faturamentoBruto: num(r[A.fb]),
      faturamentoLiquido: num(r[A.fl]),
      caixa: num(r[A.caixa]),
      ebitda: num(r[A.eb]),
      custosOperacionais: num(r[A.custos]),
      investimentos: num(r[A.inv]),
      lucratividade: num(r[A.lucro]),
      crescimento: num(r[A.cresc]),
    }))
    .filter((r) => String(r.mes || '').trim())
    .slice(0, 20);

  return {
    dashboard: 'Virtus Ads Finance',
    geradoEm: new Date().toLocaleString('pt-BR'),
    filtrosAtuais: {
      mesesSelecionados: selectedLabels,
      tipo: mensalFilters.tipo,
      categoria: mensalFilters.cat,
      conta: mensalFilters.conta,
      observacao: 'Registros mensais considerados apenas quando possuem data válida + categoria.',
    },
    resumoFiltrado,
    mesesSelecionadosFiltrados: mesesFiltrados,
    mesesTodosSemFiltro: mesesTodos,
    topCategoriasFiltradas: topCategorias,
    dre,
    financeiro2026,
  };
}
