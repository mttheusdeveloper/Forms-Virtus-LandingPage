import { C, ANUAL_VALUE_KEYS } from './constants';
import { num, parseDate, normKey, firstExistingValue } from './parse';
import { annualRoiRaw } from './roi';
import type { AnualMonthBucket, MonthlyRowInfo, RawRow } from '../types';

// Memoiza a info derivada de cada linha por identidade do objeto — evita reparsear
// data/número em toda renderização quando a mesma linha do Supabase é reutilizada.
const monthlyRowInfoCache = new WeakMap<RawRow, MonthlyRowInfo>();

export function monthlyRowInfo(row: RawRow | null | undefined): MonthlyRowInfo {
  if (!row || typeof row !== 'object') return { date: null, day: null, cat: '', conta: '', ent: 0, sai: 0, value: 0, valid: false };
  const cached = monthlyRowInfoCache.get(row);
  if (cached) return cached;

  const date = parseDate(row[C.data]);
  const ent = num(row[C.ent]);
  const sai = num(row[C.sai]);
  const cat = String(row[C.cat] || '').trim();
  const conta = String(row[C.conta] || '').trim();
  const info: MonthlyRowInfo = {
    date,
    day: date ? date.getDate() : null,
    cat,
    conta,
    ent,
    sai,
    value: Math.max(ent, sai),
    valid: !!date && !!cat,
  };
  monthlyRowInfoCache.set(row, info);
  return info;
}

export function hasRequiredMonthlyFields(row: RawRow): boolean {
  return monthlyRowInfo(row).valid;
}

export function validMensalRows(rows: RawRow[] | undefined): RawRow[] {
  return (rows || []).filter(hasRequiredMonthlyFields);
}

export function isWithdrawalDescription(row: RawRow): boolean {
  const desc = normKey(row?.[C.desc] || '');
  if (!desc) return false;
  return [
    /valor\s+retirad[oa]s?/,
    /retirad[oa]s?/,
    /saque(?:s)?/,
    /resgate(?:s)?/,
    /resgatad[oa]s?/,
    /valor\s+sacad[oa]s?/,
    /valor\s+resgatad[oa]s?/,
  ].some((rx) => rx.test(desc));
}

export function withdrawalAmount(row: RawRow): number {
  return Math.max(Math.abs(num(row?.[C.ent])), Math.abs(num(row?.[C.sai])));
}

export function categoryChartName(row: RawRow): string {
  const info = monthlyRowInfo(row);
  const current = info.cat || 'Sem categoria';

  // Algumas receitas podem vir descritas no campo Descrição/Conta,
  // mesmo quando a Categoria original está genérica.
  // Aqui só reclassifica ENTRADAS para o gráfico de Categorias,
  // sem alterar Faturamento Bruto nem Custo Operacional.
  const rawText = [
    current,
    String(row?.[C.desc] || ''),
    String(row?.[C.conta] || ''),
    row && typeof row === 'object' ? Object.values(row).join(' ') : '',
  ].join(' ');
  const txt = normKey(rawText);

  const entrada = info.ent || num(row?.Entradas) || num(row?.Entrada) || num(row?.entradas) || num(row?.entrada);
  if (entrada > 0) {
    if (/\bmentorias?\b/.test(txt) || txt.includes('mentor')) return 'Mentorias (Receita)';
    if (txt.includes('lancamento') || txt.includes('lancamentos')) return 'Lançamentos (Receita)';
  }

  return current;
}

export function isInvestmentRow(row: RawRow): boolean {
  const hay = normKey([String(row?.[C.cat] || ''), String(row?.[C.desc] || ''), String(row?.[C.conta] || '')].join(' '));
  if (!hay.trim()) return false;

  // Regra rígida: evita falsos positivos como "Criativos", que contém "ativo" no meio da palavra.
  const patterns = [
    /\binvest(?:imento|imentos|ir|ido|ida)?\b/,
    /\baporte(?:s)?\b/,
    /\bcapex\b/,
    /\bequip(?:amento|amentos)?\b/,
    /\binfra(?:estrutura)?\b/,
    /\bativo(?:s)?\b/,
    /\bimobiliz(?:ado|ados|acao|acoes)?\b/,
    /\bferramenta(?:s)?\b/,
    /\blicenca(?:s)?\b/,
    /\bsoftware(?:s)?\b/,
    /\basset(?:s)?\b/,
  ];

  return patterns.some((rx) => rx.test(hay));
}

export function annualRowHasRealFinancialData(row: RawRow): boolean {
  return (
    ANUAL_VALUE_KEYS.some((k) => Math.abs(num(firstExistingValue(row, [k]))) > 0) || Math.abs(annualRoiRaw(row)) > 0
  );
}

export function annualMonthHasRealData(monthData: AnualMonthBucket | null | undefined, hasMonthlyRows: boolean): boolean {
  return hasMonthlyRows || Boolean(monthData && monthData._hasValue);
}
