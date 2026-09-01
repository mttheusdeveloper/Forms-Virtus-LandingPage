import { useMemo } from 'react';
import { ACTIVE_MONTHS, CHART_THEME } from '../../lib/constants';
import { fmtBRL2, fmtK } from '../../lib/format';
import { annualMonthHasRealData } from '../../lib/rows';
import { buildBarOptions, buildPercentModalOptions } from '../../lib/chartBuilders';
import { ApexChartBox } from '../charts/ApexChartBox';
import { ModalShell } from './ModalShell';
import { useDashboard } from '../../state/DashboardContext';
import { useModals } from '../../state/ModalsContext';
import { useMensalDerived } from '../../hooks/useMensalDerived';
import { useAnualDerived } from '../../hooks/useAnualDerived';
import { OriginButton } from '../ui/origin-button';
import type { KpiModalItem, KpiOrigin } from '../../types';

const CLOSE_BTN_CLASS = 'h-auto py-1.5 px-3 rounded-md text-[.74rem] font-semibold gap-1';

interface KpiOriginConfig {
  label: string;
  title: string;
  type: 'money' | 'percent';
  key: 'caixa' | 'lucro' | 'cresc';
  seriesName: string;
  color: string;
  note: string;
  meta?: boolean;
}

const CONFIG_MAP: Record<KpiOrigin, KpiOriginConfig> = {
  saldo: { label: 'Saldo Líquido', title: 'Caixa por Mês', type: 'money', key: 'caixa', seriesName: 'Caixa', color: CHART_THEME.accent2, note: 'Este gráfico usa a coluna Caixa da tabela Financeiro 2026, mês a mês.' },
  caixa: { label: 'Caixa', title: 'Caixa por Mês', type: 'money', key: 'caixa', seriesName: 'Caixa', color: CHART_THEME.accent2, note: 'Este gráfico usa a coluna Caixa da tabela Financeiro 2026, mês a mês.' },
  lucratividade: { label: 'Lucratividade', title: 'Lucratividade por Mês', type: 'percent', key: 'lucro', seriesName: 'Lucratividade %', color: CHART_THEME.positive, note: 'Este gráfico usa a coluna Lucratividade da tabela Financeiro 2026, mês a mês.', meta: true },
  anualLucratividade: { label: 'Lucratividade Média', title: 'Lucratividade por Mês', type: 'percent', key: 'lucro', seriesName: 'Lucratividade %', color: CHART_THEME.positive, note: 'Este gráfico usa a coluna Lucratividade da tabela Financeiro 2026, mês a mês.', meta: true },
  crescimento: { label: 'Crescimento', title: 'Crescimento por Mês', type: 'percent', key: 'cresc', seriesName: 'Crescimento %', color: CHART_THEME.accent, note: 'Este gráfico usa a coluna Percentual de Crescimento da tabela Financeiro 2026, mês a mês.' },
};

// Porta de openKpiIndicatorModal() (script.js:1831-1889) — popup de gráfico
// acionado pelos cards de KPI (Saldo, Lucratividade, Crescimento, etc.).
export function KpiChartModal() {
  const { kpiChartOpen, kpiChartOrigin, closeKpiChart } = useModals();
  const { state } = useDashboard();
  const mensalDerived = useMensalDerived(state.mensalRows);
  const anualDerived = useAnualDerived(state.anualRows);

  const cfg = CONFIG_MAP[kpiChartOrigin] || CONFIG_MAP.caixa;

  const items: KpiModalItem[] = useMemo(
    () =>
      ACTIVE_MONTHS.map((m, i) => {
        const hasMonthlyRows = (mensalDerived.valid[m.key] || []).length > 0;
        const bucket = anualDerived.byMonth[i];
        const hasData = annualMonthHasRealData(bucket, hasMonthlyRows);
        const raw = Number(bucket?.[cfg.key]) || 0;
        return { label: m.short, fullLabel: m.label, value: hasData ? raw : null, rawValue: raw, hasData };
      }),
    [mensalDerived, anualDerived, cfg.key],
  );

  const options = useMemo(() => {
    if (cfg.type === 'percent') {
      return buildPercentModalOptions({ seriesName: cfg.seriesName, items, color: cfg.color, showMeta: !!cfg.meta });
    }
    return buildBarOptions([{ name: cfg.seriesName, data: items.map((i) => i.value) }], items.map((i) => i.label), [cfg.color], false, {
      chart: { height: 360 },
      plotOptions: { bar: { columnWidth: '52%' } },
      yaxis: { labels: { style: { colors: '#9A9A9A', fontFamily: 'Inter', fontSize: '11px' }, formatter: (v: number) => 'R$ ' + fmtK(v) } },
      tooltip: { theme: 'dark', y: { formatter: (v: number | null) => (v == null ? 'Sem dados' : fmtBRL2(v)) } },
    });
  }, [cfg, items]);

  if (!kpiChartOpen) return null;

  const ativos = items.filter((i) => i.hasData).length;

  return (
    <ModalShell onBackdropClick={closeKpiChart}>
      <div className="card kpi-chart-modal-card max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <div className="section-eyebrow mb-1">Aberto pelo indicador: {cfg.label}</div>
            <h2 className="font-semibold tracking-[-0.03em] text-lg">{cfg.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--muted)]">12 meses exibidos • {ativos} com dados</span>
            <OriginButton className={CLOSE_BTN_CLASS} onClick={closeKpiChart}>
              ✕ Fechar
            </OriginButton>
          </div>
        </div>
        <div className="px-6 py-5 flex-1 overflow-y-auto">
          <ApexChartBox id="modal-kpi-chart-graph" options={options} />
          <p className="text-[.7rem] text-[var(--muted)] mt-3">{cfg.note}</p>
        </div>
      </div>
    </ModalShell>
  );
}
