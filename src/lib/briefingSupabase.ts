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

const FILE_RULES: Record<FileGroup, { maxBytes: number; maxCount: number; extensions: Set<string> }> = {
  identityGuide: { maxBytes: 25 * 1024 * 1024, maxCount: 10, extensions: new Set(['pdf', 'ai', 'eps', 'svg', 'png', 'jpg', 'jpeg', 'zip']) },
  images: { maxBytes: 25 * 1024 * 1024, maxCount: 30, extensions: new Set(['png', 'jpg', 'jpeg', 'webp', 'zip']) },
  videos: { maxBytes: 100 * 1024 * 1024, maxCount: 10, extensions: new Set(['mp4', 'mov', 'webm', 'zip']) },
};

const GROUP_FOLDERS: Record<FileGroup, string> = { identityGuide: 'identity-guide', images: 'images', videos: 'videos' };

function fileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';
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

async function readJsonSafely(response: Response): Promise<{ error?: string; submissionId?: string } | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function submitBriefing(data: BriefingSubmission, files: BriefingFiles) {
  validateSubmission(data);
  validateFiles(files);

  const submitResponse = await fetch('/api/briefing/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const submitBody = await readJsonSafely(submitResponse);
  if (!submitResponse.ok || !submitBody?.submissionId) {
    throw new Error(submitBody?.error || 'Não foi possível salvar o briefing. Tente novamente em instantes.');
  }
  const submissionId = submitBody.submissionId;

  const uploads = (Object.keys(GROUP_FOLDERS) as FileGroup[]).flatMap((group) => files[group].map((file) => ({ file, group })));

  for (const upload of uploads) {
    const params = new URLSearchParams({ submissionId, group: GROUP_FOLDERS[upload.group], filename: upload.file.name });
    const uploadResponse = await fetch(`/api/briefing/upload?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': upload.file.type || 'application/octet-stream' },
      body: upload.file,
    });
    if (!uploadResponse.ok) {
      const uploadBody = await readJsonSafely(uploadResponse);
      throw new Error(uploadBody?.error || 'O briefing foi salvo, mas um anexo não foi enviado. Entre em contato com a equipe Virtus.');
    }
  }

  return submissionId;
}

export async function resetBriefingSession() {
  // Sem sessão a encerrar: o envio não depende mais de autenticação no navegador.
}
