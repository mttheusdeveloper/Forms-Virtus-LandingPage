import { useModals } from '../../state/ModalsContext';

export function AnnualSummaryCard() {
  const { openAnnualSummary } = useModals();

  return (
    <div className="card p-6 cursor-pointer hover:border-white transition" onClick={openAnnualSummary}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-eyebrow mb-1">Annual ledger</div>
          <h2 className="font-semibold tracking-[-0.03em] text-lg">Resumo Financeiro 2026</h2>
          <p className="text-sm text-[var(--muted)] mt-1">Clique para abrir a tabela completa em pop-up.</p>
        </div>
        <button type="button" className="chip-btn pointer-events-none">
          Abrir resumo
        </button>
      </div>
    </div>
  );
}
