import { A } from '../../lib/constants';
import { num } from '../../lib/parse';
import { fmtBRL2, fmtPct } from '../../lib/format';
import { moneyClass, lucratividadeClass } from '../../lib/money';
import { monthCfg, monthIdx } from '../../lib/months';
import { roiMonthDisplay, roiMonthValue } from '../../lib/roi';
import { ModalShell } from './ModalShell';
import { useDashboard } from '../../state/DashboardContext';
import { useModals } from '../../state/ModalsContext';
import { useAnualDerived } from '../../hooks/useAnualDerived';
import { useTxModalActions } from '../../hooks/useTxModalActions';
import { OriginButton } from '../ui/origin-button';

const CLOSE_BTN_CLASS = 'h-auto py-1.5 px-3 rounded-md text-[.74rem] font-semibold gap-1';

// Porta da tabela de #a-table-body dentro de #modal-anual-summary (script.js:2011-2029, 2906-2921).
export function AnnualSummaryModal() {
  const { annualSummaryOpen, closeAnnualSummary } = useModals();
  const { state } = useDashboard();
  const anualDerived = useAnualDerived(state.anualRows);
  const { openInvestmentMonthModal } = useTxModalActions();

  if (!annualSummaryOpen) return null;

  const totalRoiDelta = anualDerived.byMonth.reduce((acc, b) => acc + num(b.roiDelta), 0);

  return (
    <ModalShell onBackdropClick={closeAnnualSummary}>
      <div className="card w-full max-w-[96vw] max-h-[88vh] flex flex-col annual-summary-shell">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
          <div>
            <div className="section-eyebrow mb-1">Annual ledger</div>
            <h2 className="font-semibold tracking-[-0.03em] text-lg">Resumo Financeiro 2026</h2>
          </div>
          <OriginButton className={CLOSE_BTN_CLASS} onClick={closeAnnualSummary}>
            ✕ Fechar
          </OriginButton>
        </div>
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full">
            <thead className="bg-[var(--surface)] sticky top-0">
              <tr>
                <th>Mês</th>
                <th className="text-right">Fat. Bruto</th>
                <th className="text-right">Fat. Líquido</th>
                <th className="text-right">Caixa</th>
                <th className="text-right">EBITDA</th>
                <th className="text-right">Custos</th>
                <th className="text-right">Invest.</th>
                <th className="text-right">Rendimento</th>
                <th className="text-right">Lucro %</th>
                <th className="text-right">Cresc. %</th>
              </tr>
            </thead>
            <tbody>
              {anualDerived.rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center text-[var(--muted)] py-10">
                    Sem dados
                  </td>
                </tr>
              ) : (
                anualDerived.rows.map((r, i) => {
                  const fb = num(r[A.fb]);
                  const fl = num(r[A.fl]);
                  const caixa = num(r[A.caixa]);
                  const eb = num(r[A.eb]);
                  const custos = num(r[A.custos]);
                  const inv = num(r[A.inv]);
                  const lucro = num(r[A.lucro]);
                  const cresc = num(r[A.cresc]);
                  const mesKey = monthCfg(r[A.mes])?.key || '';
                  const roiIdx = mesKey ? monthIdx(mesKey) : -1;
                  const roiDisplay = mesKey ? roiMonthDisplay(anualDerived.byMonth, roiIdx) : fmtBRL2(totalRoiDelta);
                  const roiValue = roiIdx >= 0 ? roiMonthValue(anualDerived.byMonth, roiIdx) : totalRoiDelta;

                  return (
                    <tr key={i}>
                      <td className="font-semibold">
                        {mesKey ? (
                          <button type="button" className="annual-invest-btn" onClick={() => openInvestmentMonthModal(mesKey)}>
                            {String(r[A.mes] || '-')}
                          </button>
                        ) : (
                          String(r[A.mes] || '-')
                        )}
                      </td>
                      <td className={`text-right mono ${moneyClass(fb)}`}>{fmtBRL2(fb)}</td>
                      <td className={`text-right mono ${moneyClass(fl)}`}>{fmtBRL2(fl)}</td>
                      <td className={`text-right mono ${moneyClass(caixa)}`}>{fmtBRL2(caixa)}</td>
                      <td className={`text-right mono ${moneyClass(eb)}`}>{fmtBRL2(eb)}</td>
                      <td className={`text-right mono ${moneyClass(custos)}`}>{fmtBRL2(custos)}</td>
                      <td className={`text-right mono ${moneyClass(inv)}`}>
                        {mesKey ? (
                          <button type="button" className={`annual-invest-cell-btn ${moneyClass(inv)}`} onClick={() => openInvestmentMonthModal(mesKey)}>
                            {fmtBRL2(inv)}
                          </button>
                        ) : (
                          fmtBRL2(inv)
                        )}
                      </td>
                      <td className={`text-right mono ${moneyClass(roiValue)}`}>{roiDisplay}</td>
                      <td className={`text-right mono ${lucratividadeClass(lucro)}`}>{fmtPct(lucro)}</td>
                      <td className={`text-right mono ${cresc >= 0 ? 'money-pos' : 'money-neg'}`}>{fmtPct(cresc)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ModalShell>
  );
}
