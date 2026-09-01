import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, LineChart, Cloud, FileText, type LucideIcon } from 'lucide-react';
import { useDashboard } from '../../state/DashboardContext';
import type { Tab } from '../../state/dashboardReducer';

interface NavGroup {
  type: 'group';
  key: string;
  label: string;
  icon: LucideIcon;
  items: { tab: Tab; label: string }[];
}

interface NavStandalone {
  type: 'item';
  tab: Tab;
  label: string;
  icon: LucideIcon;
}

type NavEntry = NavGroup | NavStandalone;

const NAV_ENTRIES: NavEntry[] = [
  {
    type: 'group',
    key: 'financeiro',
    label: 'Financeiro',
    icon: LineChart,
    items: [
      { tab: 'mensal', label: 'Comparativo Mensal' },
      { tab: 'anual', label: 'Visão Anual 2026' },
    ],
  },
  {
    type: 'group',
    key: 'google',
    label: 'Google',
    icon: Cloud,
    items: [
      { tab: 'drive', label: 'Google Drive' },
      { tab: 'sheets', label: 'Planilhas' },
    ],
  },
  { type: 'item', tab: 'contratos', label: 'Contratos', icon: FileText },
];

function groupKeyOf(tab: Tab): string | undefined {
  return NAV_ENTRIES.find((e): e is NavGroup => e.type === 'group' && e.items.some((i) => i.tab === tab))?.key;
}

const firstGroupKey = NAV_ENTRIES.find((e): e is NavGroup => e.type === 'group')?.key;

export function Sidebar() {
  const { state, dispatch } = useDashboard();
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set([groupKeyOf(state.tab) ?? firstGroupKey ?? '']));

  function toggleGroup(key: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <aside className="w-60 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] px-4 py-6 hidden lg:flex flex-col gap-6 sticky top-0 h-screen">
      <div className="flex items-center gap-3 px-2 brand-header">
        <div className="brand-logo-box">
          <img src="/assets/logo-virtus.png" alt="Logo Virtus" />
        </div>
        <div>
          <div className="brand-name">Virtus Ads</div>
          <div className="brand-subtitle">Finance OS</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        <div className="text-[.6rem] uppercase tracking-widest text-[var(--muted)] px-3 mb-1">Workspace</div>
        {NAV_ENTRIES.map((entry) => {
          if (entry.type === 'item') {
            const Icon = entry.icon;
            return (
              <div
                key={entry.tab}
                className={`nav-item nav-item-standalone ${state.tab === entry.tab ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_TAB', tab: entry.tab })}
              >
                <Icon size={15} strokeWidth={2} />
                {entry.label}
              </div>
            );
          }

          const isOpen = openGroups.has(entry.key);
          const Icon = entry.icon;
          return (
            <div key={entry.key}>
              <button type="button" className="nav-group-header" onClick={() => toggleGroup(entry.key)}>
                <span className="flex items-center gap-2.5">
                  <Icon size={15} strokeWidth={2} />
                  {entry.label}
                </span>
                <ChevronDown size={13} strokeWidth={2.5} className={`nav-group-chevron ${isOpen ? 'open' : ''}`} />
              </button>
              <motion.div
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <ul className="nav-subgroup">
                  {entry.items.map((item) => (
                    <li key={item.tab}>
                      <div
                        className={`nav-item ${state.tab === item.tab ? 'active' : ''}`}
                        onClick={() => dispatch({ type: 'SET_TAB', tab: item.tab })}
                      >
                        {item.label}
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
