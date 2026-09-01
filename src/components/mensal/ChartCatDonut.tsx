import { useMemo } from 'react';
import { LabelList, Pie, PieChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../ui/pie-chart';
import { fmtBRL2, fmtK } from '../../lib/format';
import { normKey } from '../../lib/parse';
import { useModals } from '../../state/ModalsContext';
import type { DreContext } from '../../types';

function slugify(label: string): string {
  return normKey(label).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'grupo';
}

// Porta visual do gráfico "Visão Geral" pro componente shadcn Pie Chart
// (rounded/padded, com labels dentro das fatias) — dados reais dos grupos da
// DRE (useDreContext), não os dados de exemplo do componente original.
export function ChartCatDonut({ dreContext }: { dreContext: DreContext }) {
  const { openDre } = useModals();
  const grupos = dreContext.grupos;

  const { chartData, chartConfig } = useMemo(() => {
    const palette = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)'];
    const usedKeys = new Set<string>();
    const config: ChartConfig = {};

    const data = grupos.map((g, i) => {
      let key = slugify(g.label);
      while (usedKeys.has(key)) key = `${key}_${i}`;
      usedKeys.add(key);
      config[key] = { label: g.label, color: palette[i % palette.length] };
      return { key, value: Math.abs(g.value), fill: `var(--color-${key})` };
    });

    return { chartData: data, chartConfig: config };
  }, [grupos]);

  const totalReceitas = dreContext.totalReceitas || chartData.reduce((acc, d) => acc + d.value, 0);

  return (
    <Card className="xl:col-span-2 flex flex-col">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-0">
        <div>
          <CardTitle className="text-lg">Visão Geral</CardTitle>
          <CardDescription>{dreContext.periodoLabel || 'Sem dados'}</CardDescription>
        </div>
        <button className="chip-btn text-[.68rem] whitespace-nowrap" onClick={openDre}>
          DRE completa
        </button>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        {chartData.length ? (
          <ChartContainer config={chartConfig} className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[320px]">
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent hideLabel formatter={(value) => <span className="font-mono font-medium">{fmtBRL2(Number(value))}</span>} />}
              />
              <Pie data={chartData} dataKey="value" nameKey="key" innerRadius={30} radius={10} cornerRadius={8} paddingAngle={4}>
                <LabelList dataKey="value" stroke="none" fontSize={11} fontWeight={600} fill="currentColor" formatter={(value: number) => fmtK(value)} />
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">Sem dados</div>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
          {chartData.map((d) => (
            <div key={d.key} className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: d.fill }} />
              {chartConfig[d.key]?.label}
            </div>
          ))}
        </div>
        {chartData.length > 0 && <div className="mt-3 text-center text-xs text-muted-foreground">Total Receitas: {fmtBRL2(totalReceitas)}</div>}
      </CardContent>
    </Card>
  );
}
