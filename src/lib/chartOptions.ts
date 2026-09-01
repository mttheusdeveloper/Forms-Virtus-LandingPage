import { mergeOptions, chartMotionOptions } from './chartTheme';
import { lucratividadeColor } from './money';
import type { KpiModalItem } from '../types';

export function splitLucratividadeSeries(data: Array<number | null>): { good: Array<number | null>; bad: Array<number | null> } {
  const good = data.map((v) => {
    const n = Number(v);
    return v !== null && v !== undefined && Number.isFinite(n) && n >= 27.5 ? n : null;
  });
  const bad = data.map((v) => {
    const n = Number(v);
    return v !== null && v !== undefined && Number.isFinite(n) && n < 27.5 ? n : null;
  });
  return { good, bad };
}

export function lucroPointAnnotations(items: Array<{ label: string; value: number | null }>) {
  return (items || [])
    .map((item) => {
      const v = item && item.value;
      const n = Number(v);
      if (v === null || v === undefined || !Number.isFinite(n)) return null;
      return {
        x: item.label,
        y: n,
        marker: {
          size: 6,
          fillColor: lucratividadeColor(n),
          strokeColor: '#0E0E0E',
          strokeWidth: 2,
          radius: 99,
        },
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeChartOptions(opt: Record<string, any>): Record<string, any> {
  opt = opt || {};
  opt.chart = mergeOptions(opt.chart || {}, {
    animations: chartMotionOptions(),
    toolbar: { show: false },
    redrawOnParentResize: false,
    redrawOnWindowResize: false,
  });
  opt.states = mergeOptions(
    {
      normal: { filter: { type: 'none' } },
      hover: { filter: { type: 'lighten', value: 0.035 } },
      active: { allowMultipleDataPointsSelection: false, filter: { type: 'none' } },
    },
    opt.states || {},
  );
  return opt;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function chartOptionSignature(opt: Record<string, any>): string {
  try {
    return JSON.stringify(opt, (_key, value) => (typeof value === 'function' ? '__fn__' : value));
  } catch {
    return String(Date.now());
  }
}

export function buildKpiModalItemsFromByMonth(
  byMonth: Array<Record<string, unknown>>,
  activeMonths: Array<{ short: string; label: string }>,
  key: string,
  hasDataFor: (index: number) => boolean,
): KpiModalItem[] {
  return activeMonths.map((m, i) => {
    const hasData = hasDataFor(i);
    const raw = Number(byMonth[i]?.[key]) || 0;
    return {
      label: m.short,
      fullLabel: m.label,
      value: hasData ? raw : null,
      rawValue: raw,
      hasData,
    };
  });
}
