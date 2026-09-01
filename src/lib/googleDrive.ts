// Chamadas direto na REST API v3 do Drive via fetch (mesmo padrão do
// aiClient.ts pra OpenAI) — sem o gapi client, que é bem mais pesado do que
// precisamos só pra listar/abrir arquivo.
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  modifiedTime?: string;
  size?: string;
}

const FOLDER_MIME = 'application/vnd.google-apps.folder';
const SPREADSHEET_MIME = 'application/vnd.google-apps.spreadsheet';

export function isFolder(file: DriveFile): boolean {
  return file.mimeType === FOLDER_MIME;
}

export class DriveAuthError extends Error {}

const FILE_FIELDS = 'files(id, name, mimeType, iconLink, webViewLink, webContentLink, modifiedTime, size)';

async function queryDrive(accessToken: string, query: string, orderBy: string): Promise<{ files: DriveFile[] }> {
  const params = new URLSearchParams({
    q: query,
    fields: FILE_FIELDS,
    orderBy,
    pageSize: '200',
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    if (res.status === 401) throw new DriveAuthError('Sessão do Google expirou — conecte de novo.');
    throw new Error(`Falha ao listar arquivos do Drive (HTTP ${res.status}).`);
  }

  const data = (await res.json()) as { files?: DriveFile[] };
  return { files: data.files || [] };
}

export function listDriveFiles(accessToken: string, folderId: string): Promise<{ files: DriveFile[] }> {
  return queryDrive(accessToken, `'${folderId}' in parents and trashed = false`, 'folder,name_natural');
}

// Lista todas as planilhas do Drive (qualquer pasta), mais recentes primeiro
// — não navega por pasta, é uma lista direta pra abrir rápido.
export function listSpreadsheets(accessToken: string): Promise<{ files: DriveFile[] }> {
  return queryDrive(accessToken, `mimeType = '${SPREADSHEET_MIME}' and trashed = false`, 'modifiedTime desc');
}
