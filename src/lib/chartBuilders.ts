import type { ApexOptions } from 'apexcharts';
import { baseAxis, baseGrid, legendOptions, mergeOptions } from './chartTheme';
import { fmtBRL, fmtBRL2, fmtK } from './format';
import { LUCRO_META } from './constants';
import { lucroMetaLabel } from './money';
import { splitLucratividadeSeries, lucroPointAnnotations } from './chartOptions';

// Porta de renderArea(): área com gradiente, usada em chart-faturamento/chart-ebitda.
export function buildAreaOptions(series: ApexOptions['series'], colors: string[], height = 300, categories?: string[]): ApexOptions {
  const firstColor = colors[0];
  return {
    chart: { type: 'area', height, background: 'transparent', toolbar: { show: false }, foreColor: '#9A9A9A', fontFamily: 'Inter' },
    series,
    colors,
    stroke: { curve: 'smooth', width: 3, lineCap: 'round' },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.55, opacityTo: 0.02, stops: [0, 95], colorStops: [[{ offset: 0, color: firstColor, opacity: 0.55 }, { offset: 100, color: firstColor, opacity: 0 }]] },
    },
    dataLabels: { enabled: false },
    grid: baseGrid,
    markers: { size: 0, hover: { size: 6 } },
    xaxis: { ...baseAxis, categories: categories || [] },
    yaxis: { labels: { style: { colors: '#9A9A9A', fontFamily: 'Inter', fontSize: '11px' }, formatter: (v: number) => 'R$ ' + fmtK(v) } },
    tooltip: { theme: 'dark', y: { formatter: (v: number) => fmtBRL2(v) } },
    legend: legendOptions({ markers: { width: 10, height: 10, radius: 99 } }),
  };
}

// Porta de renderBar(): coluna vertical, base para chart-comparativo/chart-fluxo/chart-caixa/chart-custos/etc.
export function buildBarOptions(
  series: ApexOptions['series'],
  categories: string[],
  colors: string[],
  grouped = false,
  extra: Partial<ApexOptions> = {},
): ApexOptions {
  const base: ApexOptions = {
    chart: { type: 'bar', height: 260, background: 'transparent', toolbar: { show: false }, foreColor: '#9A9A9A', fontFamily: 'Inter' },
    series,
    colors,
    plotOptions: { bar: { borderRadius: 6, borderRadiusApplication: 'end', columnWidth: grouped ? '70%' : '55%' } },
    fill: { type: 'gradient', gradient: { shade: 'dark', type: 'vertical', shadeIntensity: 0.5, opacityFrom: 1, opacityTo: 0.65 } },
    dataLabels: { enabled: false },
    grid: baseGrid,
    xaxis: { ...baseAxis, categories },
    yaxis: { labels: { style: { colors: '#9A9A9A', fontFamily: 'Inter', fontSize: '11px' }, formatter: (v: number) => 'R$ ' + fmtK(v) } },
    tooltip: { theme: 'dark', y: { formatter: (v: number) => fmtBRL2(v) } },
    legend: legendOptions(),
  };
  return mergeOptions(base, extra as Record<string, unknown>);
}

// Porta de renderBarH(): barra horizontal, usada em chart-cat-comp.
export function buildBarHOptions(
  series: ApexOptions['series'],
  categories: string[],
  colors: string[],
  opts: { height?: number; barHeight?: string } & Partial<ApexOptions> = {},
): ApexOptions {
  const height = opts.height || Math.max(360, categories.length * 40);
  const barHeight = opts.barHeight || '68%';
  const base: ApexOptions = {
    chart: { type: 'bar', height, background: 'transparent', toolbar: { show: false }, foreColor: '#9A9A9A', fontFamily: 'Inter' },
    series,
    colors,
    stroke: { show: true, width: 1, colors: ['#0E0E0E'] },
    plotOptions: { bar: { horizontal: true, borderRadius: 6, borderRadiusApplication: 'end', barHeight } },
    fill: { type: 'gradient', gradient: { shade: 'dark', type: 'horizontal', shadeIntensity: 0.25, opacityFrom: 0.98, opacityTo: 0.78, stops: [0, 100] } },
    dataLabels: { enabled: false },
    grid: baseGrid,
    xaxis: { ...baseAxis, categories, labels: { style: { colors: '#9A9A9A', fontFamily: 'Inter', fontSize: '11px' }, formatter: (v: number) => 'R$ ' + fmtK(v) } },
    yaxis: { labels: { style: { colors: '#EDEDED', fontSize: '12px' } } },
    tooltip: { theme: 'dark', y: { formatter: (v: number) => fmtBRL2(v) } },
    legend: legendOptions({ markers: { width: 10, height: 10, radius: 99 }, itemMargin: { horizontal: 7, vertical: 6 } }),
  };
  const { height: _h, barHeight: _bh, ...rest } = opts;
  void _h;
  void _bh;
  return mergeOptions(base, rest as Record<string, unknown>);
}

