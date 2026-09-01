import { ACTIVE_MONTHS, C } from './constants';
import { num, numPct, normKey, firstExistingValue, firstExistingText } from './parse';
import { fmtBRL2 } from './format';
import { monthCfg } from './months';
import type { DreGroup, DreItem, DreContext, RawRow, TxModalItem } from '../types';

export function dreDesc(row: RawRow): string {
  return String(row?.descricao ?? row?.Descrição ?? row?.desc ?? '').trim();
}

export function normDreDesc(v: unknown): string {
  return normKey(v).replace(/\s+/g, ' ').trim();
}

export function dreRevenueCategoryName(desc: string): string {
  const clean = String(desc || '').trim();
  const n = normDreDesc(clean);
  if (!n) return '';

  // Não deixa cabeçalhos/subtotais da DRE virarem categoria.
  if (n === 'receitas' || n === 'receita' || n.includes('total das receitas') || n.includes('total receitas')) return '';

  if (n.includes('mentor')) return 'Mentorias (Receita)';
  if (n.includes('lancamento')) return 'Lançamentos (Receita)';
  if (n.includes('trafego')) return 'Tráfego (Receita)';

  return clean.replace(/\s*\((receita|custo|despesa)\)\s*$/i, '').trim() + ' (Receita)';
}

export function dreMonthValue(row: RawRow, mesKey: string): number {
  const cfg = monthCfg(mesKey);
  if (!cfg) return 0;
  return Math.abs(num(firstExistingValue(row, cfg.dreCols)));
}

export function dreRevenueRows(dreRows: RawRow[]): RawRow[] {
  const rows = (dreRows || []).slice().sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

  const start = rows.findIndex((r) => normDreDesc(dreDesc(r)) === 'receitas');
  const end = rows.findIndex((r) => normDreDesc(dreDesc(r)) === 'custo');

  const base =
    start >= 0
      ? rows.slice(start + 1, end > start ? end : rows.length)
      : rows.filter((r) => {
          const d = normDreDesc(dreDesc(r));
          return d.includes('mentor') || d.includes('lancamento') || d.includes('trafego');
        });

  return base.filter((r) => dreRevenueCategoryName(dreDesc(r)));
}

export function dreRevenueCategoryMap(dreRows: RawRow[], monthKeys: string[]): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = Object.fromEntries((monthKeys || []).map((k) => [k, {}]));
  dreRevenueRows(dreRows).forEach((r) => {
    const label = dreRevenueCategoryName(dreDesc(r));
    if (!label) return;
    (monthKeys || []).forEach((mesKey) => {
      const val = dreMonthValue(r, mesKey);
      if (val <= 0) return;
      out[mesKey] = out[mesKey] || {};
      out[mesKey][label] = (out[mesKey][label] || 0) + val;
    });
  });
  return out;
}

export function dreRevenueModalRows(dreRows: RawRow[], categoria: string, mesKey: string): TxModalItem[] {
  const cfg = monthCfg(mesKey);
  if (!cfg) return [];

  return dreRevenueRows(dreRows)
    .map((r) => {
      const label = dreRevenueCategoryName(dreDesc(r));
      const val = dreMonthValue(r, cfg.key);
      if (label !== categoria || val <= 0) return null;
      const item: TxModalItem = {
        row: {
          [C.data]: '',
          [C.conta]: 'DRE',
          [C.cat]: label,
          [C.desc]: dreDesc(r) || label,
          [C.ent]: val,
          [C.sai]: 0,
        } as RawRow,
        _mes: cfg.label,
        _mesKey: cfg.key,
      };
      return item;
    })
    .filter((v): v is TxModalItem => v !== null);
}

