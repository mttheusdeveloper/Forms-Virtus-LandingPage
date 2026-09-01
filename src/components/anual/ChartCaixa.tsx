import { useMemo } from 'react';
import { buildBarOptions } from '../../lib/chartBuilders';
import { CHART_THEME } from '../../lib/constants';
import { ApexChartBox } from '../charts/ApexChartBox';
import type { AnualChartsData } from '../../hooks/useAnualChartsData';

export function ChartCaixa({ data }: { data: AnualChartsData }) {
  const options = useMemo(() => buildBarOptions([{ name: 'Caixa', data: data.caixa }], data.labels, [CHART_THEME.accent2]), [data]);

  return (
    <div className="card p-6">
      <div className="section-eyebrow mb-1">Liquidity</div>
      <h2 className="font-semibold tracking-[-0.03em] mb-4">Caixa por Mês</h2>
      <ApexChartBox id="chart-caixa" options={options} />
    </div>
  );
}
