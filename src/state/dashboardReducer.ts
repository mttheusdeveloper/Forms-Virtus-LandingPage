import { ACTIVE_MONTHS, CURRENT_MONTH_LIMIT_INDEX, MONTHS } from '../lib/constants';
import { clampAnualRange, defaultMonthKey } from '../lib/months';
import type { AnualFilterState, MensalFilterState, RawRow } from '../types';

export type Tab = 'mensal' | 'anual' | 'contratos' | 'drive' | 'sheets';
export type ConnectionStatus = 'connecting' | 'connected' | 'error';

export interface DashboardState {
  tab: Tab;
  mensalRows: Record<string, RawRow[]>;
  mensalFilters: MensalFilterState;
  anualRows: RawRow[];
  anualFilters: AnualFilterState;
  dreRows: RawRow[];
  status: ConnectionStatus;
  statusCount: number;
  usingMockData: boolean;
}

export const initialMensalFilters: MensalFilterState = {
  mesesDisp: [],
  mesesSel: new Set(),
  tipo: 'all',
  cat: 'all',
  conta: 'all',
  dayMin: null,
  dayMax: null,
  valMin: null,
  valMax: null,
};

export const initialAnualFilters: AnualFilterState = {
  metric: 'fb',
  mMin: 0,
  mMax: CURRENT_MONTH_LIMIT_INDEX,
};

export const initialDashboardState: DashboardState = {
  tab: 'mensal',
  mensalRows: Object.fromEntries(MONTHS.map((m) => [m.key, []])),
  mensalFilters: initialMensalFilters,
  anualRows: [],
  anualFilters: initialAnualFilters,
  dreRows: [],
  status: 'connecting',
  statusCount: 0,
  usingMockData: false,
};

export type DashboardAction =
  | { type: 'SET_TAB'; tab: Tab }
  | { type: 'SET_STATUS'; status: ConnectionStatus; count?: number }
  | { type: 'DATA_LOADED'; mensalRows: Record<string, RawRow[]>; anualRows: RawRow[]; dreRows: RawRow[]; usingMockData: boolean }
  | { type: 'TOGGLE_MONTH_CHIP'; key: string }
  | { type: 'SET_TIPO'; tipo: MensalFilterState['tipo'] }
  | { type: 'SET_CATEGORIA'; value: string }
  | { type: 'SET_CONTA'; value: string }
  | { type: 'SET_DAY_MIN'; value: number | null }
  | { type: 'SET_DAY_MAX'; value: number | null }
  | { type: 'SET_VAL_MIN'; value: number | null }
  | { type: 'SET_VAL_MAX'; value: number | null }
  | { type: 'CLEAR_MENSAL_FILTERS' }
  | { type: 'SET_ANUAL_METRIC'; metric: string }
  | { type: 'SET_ANUAL_RANGE'; mMin: number; mMax: number }
  | { type: 'CLEAR_ANUAL_RANGE' };

export function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, tab: action.tab };

    case 'SET_STATUS':
      return { ...state, status: action.status, statusCount: action.count ?? state.statusCount };

    case 'DATA_LOADED': {
      // Espelha populateSelects(): meses disponíveis são sempre Jan..mês atual;
      // mantém a seleção existente se ainda for válida, senão volta pro mês atual.
      const mesesDisp = ACTIVE_MONTHS.map((m) => m.key);
      const keptSel = new Set([...state.mensalFilters.mesesSel].filter((k) => mesesDisp.includes(k)));
      const mesesSel = keptSel.size ? keptSel : new Set([defaultMonthKey(mesesDisp)].filter(Boolean));

      return {
        ...state,
        mensalRows: action.mensalRows,
        anualRows: action.anualRows,
        dreRows: action.dreRows,
        usingMockData: action.usingMockData,
        mensalFilters: { ...state.mensalFilters, mesesDisp, mesesSel },
      };
    }

    case 'TOGGLE_MONTH_CHIP': {
      const sel = new Set(state.mensalFilters.mesesSel);
      if (sel.has(action.key) && sel.size > 1) sel.delete(action.key);
      else sel.add(action.key);
      return { ...state, mensalFilters: { ...state.mensalFilters, mesesSel: sel } };
    }

    case 'SET_TIPO':
      return { ...state, mensalFilters: { ...state.mensalFilters, tipo: action.tipo } };

    case 'SET_CATEGORIA':
      return { ...state, mensalFilters: { ...state.mensalFilters, cat: action.value } };

    case 'SET_CONTA':
      return { ...state, mensalFilters: { ...state.mensalFilters, conta: action.value } };

    case 'SET_DAY_MIN':
      return { ...state, mensalFilters: { ...state.mensalFilters, dayMin: action.value } };

    case 'SET_DAY_MAX':
      return { ...state, mensalFilters: { ...state.mensalFilters, dayMax: action.value } };

    case 'SET_VAL_MIN':
      return { ...state, mensalFilters: { ...state.mensalFilters, valMin: action.value } };

    case 'SET_VAL_MAX':
      return { ...state, mensalFilters: { ...state.mensalFilters, valMax: action.value } };

    case 'CLEAR_MENSAL_FILTERS': {
      const key = defaultMonthKey(state.mensalFilters.mesesDisp);
      return {
        ...state,
        mensalFilters: {
          ...state.mensalFilters,
          tipo: 'all',
          cat: 'all',
          conta: 'all',
          dayMin: null,
          dayMax: null,
          valMin: null,
          valMax: null,
          mesesSel: new Set(key ? [key] : []),
        },
      };
    }

    case 'SET_ANUAL_METRIC':
      return { ...state, anualFilters: { ...state.anualFilters, metric: action.metric } };

    case 'SET_ANUAL_RANGE': {
      const { mMin, mMax } = clampAnualRange(action.mMin, action.mMax);
      return { ...state, anualFilters: { ...state.anualFilters, mMin, mMax } };
    }

    case 'CLEAR_ANUAL_RANGE':
      return { ...state, anualFilters: { ...state.anualFilters, mMin: 0, mMax: CURRENT_MONTH_LIMIT_INDEX } };

    default:
      return state;
  }
}
