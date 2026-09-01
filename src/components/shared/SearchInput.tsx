import { useId } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Barra de busca com label flutuante (some pro lugar do placeholder e sobe
// pra cima da linha ao focar/preencher) — no lugar do placeholder estático
// que só some/aparece, sem indicar o campo depois de preenchido.
export function SearchInput({ label, value, onChange, className }: SearchInputProps) {
  const id = useId();

  return (
    <div className={`search-shell ${className ?? ''}`}>
      <Search className="search-icon" />
      <div className="search-field">
        <input id={id} className="search-input" value={value} onChange={(e) => onChange(e.target.value)} />
        <label htmlFor={id} className={`search-float-label ${value ? 'filled' : ''}`}>
          {label}
        </label>
      </div>
      {value && (
        <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="Limpar busca">
          ✕
        </button>
      )}
    </div>
  );
}
