import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useScrollLock } from '../hooks/useScrollLock';
import type { KpiOrigin, TxModalItem } from '../types';
import type { EbookClient } from '../lib/googleSheets';

export interface TxModalState {
  open: boolean;
  kind: string;
  title: string;
  eyebrow: string;
  headCells: string[];
  items: TxModalItem[];
  emptyMsg: string;
  colSpan: number;
}

const closedTxModal: TxModalState = {
  open: false,
  kind: '',
  title: '',
  eyebrow: '',
  headCells: [],
  items: [],
  emptyMsg: 'Nenhum registro',
  colSpan: 7,
};

interface ModalsContextValue {
  tx: TxModalState;
  openTx: (cfg: Omit<TxModalState, 'open'>) => void;
  closeTx: () => void;

  kpiChartOpen: boolean;
  kpiChartOrigin: KpiOrigin;
  openKpiChart: (origin: KpiOrigin) => void;
  closeKpiChart: () => void;

  dreOpen: boolean;
  openDre: () => void;
  closeDre: () => void;

  annualSummaryOpen: boolean;
  openAnnualSummary: () => void;
  closeAnnualSummary: () => void;

  contractDetail: EbookClient | null;
  openContractDetail: (client: EbookClient) => void;
  closeContractDetail: () => void;
}

const ModalsContext = createContext<ModalsContextValue | null>(null);

export function ModalsProvider({ children }: { children: ReactNode }) {
  const [tx, setTx] = useState<TxModalState>(closedTxModal);
  const [kpiChartOpen, setKpiChartOpen] = useState(false);
  const [kpiChartOrigin, setKpiChartOrigin] = useState<KpiOrigin>('caixa');
  const [dreOpen, setDreOpen] = useState(false);
  const [annualSummaryOpen, setAnnualSummaryOpen] = useState(false);
  const [contractDetail, setContractDetail] = useState<EbookClient | null>(null);

  const openTx = (cfg: Omit<TxModalState, 'open'>) => setTx({ ...cfg, open: true });
  const closeTx = () => setTx((prev) => ({ ...prev, open: false }));

  const openKpiChart = (origin: KpiOrigin) => {
    setKpiChartOrigin(origin);
    setKpiChartOpen(true);
  };
  const closeKpiChart = () => setKpiChartOpen(false);

  const openDre = () => setDreOpen(true);
  const closeDre = () => setDreOpen(false);

  const openAnnualSummary = () => setAnnualSummaryOpen(true);
  const closeAnnualSummary = () => setAnnualSummaryOpen(false);

  const openContractDetail = (client: EbookClient) => setContractDetail(client);
  const closeContractDetail = () => setContractDetail(null);

  const anyOpen = tx.open || kpiChartOpen || dreOpen || annualSummaryOpen || !!contractDetail;
  useScrollLock(anyOpen);

  // Porta do handler global de Escape (script.js:3371): fecha os modais.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      closeTx();
      closeDre();
      closeAnnualSummary();
      closeKpiChart();
      closeContractDetail();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const value = useMemo<ModalsContextValue>(
    () => ({
      tx,
      openTx,
      closeTx,
      kpiChartOpen,
      kpiChartOrigin,
      openKpiChart,
      closeKpiChart,
      dreOpen,
      openDre,
      closeDre,
      annualSummaryOpen,
      openAnnualSummary,
      closeAnnualSummary,
      contractDetail,
      openContractDetail,
      closeContractDetail,
    }),
    [tx, kpiChartOpen, kpiChartOrigin, dreOpen, annualSummaryOpen, contractDetail],
  );

  return <ModalsContext.Provider value={value}>{children}</ModalsContext.Provider>;
}

export function useModals(): ModalsContextValue {
  const ctx = useContext(ModalsContext);
  if (!ctx) throw new Error('useModals must be used within a ModalsProvider');
  return ctx;
}
