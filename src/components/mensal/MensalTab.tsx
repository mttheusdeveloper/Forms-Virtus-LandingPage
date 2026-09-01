import { useDashboard } from '../../state/DashboardContext';
import { ChartRevealBox } from '../charts/ChartRevealBox';
import { useMensalDerived } from '../../hooks/useMensalDerived';
import { useMensalKpis, useCaixaChartItems } from '../../hooks/useMensalKpis';
import { useDreContext } from '../../hooks/useDreContext';
import { useCategoryComparison } from '../../hooks/useCategoryComparison';
import { useMonthComparison } from '../../hooks/useMonthComparison';
import { MensalFilters } from './MensalFilters';
import { KpiGridMensal } from './KpiGridMensal';
import { ChartComparativo } from './ChartComparativo';
import { ChartFluxo } from './ChartFluxo';
import { ChartCatDonut } from './ChartCatDonut';
import { DreWaterfall } from './DreWaterfall';
import { MomComparison } from './MomComparison';
import { FinanceTraffic } from './FinanceTraffic';
import { ChartCatComp } from './ChartCatComp';

export function MensalTab() {
  const { state } = useDashboard();
  const mensalDerived = useMensalDerived(state.mensalRows);
  const kpis = useMensalKpis(state.mensalFilters, mensalDerived, state.anualRows);
  const caixaChartItems = useCaixaChartItems(mensalDerived);
  const dreContext = useDreContext(state.dreRows, state.mensalFilters);
  const categoryComparison = useCategoryComparison(state.mensalFilters, mensalDerived, state.dreRows);
  const monthComparison = useMonthComparison(state.mensalFilters, state.anualRows);

  return (
    <section className="space-y-6">
      <MensalFilters mensalDerived={mensalDerived} />
      <KpiGridMensal kpis={kpis} />
      <ChartComparativo items={caixaChartItems} />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 items-stretch">
        <ChartFluxo items={caixaChartItems} />
        <ChartCatDonut dreContext={dreContext} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card p-6 xl:col-span-1">
          <div className="section-eyebrow mb-1">DRE</div>
          <h2 className="font-semibold tracking-[-0.03em] mb-4">DRE</h2>
          <ChartRevealBox>
            <DreWaterfall grupos={dreContext.grupos} periodoLabel={dreContext.periodoLabel} />
          </ChartRevealBox>
        </div>
        <div className="card p-6 xl:col-span-1">
          <div className="section-eyebrow mb-1">Mês contra mês</div>
          <h2 className="font-semibold tracking-[-0.03em] mb-4">Comparativo automático</h2>
          <ChartRevealBox>
            <MomComparison data={monthComparison} />
          </ChartRevealBox>
        </div>
        <div className="card p-6 xl:col-span-1">
          <div className="section-eyebrow mb-1">Status</div>
          <h2 className="font-semibold tracking-[-0.03em] mb-4">Semáforo financeiro</h2>
          <ChartRevealBox>
            <FinanceTraffic data={monthComparison} />
          </ChartRevealBox>
        </div>
      </div>

      <ChartCatComp data={categoryComparison} />
    </section>
  );
}