// Monta os 7 grupos fixos da DRE (RECEITAS, CUSTO, EBITDA, DESPESAS, DESPESAS
// FINANCEIRAS, TOTAL DAS DESPESAS, RESULTADO DO EXERCÍCIO) a partir das linhas
// brutas da tabela `dre`, somando as colunas dos meses selecionados.
export function buildDreContext(dreRows: RawRow[], mesesDreInput: string[]): DreContext {
  const mesesDre = mesesDreInput.length ? mesesDreInput : ACTIVE_MONTHS.map((m) => m.key);
  const mesesDreLabel = mesesDre.map((m) => monthCfg(m)?.label ?? m).join(' + ');

  const rows = (dreRows || []).slice().sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

  const getDreIndex = (desc: string) => rows.findIndex((r) => normDreDesc(dreDesc(r)) === normDreDesc(desc));
  const getDreRow = (desc: string): RawRow | null => rows[getDreIndex(desc)] || null;

  function valorDreRow(r: RawRow | null): number {
    if (!r) return 0;
    return mesesDre.reduce((acc, mesKey) => {
      const cfg = monthCfg(mesKey);
      if (!cfg) return acc;
      return acc + num(firstExistingValue(r, cfg.dreCols));
    }, 0);
  }

  const totalReceitasDre = Math.abs(valorDreRow(getDreRow('Total das receitas')));

  function pctDreRow(r: RawRow | null, valorOriginal: number): string {
    if (!r) return '';

    // Quando só tem um mês selecionado, usa a porcentagem original da DRE, se existir.
    if (mesesDre.length === 1) {
      const cfg = monthCfg(mesesDre[0]);
      if (cfg) {
        const pctOriginal = firstExistingText(r, cfg.drePctCols);
        if (pctOriginal) return pctOriginal;
      }
    }

    // Quando tem mais de um mês, recalcula a % em cima do Total das receitas do recorte.
    if (!totalReceitasDre) return '';
    const pctCalc = (valorOriginal / totalReceitasDre) * 100;
    if (!isFinite(pctCalc) || Math.abs(pctCalc) < 0.005) return '';
    return pctCalc.toFixed(2) + '%';
  }

  function itemFromRow(r: RawRow | null): DreItem | null {
    if (!r) return null;
    const desc = dreDesc(r);
    if (!desc) return null;

    const valorOriginal = valorDreRow(r);
    const val = Math.abs(valorOriginal);
    const pctTexto = pctDreRow(r, valorOriginal);
    const pctValor = numPct(pctTexto);

    if (val === 0) return null;
    if (pctTexto && pctValor === 0) return null;

    return { desc, valorOriginal, val, pct: pctTexto };
  }

  const itemByDesc = (desc: string) => itemFromRow(getDreRow(desc));

  function rowsEntre(inicio: string, fim?: string): RawRow[] {
    const i = getDreIndex(inicio);
    if (i < 0) return [];
    const f = fim ? getDreIndex(fim) : -1;
    const end = f > i ? f : rows.length;
    return rows.slice(i + 1, end);
  }

  function montarGrupoSecao({ label, inicio, fim, total }: { label: string; inicio?: string; fim?: string; total?: string }): DreGroup | null {
    const totalItem = total ? itemByDesc(total) : itemByDesc(inicio || label);
    const totalNorm = normDreDesc(total || '');
    const inicioNorm = normDreDesc(inicio || label);

    const detalhes = rowsEntre(inicio || label, fim)
      .map(itemFromRow)
      .filter((item): item is DreItem => !!item)
      .filter((item) => {
        const d = normDreDesc(item.desc);
        if (d === inicioNorm) return false;
        if (totalNorm && d === totalNorm) return false;
        return true;
      });

    const value = totalItem ? totalItem.val : detalhes.reduce((acc, item) => acc + item.val, 0);
    if (value === 0) return null;

    return { label, value, totalItem, detalhes, periodo: mesesDreLabel };
  }

  function montarGrupoUnico({ label, desc }: { label: string; desc?: string }): DreGroup | null {
    const totalItem = itemByDesc(desc || label);
    if (!totalItem) return null;
    return { label, value: totalItem.val, totalItem, detalhes: [], periodo: mesesDreLabel };
  }

  const gruposDre = [
    montarGrupoSecao({ label: 'RECEITAS', inicio: 'RECEITAS', fim: 'CUSTO', total: 'Total das receitas' }),
    montarGrupoSecao({ label: 'CUSTO', inicio: 'CUSTO', fim: 'EBITDA', total: 'Fixos e Variáveis' }),
    montarGrupoUnico({ label: 'EBITDA', desc: 'EBITDA' }),
    montarGrupoSecao({ label: 'DESPESAS', inicio: 'Despesas', fim: 'Despesas Financeiras', total: 'Despesas' }),
    montarGrupoSecao({ label: 'DESPESAS FINANCEIRAS', inicio: 'Despesas Financeiras', fim: 'Total das despesas', total: 'Despesas Financeiras' }),
    montarGrupoUnico({ label: 'TOTAL DAS DESPESAS', desc: 'Total das despesas' }),
    montarGrupoUnico({ label: 'RESULTADO DO EXERCÍCIO', desc: 'RESULTADO DO EXERCÍCIO' }),
  ].filter((g): g is DreGroup => !!g);

  return { grupos: gruposDre, totalReceitas: totalReceitasDre, periodoLabel: mesesDreLabel, meses: mesesDre };
}

export interface DreModalRow {
  type: 'group' | 'item';
  group: string;
  tipo?: string;
  desc?: string;
  valor?: number;
  pct?: string;
}

// Porta de buildDreModalRows() (script.js:2775-2819): achata os grupos em
// linhas de cabeçalho + linhas de item pra tabela do modal "DRE completa".
export function buildDreModalRows(dreContext: DreContext): DreModalRow[] {
  const rows: DreModalRow[] = [];

  dreContext.grupos.forEach((grupo) => {
    rows.push({ type: 'group', group: grupo.label });

    const makeItem = (item: DreItem, tipo: string): DreModalRow => ({
      type: 'item',
      group: grupo.label,
      tipo,
      desc: item.desc,
      valor: item.valorOriginal,
      pct: item.pct || '-',
    });

    if (grupo.totalItem) rows.push(makeItem(grupo.totalItem, 'Total'));
    grupo.detalhes.forEach((item) => rows.push(makeItem(item, 'Item')));
  });

  return rows;
}

export function dreModalHaystack(row: DreModalRow): string {
  return normKey([row.group || '', row.tipo || '', row.desc || '', row.valor ? fmtBRL2(row.valor) : '', row.pct || ''].join(' '));
}
