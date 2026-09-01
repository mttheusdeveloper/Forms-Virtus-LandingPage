import { motion } from 'framer-motion';

// Esqueleto pulsando pros estados de "carregando" (Drive, Planilhas,
// Contratos) — no lugar de um texto parado "Carregando...".
export function LoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="card p-6 flex items-center gap-3">
      <motion.div
        className="h-9 w-9 rounded-md bg-[var(--surface-2)] shrink-0"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.1, repeat: Infinity }}
      />
      <div className="flex-1 space-y-2">
        <motion.div
          className="h-3 w-2/5 rounded bg-[var(--surface-2)]"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: 0.1 }}
        />
        <span className="text-xs text-[var(--muted-2)]">{label}</span>
      </div>
    </div>
  );
}
