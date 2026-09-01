import { DriveAuthError } from './googleDrive';

export interface SheetTab {
  sheetId: number;
  title: string;
}

export async function listSheetTabs(accessToken: string, spreadsheetId: string): Promise<SheetTab[]> {
  const fields = encodeURIComponent('sheets.properties(sheetId,title)');
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=${fields}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new DriveAuthError('Sessão do Google expirou ou sem permissão pra planilhas — conecte de novo.');
    throw new Error(`Falha ao ler as abas da planilha (HTTP ${res.status}).`);
  }
  const data = (await res.json()) as { sheets?: { properties: SheetTab }[] };
  return (data.sheets || []).map((s) => s.properties);
}

export async function getSheetValues(accessToken: string, spreadsheetId: string, sheetTitle: string): Promise<string[][]> {
  const range = encodeURIComponent(`'${sheetTitle.replace(/'/g, "''")}'`);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new DriveAuthError('Sessão do Google expirou ou sem permissão pra planilhas — conecte de novo.');
    throw new Error(`Falha ao ler os dados de "${sheetTitle}" (HTTP ${res.status}).`);
  }
  const data = (await res.json()) as { values?: string[][] };
  return data.values || [];
}

export type EbookClientStatus = 'never' | 'overdue' | 'soon' | 'ok';

export interface EbookRound {
  label: string;
  sent: boolean;
  dateLabel: string | null;
}

export interface EbookClient {
  client: string;
  rounds: EbookRound[];
  lastSentLabel: string | null;
  lastSentDate: Date | null;
  nextDueDate: Date | null;
  daysUntilDue: number | null;
  monthsUntilDue: number | null;
  status: EbookClientStatus;
}

export interface EbookControlData {
  clients: EbookClient[];
  cycleMonths: number;
}

const CYCLE_MONTHS = 3;
const SOON_THRESHOLD_DAYS = 14;

// Rótulo sempre bate com a cor do badge (c.status) — olhar só o
// arredondamento em meses faz um atraso de poucos dias (arredondando pra "0
// meses") sair com o texto "Vence este mês" só que na cor de atrasado.
export function monthsLabel(c: EbookClient): string {
  if (c.status === 'never') return 'Nunca enviado';
  if (c.monthsUntilDue === null) return '—';
  const m = Math.abs(c.monthsUntilDue);
  if (c.status === 'overdue') return m === 0 ? 'Atrasado' : `Atrasado há ${m} ${m === 1 ? 'mês' : 'meses'}`;
  if (c.status === 'soon') return m === 0 ? 'Vence este mês' : `Faltam ${m} ${m === 1 ? 'mês' : 'meses'}`;
  return `Faltam ${m} ${m === 1 ? 'mês' : 'meses'}`;
}

function parseBrDate(raw: string | undefined): Date | null {
  const m = raw?.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const year = y.length === 2 ? 2000 + Number(y) : Number(y);
  const date = new Date(year, Number(mo) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// Lê a aba "Controle Ebook": primeira coluna = cliente, e a partir daí pares
// [coluna "Ebook NN" (marcada quando enviado), coluna de data seguinte]. Pra
// cada cliente, acha o último envio feito e calcula quando o próximo vence
// (a cada 3 meses) — já devolve ordenado com quem está devendo/mais perto de
// vencer no topo, do jeito que se usa pra decidir quem mandar contrato novo primeiro.
export function parseEbookControl(values: string[][]): EbookControlData {
  if (values.length === 0) return { clients: [], cycleMonths: CYCLE_MONTHS };
  const [header, ...rows] = values;

  const rounds: { ebookCol: number; dateCol: number; label: string }[] = [];
  for (let i = 1; i < header.length; i++) {
    if ((header[i] || '').trim().toLowerCase().startsWith('ebook')) {
      rounds.push({ ebookCol: i, dateCol: i + 1, label: (header[i] || `Ebook ${rounds.length + 1}`).trim() });
    }
  }

  const now = new Date();

  const clients: EbookClient[] = rows
    .filter((row) => (row[0] || '').trim())
    .map((row) => {
      const client = row[0].trim();
      const roundStates = rounds.map((r) => {
        const sentRaw = row[r.ebookCol];
        const dateRaw = row[r.dateCol];
        const parsedDate = parseBrDate(dateRaw);
        return { label: r.label, sent: !!(sentRaw && sentRaw.trim()) && !!parsedDate, dateLabel: dateRaw || null, parsedDate };
      });

      let last: (typeof roundStates)[number] | null = null;
      for (const r of roundStates) {
        if (r.sent) last = r;
      }

      const lastSentDate = last?.parsedDate ?? null;
      const nextDueDate = lastSentDate ? addMonths(lastSentDate, CYCLE_MONTHS) : null;
      const daysUntilDue = nextDueDate ? Math.round((nextDueDate.getTime() - now.getTime()) / 86400000) : null;
      const monthsUntilDue = daysUntilDue !== null ? Math.round(daysUntilDue / 30) : null;

      let status: EbookClientStatus;
      if (!lastSentDate) status = 'never';
      else if (daysUntilDue !== null && daysUntilDue < 0) status = 'overdue';
      else if (daysUntilDue !== null && daysUntilDue <= SOON_THRESHOLD_DAYS) status = 'soon';
      else status = 'ok';

      return {
        client,
        rounds: roundStates.map(({ label, sent, dateLabel }) => ({ label, sent, dateLabel })),
        lastSentLabel: last?.label ?? null,
        lastSentDate,
        nextDueDate,
        daysUntilDue,
        monthsUntilDue,
        status,
      };
    });

  const statusRank: Record<EbookClientStatus, number> = { never: 0, overdue: 1, soon: 2, ok: 3 };
  clients.sort((a, b) => {
    const rankDiff = statusRank[a.status] - statusRank[b.status];
    if (rankDiff !== 0) return rankDiff;
    const at = a.nextDueDate ? a.nextDueDate.getTime() : -Infinity;
    const bt = b.nextDueDate ? b.nextDueDate.getTime() : -Infinity;
    return at - bt;
  });

  return { clients, cycleMonths: CYCLE_MONTHS };
}
