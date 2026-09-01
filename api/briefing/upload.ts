import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export const config = { api: { bodyParser: false } };

const BUCKET = 'briefing-files';
const GROUP_COLUMNS: Record<string, string> = {
  'identity-guide': 'identity_guide_files',
  images: 'image_files',
  videos: 'video_files',
};

const FILE_RULES: Record<string, { maxBytes: number; extensions: Set<string> }> = {
  'identity-guide': { maxBytes: 25 * 1024 * 1024, extensions: new Set(['pdf', 'ai', 'eps', 'svg', 'png', 'jpg', 'jpeg', 'zip']) },
  images: { maxBytes: 25 * 1024 * 1024, extensions: new Set(['png', 'jpg', 'jpeg', 'webp', 'zip']) },
  videos: { maxBytes: 100 * 1024 * 1024, extensions: new Set(['mp4', 'mov', 'webm', 'zip']) },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const COMBINING_DIACRITIC_START = 768;
const COMBINING_DIACRITIC_END = 879;

function stripDiacritics(value: string) {
  let result = '';
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code >= COMBINING_DIACRITIC_START && code <= COMBINING_DIACRITIC_END) continue;
    result += char;
  }
  return result;
}

function getClient() {
  const supabaseUrl = process.env.BRIEFING_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Credenciais do Supabase não configuradas no servidor.');
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

function fileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';
}

function sanitizeFileName(fileName: string) {
  const parts = fileName.split('.');
  const extension = parts.length > 1 ? `.${fileExtension(fileName)}` : '';
  const base = parts.slice(0, -1).join('.') || parts[0];
  const safeBase = stripDiacritics(base.normalize('NFD')).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'arquivo';
  return `${safeBase}${extension}`;
}

async function readBody(req: AsyncIterable<Buffer>): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const submissionId = String(req.query.submissionId || '');
    const group = String(req.query.group || '');
    const filename = String(req.query.filename || '');

    if (!UUID_RE.test(submissionId)) throw new Error('Briefing inválido.');
    const rules = FILE_RULES[group];
    if (!rules) throw new Error('Categoria de arquivo inválida.');
    if (!filename) throw new Error('Nome de arquivo inválido.');
    const extension = fileExtension(filename);
    if (!rules.extensions.has(extension)) throw new Error(`O arquivo "${filename}" possui um formato não permitido.`);

    const buffer = await readBody(req);
    if (buffer.length === 0 || buffer.length > rules.maxBytes) {
      throw new Error(`O arquivo "${filename}" ultrapassa o limite permitido.`);
    }

    const supabase = getClient();
    const column = GROUP_COLUMNS[group];
    const { data: submission, error: lookupError } = await supabase
      .from('briefing_responses')
      .select('*')
      .eq('id', submissionId)
      .maybeSingle();
    if (lookupError || !submission) throw new Error('Briefing não encontrado.');

    const path = `${submissionId}/${group}/${randomUUID()}-${sanitizeFileName(filename)}`;
    const contentType = req.headers['content-type'] || undefined;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: false });
    if (uploadError) {
      console.error('Supabase briefing upload:', uploadError);
      throw new Error('Falha ao enviar o arquivo.');
    }

    const existing = ((submission as Record<string, string[] | null>)[column]) || [];
    const { error: updateError } = await supabase
      .from('briefing_responses')
      .update({ [column]: [...existing, path] })
      .eq('id', submissionId);
    if (updateError) console.error('Supabase briefing file list update:', updateError);

    res.status(200).json({ path });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Não foi possível enviar o arquivo.' });
  }
}
