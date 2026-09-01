import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { normKey } from '../../lib/parse';
import { categoryIcon, categoryLabel, categoryTone } from '../../lib/categoryUi';
import { ChevronUpDownIcon, CheckIcon } from '../shared/SelectIcons';
import { OriginButton } from '../ui/origin-button';

const TRIGGER_CLASS = 'w-full h-[46px] px-2.5 rounded-lg';
const OPTION_CLASS = 'w-full h-auto justify-start py-[.56rem] px-[.62rem] rounded-lg';

interface CategorySelectProps {
  value: string;
  categories: string[];
  onChange: (value: string) => void;
}

// Porta do dropdown custom de categoria (script.js:793-859): não é um <select>
// visual, é um menu próprio com busca e ícones por categoria.
export function CategorySelect({ value, categories, onChange }: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const options = ['all', ...categories];
  const q = normKey(search);
  const filtered = options.filter((o) => !q || normKey(categoryLabel(o)).includes(q));

  function select(v: string) {
    onChange(v);
    setOpen(false);
  }

  function toggleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) setTimeout(() => searchRef.current?.focus(), 40);
  }

  return (
    <div className="category-filter-shell">
      <div className="kpi-label mb-1">Categoria</div>
      <div ref={wrapRef} className={`category-select ${open ? 'open' : ''}`}>
        <OriginButton className={TRIGGER_CLASS} active={open} aria-expanded={open} onClick={toggleOpen}>
          <span className="w-full flex items-center gap-[.7rem]">
            <span className="category-select-main-icon">▣</span>
            <span className="category-select-text">{categoryLabel(value)}</span>
            <ChevronUpDownIcon className="category-select-chevron" />
          </span>
        </OriginButton>
        <AnimatePresence>
          {open && (
            <motion.div
              className="category-select-menu"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              style={{ transformOrigin: 'top left' }}
            >
              <div className="category-select-search">
                <Search className="category-select-search-icon" />
                <input
                  ref={searchRef}
                  type="text"
                  autoComplete="off"
                  placeholder="Buscar categoria..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="category-select-options">
                {filtered.length ? (
                  filtered.map((o) => (
                    <OriginButton
                      key={o}
                      className={`${OPTION_CLASS} ${categoryTone(o)}`}
                      active={o === value}
                      title={categoryLabel(o)}
                      onClick={() => select(o)}
                    >
                      <span className="w-full flex items-center gap-[.65rem]">
                        <span className="category-option-icon">{categoryIcon(o)}</span>
                        <span className="category-option-label">{categoryLabel(o)}</span>
                        {o === value && <CheckIcon className="category-option-check" />}
                      </span>
                    </OriginButton>
                  ))
                ) : (
                  <div className="category-select-empty">Nenhuma categoria encontrada</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
