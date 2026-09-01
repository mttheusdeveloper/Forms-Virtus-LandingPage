import { useState } from 'react';
import { C } from '../../lib/constants';
import { parseDate, num, normKey } from '../../lib/parse';
import { fmtBRL2 } from '../../lib/format';
import { modalRowHaystack } from '../../lib/modalSearch';
import { useModals } from '../../state/ModalsContext';
import { ModalShell } from './ModalShell';
import { OriginButton } from '../ui/origin-button';
import { SearchInput } from '../shared/SearchInput';
import type { TxModalItem } from '../../types';

const CLOSE_BTN_CLASS = 'h-auto py-1.5 px-3 rounded-md text-[.74rem] font-semibold gap-1';

// Porta do modal genérico de transações (script.js:1298-1483) — reaproveitado
// por 5 "abridores" diferentes (ver hooks/useTxModalActions.ts).
export function TxModal() {
  const { tx, closeTx } = useModals();
  const [search, setSearch] = useState('');

  if (!tx.open) return null;

  const terms = normKey(search).split(/\s+/).filter(Boolean);
  const filtered = terms.length ? tx.items.filter((item) => terms.every((t) => modalRowHaystack(item).includes(t))) : tx.items;

  return (
    <ModalShell onBackdropClick={closeTx}>
      <div className="card tx-modal-card max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <div className="section-eyebrow mb-1">{tx.eyebrow}</div>
            <h2 className="font-semibold tracking-[-0.03em] text-lg">{tx.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--muted)]">
              {terms.length ? `${filtered.length} de ${tx.items.length} registros` : `${tx.items.length} registros`}
            </span>
            <OriginButton className={CLOSE_BTN_CLASS} onClick={closeTx}>
              ✕ Fechar
            </OriginButton>
          </div>
        </div>
        <div className="modal-toolbar px-6 py-3 border-b border-[var(--border)] flex flex-wrap items-center gap-3">
          <SearchInput label="Busque por data, mês, conta, categoria, descrição, entradas ou saídas" value={search} onChange={setSearch} />
          <span className="modal-filter-pill">
            {terms.length ? `Filtrando: ${filtered.length}/${tx.items.length}` : 'Pesquise em todas as colunas do pop-up'}
          </span>
        </div>
        <div className="modal-table-wrap flex-1">
          <table className="w-full annual-summary-table">
            <thead className="bg-[var(--surface)] sticky top-0">
              <tr>
                {tx.headCells.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((item, i) => <TxRow key={i} item={item} />)
              ) : (
                <tr>
                  <td colSpan={tx.colSpan} className="text-center text-[var(--muted)] py-10">
                    {tx.emptyMsg}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ModalShell>
  );
}

function TxRow({ item }: { item: TxModalItem }) {
  const r = item.row;
  const d = parseDate(r[C.data]);
  const mes = item._mes || '-';
  const mesKey = item._mesKey || '';
  const entrada = num(r[C.ent]);
  const saida = num(r[C.sai]);
  const pillClass = mesKey === 'total' ? 'pill-up' : 'pill-amber';

  return (
    <tr>
      <td className="mono">{d ? d.toLocaleDateString('pt-BR') : '-'}</td>
      <td>
        <span className={`pill ${pillClass}`}>{mes}</span>
      </td>
      <td>{String(r[C.conta] || '-')}</td>
      <td>{String(r[C.cat] || '-')}</td>
      <td className="modal-desc-cell">{String(r[C.desc] || '-')}</td>
      <td className="text-right mono money-pos modal-money">{entrada ? fmtBRL2(entrada) : '-'}</td>
      <td className="text-right mono money-neg modal-money">{saida ? fmtBRL2(saida) : '-'}</td>
    </tr>
  );
}
