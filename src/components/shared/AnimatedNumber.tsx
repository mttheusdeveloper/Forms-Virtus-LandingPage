import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  formatter: (n: number) => string;
  duration?: number;
}

// Sobe animado do valor anterior até o novo sempre que `value` muda (na
// primeira renderização, sobe de 0) — mesma técnica do StatsCard
// (components/ui/activity-stats-card.tsx), só que reaproveitável em
// qualquer número já formatado (R$, %, etc.) via `formatter`.
export function AnimatedNumber({ value, formatter, duration = 1.2 }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevRef = useRef(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const from = prevRef.current;
    const controls = animate(from, value, {
      duration,
      ease: 'easeOut',
      onUpdate(v) {
        node.textContent = formatter(v);
      },
    });
    prevRef.current = value;

    return () => controls.stop();
  }, [value, formatter, duration]);

  return <span ref={ref}>{formatter(value)}</span>;
}
