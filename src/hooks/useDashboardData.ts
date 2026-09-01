import { useCallback, useEffect, useRef } from 'react';
import { ACTIVE_MONTHS, MONTHS, TABLES } from '../lib/constants';
import { fetchTable } from '../lib/supabase';
import { validMensalRows } from '../lib/rows';
import { buildMockAnualRows, buildMockDreRows, buildMockMensalRows } from '../lib/mockData';
import type { DashboardAction } from '../state/dashboardReducer';
import type { RawRow } from '../types';

// Porta de loadAll(): busca em paralelo as tabelas Caixa <Mês> (só meses ativos),
// Financeiro 2026 e dre, e despacha o resultado no reducer.
//
// Se o Supabase não devolver NENHUMA linha em nenhuma tabela (ex.: o erro 401
// "permission denied" que o projeto está tomando agora, por falta de GRANT no
// banco), cai automaticamente pra dados fictícios com a mesma estrutura, só
// pra visualização — `usingMockData` fica true e a UI mostra um aviso.
export function useDashboardData(dispatch: (action: DashboardAction) => void) {
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    dispatch({ type: 'SET_STATUS', status: 'connecting' });
    try {
      const [mensalResults, anualRows, dreRows] = await Promise.all([
        Promise.all(ACTIVE_MONTHS.map((m) => fetchTable(TABLES[m.key] || m.table))),
        fetchTable(TABLES.anual),
        fetchTable(TABLES.dre),
      ]);

      let mensalRows: Record<string, RawRow[]> = Object.fromEntries(MONTHS.map((m) => [m.key, [] as RawRow[]]));
      ACTIVE_MONTHS.forEach((m, i) => {
        mensalRows[m.key] = mensalResults[i] || [];
      });

      let finalAnualRows = anualRows;
      let finalDreRows = dreRows;

      const totalFetched = ACTIVE_MONTHS.reduce((acc, m) => acc + (mensalRows[m.key]?.length || 0), 0) + anualRows.length + dreRows.length;
      const usingMockData = totalFetched === 0;

      if (usingMockData) {
        console.warn('[demo] Supabase não retornou nenhuma linha (provável falta de GRANT/RLS) — usando dados fictícios para visualização.');
        mensalRows = buildMockMensalRows();
        finalAnualRows = buildMockAnualRows();
        finalDreRows = buildMockDreRows();
      }

      dispatch({ type: 'DATA_LOADED', mensalRows, anualRows: finalAnualRows, dreRows: finalDreRows, usingMockData });

      const totalMensal = ACTIVE_MONTHS.reduce((acc, m) => acc + validMensalRows(mensalRows[m.key]).length, 0);
      dispatch({ type: 'SET_STATUS', status: 'connected', count: totalMensal + finalAnualRows.length + finalDreRows.length });
    } catch (e) {
      console.error(e);
      dispatch({ type: 'SET_STATUS', status: 'error' });
    } finally {
      loadingRef.current = false;
    }
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  return { reload: load };
}
