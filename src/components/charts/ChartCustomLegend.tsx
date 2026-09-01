import { useState, type RefObject } from 'react';
import type ApexCharts from 'apexcharts';

interface ChartCustomLegendProps {
  chartRef: RefObject<ApexCharts | null>;
  labels: string[];
  colors: string[];
}

// Porta de renderCustomChartLegend() (script.js:2308-2361): legenda própria
// abaixo do donut (a nativa do ApexCharts foi desligada), com clique para
// ocultar/mostrar séries via chart.hideSeries()/showSeries().
export function ChartCustomLegend({ chartRef, labels, colors }: ChartCustomLegendProps) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  function toggle(label: string) {
    const chart = chartRef.current;
    const willHide = !hidden.has(label);
    setHidden((prev) => {
      const next = new Set(prev);
      if (willHide) next.add(label);
      else next.delete(label);
      return next;
    });
    if (chart) {
      try {
        if (willHide) chart.hideSeries(label);
        else chart.showSeries(label);
      } catch (e) {
        console.warn('Falha ao alternar legenda', label, e);
      }
    }
  }

  return (
    <div className="chart-custom-legend">
      {labels.map((label, idx) => {
        const isHidden = hidden.has(label);
        const color = colors[idx % colors.length];
        return (
          <button
            key={label}
            type="button"
            className={`chart-legend-btn ${isHidden ? 'is-hidden' : ''}`}
            title={`Clique para ${isHidden ? 'ativar' : 'ocultar'} ${label}`}
            onClick={() => toggle(label)}
          >
            <span className="legend-dot" style={{ background: color }} />
            <span className="legend-label">{label}</span>
            <span className="legend-state">{isHidden ? 'oculto' : 'ativo'}</span>
          </button>
        );
      })}
    </div>
  );
}
