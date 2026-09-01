import { monthlyRowInfo } from './rows';
import type { MensalFilterState, RawRow } from '../types';

export function applyFilter(rows: RawRow[], mesLabel: string | null | undefined, f: MensalFilterState): RawRow[] {
  if (mesLabel && !f.mesesSel.has(mesLabel.toLowerCase())) return [];

  const out: RawRow[] = [];
  for (const r of rows) {
    const info = monthlyRowInfo(r);
    if (!info.valid) continue;
    if (f.tipo === 'entrada' && !(info.ent > 0)) continue;
    if (f.tipo === 'saida' && !(info.sai > 0)) continue;
    if (f.cat !== 'all' && info.cat !== f.cat) continue;
    if (f.conta !== 'all' && info.conta !== f.conta) continue;
    if (f.dayMin != null && info.day != null && info.day < f.dayMin) continue;
    if (f.dayMax != null && info.day != null && info.day > f.dayMax) continue;
    if (f.valMin != null && info.value < f.valMin) continue;
    if (f.valMax != null && info.value > f.valMax) continue;
    out.push(r);
  }
  return out;
}
