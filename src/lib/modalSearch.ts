import { C } from './constants';
import { parseDate, num, normKey } from './parse';
import { fmtBRL2 } from './format';
import type { TxModalItem } from '../types';

export function modalRowHaystack(item: TxModalItem): string {
  const r = item.row;
  const d = parseDate(r[C.data]);
  const entrada = num(r[C.ent]);
  const saida = num(r[C.sai]);
  const total = entrada + saida;
  return normKey(
    [
      d ? d.toLocaleDateString('pt-BR') : '',
      item._mes || '',
      item._mesKey || '',
      String(r[C.conta] || ''),
      String(r[C.cat] || ''),
      String(r[C.desc] || ''),
      entrada ? fmtBRL2(entrada) : '',
      saida ? fmtBRL2(saida) : '',
      total ? fmtBRL2(total) : '',
    ].join(' '),
  );
}
