import { useCallback, useEffect, useState } from 'react';
import { Folder } from 'lucide-react';
import { clearGoogleToken, getStoredAccessToken, requestDriveAccessToken } from '../../lib/googleAuth';
import { DriveAuthError, isFolder, listDriveFiles, type DriveFile } from '../../lib/googleDrive';
import { PulsingIcon } from '../shared/PulsingIcon';
import { LoadingSkeleton } from '../shared/LoadingSkeleton';
import { SearchInput } from '../shared/SearchInput';

interface Crumb {
  id: string;
  name: string;
}

const ROOT: Crumb = { id: 'root', name: 'Meu Drive' };

function formatBytes(size?: string): string {
  if (!size) return '';
  const n = Number(size);
  if (!Number.isFinite(n) || n <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = n;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function DriveTab() {
  const [accessToken, setAccessToken] = useState<string | null>(() => getStoredAccessToken());
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [path, setPath] = useState<Crumb[]>([ROOT]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const currentFolder = path[path.length - 1];
  const filteredFiles = search.trim()
    ? files.filter((f) => f.name.toLowerCase().includes(search.trim().toLowerCase()))
    : files;

  // Empurra cada nível de pasta pro histórico do navegador, então "voltar"
  // (botão do navegador, botão lateral do mouse, ou o botão "Voltar" daqui)
  // sobe uma pasta em vez de sair do site.
  useEffect(() => {
    window.history.replaceState({ drivePath: [ROOT] }, '');
    function onPopState(e: PopStateEvent) {
      const state = e.state as { drivePath?: Crumb[] } | null;
      setPath(state?.drivePath ?? [ROOT]);
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const loadFolder = useCallback(async (token: string, folderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { files } = await listDriveFiles(token, folderId);
      setFiles(files);
    } catch (err) {
      if (err instanceof DriveAuthError) {
        clearGoogleToken();
        setAccessToken(null);
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao carregar arquivos do Drive.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accessToken) loadFolder(accessToken, currentFolder.id);
  }, [accessToken, currentFolder.id, loadFolder]);

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
    setPath([ROOT]);
    setFiles([]);
    window.history.replaceState({ drivePath: [ROOT] }, '');
  }

  function openFolder(file: DriveFile) {
    setSearch('');
    // pushState roda aqui fora do updater de estado de propósito: passado como
    // função pro setPath, o StrictMode chama o updater duas vezes (pra pegar
    // efeitos colaterais escondidos) e empurrava 2 entradas no histórico por
    // navegação — exigindo 2 cliques em "Voltar"/botão do mouse pra desfazer 1.
    const next = [...path, { id: file.id, name: file.name }];
    window.history.pushState({ drivePath: next }, '');
    setPath(next);
  }

  function goToCrumb(index: number) {
    setSearch('');
    const next = path.slice(0, index + 1);
    window.history.pushState({ drivePath: next }, '');
    setPath(next);
  }

  function goBack() {
    window.history.back();
  }

  if (!accessToken) {
    return (
      <section className="space-y-6">
        <div className="card p-10 flex flex-col items-center justify-center text-center gap-4">
          <PulsingIcon icon={Folder} />
          <h2 className="font-semibold tracking-[-0.03em] text-lg">Conectar Google Drive</h2>
          <p className="text-sm text-[var(--muted-2)] max-w-md">
            Conecte a sua conta do Google pra navegar e abrir os arquivos do seu Drive direto por aqui.
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 text-sm flex-wrap">
          {path.length > 1 && (
            <button className="chip-btn" onClick={goBack} aria-label="Voltar">
              ← Voltar
            </button>
          )}
          {path.map((crumb, i) => (
            <span key={crumb.id} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[var(--muted-2)]">/</span>}
              <button
                className={i === path.length - 1 ? 'text-[var(--text)] font-medium' : 'text-[var(--muted-2)] hover:text-[var(--text)] hover:underline'}
                onClick={() => goToCrumb(i)}
                disabled={i === path.length - 1}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>
        <button className="chip-btn" onClick={handleDisconnect}>
          Desconectar
        </button>
      </div>

      <SearchInput label="Buscar nesta pasta" value={search} onChange={setSearch} />

      {loading ? (
        <LoadingSkeleton label="Carregando arquivos…" />
      ) : (
        <div className="card p-2">
          {error && <div className="p-6 text-sm text-[#F87171]">{error}</div>}
          {!error && files.length === 0 && <div className="p-6 text-sm text-[var(--muted-2)]">Pasta vazia.</div>}
          {!error && files.length > 0 && filteredFiles.length === 0 && (
            <div className="p-6 text-sm text-[var(--muted-2)]">Nada encontrado para "{search}".</div>
          )}
          {!error && filteredFiles.length > 0 && (
            <div className="divide-y divide-[var(--border)]">
              {filteredFiles.map((file) => (
                <DriveRow key={file.id} file={file} onOpenFolder={() => openFolder(file)} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function DriveRow({ file, onOpenFolder }: { file: DriveFile; onOpenFolder: () => void }) {
  const folder = isFolder(file);

  return (
    <div
      className="flex items-center gap-3 py-2.5 px-3 rounded-md hover:bg-[var(--surface-2)] cursor-pointer transition-colors"
      onClick={() => {
        if (folder) onOpenFolder();
        else if (file.webViewLink) window.open(file.webViewLink, '_blank', 'noopener,noreferrer');
      }}
    >
      {file.iconLink ? (
        <img src={file.iconLink} alt="" className="w-4 h-4 shrink-0" />
      ) : (
        <span className="text-base shrink-0">{folder ? '📁' : '📄'}</span>
      )}
      <span className="flex-1 min-w-0 truncate text-sm text-[var(--text)]">{file.name}</span>
      {!folder && <span className="text-xs text-[var(--muted-2)] shrink-0">{formatBytes(file.size)}</span>}
      {!folder && file.webContentLink && (
        <a
          href={file.webContentLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-[var(--muted-2)] hover:text-[var(--accent)] hover:underline shrink-0"
        >
          Baixar
        </a>
      )}
    </div>
  );
}
