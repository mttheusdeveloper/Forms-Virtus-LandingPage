import { useCallback, useEffect, useState } from 'react';
import { Sheet } from 'lucide-react';
import { clearGoogleToken, getStoredAccessToken, requestDriveAccessToken } from '../../lib/googleAuth';
import { DriveAuthError, listSpreadsheets, type DriveFile } from '../../lib/googleDrive';
import { PulsingIcon } from '../shared/PulsingIcon';
import { LoadingSkeleton } from '../shared/LoadingSkeleton';
import { SearchInput } from '../shared/SearchInput';

function formatModified(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `Editado em ${d.toLocaleDateString('pt-BR')}`;
}

// Lista as planilhas do Google Sheets (Drive inteiro, sem navegar por pasta)
// e abre no próprio Google Sheets ao clicar — reaproveita o mesmo login/token
// da aba Drive, já que o escopo (drive.readonly) cobre os dois.
export function SheetsTab() {
  const [accessToken, setAccessToken] = useState<string | null>(() => getStoredAccessToken());
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const filteredFiles = search.trim()
    ? files.filter((f) => f.name.toLowerCase().includes(search.trim().toLowerCase()))
    : files;

  const load = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const { files } = await listSpreadsheets(token);
      setFiles(files);
    } catch (err) {
      if (err instanceof DriveAuthError) {
        clearGoogleToken();
        setAccessToken(null);
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao carregar as planilhas.');
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
    setFiles([]);
  }

  if (!accessToken) {
    return (
      <section className="space-y-6">
        <div className="card p-10 flex flex-col items-center justify-center text-center gap-4">
          <PulsingIcon icon={Sheet} />
          <h2 className="font-semibold tracking-[-0.03em] text-lg">Conectar Google Planilhas</h2>
          <p className="text-sm text-[var(--muted-2)] max-w-md">
            Conecte a sua conta do Google pra ver suas planilhas e abrir direto por aqui.
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
    <section className="space-y-4">
      <div className="flex items-center justify-end">
        <button className="chip-btn" onClick={handleDisconnect}>
          Desconectar
        </button>
      </div>

      <SearchInput label="Buscar planilha" value={search} onChange={setSearch} />

      {loading ? (
        <LoadingSkeleton label="Carregando planilhas…" />
      ) : (
        <div className="card p-2">
          {error && <div className="p-6 text-sm text-[#F87171]">{error}</div>}
          {!error && files.length === 0 && (
            <div className="p-6 text-sm text-[var(--muted-2)]">Nenhuma planilha encontrada no seu Drive.</div>
          )}
          {!error && files.length > 0 && filteredFiles.length === 0 && (
            <div className="p-6 text-sm text-[var(--muted-2)]">Nada encontrado para "{search}".</div>
          )}
          {!error && filteredFiles.length > 0 && (
            <div className="divide-y divide-[var(--border)]">
              {filteredFiles.map((file) => (
                <SheetRow key={file.id} file={file} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SheetRow({ file }: { file: DriveFile }) {
  return (
    <div
      className="flex items-center gap-3 py-2.5 px-3 rounded-md hover:bg-[var(--surface-2)] cursor-pointer transition-colors"
      onClick={() => file.webViewLink && window.open(file.webViewLink, '_blank', 'noopener,noreferrer')}
    >
      {file.iconLink ? (
        <img src={file.iconLink} alt="" className="w-4 h-4 shrink-0" />
      ) : (
        <span className="text-base shrink-0">📊</span>
      )}
      <span className="flex-1 min-w-0 truncate text-sm text-[var(--text)]">{file.name}</span>
      <span className="text-xs text-[var(--muted-2)] shrink-0">{formatModified(file.modifiedTime)}</span>
    </div>
  );
}
