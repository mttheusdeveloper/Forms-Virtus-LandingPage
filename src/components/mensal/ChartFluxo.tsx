import { useMemo } from 'react';
import { buildBarOptions } from '../../lib/chartBuilders';
import { CHART_THEME } from '../../lib/constants';
import { ApexChartBox } from '../charts/ApexChartBox';
import { useTxModalActions } from '../../hooks/useTxModalActions';
import type { CaixaChartItem } from '../../hooks/useMensalKpis';

export function ChartFluxo({ items }: { items: CaixaChartItem[] }) {
  const { openMonthlyChartModal } = useTxModalActions();

  const options = useMemo(
    () =>
      buildBarOptions(
        [{ name: 'Custo Operacional', data: items.map((m) => m.custoOperacional) }],
        items.map((m) => m.short),
        [CHART_THEME.primary],
        false,
        {
          yaxis: { min: 0 },
          chart: {
            height: 490,
            events: {
              dataPointSelection: (_e, _ctx, config) => {
                const item = items[config?.dataPointIndex ?? -1];
                if (item) openMonthlyChartModal('custo', item.key);
              },
            },
          },
          plotOptions: { bar: { columnWidth: '64%' } },
        },
      ),
    [items, openMonthlyChartModal],
  );

  return (
    <div className="card p-6 xl:col-span-3 min-h-[580px] flex flex-col">
      <div className="section-eyebrow mb-1">Costs</div>
      <h2 className="font-semibold tracking-[-0.03em] mb-5">Custo Operacional</h2>
      <ApexChartBox id="chart-fluxo" options={options} className="flex-1" />
    </div>
  );
}
