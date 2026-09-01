import { A } from '../../lib/constants';
import { num } from '../../lib/parse';
import { fmtBRL2 } from '../../lib/format';
import { monthIdx } from '../../lib/months';
import { moneyClass } from '../../lib/money';
import type { MonthComparisonData } from '../../hooks/useMonthComparison';

// Porta de renderFinancialTraffic() (script.js:2710-2767).
export function FinanceTraffic({ data }: { data: MonthComparisonData }) {
  const { consolAll, cur, prev } = data;

  if (!cur) {
    return <div className="text-sm text-[var(--muted)]">Sem dados para status.</div>;
  }

  const valid = consolAll.filter((r) => monthIdx(r[A.mes]) >= 0 && num(r[A.fb]) !== 0);

  const receitaCrescendo = prev ? num(cur[A.fb]) > num(prev[A.fb]) : false;
  const custoPerc = num(cur[A.fb]) ? (Math.abs(num(cur[A.custos])) / Math.abs(num(cur[A.fb]))) * 100 : 0;
  const ebitdaOk = num(cur[A.eb]) > 0;
  const caixaMedia = valid.length ? valid.reduce((a, r) => a + num(r[A.caixa]), 0) / valid.length : 0;
  const caixaBaixo = caixaMedia ? num(cur[A.caixa]) < caixaMedia : false;

  const items: { label: string; value: string; status: 'good' | 'bad' | 'warn'; money?: number }[] = [
    {
      label: 'Receita crescendo',
      value: prev ? `${String(cur[A.mes])} ${receitaCrescendo ? 'acima' : 'abaixo'} de ${String(prev[A.mes])}` : 'Sem mês anterior',
      status: receitaCrescendo ? 'good' : 'bad',
    },
    {
      label: 'Custo sobre receita',
      value: `${custoPerc.toFixed(1)}% da receita`,
      status: custoPerc > 70 ? 'bad' : custoPerc > 55 ? 'warn' : 'good',
    },
    { label: 'EBITDA saudável', value: fmtBRL2(num(cur[A.eb])), status: ebitdaOk ? 'good' : 'bad', money: num(cur[A.eb]) },
    { label: 'Caixa vs média', value: `${fmtBRL2(num(cur[A.caixa]))} / média ${fmtBRL2(caixaMedia)}`, status: caixaBaixo ? 'warn' : 'good', money: num(cur[A.caixa]) },
  ];

  return (
    <>
      <div className="text-[.7rem] text-[var(--muted)] mb-3">Base: {String(cur[A.mes])}</div>
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.label} className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-2 last:border-b-0 last:pb-0">
            <div className="flex items-center gap-2">
              <span className={`status-dot-mini ${it.status}`} />
              <span className="text-xs text-[var(--muted-2)]">{it.label}</span>
            </div>
            <div className={`text-right text-xs mono ${typeof it.money === 'number' ? moneyClass(it.money) : ''}`}>{it.value}</div>
          </div>
        ))}
      </div>
    </>
  );
}
