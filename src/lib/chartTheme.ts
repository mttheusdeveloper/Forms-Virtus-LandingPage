import { CHART_THEME } from './constants';

export const PALETTE = [
  CHART_THEME.primary,
  CHART_THEME.secondary,
  CHART_THEME.accent,
  CHART_THEME.accent2,
  CHART_THEME.positive,
  CHART_THEME.warning,
  CHART_THEME.negative,
  CHART_THEME.cost,
  CHART_THEME.muted,
];

export const baseGrid = { borderColor: '#2A2A2A', strokeDashArray: 4, padding: { left: 8, right: 8 } };

export const baseAxis = {
  labels: { style: { colors: '#9A9A9A', fontSize: '11px', fontFamily: 'Inter' } },
  axisBorder: { show: false },
  axisTicks: { show: false },
};

// Animação de "subida" dos gráficos (barras crescendo da base, linhas/áreas
// desenhando ao entrar). Sempre ligada: não fica atrás de prefers-reduced-motion
// porque essa animação foi pedida explicitamente e o resto do dashboard
// (ChartRevealBox, AnimatedNumber) também já anima incondicionalmente.
const MOTION_EASE = 'easeinout';
const MOTION_DURATION = 550;
const CHART_MOTION = {
  enabled: true,
  easing: MOTION_EASE,
  speed: MOTION_DURATION,
  animateGradually: { enabled: true, delay: 120 },
  dynamicAnimation: { enabled: true, speed: 350 },
  // ApexCharts 7 ignora `enabled: true` e pula a animação de entrada sempre
  // que o SO/navegador reporta prefers-reduced-motion — precisa desse opt-out
  // explícito pra animação realmente acontecer nesse caso.
  respectReducedMotion: false,
};

export function chartMotionOptions() {
  return CHART_MOTION;
}

// Deep-ish merge para objetos de opções do ApexCharts (arrays são substituídos, não mesclados).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeOptions<T extends Record<string, any>>(base: T, extra: Record<string, any> = {}): T {
  const out: Record<string, any> = { ...base };
  Object.keys(extra || {}).forEach((k) => {
    const bv = out[k];
    const ev = extra[k];
    const bothObjects = bv && ev && typeof bv === 'object' && typeof ev === 'object' && !Array.isArray(bv) && !Array.isArray(ev);
    out[k] = bothObjects ? mergeOptions(bv, ev) : ev;
  });
  return out as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function legendOptions(extra: Record<string, any> = {}) {
  const base = {
    show: true,
    showForSingleSeries: true,
    position: 'bottom' as const,
    horizontalAlign: 'center' as const,
    floating: false,
    fontSize: '12px',
    fontFamily: 'Inter',
    fontWeight: 650,
    labels: { colors: '#EDEDED', useSeriesColors: false },
    markers: { width: 10, height: 10, radius: 99, offsetX: 0, offsetY: 0 },
    itemMargin: { horizontal: 6, vertical: 6 },
    onItemClick: { toggleDataSeries: true },
    onItemHover: { highlightDataSeries: true },
  };
  return mergeOptions(base, extra);
}