// Porta de renderLine(): linha simples, com caso especial para chart-lucro (meta + acima/abaixo).
export function buildLineOptions(id: string, series: ApexOptions['series'], categories: string[], colors: string[]): ApexOptions {
  const opt: ApexOptions = {
    chart: { type: 'line', height: 240, background: 'transparent', toolbar: { show: false }, foreColor: '#9A9A9A', fontFamily: 'Inter' },
    series,
    colors,
    stroke: { curve: 'smooth', width: 3, lineCap: 'round' },
    markers: { size: 5, strokeWidth: 0, colors, hover: { size: 8 } },
    dataLabels: { enabled: false },
    grid: baseGrid,
    xaxis: { ...baseAxis, categories },
    yaxis: { labels: { style: { colors: '#9A9A9A', fontFamily: 'Inter', fontSize: '11px' }, formatter: (v: number) => v.toFixed(0) + '%' } },
    tooltip: { theme: 'dark', y: { formatter: (v: number | null) => (v == null ? 'Sem dados' : `${Number(v).toFixed(2)}%`) } },
    legend: legendOptions(),
  };

  if (id === 'chart-lucro') {
    const rawSeries = (series as { data: Array<number | null> }[])[0]?.data || [];
    const data = rawSeries.map((v) => (v === null || v === undefined ? null : Number(v)));
    const values = data.filter((v): v is number => v !== null && Number.isFinite(v));
    const minValue = values.length ? Math.min(...values, LUCRO_META) : 0;
    const maxValue = values.length ? Math.max(...values, LUCRO_META) : LUCRO_META;
    const items = categories.map((label, idx) => ({ label, value: data[idx] }));
    const split = splitLucratividadeSeries(data);

    opt.series = [
      { name: 'Lucratividade %', data },
      { name: 'Acima da meta', data: split.good },
      { name: 'Abaixo da meta', data: split.bad },
    ];
    opt.colors = ['rgba(255,255,255,.22)', '#34D399', '#F87171'];
    opt.stroke = { curve: 'smooth', width: [2, 4, 4], lineCap: 'round' };
    opt.markers = { size: [0, 5, 5], strokeWidth: 0, hover: { size: 8 } };
    opt.yaxis = { ...(opt.yaxis as object), min: Math.min(0, Math.floor(minValue / 5) * 5), max: Math.max(35, Math.ceil((maxValue + 5) / 5) * 5) };
    opt.legend = legendOptions({ customLegendItems: ['Lucratividade %', 'Acima da meta', 'Abaixo da meta'] });
    opt.annotations = {
      yaxis: [
        {
          y: LUCRO_META,
          borderColor: '#FBBF24',
          strokeDashArray: 6,
          label: { text: lucroMetaLabel(), borderColor: '#FBBF24', style: { background: '#1B1B1B', color: '#FBBF24', fontSize: '11px', fontFamily: 'Inter', fontWeight: 800 } },
        },
      ],
      points: lucroPointAnnotations(items),
    };
  }

  return opt;
}

