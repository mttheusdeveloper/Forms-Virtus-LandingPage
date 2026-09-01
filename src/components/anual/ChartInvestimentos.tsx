import { useMemo } from 'react';
import { buildBarOptions } from '../../lib/chartBuilders';
import { CHART_THEME } from '../../lib/constants';
import { fmtBRL2 } from '../../lib/format';
import { ApexChartBox } from '../charts/ApexChartBox';
import { useTxModalActions } from '../../hooks/useTxModalActions';
import type { AnualChartsData } from '../../hooks/useAnualChartsData';

function escapeHtml(v: unknown): string {
  return String(v ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m] as string);
}

// Porta do gráfico Investimentos x ROI (script.js:1965-2007) — barras
// agrupadas com tooltip.custom nativo do ApexCharts (retorna HTML) e dois
// tipos de clique diferentes dependendo da série (Investimentos vs ROI).
export function ChartInvestimentos({ data }: { data: AnualChartsData }) {
  const { openInvestmentMonthModal, openRoiMonthModal } = useTxModalActions();

  const options = useMemo(
    () =>
      buildBarOptions(
        [
          { name: 'Investimentos', data: data.investSeries },
          { name: 'ROI', data: data.roiSeries },
        ],
        data.labels,
        [CHART_THEME.accent, CHART_THEME.positive],
        true,
        {
          chart: {
            events: {
              dataPointSelection: (_e, _ctx, config) => {
                const idx = config?.dataPointIndex ?? -1;
                const key = data.investKeys[idx];
                if (!key) return;
                if (config?.seriesIndex === 0) openInvestmentMonthModal(key);
                if (config?.seriesIndex === 1 && data.roiSeries[idx] != null) openRoiMonthModal(key);
              },
            },
          },
          plotOptions: { bar: { columnWidth: '70%' } },
          tooltip: {
            theme: 'dark',
            shared: false,
            intersect: true,
            fixed: { enabled: true, position: 'topLeft', offsetX: 12, offsetY: 10 },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            custom: ({ series, seriesIndex, dataPointIndex, w }: any) => {
              const nome = w?.globals?.seriesNames?.[seriesIndex] || '';
              const mes = w?.globals?.categoryLabels?.[dataPointIndex] || data.labels[dataPointIndex] || '';
              const valor = series?.[seriesIndex]?.[dataPointIndex];
              if (valor == null) return '';
              const isRoi = nome === 'ROI';
              return `
                <div class="safe-chart-tooltip">
                  <div class="safe-chart-tooltip-month">${escapeHtml(mes)}</div>
                  <div class="safe-chart-tooltip-row">
                    <span class="safe-chart-tooltip-dot" style="background:${isRoi ? CHART_THEME.positive : CHART_THEME.accent}"></span>
                    <span>${escapeHtml(nome)}</span>
                    <strong>${fmtBRL2(valor)}</strong>
                  </div>
                  <div class="safe-chart-tooltip-source">${isRoi ? 'Financeiro 2026 • coluna roi • mês atual - mês anterior' : 'Financeiro 2026 • coluna Investimentos'}</div>
                </div>
              `;
            },
          },
        },
      ),
    [data, openInvestmentMonthModal, openRoiMonthModal],
  );

  return (
    <div className="card p-6">
      <div className="section-eyebrow mb-1">Investimento</div>
      <h2 className="font-semibold tracking-[-0.03em] mb-4">Investimentos x Rendimento</h2>
      <ApexChartBox id="chart-investimentos" options={options} />
    </div>
  );
}
