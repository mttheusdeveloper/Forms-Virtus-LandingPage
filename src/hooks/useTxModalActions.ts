import { ACTIVE_MONTHS, A, C, TABLES } from '../lib/constants';
import { num, parseDate } from '../lib/parse';
import { fmtBRL2 } from '../lib/format';
import { monthCfg, monthIdx } from '../lib/months';
import { categoryChartName, isInvestmentRow } from '../lib/rows';
import { dreRevenueModalRows } from '../lib/dre';
import { selectedMonthData } from '../lib/selectors';
import { useDashboard } from '../state/DashboardContext';
import { useModals } from '../state/ModalsContext';
import { useMensalDerived } from './useMensalDerived';
import { useAnualDerived } from './useAnualDerived';
import type { RawRow, TxModalItem } from '../types';

const HEAD_ENTSAI = ['Data', 'Mês', 'Conta', 'Categoria', 'Descrição', 'Entradas', 'Saídas'];

function byDateDesc(a: TxModalItem, b: TxModalItem): number {
  return (parseDate(b.row[C.data])?.getTime() || 0) - (parseDate(a.row[C.data])?.getTime() || 0);
}

// Porta dos "abridores" de modal de script.js:1484-1697 — cada função monta o
// mesmo shape de modal de transações (reaproveitado em 5 contextos diferentes).
export function useTxModalActions() {
  const { state } = useDashboard();
  const { openTx } = useModals();
  const mensalDerived = useMensalDerived(state.mensalRows);
  const anualDerived = useAnualDerived(state.anualRows);

  function rowsForMonthlyModal(mesKey: string): TxModalItem[] {
    if (mesKey === 'total') {
      return ACTIVE_MONTHS.flatMap((m) => (mensalDerived.valid[m.key] || []).map((row) => ({ row, _mes: m.label, _mesKey: m.key })));
    }
    const cfg = monthCfg(mesKey);
    if (!cfg) return [];
    return (mensalDerived.valid[cfg.key] || []).map((row) => ({ row, _mes: cfg.label, _mesKey: cfg.key }));
  }

  function openMonthlyChartModal(tipo: 'faturamento' | 'custo', mesKey: string) {
    const isTotal = mesKey === 'total';
    const cfg = isTotal ? { key: 'total', label: 'Total', table: 'Todas as tabelas Caixa' } : monthCfg(mesKey);
    if (!cfg) return;

    const isCusto = tipo === 'custo';
    const rows = rowsForMonthlyModal(mesKey)
      .filter((item) => (isCusto ? num(item.row[C.sai]) > 0 : num(item.row[C.ent]) > 0))
      .sort(byDateDesc);

    openTx({
      kind: isCusto ? 'custo' : 'faturamento',
      title: isCusto ? `Custo Operacional — ${cfg.label}` : `Faturamento Bruto — ${cfg.label}`,
      eyebrow: isTotal
        ? isCusto
          ? 'Saídas de todas as tabelas Caixa'
          : 'Somente entradas de todas as tabelas Caixa'
        : isCusto
          ? `Saídas da tabela ${TABLES[cfg.key] || cfg.table}`
          : `Somente entradas da tabela ${TABLES[cfg.key] || cfg.table}`,
      headCells: HEAD_ENTSAI,
      items: rows,
      colSpan: 7,
      emptyMsg: isCusto
        ? isTotal
          ? 'Nenhuma saída encontrada'
          : 'Nenhuma saída encontrada para este mês'
        : isTotal
          ? 'Nenhuma entrada encontrada'
          : 'Nenhuma entrada encontrada para este mês',
    });
  }

  function openInvestmentMonthModal(mesKey: string) {
    const cfg = monthCfg(mesKey);
    if (!cfg) return;

    const annualRow = state.anualRows.find((r) => monthIdx(r[A.mes]) === monthIdx(cfg.key));
    const valorInvestimento = annualRow ? num(annualRow[A.inv]) : 0;

    let rows = rowsForMonthlyModal(cfg.key)
      .filter((item) => isInvestmentRow(item.row) && (num(item.row[C.ent]) > 0 || num(item.row[C.sai]) > 0))
      .sort(byDateDesc);

    // Se a Caixa do mês não tiver linhas claramente marcadas como investimento,
    // mostra somente o valor consolidado correto vindo do Financeiro 2026.
    if (!rows.length) {
      rows = [
        {
          row: {
            [C.data]: '',
            [C.conta]: 'Investimento consolidado',
            [C.cat]: 'Investimentos',
            [C.desc]: 'Valor consolidado do mês no Financeiro 2026',
            [C.ent]: 0,
            [C.sai]: Math.abs(valorInvestimento),
          } as RawRow,
          _mes: cfg.label,
          _mesKey: cfg.key,
        },
      ];
    }

    openTx({
      kind: 'investimentos',
      title: `Investimentos — ${cfg.label}`,
      eyebrow: `Valor consolidado: ${fmtBRL2(valorInvestimento)} • Fonte: Financeiro 2026`,
      headCells: HEAD_ENTSAI,
      items: rows,
      colSpan: 7,
      emptyMsg: 'Nenhum lançamento de investimento encontrado para este mês',
    });
  }

  function openRoiMonthModal(mesKey: string) {
    const cfg = monthCfg(mesKey);
    if (!cfg) return;

    const idx = monthIdx(cfg.key);
    const current = anualDerived.byMonth[idx] || { roiRaw: 0, roiDelta: null };
    const previousRaw = idx > 0 ? num(anualDerived.byMonth[idx - 1]?.roiRaw) : 0;
    const roiDelta = current.roiDelta;

    const rows: TxModalItem[] = [];
    if (roiDelta != null) {
      rows.push({
        row: {
          [C.data]: '',
          [C.conta]: 'Financeiro 2026',
          [C.cat]: 'ROI',
          [C.desc]: `ROI calculado mês contra mês: ${fmtBRL2(num(current.roiRaw))} - ${fmtBRL2(previousRaw)}`,
          [C.ent]: roiDelta >= 0 ? roiDelta : 0,
          [C.sai]: roiDelta < 0 ? Math.abs(roiDelta) : 0,
        } as RawRow,
        _mes: cfg.label,
        _mesKey: cfg.key,
      });
    }

    openTx({
      kind: 'roi',
      title: `ROI — ${cfg.label}`,
      eyebrow:
        roiDelta != null
          ? `Financeiro 2026 • roi atual ${fmtBRL2(num(current.roiRaw))} - roi anterior ${fmtBRL2(previousRaw)} = ${fmtBRL2(roiDelta)}`
          : 'Sem roi informado na tabela Financeiro 2026 para este mês ou mês anterior',
      headCells: HEAD_ENTSAI,
      items: rows,
      colSpan: 7,
      emptyMsg: 'Nenhum ROI encontrado para este mês',
    });
  }

  function openCategoryChartModal(categoria: string, mesKey: string) {
    const cfg = monthCfg(mesKey);
    if (!cfg || !categoria || categoria === 'Sem dados') return;

    const caixaRows: TxModalItem[] = (mensalDerived.valid[cfg.key] || [])
      .filter((row) => categoryChartName(row) === categoria)
      .map((row) => ({ row, _mes: cfg.label, _mesKey: cfg.key }));

    // Se a categoria foi completada pela DRE (ex.: Mentorias), mostra a linha
    // consolidada da DRE. Se já existe na Caixa, não soma de novo (evita duplicar).
    const dreRowsForCat = caixaRows.length ? [] : dreRevenueModalRows(state.dreRows, categoria, cfg.key);

    const rows = caixaRows.concat(dreRowsForCat).sort(byDateDesc);

    openTx({
      kind: 'faturamento',
      title: `Categoria — ${categoria}`,
      eyebrow:
        dreRowsForCat.length && !caixaRows.length
          ? `Valor puxado da DRE de ${cfg.label}`
          : `Entradas e saídas de ${cfg.label} na tabela ${TABLES[cfg.key] || cfg.table}`,
      headCells: HEAD_ENTSAI,
      items: rows,
      colSpan: 7,
      emptyMsg: 'Nenhum registro encontrado para esta categoria',
    });
  }

  function openTxModal(tipo: 'entrada' | 'saida') {
    const srcs = selectedMonthData(state.mensalFilters, mensalDerived.valid, false).flatMap((m) =>
      m.rows.map((row) => ({ row, _mes: m.label, _mesKey: m.key })),
    );
    const rows = srcs
      .filter((item) => {
        const r = item.row;
        const d = parseDate(r[C.data]);
        const categoria = String(r[C.cat] || '').trim();
        if (!d || !categoria) return false;
        const e = num(r[C.ent]);
        const s = num(r[C.sai]);
        if (tipo === 'entrada' && !(e > 0)) return false;
        if (tipo === 'saida' && !(s > 0)) return false;
        return true;
      })
      .sort(byDateDesc);

    openTx({
      kind: 'movimentacoes',
      title: tipo === 'entrada' ? '↑ Entradas' : '↓ Saídas',
      eyebrow: tipo === 'entrada' ? 'Movimentações de entrada' : 'Movimentações de saída',
      headCells: HEAD_ENTSAI,
      items: rows,
      colSpan: 7,
      emptyMsg: 'Nenhum registro',
    });
  }

  return { openMonthlyChartModal, openInvestmentMonthModal, openRoiMonthModal, openCategoryChartModal, openTxModal };
}
