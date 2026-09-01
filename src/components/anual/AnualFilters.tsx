import { ACTIVE_MONTHS } from '../../lib/constants';
import { useDashboard } from '../../state/DashboardContext';
import { MonthSelect } from './MonthSelect';

export function AnualFilters() {
  const { state, dispatch } = useDashboard();
  const { mMin, mMax } = state.anualFilters;

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <div className="kpi-label mb-1">Janela</div>
          <div className="flex items-center gap-2">
            <MonthSelect value={mMin} options={ACTIVE_MONTHS} onChange={(i) => dispatch({ type: 'SET_ANUAL_RANGE', mMin: i, mMax })} />
            <span className="text-[var(--muted)]">→</span>
            <MonthSelect value={mMax} options={ACTIVE_MONTHS} onChange={(i) => dispatch({ type: 'SET_ANUAL_RANGE', mMin, mMax: i })} />
          </div>
        </div>
        <div className="ml-auto">
          <button className="chip-btn" onClick={() => dispatch({ type: 'CLEAR_ANUAL_RANGE' })}>
            ✕ Resetar
          </button>
        </div>
      </div>
    </div>
  );
}
