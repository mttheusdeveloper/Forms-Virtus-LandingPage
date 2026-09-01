import { useMemo } from 'react';
import { buildBarOptions } from '../../lib/chartBuilders';
import { CHART_THEME } from '../../lib/constants';
import { ApexChartBox } from '../charts/ApexChartBox';
import { useTxModalActions } from '../../hooks/useTxModalActions';
import type { CaixaChartItem } from '../../hooks/useMensalKpis';

export function ChartComparativo({ items }: { items: CaixaChartItem[] }) {
  const { openMonthlyChartModal } = useTxModalActions();

  const options = useMemo(
    () =>
      buildBarOptions(
        [{ name: 'Faturamento Bruto', data: items.map((m) => m.faturamentoBruto) }],
        items.map((m) => m.short),
        [CHART_THEME.primary],
        false,
        {
          chart: {
            events: {
              dataPointSelection: (_e, _ctx, config) => {
                const item = items[config?.dataPointIndex ?? -1];
                if (item) openMonthlyChartModal('faturamento', item.key);
              },
            },
          },
          plotOptions: { bar: { columnWidth: '48%' } },
        },
      ),
    [items, openMonthlyChartModal],
  );

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="section-eyebrow mb-1">Revenue</div>
          <h2 className="text-lg font-semibold tracking-[-0.03em]">Faturamento Bruto dos Meses</h2>
        </div>
      </div>
      <ApexChartBox id="chart-comparativo" options={options} />
    </div>
  );
}
