import type { RawRow } from '../types';

export function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  let s = String(v).trim();
  if (!s || s === '-') return 0;
  s = s.replace(/[R$\s]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export function numPct(v: unknown): number {
  if (v == null) return 0;
  let s = String(v).trim();
  if (!s || s === '-' || s === '#ERROR!') return 0;

  s = s.replace('%', '').replace(/\s/g, '');

  // trata formato BR: 0,00 / 12,34
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');

  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export function parseDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const s = String(v).trim();
  if (!s) return null;
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let y = +m[3];
    if (y < 100) y += 2000;
    return new Date(y, +m[2] - 1, +m[1]);
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (m) {
    let y = +m[3];
    if (y < 100) y += 2000;
    return new Date(y, +m[2] - 1, +m[1]);
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// Faixa Unicode dos diacríticos combinantes (U+0300-U+036F), construída via
// charCode para evitar depender de caracteres combinantes literais no código-fonte.
const DIACRITICS_RE = new RegExp(`[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`, 'g');

export function normKey(v: unknown): string {
  return String(v || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_RE, '');
}

// Normaliza nomes de coluna vindos do Supabase.
// Assim o ROI é localizado mesmo como roi, ROI, Roi, ROI %, R.O.I etc.
export function normFieldName(v: unknown): string {
  return normKey(v).replace(/[^a-z0-9]/g, '');
}

export function filledValue(v: unknown): boolean {
  return v !== null && v !== undefined && String(v).trim() !== '';
}

export function firstExistingValue(row: RawRow | null | undefined, keys: string[]): unknown {
  // `null` sinaliza "não encontrado". Importante NÃO usar 0 aqui: filledValue(0)
  // é true (String(0) não é vazio), então firstExistingText() acabava lendo o
  // sentinela como um valor de verdade (texto "0"), zerando itens da DRE cujas
  // colunas de % simplesmente não existem na linha. num()/parseDate() já tratam
  // null como "sem valor" normalmente, então essa troca não muda nenhum outro caller.
  if (!row) return null;

  // 1) tenta exatamente como está escrito.
  for (const k of keys || []) {
    if (Object.prototype.hasOwnProperty.call(row, k) && filledValue(row[k])) return row[k];
  }

  // 2) fallback multifator: compara sem maiúsculas, acentos, espaços, pontos e símbolos.
  // Ex.: ROI, roi, Roi, R.O.I, ROI %, "Retorno sobre Investimento".
  const normalizedRowKeys: Record<string, string> = Object.keys(row).reduce((acc: Record<string, string>, key) => {
    const nk = normFieldName(key);
    if (nk && !(nk in acc)) acc[nk] = key;
    return acc;
  }, {});

  for (const k of keys || []) {
    const realKey = normalizedRowKeys[normFieldName(k)];
    if (realKey && filledValue(row[realKey])) return row[realKey];
  }

  return null;
}

export function firstExistingText(row: RawRow | null | undefined, keys: string[]): string {
  const v = firstExistingValue(row, keys);
  return filledValue(v) ? String(v).trim() : '';
}
