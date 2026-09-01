import { useRef, type MutableRefObject } from 'react';
import type ApexCharts from 'apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useApexChart } from '../../hooks/useApexChart';
import { ChartRevealBox } from './ChartRevealBox';

interface ApexChartBoxProps {
  id: string;
  options: ApexOptions | null;
  className?: string;
  chartRef?: MutableRefObject<ApexCharts | null>;
  revealDirection?: 'vertical' | 'horizontal';
}

// A animação "de subida" nativa do ApexCharts (chart.animations) não é
// confiável aqui: o React StrictMode (main.tsx) destrói e recria o gráfico
// duas vezes assim que ele monta, o que atropela a animação de entrada do
// ApexCharts antes dela terminar. Em vez de depender disso, o CONTÊINER do
// gráfico é revelado de baixo pra cima via clip-path (ChartRevealBox) — dá o
// efeito de "subida" sem esticar/distorcer os eixos e rótulos (o que um
// scaleY no container inteiro faria), e cobre os ~14 gráficos de uma vez só
// por passar por aqui.
export function ApexChartBox({ id, options, className, chartRef, revealDirection = 'vertical' }: ApexChartBoxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useApexChart(containerRef, options, id, chartRef);

  return (
    <ChartRevealBox id={id} className={className} direction={revealDirection}>
      <div ref={containerRef} className="h-full w-full" />
    </ChartRevealBox>
  );
}
