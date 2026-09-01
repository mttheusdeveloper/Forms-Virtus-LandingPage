import { Check, X } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { useModals } from '../../state/ModalsContext';
import { OriginButton } from '../ui/origin-button';
import { monthsLabel, type EbookClientStatus } from '../../lib/googleSheets';

const CLOSE_BTN_CLASS = 'h-auto py-1.5 px-3 rounded-md text-[.74rem] font-semibold gap-1';

const STATUS_TEXT: Record<EbookClientStatus, string> = {
  never: 'Nunca enviado',
  overdue: 'Atrasado',
  soon: 'Vencendo em breve',
  ok: 'Em dia',
};

// Detalhe de um cliente ao clicar no card em ContratosTab: nome completo (o
// card corta com ellipsis), data de cada envio de ebook, e quanto falta pro
// próximo — sem precisar abrir a planilha original.
export function ContractDetailModal() {
  const { contractDetail, closeContractDetail } = useModals();

  if (!contractDetail) return null;
  const c = contractDetail;

  return (
    <ModalShell onBackdropClick={closeContractDetail}>
      <div className="card w-full max-w-[480px] max-h-[88vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="section-eyebrow mb-1">Contrato</div>
            <h2 className="font-semibold tracking-[-0.03em] text-lg break-words">{c.client}</h2>
          </div>
          <OriginButton className={CLOSE_BTN_CLASS} onClick={closeContractDetail}>
            ✕ Fechar
          </OriginButton>
        </div>

        <div className="px-6 py-4 space-y-5 overflow-y-auto">
          <span className={`contract-status-badge status-${c.status}`}>{STATUS_TEXT[c.status]}</span>

          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3">
              <div className="kpi-label mb-1">Último ebook enviado</div>
              <div className="text-sm font-semibold">{c.lastSentLabel || 'Nenhum ainda'}</div>
            </div>
            <div className="card p-3">
              <div className="kpi-label mb-1">Data do último envio</div>
              <div className="text-sm font-semibold">{c.lastSentDate ? c.lastSentDate.toLocaleDateString('pt-BR') : '—'}</div>
            </div>
            <div className="card p-3">
              <div className="kpi-label mb-1">Próximo vencimento</div>
              <div className="text-sm font-semibold">{c.nextDueDate ? c.nextDueDate.toLocaleDateString('pt-BR') : '—'}</div>
            </div>
            <div className="card p-3">
              <div className="kpi-label mb-1">Situação</div>
              <div className="text-sm font-semibold">{monthsLabel(c)}</div>
            </div>
          </div>

          <div>
            <div className="kpi-label mb-2">Histórico de envios</div>
            <div className="space-y-1.5">
              {c.rounds.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)]">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {r.sent ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <X className="w-3.5 h-3.5 text-[var(--muted)]" />}
                    {r.label}
                  </span>
                  <span className="text-xs text-[var(--muted-2)]">{r.dateLabel || 'Não enviado'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
