import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ChartRevealBoxProps {
  children: ReactNode;
  className?: string;
  id?: string;
  // 'vertical' (padrão) revela de baixo pra cima — combina com gráficos de
  // barra vertical (a barra "sobe"). 'horizontal' revela da esquerda pra
  // direita — combina com gráficos de barra horizontal (a barra "cresce"
  // no mesmo sentido do próprio clip), como o de Categorias.
  direction?: 'vertical' | 'horizontal';
}

const CLIP_BY_DIRECTION = {
  vertical: { hidden: 'inset(100% 0 0 0)', visible: 'inset(0% 0 0 0)' },
  horizontal: { hidden: 'inset(0 100% 0 0)', visible: 'inset(0 0% 0 0)' },
} as const;

// Mesma animação de "subida" do ApexChartBox (revela de baixo pra cima via
// clip-path), só que reaproveitável pros widgets que não são ApexCharts —
// DreWaterfall, MomComparison, FinanceTraffic — que antes ficavam parados.
//
// O IntersectionObserver precisa observar um elemento SEM clip-path: um
// elemento com clip-path: inset(100%...) é reportado pelo Chrome como tendo
// interseção zero mesmo estando 100% dentro da viewport (a área visível dele
// é zero), então o observer nunca disparava — um deadlock. Por isso o clip
// vai num motion.div FILHO, e o observer fica no wrapper de fora, que nunca é clipado.
export function ChartRevealBox({ children, className, id, direction = 'vertical' }: ChartRevealBoxProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const clip = CLIP_BY_DIRECTION[direction];

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={outerRef} id={id} className={className}>
      <motion.div
        className="h-full w-full"
        initial={{ clipPath: clip.hidden }}
        animate={inView ? { clipPath: clip.visible } : undefined}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
