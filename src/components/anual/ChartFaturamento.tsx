import { useMemo } from 'react';
import { buildAreaOptions } from '../../lib/chartBuilders';
import { CHART_THEME } from '../../lib/constants';
import { ApexChartBox } from '../charts/ApexChartBox';
import type { AnualChartsData } from '../../hooks/useAnualChartsData';

export function ChartFaturamento({ data }: { data: AnualChartsData }) {
  const options = useMemo(
    () =>
      buildAreaOptions(
        [
          { name: 'Bruto', data: data.fb },
          { name: 'Líquido', data: data.fl },
        ],
        [CHART_THEME.primary, CHART_THEME.secondary],
        320,
        data.labels,
      ),
    [data],
  );

  return (
    <div className="card p-6 lg:col-span-2">
      <div className="section-eyebrow mb-1">Revenue</div>
      <h2 className="font-semibold tracking-[-0.03em] mb-4">Faturamento — Bruto vs Líquido</h2>
      <ApexChartBox id="chart-faturamento" options={options} revealDirection="horizontal" />
    </div>
  );
}
