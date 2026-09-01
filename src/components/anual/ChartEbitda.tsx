import { useMemo } from 'react';
import { buildAreaOptions } from '../../lib/chartBuilders';
import { CHART_THEME } from '../../lib/constants';
import { ApexChartBox } from '../charts/ApexChartBox';
import type { AnualChartsData } from '../../hooks/useAnualChartsData';

export function ChartEbitda({ data }: { data: AnualChartsData }) {
  const options = useMemo(() => buildAreaOptions([{ name: 'EBITDA', data: data.eb }], [CHART_THEME.positive], 260, data.labels), [data]);

  return (
    <div className="card p-6">
      <div className="section-eyebrow mb-1">Operacional</div>
      <h2 className="font-semibold tracking-[-0.03em] mb-4">EBITDA</h2>
      <ApexChartBox id="chart-ebitda" options={options} revealDirection="horizontal" />
    </div>
  );
}
