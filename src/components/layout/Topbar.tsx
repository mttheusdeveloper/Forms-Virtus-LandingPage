import { useDashboard } from '../../state/DashboardContext';
import { OriginButton } from '../ui/origin-button';

const TITLES: Record<string, string> = {
  mensal: 'Comparativo Mensal',
  anual: 'Visão Anual 2026',
  contratos: 'Contratos',
  drive: 'Google Drive',
  sheets: 'Planilhas',
};

// Abas que não usam o "Atualizar" (recarrega Supabase) — têm o próprio botão
// de conectar/recarregar do Google.
const GOOGLE_TABS = new Set(['contratos', 'drive', 'sheets']);

export function Topbar() {
  const { state, reload } = useDashboard();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <div className="section-eyebrow mb-1">Painel ativo</div>
        <h1 className="text-2xl font-semibold tracking-[-0.04em]">{TITLES[state.tab]}</h1>
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {!GOOGLE_TABS.has(state.tab) && (
          <>
            <button className="chip-btn" onClick={() => reload()}>
              ↻ Atualizar
            </button>
            <OriginButton className="h-8.5 px-4 text-[.8125rem]" onClick={() => reload()}>
              ↻ Atualizar
            </OriginButton>
          </>
        )}
      </div>
    </div>
  );
}
