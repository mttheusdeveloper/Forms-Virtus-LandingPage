// Login com Google via Google Identity Services (GIS) — fluxo 100%
// client-side (token implícito), sem backend e sem client_secret: cada
// usuário conecta a própria conta e recebe um access token só pro navegador
// dele. O token vive em sessionStorage (não sobrevive fechar a aba, evita
// deixar credencial "esquecida" no navegador de máquina compartilhada).
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// drive.readonly cobre listar/abrir arquivos (Drive, Planilhas); spreadsheets.readonly
// é necessário à parte pra ler o CONTEÚDO (células) de uma planilha (aba Contratos).
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly';
const STORAGE_KEY = 'virtus_google_drive_token';

interface StoredToken {
  accessToken: string;
  expiresAt: number;
}

let tokenClient: GoogleTokenClient | null = null;
let pendingResolve: ((token: string) => void) | null = null;
let pendingReject: ((err: Error) => void) | null = null;

function readStoredToken(): StoredToken | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredToken;
    if (!parsed.accessToken || parsed.expiresAt <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function storeToken(accessToken: string, expiresInSeconds: number) {
  const expiresAt = Date.now() + (expiresInSeconds - 60) * 1000;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken, expiresAt } satisfies StoredToken));
}

export function getStoredAccessToken(): string | null {
  return readStoredToken()?.accessToken ?? null;
}

export function clearGoogleToken() {
  sessionStorage.removeItem(STORAGE_KEY);
}

function getTokenClient(): GoogleTokenClient {
  if (!CLIENT_ID) {
    throw new Error('Falta VITE_GOOGLE_CLIENT_ID no .env (veja .env.example).');
  }
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services ainda não carregou — tente de novo em instantes.');
  }
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error || !response.access_token) {
          pendingReject?.(new Error(response.error || 'Falha ao autenticar com o Google.'));
        } else {
          storeToken(response.access_token, response.expires_in);
          pendingResolve?.(response.access_token);
        }
        pendingResolve = null;
        pendingReject = null;
      },
      error_callback: (error) => {
        pendingReject?.(new Error(error.type || 'Falha ao autenticar com o Google.'));
        pendingResolve = null;
        pendingReject = null;
      },
    });
  }
  return tokenClient;
}

// Reaproveita o token guardado se ainda for válido; senão abre o popup de
// login do Google e resolve quando o usuário concede acesso ao Drive.
export function requestDriveAccessToken(): Promise<string> {
  const stored = readStoredToken();
  if (stored) return Promise.resolve(stored.accessToken);

  return new Promise((resolve, reject) => {
    pendingResolve = resolve;
    pendingReject = reject;
    try {
      getTokenClient().requestAccessToken();
    } catch (err) {
      pendingResolve = null;
      pendingReject = null;
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}
