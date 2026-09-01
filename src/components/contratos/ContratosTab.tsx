import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { FileText, Users, AlertTriangle, Clock, CheckCircle2, Inbox, type LucideIcon } from 'lucide-react';
import { clearGoogleToken, getStoredAccessToken, requestDriveAccessToken } from '../../lib/googleAuth';
import { DriveAuthError } from '../../lib/googleDrive';
import { getSheetValues, listSheetTabs, parseEbookControl, monthsLabel, type EbookClient, type EbookControlData } from '../../lib/googleSheets';
import { useModals } from '../../state/ModalsContext';
import { OriginButton } from '../ui/origin-button';
import { PulsingIcon } from '../shared/PulsingIcon';
import { LoadingSkeleton } from '../shared/LoadingSkeleton';
import { SearchInput } from '../shared/SearchInput';
import { KpiCard } from '../shared/KpiCard';

const FILTER_CHIP_CLASS = 'h-auto py-1.5 px-3 rounded-md text-[.74rem] font-semibold gap-1';

// Planilha "Contratos Virtus [Clientes]" — ID fixo (do link), mais confiável
// que buscar pelo nome no Drive (evita ambiguidade se houver cópias/arquivos
// com nome parecido).
const SPREADSHEET_ID = '17AOa0PcTw0IamndcCK9sNGpSfIwtNLJV47alOMwuh6M';
const EBOOK_TAB_MATCH = 'controle ebook';

interface EbookTabState {
  title: string;
  data: EbookControlData;
}

export function ContratosTab() {
  const [accessToken, setAccessToken] = useState<string | null>(() => getStoredAccessToken());
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ebookTab, setEbookTab] = useState<EbookTabState | null>(null);

  const load = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    setEbookTab(null);
    try {
      const allTabs = await listSheetTabs(token, SPREADSHEET_ID);
      const ebook = allTabs.find((t) => t.title.toLowerCase().includes(EBOOK_TAB_MATCH));
      if (!ebook) {
        setError('Não achei a aba "Controle Ebook [Virtus]" nessa planilha.');
        return;
      }

      const values = await getSheetValues(token, SPREADSHEET_ID, ebook.title);
      setEbookTab({ title: ebook.title, data: parseEbookControl(values) });
    } catch (err) {
      if (err instanceof DriveAuthError) {
        clearGoogleToken();
        setAccessToken(null);
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao carregar os dados da planilha.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accessToken) load(accessToken);
  }, [accessToken, load]);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const token = await requestDriveAccessToken();
      setAccessToken(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível conectar ao Google.');
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    clearGoogleToken();
    setAccessToken(null);
    setEbookTab(null);
  }

  if (!accessToken) {
    return (
      <section className="space-y-6">
        <div className="card p-10 flex flex-col items-center justify-center text-center gap-4">
          <PulsingIcon icon={FileText} />
          <h2 className="font-semibold tracking-[-0.03em] text-lg">Conectar Contratos</h2>
          <p className="text-sm text-[var(--muted-2)] max-w-md">
            Conecte a sua conta do Google pra puxar os dados da planilha de contratos direto por aqui.
          </p>
          {error && <p className="text-sm text-[#F87171]">{error}</p>}
          <button className="chip-btn active" onClick={handleConnect} disabled={connecting}>
            {connecting ? 'Conectando…' : 'Conectar com o Google'}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-end">
        <button className="chip-btn" onClick={handleDisconnect}>
          Desconectar
        </button>
      </div>

      {loading && <LoadingSkeleton label="Carregando dados da planilha…" />}
      {!loading && error && <div className="card p-4 text-sm text-[#F87171]">{error}</div>}
      {!loading && ebookTab && <EbookControlSection data={ebookTab.data} />}
    </section>
  );
}

const STATUS_FILTERS: { key: EbookClient['status'] | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'overdue', label: 'Atrasados' },
  { key: 'soon', label: 'Vencendo em breve' },
  { key: 'ok', label: 'Em dia' },
  { key: 'never', label: 'Nunca enviado' },
];

const STATUS_ICON: Record<EbookClient['status'], LucideIcon> = {
  overdue: AlertTriangle,
  soon: Clock,
  ok: CheckCircle2,
  never: Inbox,
};

const SECTION_ORDER: { status: EbookClient['status']; label: string }[] = [
  { status: 'never', label: 'Nunca enviado' },
  { status: 'overdue', label: 'Atrasados' },
  { status: 'soon', label: 'Vencendo em breve' },
  { status: 'ok', label: 'Em dia' },
];

// Cor de cada status — vira variável CSS no card (--status-color/--status-tint)
// pra colorir só o ícone, a barra lateral e o badge, mantendo o fundo escuro
// igual ao resto do site em vez do preenchimento sólido do card do Mensal.
const STATUS_COLOR: Record<EbookClient['status'], string> = {
  overdue: '#F87171',
  soon: '#FBBF24',
  ok: '#34D399',
  never: '#9CA3AF',
};