// Porta de renderPercentModalChart(): usado no popup de KPI para métricas percentuais.
export function buildPercentModalOptions({
  seriesName,
  items,
  color,
  showMeta = false,
}: {
  seriesName: string;
  items: Array<{ label: string; value: number | null }>;
  color: string;
  showMeta?: boolean;
}): ApexOptions {
  const data = items.map((i) => i.value);
  const values = data.filter((v): v is number => v !== null && v !== undefined && Number.isFinite(Number(v)));
  const yaxis: NonNullable<ApexOptions['yaxis']> = {
    labels: { style: { colors: '#9A9A9A', fontFamily: 'Inter', fontSize: '11px' }, formatter: (v: number) => `${Number(v).toFixed(0)}%` },
  };

  if (showMeta) {
    const minValue = values.length ? Math.min(...values, LUCRO_META) : 0;
    const maxValue = values.length ? Math.max(...values, LUCRO_META) : LUCRO_META;
    (yaxis as Record<string, unknown>).min = Math.min(0, Math.floor(minValue / 5) * 5);
    (yaxis as Record<string, unknown>).max = Math.max(35, Math.ceil((maxValue + 5) / 5) * 5);
  }

  const base: ApexOptions = {
    chart: { type: 'line', height: 360, background: 'transparent', toolbar: { show: false }, foreColor: '#9A9A9A', fontFamily: 'Inter' },
    stroke: { curve: 'smooth', lineCap: 'round' },
    markers: { size: 5, strokeWidth: 0, hover: { size: 8 } },
    dataLabels: { enabled: false },
    grid: baseGrid,
    xaxis: { ...baseAxis, categories: items.map((i) => i.label) },
    yaxis,
    tooltip: { theme: 'dark', y: { formatter: (v: number | null) => (v == null ? 'Sem dados' : `${Number(v).toFixed(2)}%`) } },
    legend: legendOptions(),
    annotations: showMeta
      ? {
          yaxis: [
            {
              y: LUCRO_META,
              borderColor: '#FBBF24',
              strokeDashArray: 6,
              label: { text: lucroMetaLabel(), borderColor: '#FBBF24', style: { background: '#1B1B1B', color: '#FBBF24', fontSize: '11px', fontFamily: 'Inter', fontWeight: 800 } },
            },
          ],
          points: lucroPointAnnotations(items),
        }
      : undefined,
  };

  if (showMeta) {
    const split = splitLucratividadeSeries(data);
    return mergeOptions(base, {
      series: [
        { name: 'Lucratividade %', data },
        { name: 'Acima da meta', data: split.good },
        { name: 'Abaixo da meta', data: split.bad },
      ],
      colors: ['rgba(255,255,255,.22)', '#34D399', '#F87171'],
      stroke: { width: [2, 4, 4], curve: 'smooth', lineCap: 'round' },
      markers: { size: [0, 5, 5], strokeWidth: 0, hover: { size: 8 } },
      legend: legendOptions({ customLegendItems: ['Lucratividade %', 'Acima da meta', 'Abaixo da meta'] }),
    });
  }

  return mergeOptions(base, {
    series: [{ name: seriesName, data }],
    colors: [color],
    stroke: { width: 3, curve: 'smooth', lineCap: 'round' },
    markers: { size: 5, strokeWidth: 0, colors: [color], hover: { size: 8 } },
  });
}

// Porta da config estática de renderDonutDre() (script.js:2527-2616) — a
// lógica do tooltip custom (mousemove) e da legenda fica no componente,
// aqui só a config pura do gráfico (tooltip nativo desligado, legend:false).
export function buildDonutOptions(series: number[], labels: string[], colors: string[], totalOverride: number | null): ApexOptions {
  return {
    chart: { type: 'donut', height: 380, background: 'transparent', foreColor: '#9A9A9A', fontFamily: 'Inter' },
    series,
    labels,
    colors,
    stroke: { colors: ['#000000'], width: 3 },
    legend: { show: false },
    plotOptions: {
      pie: {
        customScale: 0.72,
        donut: {
          size: '66%',
          labels: {
            show: true,
            name: { color: '#8a8a8a', fontSize: '14px', fontFamily: 'Inter', fontWeight: 650 },
            value: { color: '#EDEDED', fontSize: '22px', fontFamily: 'Inter', fontWeight: 700, formatter: (v: string) => fmtBRL(Number(v)) },
            total: {
              show: true,
              label: 'Total Receitas',
              fontSize: '14px',
              fontFamily: 'Inter',
              fontWeight: 650,
              color: '#8a8a8a',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter: (w: any) => {
                const totalSeries = (w?.globals?.seriesTotals || []).reduce((a: number, b: number) => a + b, 0);
                return fmtBRL(totalOverride ?? totalSeries);
              },
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    tooltip: { enabled: false },
  };
}

// Porta de renderSpark(): área compacta usada nos sparklines de Entradas/Saídas.
export function buildSparkOptions(data: number[], color: string): ApexOptions {
  return {
    chart: { type: 'area', height: 50, sparkline: { enabled: true }, background: 'transparent', animations: { enabled: false } },
    series: [{ data }],
    colors: [color],
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.5, opacityTo: 0 } },
    tooltip: { enabled: false },
  };
}
