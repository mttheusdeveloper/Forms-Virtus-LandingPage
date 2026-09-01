import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

// Ícone com anéis pulsando ao redor — usado nas telas de "Conectar com o
// Google" (Drive/Planilhas/Contratos) pra chamar mais atenção pro botão de
// conectar do que um emoji estático.
export function PulsingIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <Icon className="w-7 h-7 text-[var(--text)] z-10" />
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-14 h-14 border-2 border-[var(--accent)]/40 rounded-full"
          initial={{ scale: 0.6, opacity: 1 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.7, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}
