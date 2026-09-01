import { useDashboard } from '../../state/DashboardContext';
import { useAnualDerived } from '../../hooks/useAnualDerived';
import { useAnualChartsData } from '../../hooks/useAnualChartsData';
import { AnualFilters } from './AnualFilters';
import { KpiGridAnual } from './KpiGridAnual';
import { ChartFaturamento } from './ChartFaturamento';
import { ChartCaixa } from './ChartCaixa';
import { ChartEbitda } from './ChartEbitda';
import { ChartCustos } from './ChartCustos';
import { ChartInvestimentos } from './ChartInvestimentos';
import { ChartLucro } from './ChartLucro';
import { ChartCresc } from './ChartCresc';
import { AnnualSummaryCard } from './AnnualSummaryCard';

export function AnualTab() {
  const { state } = useDashboard();
  const anualDerived = useAnualDerived(state.anualRows);
  const chartsData = useAnualChartsData(anualDerived, state.anualFilters);

  return (
    <section className="space-y-6">
      <AnualFilters />
      <KpiGridAnual kpis={chartsData.kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartFaturamento data={chartsData} />
        <ChartCaixa data={chartsData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartEbitda data={chartsData} />
        <ChartCustos data={chartsData} />
        <ChartInvestimentos data={chartsData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartLucro data={chartsData} />
        <ChartCresc data={chartsData} />
      </div>

      <AnnualSummaryCard />
    </section>
  );
}
