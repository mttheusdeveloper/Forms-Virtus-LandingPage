import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { dashboardReducer, initialDashboardState, type DashboardAction, type DashboardState } from './dashboardReducer';
import { useDashboardData } from '../hooks/useDashboardData';

interface DashboardContextValue {
  state: DashboardState;
  dispatch: Dispatch<DashboardAction>;
  reload: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState);
  const { reload } = useDashboardData(dispatch);

  return <DashboardContext.Provider value={{ state, dispatch, reload }}>{children}</DashboardContext.Provider>;
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within a DashboardProvider');
  return ctx;
}
