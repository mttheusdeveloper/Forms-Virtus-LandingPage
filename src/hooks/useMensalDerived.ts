import { useMemo } from 'react';
import { ACTIVE_MONTHS } from '../lib/constants';
import { validMensalRows, monthlyRowInfo } from '../lib/rows';
import type { MensalMonthTotals, RawRow } from '../types';

export interface MensalDerived {
  valid: Record<string, RawRow[]>;
  totals: Record<string, MensalMonthTotals>;
  all: RawRow[];
}

// Porta de rebuildMensalCache(): filtra linhas válidas (data+categoria) por mês
// e soma entradas/saídas — substitui o cache manual por useMemo.
export function useMensalDerived(mensalRows: Record<string, RawRow[]>): MensalDerived {
  return useMemo(() => {
    const valid: Record<string, RawRow[]> = {};
    const totals: Record<string, MensalMonthTotals> = {};
    const all: RawRow[] = [];

    ACTIVE_MONTHS.forEach((m) => {
      const rows = validMensalRows(mensalRows[m.key] || []);
      valid[m.key] = rows;
      all.push(...rows);

      totals[m.key] = rows.reduce(
        (acc, r) => {
          const info = monthlyRowInfo(r);
          acc.entradas += info.ent;
          acc.saidas += info.sai;
          acc.faturamentoBruto += info.ent;
          acc.custoOperacional += info.sai;
          return acc;
        },
        { entradas: 0, saidas: 0, faturamentoBruto: 0, custoOperacional: 0 } as MensalMonthTotals,
      );
    });

    return { valid, totals, all };
  }, [mensalRows]);
}
