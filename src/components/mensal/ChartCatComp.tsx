import { useMemo } from 'react';
import { buildBarHOptions } from '../../lib/chartBuilders';
import { ApexChartBox } from '../charts/ApexChartBox';
import { useTxModalActions } from '../../hooks/useTxModalActions';
import type { CategoryComparisonData } from '../../hooks/useCategoryComparison';

export function ChartCatComp({ data }: { data: CategoryComparisonData }) {
  const { catList, series, colors } = data;
  const { openCategoryChartModal } = useTxModalActions();

  const options = useMemo(
    () =>
      buildBarHOptions(
        series.map((s) => ({ name: s.name, data: s.data })),
        catList,
        colors,
        {
          height: Math.max(460, catList.length * Math.max(36, series.length * 6 + 28)),
          barHeight: catList.length >= 8 ? '58%' : '62%',
          chart: {
            events: {
              dataPointSelection: (_e, _ctx, config) => {
                const serie = series[config?.seriesIndex ?? -1];
                const categoria = catList[config?.dataPointIndex ?? -1];
                if (serie && serie.key) openCategoryChartModal(categoria, serie.key);
              },
            },
          },
        },
      ),
    [catList, series, colors, openCategoryChartModal],
  );

  return (
    <div className="card p-6">
      <div className="section-eyebrow mb-1">Meses</div>
      <h2 className="font-semibold tracking-[-0.03em] mb-4">Categorias</h2>
      <ApexChartBox id="chart-cat-comp" options={options} revealDirection="horizontal" />
    </div>
  );
}
