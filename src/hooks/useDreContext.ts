import { useMemo } from 'react';
import { buildDreContext } from '../lib/dre';
import { selectedMonthKeys } from '../lib/selectors';
import type { DreContext, MensalFilterState, RawRow } from '../types';

// Porta do bloco de agrupamento da DRE de dentro de renderMensal(): monta os 7
// grupos fixos (RECEITAS, CUSTO, EBITDA, ...) para os meses atualmente selecionados.
export function useDreContext(dreRows: RawRow[], mensalFilters: MensalFilterState): DreContext {
  return useMemo(() => {
    const mesesDre = selectedMonthKeys(mensalFilters);
    return buildDreContext(dreRows, mesesDre);
  }, [dreRows, mensalFilters]);
}
