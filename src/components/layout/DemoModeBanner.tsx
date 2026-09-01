import { useDashboard } from '../../state/DashboardContext';

// Aviso visível quando o dashboard está mostrando dados fictícios (fallback
// automático de useDashboardData quando o Supabase não devolve nenhuma linha).
export function DemoModeBanner() {
  const { state, reload } = useDashboard();

  if (!state.usingMockData) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#FBBF24]/30 bg-[#FBBF24]/10 px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-base">⚠️</span>
        <span className="text-[var(--text)]">
          <strong className="money-warn">Modo demonstração</strong> — o Supabase não devolveu nenhum dado (erro de permissão no banco). Os números abaixo são{' '}
          <strong>fictícios</strong>, só para visualização.
        </span>
      </div>
      <button className="chip-btn shrink-0" onClick={() => reload()}>
        ↻ Tentar de novo
      </button>
    </div>
  );
}
