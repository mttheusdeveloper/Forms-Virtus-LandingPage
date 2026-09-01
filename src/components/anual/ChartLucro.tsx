import { useMemo } from 'react';
import { buildLineOptions } from '../../lib/chartBuilders';
import { CHART_THEME } from '../../lib/constants';
import { ApexChartBox } from '../charts/ApexChartBox';
import type { AnualChartsData } from '../../hooks/useAnualChartsData';

export function ChartLucro({ data }: { data: AnualChartsData }) {
  const options = useMemo(
    () => buildLineOptions('chart-lucro', [{ name: 'Lucro %', data: data.lucro }], data.labels, [CHART_THEME.positive]),
    [data],
  );

  return (
    <div className="card p-6">
      <div className="section-eyebrow mb-1">Margin</div>
      <h2 className="font-semibold tracking-[-0.03em] mb-4">Lucratividade %</h2>
      <ApexChartBox id="chart-lucro" options={options} revealDirection="horizontal" />
    </div>
  );
}
