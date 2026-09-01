// Dados crus do Supabase: nomes de coluna variam por tabela/mês e já são
// resolvidos em runtime via firstExistingValue/normFieldName. Tipar o schema
// exato não traria benefício real e exigiria manutenção constante.
export type RawRow = Record<string, unknown>;

export interface MonthConfig {
  key: string;
  short: string;
  label: string;
  table: string;
  dreCols: string[];
  drePctCols: string[];
}

export interface MonthlyRowInfo {
  date: Date | null;
  day: number | null;
  cat: string;
  conta: string;
  ent: number;
  sai: number;
  value: number;
  valid: boolean;
}

export interface MensalFilterState {
  mesesDisp: string[];
  mesesSel: Set<string>;
  tipo: 'all' | 'entrada' | 'saida';
  cat: string;
  conta: string;
  dayMin: number | null;
  dayMax: number | null;
  valMin: number | null;
  valMax: number | null;
}

export interface AnualFilterState {
  metric: string;
  mMin: number;
  mMax: number;
}

export interface DreItem {
  desc: string;
  valorOriginal: number;
  val: number;
  pct: string;
}

export interface DreGroup {
  label: string;
  value: number;
  totalItem: DreItem | null;
  detalhes: DreItem[];
  periodo: string;
}

export interface DreContext {
  grupos: DreGroup[];
  totalReceitas: number;
  periodoLabel: string;
  meses: string[];
}

export interface MensalMonthTotals {
  entradas: number;
  saidas: number;
  faturamentoBruto: number;
  custoOperacional: number;
}

export interface AnualMonthBucket {
  fb: number;
  fl: number;
  caixa: number;
  eb: number;
  custos: number;
  inv: number;
  roiRaw: number;
  roiDelta: number | null;
  roi: number;
  endiv: number;
  lucro: number;
  cresc: number;
  _count: number;
  _hasValue: boolean;
}

export type KpiOrigin = 'saldo' | 'caixa' | 'lucratividade' | 'anualLucratividade' | 'crescimento';

export interface KpiModalItem {
  label: string;
  fullLabel: string;
  value: number | null;
  rawValue: number;
  hasData: boolean;
}

// Item genérico usado pelo modal de transações (tabela reaproveitada em vários contextos).
export interface TxModalItem {
  row: RawRow;
  _mes?: string;
  _mesKey?: string;
}

export interface TxModalConfig {
  kind: string;
  rows: TxModalItem[];
  emptyMsg: string;
  colSpan: number;
}
