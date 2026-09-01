import { useEffect, useRef, type MutableRefObject, type RefObject } from 'react';
import ApexCharts from 'apexcharts';
import type { ApexOptions } from 'apexcharts';
import { normalizeChartOptions, chartOptionSignature } from '../lib/chartOptions';
import { mergeOptions } from '../lib/chartTheme';

// Porta de upsert()/destroyChart() (script.js:2080-2122): cria o gráfico na
// primeira montagem, chama updateOptions() quando o tipo não muda, destrói e
// recria quando muda (ApexCharts falha ao trocar tipo via updateOptions), e
// pula updates sem alteração real via assinatura JSON das opções. Diferença
// vs. o legado: aqui o gráfico é destruído no unmount, já que o React
// desmonta ao trocar de aba em vez de só escondê-la via CSS.
//
// `externalChartRef` permite que o chamador (ex.: legenda custom do donut)
// acesse a mesma instância do ApexCharts sem precisar de forwardRef.
export function useApexChart(
  containerRef: RefObject<HTMLDivElement | null>,
  options: ApexOptions | null,
  chartId: string,
  externalChartRef?: MutableRefObject<ApexCharts | null>,
) {
  const internalRef = useRef<ApexCharts | null>(null);
  const chartRef = externalChartRef ?? internalRef;
  const typeRef = useRef<string | null>(null);
  const signatureRef = useRef<string | null>(null);
  const destroyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || !options) return;

    // O React StrictMode roda mount -> cleanup -> mount de novo, o que destruía
    // e recriava o gráfico antes da animação de entrada nativa do ApexCharts
    // (barras crescendo) terminar. Se um destroy adiado pelo cleanup abaixo
    // ainda estiver pendente aqui, é o "segundo mount" do StrictMode: cancela
    // o destroy e reaproveita a MESMA instância, sem recriar nem reanimar nada.
    if (destroyTimeoutRef.current !== null) {
      window.clearTimeout(destroyTimeoutRef.current);
      destroyTimeoutRef.current = null;
    }

    const normalized = normalizeChartOptions(mergeOptions(options as Record<string, unknown>, { chart: { id: chartId } }));
    const nextType = (normalized.chart?.type as string) || 'line';
    const signature = chartOptionSignature(normalized);

    if (chartRef.current && typeRef.current === nextType && signatureRef.current === signature) return;

    if (chartRef.current && typeRef.current !== nextType) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    signatureRef.current = signature;

    if (chartRef.current) {
      // animate:true (3º arg) — os dados reais/mock só chegam depois da
      // primeira montagem (fetch assíncrono), então é esta chamada de update,
      // não o render() inicial, que o usuário efetivamente vê primeiro.
      // Com animate:false aqui a animação de entrada nunca aparecia.
      chartRef.current.updateOptions(normalized, false, true, false);
    } else {
      containerRef.current.innerHTML = '';
      chartRef.current = new ApexCharts(containerRef.current, normalized as ApexOptions);
      typeRef.current = nextType;
      chartRef.current.render();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, chartId]);

  useEffect(
    () => () => {
      destroyTimeoutRef.current = window.setTimeout(() => {
        chartRef.current?.destroy();
        chartRef.current = null;
        typeRef.current = null;
        signatureRef.current = null;
        destroyTimeoutRef.current = null;
      }, 0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return chartRef;
}
