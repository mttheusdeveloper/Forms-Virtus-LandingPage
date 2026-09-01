import { normKey } from './parse';

export function categoryIcon(value: string): string {
  const s = normKey(value);
  if (value === 'all') return '▣';
  if (s.includes('trafego')) return '↗';
  if (s.includes('energia')) return '⚡';
  if (s.includes('imposto')) return '◫';
  if (s.includes('salario') || s.includes('freelance')) return '◌';
  if (s.includes('bancaria') || s.includes('financeira')) return '▦';
  if (s.includes('curso') || s.includes('mentoria')) return '◇';
  if (s.includes('aluguel') || s.includes('limpeza')) return '⌂';
  if (s.includes('receita') || s.includes('lancamento')) return '↥';
  return '•';
}

export function categoryTone(value: string): string {
  const s = normKey(value);
  if (value === 'all') return '';
  if (s.includes('receita')) return 'cat-tone-receita';
  if (s.includes('financeira')) return 'cat-tone-financeira';
  if (s.includes('despesa')) return 'cat-tone-despesa';
  if (s.includes('custo')) return 'cat-tone-custo';
  return '';
}

export function categoryLabel(value: string): string {
  if (!value || value === 'all') return 'Todas as categorias';
  return String(value);
}
