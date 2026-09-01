import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { OriginButton } from '../ui/origin-button';
import { ChevronUpDownIcon, CheckIcon } from '../shared/SelectIcons';

const TRIGGER_CLASS = 'w-[92px] h-[38px] px-2.5 rounded-lg text-[.82rem] font-semibold tracking-[-0.02em]';
const OPTION_CLASS = 'w-full h-auto justify-start py-[.56rem] px-[.62rem] rounded-lg';

interface MonthSelectProps {
  value: number;
  options: { short: string }[];
  onChange: (index: number) => void;
}

// Dropdown custom pro filtro "Janela" da aba Anual — mesmo padrão visual do
// CategorySelect, só que sem busca/ícones (a lista de meses é curta).
export function MonthSelect({ value, options, onChange }: MonthSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  function select(index: number) {
    onChange(index);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className={`month-select ${open ? 'open' : ''}`}>
      <OriginButton
        className={TRIGGER_CLASS}
        active={open}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <span className="w-full flex items-center justify-between gap-2">
          <span className="month-select-text">{options[value]?.short}</span>
          <ChevronUpDownIcon className="month-select-chevron" />
        </span>
      </OriginButton>
      <AnimatePresence>
        {open && (
          <motion.div
            className="month-select-menu"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            style={{ transformOrigin: 'top left' }}
          >
            {options.map((m, i) => (
              <OriginButton key={m.short} className={OPTION_CLASS} active={i === value} onClick={() => select(i)}>
                <span className="w-full flex items-center gap-[.65rem]">
                  <span className="category-option-label">{m.short}</span>
                  {i === value && <CheckIcon className="category-option-check" />}
                </span>
              </OriginButton>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
