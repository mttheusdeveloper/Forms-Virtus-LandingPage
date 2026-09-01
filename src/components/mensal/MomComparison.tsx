import { A } from '../../lib/constants';
import { num } from '../../lib/parse';
import { fmtBRL2, fmtPct } from '../../lib/format';
import { moneyClass, lucratividadeClass } from '../../lib/money';
import type { MonthComparisonData } from '../../hooks/useMonthComparison';

// Porta de renderMonthComparison() (script.js:2669-2708).
export function MomComparison({ data }: { data: MonthComparisonData }) {
  const { cur, prev } = data;
  if (!cur || !prev) {
    return <div className="text-sm text-[var(--muted)]">Sem mês anterior suficiente para comparar.</div>;
  }

  const metrics = [
    { label: 'Faturamento', key: A.fb, money: true },
    { label: 'EBITDA', key: A.eb, money: true },
    { label: 'Caixa', key: A.caixa, money: true },
    { label: 'Lucratividade', key: A.lucro, money: false },
  ];

  return (
    <>
      <div className="text-[.7rem] text-[var(--muted)] mb-3">
        {String(cur[A.mes])} vs {String(prev[A.mes])}
      </div>
      <table className="w-full dre-mini-table">
        <tbody>
          {metrics.map((m) => {
            const atual = num(cur[m.key]);
            const anterior = num(prev[m.key]);
            const delta = atual - anterior;
            const pct = anterior ? (delta / Math.abs(anterior)) * 100 : 0;
            const cls = delta < 0 ? 'money-neg' : 'money-pos';
            const atualFmt = m.money ? fmtBRL2(atual) : fmtPct(atual);
            return (
              <tr key={m.label}>
                <td className="text-[var(--muted-2)]">{m.label}</td>
                <td className={`text-right mono ${m.money ? moneyClass(atual) : lucratividadeClass(atual)}`}>{atualFmt}</td>
                <td className={`text-right mono ${cls}`}>
                  {delta >= 0 ? '+' : ''}
                  {pct.toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
