import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { fmtBRL2 } from '../../lib/format';
import { moneyClass } from '../../lib/money';
import type { DreGroup } from '../../types';

// Porta de renderDreWaterfall() (script.js:2622-2652) — barras horizontais
// hand-rolled (não é ApexCharts) mostrando a cascata Receitas → Resultado.
export function DreWaterfall({ grupos, periodoLabel }: { grupos: DreGroup[]; periodoLabel: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // whileInView do framer-motion não disparava aqui (mesmo bug do
  // ChartRevealBox) — IntersectionObserver manual é mais previsível.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const byLabel = (label: string) => grupos.find((g) => g.label.toUpperCase() === label);
  const rows = (
    [
      { label: 'Receitas', item: byLabel('RECEITAS'), kind: 'pos' as const },
      { label: 'Fixos e Variáveis', item: byLabel('CUSTO'), kind: 'neg' as const },
      { label: 'EBITDA', item: byLabel('EBITDA'), kind: 'pos' as const },
      { label: 'Despesas', item: byLabel('DESPESAS'), kind: 'neg' as const },
      { label: 'Desp. financeiras', item: byLabel('DESPESAS FINANCEIRAS'), kind: 'neg' as const },
      { label: 'Resultado', item: byLabel('RESULTADO DO EXERCÍCIO'), kind: 'pos' as const },
    ] as { label: string; item: DreGroup | undefined; kind: 'pos' | 'neg' }[]
  ).filter((r): r is { label: string; item: DreGroup; kind: 'pos' | 'neg' } => !!r.item && Number(r.item.value) !== 0);

  const maxVal = Math.max(1, ...rows.map((r) => Math.abs(r.item.value)));

  return (
    <div ref={containerRef}>
      <div className="text-[.7rem] text-[var(--muted)] mb-3">Período: {periodoLabel || '-'}</div>
      {rows.map((r, i) => {
        const original = r.item.totalItem ? r.item.totalItem.valorOriginal : r.item.value;
        const width = Math.max(3, (Math.abs(r.item.value) / maxVal) * 100);
        const cls = original < 0 || r.kind === 'neg' ? 'neg' : 'pos';
        return (
          <div className="waterfall-row" key={r.label}>
            <div className="text-xs text-[var(--muted-2)] truncate" title={r.label}>
              {r.label}
            </div>
            <div className="waterfall-track">
              <motion.div
                className={`waterfall-fill ${cls}`}
                initial={{ width: 0 }}
                animate={inView ? { width: `${width}%` } : undefined}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
              />
            </div>
            <div className={`mono text-xs text-right ${moneyClass(original, r.kind === 'neg')}`}>{fmtBRL2(original)}</div>
          </div>
        );
      })}
    </div>
  );
}