function ContractCard({ c, onOpen }: { c: EbookClient; onOpen: () => void }) {
  const Icon = STATUS_ICON[c.status];
  const color = STATUS_COLOR[c.status];

  return (
    <div
      className="contract-card"
      style={{ '--status-color': color, '--status-tint': `${color}24` } as CSSProperties}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="contract-card-top">
        <span className="contract-card-icon">
          <Icon />
        </span>
        <span className="contract-card-ebook">{c.lastSentLabel || 'Nenhum ainda'}</span>
      </div>
      <div className="contract-card-name" title={c.client}>
        {c.client}
      </div>
      <span className={`contract-status-badge status-${c.status}`}>{monthsLabel(c)}</span>
    </div>
  );
}

// Visão enxuta pra "de 3 em 3 meses tem que mandar contrato novo": só 3
// colunas — cliente, em qual ebook ele está, e quantos meses faltam pro
// próximo — em vez de expor todas as colunas/datas cruas da planilha. Já vem
// ordenado (do parseEbookControl) com quem está devendo no topo.
function EbookControlSection({ data }: { data: EbookControlData }) {
  const { clients, cycleMonths } = data;
  const { openContractDetail } = useModals();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EbookClient['status'] | 'all'>('all');

  const counts = useMemo(
    () => ({
      all: clients.length,
      overdue: clients.filter((c) => c.status === 'overdue').length,
      soon: clients.filter((c) => c.status === 'soon').length,
      ok: clients.filter((c) => c.status === 'ok').length,
      never: clients.filter((c) => c.status === 'never').length,
    }),
    [clients],
  );

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (q && !c.client.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [clients, statusFilter, search]);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-semibold tracking-[-0.03em] text-lg">Envio de contratos</h2>
        <p className="text-xs text-[var(--muted-2)] mt-0.5">Novo contrato a cada {cycleMonths} meses — quem está devendo aparece primeiro.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard
          icon={<Users className="w-4 h-4" />}
          label="Total de clientes"
          value={counts.all}
          tone="info"
          pillText="CONTRATOS"
          sub={<p className="text-[.7rem] text-white/70 mt-1">Base de clientes ativos</p>}
          onClick={() => setStatusFilter('all')}
        />
        <KpiCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Atrasados"
          value={counts.overdue}
          tone="negative"
          pillText="AÇÃO NECESSÁRIA"
          sub={<p className="text-[.7rem] text-white/70 mt-1">Contrato vencido, enviar já</p>}
          onClick={() => setStatusFilter('overdue')}
        />
        <KpiCard
          icon={<Clock className="w-4 h-4" />}
          label="Vencendo em breve"
          value={counts.soon}
          tone="orange"
          pillText="PRAZO CURTO"
          sub={<p className="text-[.7rem] text-white/70 mt-1">Vence nos próximos 14 dias</p>}
          onClick={() => setStatusFilter('soon')}
        />
        <KpiCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Em dia"
          value={counts.ok}
          tone="positive"
          pillText="SEM PENDÊNCIA"
          sub={<p className="text-[.7rem] text-white/70 mt-1">Dentro do ciclo de {cycleMonths} meses</p>}
          onClick={() => setStatusFilter('ok')}
        />
        <KpiCard
          icon={<Inbox className="w-4 h-4" />}
          label="Nunca enviado"
          value={counts.never}
          tone="info"
          pillText="NOVO CLIENTE"
          sub={<p className="text-[.7rem] text-white/70 mt-1">Ainda sem o 1º ebook</p>}
          onClick={() => setStatusFilter('never')}
        />
      </div>

      <SearchInput label="Buscar cliente" value={search} onChange={setSearch} className="max-w-sm" />

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <OriginButton
            key={f.key}
            className={FILTER_CHIP_CLASS}
            active={statusFilter === f.key}
            onClick={() => setStatusFilter(f.key)}
          >
            {f.label} ({counts[f.key]})
          </OriginButton>
        ))}
      </div>

      {filteredClients.length === 0 ? (
        <div className="card p-10 text-center text-[var(--muted)]">
          {clients.length === 0 ? 'Sem dados' : 'Nada encontrado com esse filtro/busca.'}
        </div>
      ) : (
        <div className="space-y-6">
          {SECTION_ORDER.map(({ status, label }) => {
            const group = filteredClients.filter((c) => c.status === status);
            if (group.length === 0) return null;
            return (
              <div key={status}>
                <div className={`contract-section-header status-${status}`}>
                  <span className="contract-section-dot" />
                  {label}
                  <span className="contract-section-count">{group.length}</span>
                </div>
                <div className="contract-card-grid">
                  {group.map((c) => (
                    <ContractCard key={c.client} c={c} onOpen={() => openContractDetail(c)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
