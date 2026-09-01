import type { ReactNode } from 'react';

export type KpiTone = 'orange' | 'positive' | 'negative' | 'info';

const TONE_GRADIENTS: Record<KpiTone, string> = {
  orange: 'from-[#FF6B00] to-[#E55A00]',
  positive: 'from-[#0D9488] to-[#10B981]',
  negative: 'from-[#DC2626] to-[#F87171]',
  info: 'from-[#2563EB] to-[#60A5FA]',
};

const TONE_SHADOW: Record<KpiTone, string> = {
  orange: 'shadow-[#FF6B00]/20',
  positive: 'shadow-[#10B981]/20',
  negative: 'shadow-[#DC2626]/20',
  info: 'shadow-[#2563EB]/20',
};

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone?: KpiTone;
  pillText?: string;
  sub?: ReactNode;
  onClick?: () => void;
}

// Card de KPI "hero" com gradiente — inspirado no UnifiedKpiCard do energy-dashboard,
// com 4 tons (orange/positive/negative/info) pra preservar a semântica financeira
// (entradas=verde, saídas=vermelho) que o dashboard de referência não precisa carregar.
export function KpiCard({ icon, label, value, tone = 'orange', pillText, sub, onClick }: KpiCardProps) {
  return (
    <div
      className={`rounded-lg bg-gradient-to-br ${TONE_GRADIENTS[tone]} text-white shadow-lg ${TONE_SHADOW[tone]} p-4 transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02]' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2.5 gap-2">
        <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-xl bg-white/20 text-sm font-semibold">{icon}</div>
        {pillText && (
          <span className="shrink-0 text-[.58rem] font-semibold uppercase tracking-wide bg-white/15 text-white/90 rounded-full px-2 py-1 whitespace-nowrap max-w-full overflow-hidden text-ellipsis">
            {pillText}
          </span>
        )}
      </div>
      <h3 className="text-[.66rem] font-semibold uppercase tracking-wider text-white/80 truncate mb-1.5">{label}</h3>
      <div className="text-2xl font-bold text-white leading-none mono">{value}</div>
      {sub}
    </div>
  );
}
