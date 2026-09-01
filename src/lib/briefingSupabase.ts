import { createClient } from '@supabase/supabase-js';

type Reference = { url: string; notes: string };

export type BriefingSubmission = {
  companyName: string; domainStatus: string; domain: string; mainObjective: string;
  targetAudience: string; productsServices: string; productsDescription: string;
  missionVisionValues: string; address: string; contactInfo: string; phones: string;
  emails: string; businessHours: string; companyNotes: string; references: Reference[];
  visualIdentity: string; identityGuideLink: string; imageLink: string; videoLink: string;
  deadline: string; finalNotes: string;
};

export type BriefingFiles = { identityGuide: File[]; images: File[]; videos: File[] };
type FileGroup = keyof BriefingFiles;

const BUCKET = 'briefing-files';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const FILE_RULES: Record<FileGroup, { maxBytes: number; maxCount: number; extensions: Set<string> }> = {
  identityGuide: { maxBytes: 25 * 1024 * 1024, maxCount: 10, extensions: new Set(['pdf', 'ai', 'eps', 'svg', 'png', 'jpg', 'jpeg', 'zip']) },
  images: { maxBytes: 25 * 1024 * 1024, maxCount: 30, extensions: new Set(['png', 'jpg', 'jpeg', 'webp', 'zip']) },
  videos: { maxBytes: 100 * 1024 * 1024, maxCount: 10, extensions: new Set(['mp4', 'mov', 'webm', 'zip']) },
};

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
        storage: window.sessionStorage,
      },
    })
  : null;

function fileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';
}

function sanitizeFileName(fileName: string) {
  const parts = fileName.split('.');
  const extension = parts.length > 1 ? `.${fileExtension(fileName)}` : '';
  const base = parts.slice(0, -1).join('.') || parts[0];
  const safeBase = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'arquivo';
  return `${safeBase}${extension}`;
}

function validateFiles(files: BriefingFiles) {
  (Object.keys(FILE_RULES) as FileGroup[]).forEach((group) => {
    const selected = files[group];
    const rules = FILE_RULES[group];
    if (selected.length > rules.maxCount) throw new Error('Muitos arquivos selecionados. Reduza a quantidade e tente novamente.');
    selected.forEach((file) => {
      if (!rules.extensions.has(fileExtension(file.name))) throw new Error(`O arquivo "${file.name}" possui um formato não permitido.`);
      if (file.size <= 0 || file.size > rules.maxBytes) throw new Error(`O arquivo "${file.name}" ultrapassa o limite permitido.`);
    });
  });
}

function isSafeWebUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch { return false; }
}

function validateSubmission(data: BriefingSubmission) {
  const lengthChecks: Array<[string, number]> = [
    [data.companyName, 200], [data.domain, 255], [data.mainObjective, 5000],
    [data.targetAudience, 5000], [data.productsServices, 5000], [data.productsDescription, 10000],
    [data.missionVisionValues, 5000], [data.address, 1000], [data.contactInfo, 1000],
    [data.phones, 500], [data.emails, 1000], [data.businessHours, 1000],
    [data.companyNotes, 10000], [data.finalNotes, 10000],
  ];
  if (lengthChecks.some(([value, limit]) => value.length > limit)) {
    throw new Error('Um dos textos ultrapassa o limite permitido. Reduza o conteúdo e tente novamente.');
  }
  if (data.references.length !== 5 || data.references.some((reference) => !reference.url.trim() || !reference.notes.trim() || reference.url.length > 2048 || reference.notes.length > 5000)) {
    throw new Error('Revise os cinco sites de referência e suas observações.');
  }
  if ([data.identityGuideLink, data.imageLink, data.videoLink].some((link) => !isSafeWebUrl(link))) {
    throw new Error('Revise os links informados. Utilize endereços iniciados por https://.');
  }
  if (data.references.some((reference) => !isSafeWebUrl(reference.url))) {
    throw new Error('Revise os sites de referência. Utilize endereços iniciados por https://.');
  }
}

async function getAnonymousUserId() {
  if (!supabase) throw new Error('A conexão segura ainda não foi configurada.');
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user.id) return sessionData.session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    if (import.meta.env.DEV) console.error('Supabase anonymous auth:', error);
    throw new Error('Não foi possível iniciar uma sessão segura. Tente novamente em instantes.');
  }
  return data.user.id;
}

function buildUploads(userId: string, submissionId: string, files: BriefingFiles) {
  const folders: Record<FileGroup, string> = { identityGuide: 'identity-guide', images: 'images', videos: 'videos' };
  return (Object.keys(folders) as FileGroup[]).flatMap((group) => files[group].map((file) => ({
    file,
    group,
    path: `${userId}/${submissionId}/${folders[group]}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`,
  })));
}

export async function submitBriefing(data: BriefingSubmission, files: BriefingFiles) {
  if (!supabase) throw new Error('A conexão segura ainda não foi configurada.');
  validateSubmission(data);
  validateFiles(files);

  const userId = await getAnonymousUserId();
  const submissionId = crypto.randomUUID();
  const uploads = buildUploads(userId, submissionId, files);
  const pathsFor = (group: FileGroup) => uploads.filter((upload) => upload.group === group).map((upload) => upload.path);

  const { error: insertError } = await supabase.from('briefing_responses').insert({
    id: submissionId,
    company_name: data.companyName.trim(),
    domain_status: data.domainStatus,
    domain: data.domain.trim(),
    main_objective: data.mainObjective.trim(),
    target_audience: data.targetAudience.trim(),
    products_services: data.productsServices.trim(),
    products_description: data.productsDescription.trim(),
    mission_vision_values: data.missionVisionValues.trim() || null,
    address: data.address.trim() || null,
    contact_info: data.contactInfo.trim() || null,
    phones: data.phones.trim() || null,
    emails: data.emails.trim() || null,
    business_hours: data.businessHours.trim() || null,
    company_notes: data.companyNotes.trim() || null,
    design_references: data.references.map((reference) => ({ url: reference.url.trim(), notes: reference.notes.trim() })),
    visual_identity_status: data.visualIdentity,
    identity_guide_link: data.identityGuideLink.trim() || null,
    identity_guide_files: pathsFor('identityGuide'),
    image_link: data.imageLink.trim() || null,
    image_files: pathsFor('images'),
    video_link: data.videoLink.trim() || null,
    video_files: pathsFor('videos'),
    desired_deadline: data.deadline,
    final_notes: data.finalNotes.trim() || null,
  });

  if (insertError) {
    if (import.meta.env.DEV) console.error('Supabase briefing insert:', insertError);
    throw new Error('Não foi possível salvar o briefing. Tente novamente em instantes.');
  }

  for (const upload of uploads) {
    const { error } = await supabase.storage.from(BUCKET).upload(upload.path, upload.file, {
      cacheControl: '3600',
      contentType: upload.file.type || undefined,
      upsert: false,
    });
    if (error) {
      if (import.meta.env.DEV) console.error('Supabase briefing upload:', error);
      throw new Error('O briefing foi salvo, mas um anexo não foi enviado. Entre em contato com a equipe Virtus.');
    }
  }

  return submissionId;
}

export async function resetBriefingSession() {
  if (!supabase) return;
  await supabase.auth.signOut({ scope: 'local' });
}
