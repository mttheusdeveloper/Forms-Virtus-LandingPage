import { useMemo } from 'react';
import { buildLineOptions } from '../../lib/chartBuilders';
import { CHART_THEME } from '../../lib/constants';
import { ApexChartBox } from '../charts/ApexChartBox';
import type { AnualChartsData } from '../../hooks/useAnualChartsData';

export function ChartCresc({ data }: { data: AnualChartsData }) {
  const options = useMemo(
    () => buildLineOptions('chart-cresc', [{ name: 'Crescimento %', data: data.cresc }], data.labels, [CHART_THEME.accent]),
    [data],
  );

  return (
    <div className="card p-6">
      <div className="section-eyebrow mb-1">Growth</div>
      <h2 className="font-semibold tracking-[-0.03em] mb-4">Crescimento %</h2>
      <ApexChartBox id="chart-cresc" options={options} revealDirection="horizontal" />
    </div>
  );
}
