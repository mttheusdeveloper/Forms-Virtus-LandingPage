import type { MonthConfig } from '../types';

export const MONTHS: MonthConfig[] = [
  { key: 'janeiro', short: 'Jan', label: 'Janeiro', table: 'Caixa Janeiro', dreCols: ['janeiro', 'jan'], drePctCols: ['j_pct', 'jan_pct', 'janeiro_pct'] },
  { key: 'fevereiro', short: 'Fev', label: 'Fevereiro', table: 'Caixa Fevereiro', dreCols: ['fevereiro', 'fev'], drePctCols: ['f_pct', 'fev_pct', 'fevereiro_pct'] },
  { key: 'marco', short: 'Mar', label: 'Março', table: 'Caixa Março', dreCols: ['marco', 'março', 'mar'], drePctCols: ['mar_pct', 'marco_pct', 'março_pct'] },
  { key: 'abril', short: 'Abr', label: 'Abril', table: 'Caixa Abril', dreCols: ['abril', 'abr'], drePctCols: ['a_pct', 'abr_pct', 'abril_pct'] },
  { key: 'maio', short: 'Mai', label: 'Maio', table: 'Caixa Maio', dreCols: ['maio', 'mai'], drePctCols: ['ma_pct', 'mai_pct', 'maio_pct'] },
  { key: 'junho', short: 'Jun', label: 'Junho', table: 'Caixa Junho', dreCols: ['junho', 'jun'], drePctCols: ['jun_pct', 'junho_pct'] },
  { key: 'julho', short: 'Jul', label: 'Julho', table: 'Caixa Julho', dreCols: ['julho', 'jul'], drePctCols: ['jul_pct', 'julho_pct'] },
  { key: 'agosto', short: 'Ago', label: 'Agosto', table: 'Caixa Agosto', dreCols: ['agosto', 'ago'], drePctCols: ['ago_pct', 'agosto_pct'] },
  { key: 'setembro', short: 'Set', label: 'Setembro', table: 'Caixa Setembro', dreCols: ['setembro', 'set'], drePctCols: ['set_pct', 'setembro_pct'] },
  { key: 'outubro', short: 'Out', label: 'Outubro', table: 'Caixa Outubro', dreCols: ['outubro', 'out'], drePctCols: ['out_pct', 'outubro_pct'] },
  { key: 'novembro', short: 'Nov', label: 'Novembro', table: 'Caixa Novembro', dreCols: ['novembro', 'nov'], drePctCols: ['nov_pct', 'novembro_pct'] },
  { key: 'dezembro', short: 'Dez', label: 'Dezembro', table: 'Caixa Dezembro', dreCols: ['dezembro', 'dez'], drePctCols: ['dez_pct', 'dezembro_pct'] },
];

// Meses disponíveis no dashboard: somente os meses já passados e o mês atual.
// Em junho, por exemplo, o sistema puxa/mostra Janeiro até Junho e ignora Julho-Dezembro.
export const CURRENT_MONTH_LIMIT_INDEX = Math.min(11, Math.max(0, new Date().getMonth()));
export const ACTIVE_MONTHS: MonthConfig[] = MONTHS.slice(0, CURRENT_MONTH_LIMIT_INDEX + 1);
export const ACTIVE_MONTH_KEYS = new Set(ACTIVE_MONTHS.map((m) => m.key));
export const MESES = ACTIVE_MONTHS.map((m) => m.short);

export const TABLES: Record<string, string> = Object.assign(
  Object.fromEntries(MONTHS.map((m) => [m.key, m.table])),
  { anual: 'Financeiro 2026', dre: 'dre' },
);

export const C = { data: 'data', conta: 'conta', desc: 'descricao', cat: 'categoria', ent: 'entradas', sai: 'saidas' } as const;

export const A = {
  mes: 'Mês',
  fb: 'faturamento_bruto',
  fl: 'faturamento_liquido',
  caixa: 'caixa',
  eb: 'ebtida',
  custos: 'custos_operacionais',
  inv: 'investimentos',
  roi: 'roi',
  endiv: 'endividamento',
  lucro: 'lucratividade',
  cresc: 'percentual_crescimento',
} as const;

// Fonte oficial do ROI: tabela Financeiro 2026, coluna roi.
// As variações abaixo servem só como compatibilidade caso o Supabase retorne capitalização diferente.
export const ROI_FIELD_KEYS = [
  'ROI', A.roi, 'roi', 'Roi', 'R.O.I', 'r.o.i',
  'Retorno sobre Investimento', 'retorno_sobre_investimento', 'retorno sobre investimento',
  'Retorno Investimento', 'retorno_investimento',
  'Retorno dos Investimentos', 'retorno_dos_investimentos',
];

// Campos financeiros que indicam que o mês realmente tem dados consolidados.
// Não usa lucratividade/crescimento aqui porque fórmulas de meses vazios podem virar 0% ou -100% e parecerem bugs no gráfico.
export const ANUAL_VALUE_KEYS = [A.fb, A.fl, A.caixa, A.eb, A.custos, A.inv, A.roi, A.endiv];

// Paleta do tema "energy-dashboard": fundo quase preto, acento laranja.
export const CHART_THEME = {
  primary: '#FF8A3D',
  secondary: '#9A9A9A',
  accent: '#A78BFA',
  accent2: '#60A5FA',
  positive: '#34D399',
  negative: '#F87171',
  warning: '#FBBF24',
  cost: '#FF6B00',
  muted: '#7A7A7A',
} as const;

export const LUCRO_META = 27.5;

export const MONTH_CHART_COLORS: Record<string, string> = {
  janeiro: '#FF6B00',
  fevereiro: '#FF8A3D',
  marco: '#FBBF24',
  abril: '#34D399',
  maio: '#22B8A8',
  junho: '#60A5FA',
  julho: '#A78BFA',
  agosto: '#F472B6',
  setembro: '#F87171',
  outubro: '#FB923C',
  novembro: '#EAB308',
  dezembro: '#38BDF8',
};

export const OPENAI_MODEL_DEFAULT = 'gpt-5.4-mini';
