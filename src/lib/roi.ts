import { ROI_FIELD_KEYS } from './constants';
import { num, normFieldName, filledValue } from './parse';
import { fmtBRL2 } from './format';
import { currentDashboardMonthIndex } from './months';
import type { AnualMonthBucket, RawRow } from '../types';

export function detectRoiColumn(row: RawRow | null | undefined, requireFilled = true): string {
  if (!row) return '';
  const keys = Object.keys(row);
  const hasValue = (key: string) => !requireFilled || filledValue(row[key]);

  // 1) prioridade total para coluna exatamente "roi" minúscula, como está no Supabase.
  const lowerExact = keys.find((key) => key === 'roi' && hasValue(key));
  if (lowerExact) return lowerExact;

  // 2) compatibilidade por nome normalizado: ROI, Roi, R.O.I, ROI %, etc.
  const normalizedCandidates = new Set((ROI_FIELD_KEYS || []).map(normFieldName).filter(Boolean));
  for (const key of keys) {
    const nk = normFieldName(key);
    if (normalizedCandidates.has(nk) && hasValue(key)) return key;
  }

  // 3) fallback mais aberto: qualquer coluna contendo "roi", mesmo com espaço/sufixo.
  for (const key of keys) {
    const nk = normFieldName(key);
    if (nk.includes('roi') && hasValue(key)) return key;
  }

  // 4) fallback semântico caso a coluna tenha vindo como retorno/retorno investimento.
  for (const key of keys) {
    const nk = normFieldName(key);
    if (nk.includes('retorno') && nk.includes('invest') && hasValue(key)) return key;
  }

  return '';
}

export function roiColumnLabel(row: RawRow): string {
  return detectRoiColumn(row, false) || 'roi';
}

export function annualRoiRaw(row: RawRow): number {
  // Base oficial do dashboard: tabela Financeiro 2026, coluna roi.
  const roiKey = detectRoiColumn(row, true);
  return roiKey ? num(row[roiKey]) : 0;
}

export function visibleRoiDelta(currentRaw: number, previousRaw: number, idx: number): number | null {
  const cur = num(currentRaw);
  const prev = num(previousRaw);
  if (idx <= 0) return null;
  if (idx > currentDashboardMonthIndex()) return null;

  // Regra especial: Maio sempre pode aparecer mesmo se Abril estiver zerado/vazio.
  const isMay = idx === 4;

  if (Math.abs(cur) < 0.005) return null;
  if (!isMay && Math.abs(prev) < 0.005) return null;

  const diff = cur - (isMay && Math.abs(prev) < 0.005 ? 0 : prev);
  return Math.abs(diff) < 0.005 ? null : diff;
}

export function roiMonthValue(byMonth: AnualMonthBucket[], idx: number): number {
  const b = byMonth?.[idx];
  return b && b.roiDelta != null ? num(b.roiDelta) : 0;
}

export function roiMonthDisplay(byMonth: AnualMonthBucket[], idx: number): string {
  const b = byMonth?.[idx];
  return b && b.roiDelta != null ? fmtBRL2(b.roiDelta) : '—';
}
