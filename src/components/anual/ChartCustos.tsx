import { useMemo } from 'react';
import { buildBarOptions } from '../../lib/chartBuilders';
import { CHART_THEME } from '../../lib/constants';
import { ApexChartBox } from '../charts/ApexChartBox';
import { useTxModalActions } from '../../hooks/useTxModalActions';
import type { AnualChartsData } from '../../hooks/useAnualChartsData';

export function ChartCustos({ data }: { data: AnualChartsData }) {
  const { openMonthlyChartModal } = useTxModalActions();

  const options = useMemo(
    () =>
      buildBarOptions([{ name: 'Custo Operacional', data: data.custosData }], data.custosLabels, [CHART_THEME.primary], false, {
        yaxis: { min: 0 },
        chart: {
          events: {
            dataPointSelection: (_e, _ctx, config) => {
              const key = data.custosKeys[config?.dataPointIndex ?? -1];
              if (key) openMonthlyChartModal('custo', key);
            },
          },
        },
      }),
    [data, openMonthlyChartModal],
  );

  return (
    <div className="card p-6">
      <div className="section-eyebrow mb-1">Costs</div>
      <h2 className="font-semibold tracking-[-0.03em] mb-4">Custo Operacional</h2>
      <ApexChartBox id="chart-custos" options={options} />
    </div>
  );
}
