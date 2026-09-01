import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

type Reference = { url: string; notes: string };

type BriefingSubmission = {
  companyName: string; domainStatus: string; domain: string; mainObjective: string;
  targetAudience: string; productsServices: string; productsDescription: string;
  missionVisionValues: string; address: string; contactInfo: string; phones: string;
  emails: string; businessHours: string; companyNotes: string; references: Reference[];
  visualIdentity: string; identityGuideLink: string; imageLink: string; videoLink: string;
  deadline: string; finalNotes: string;
};

function getClient() {
  const supabaseUrl = process.env.BRIEFING_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Credenciais do Supabase não configuradas no servidor.');
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

function isSafeWebUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function normalizeWebUrl(value: unknown) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

function normalizeSubmission(input: BriefingSubmission): BriefingSubmission {
  return {
    ...input,
    identityGuideLink: normalizeWebUrl(input?.identityGuideLink),
    imageLink: normalizeWebUrl(input?.imageLink),
    videoLink: normalizeWebUrl(input?.videoLink),
    references: Array.isArray(input?.references)
      ? input.references
        .filter((reference) => reference?.url?.trim() || reference?.notes?.trim())
        .map((reference) => ({ url: normalizeWebUrl(reference.url), notes: reference.notes?.trim() || '' }))
      : [],
  };
}

function referencesForStorage(references: Reference[]) {
  return Array.from({ length: 5 }, (_, index) => references[index] ?? { url: '', notes: '' });
}

function validateSubmission(data: BriefingSubmission) {
  if (!data || typeof data !== 'object') throw new Error('Dados inválidos.');

  const required: Array<[string, unknown]> = [
    ['companyName', data.companyName], ['domainStatus', data.domainStatus], ['domain', data.domain],
    ['mainObjective', data.mainObjective], ['targetAudience', data.targetAudience],
    ['productsServices', data.productsServices], ['productsDescription', data.productsDescription],
    ['visualIdentity', data.visualIdentity], ['deadline', data.deadline],
  ];
  if (required.some(([, value]) => typeof value !== 'string' || !value.trim())) {
    throw new Error('Preencha todos os campos obrigatórios.');
  }
  if (!['Sim', 'Não'].includes(data.domainStatus)) throw new Error('Status de domínio inválido.');
  if (!['Sim', 'Não', 'Em desenvolvimento'].includes(data.visualIdentity)) throw new Error('Status de identidade visual inválido.');
  if (!['15 dias', '30 dias', '45 dias', '60 dias'].includes(data.deadline)) throw new Error('Prazo inválido.');

  const lengthChecks: Array<[string, number]> = [
    [data.companyName, 200], [data.domain, 255], [data.mainObjective, 5000],
    [data.targetAudience, 5000], [data.productsServices, 5000], [data.productsDescription, 10000],
    [data.missionVisionValues ?? '', 5000], [data.address ?? '', 1000], [data.contactInfo ?? '', 1000],
    [data.phones ?? '', 500], [data.emails ?? '', 1000], [data.businessHours ?? '', 1000],
    [data.companyNotes ?? '', 10000], [data.finalNotes ?? '', 10000],
  ];
  if (lengthChecks.some(([value, limit]) => value.length > limit)) {
    throw new Error('Um dos textos ultrapassa o limite permitido. Reduza o conteúdo e tente novamente.');
  }

  if (
    !Array.isArray(data.references) ||
    data.references.length < 1 ||
    data.references.length > 5 ||
    data.references.some((reference) => !reference?.url?.trim() || !reference?.notes?.trim() || reference.url.length > 2048 || reference.notes.length > 5000)
  ) {
    throw new Error('Revise os sites de referência e suas observações.');
  }
  if ([data.identityGuideLink, data.imageLink, data.videoLink].some((link) => link && !isSafeWebUrl(link))) {
    throw new Error('Revise os links informados.');
  }
  if (data.references.some((reference) => !isSafeWebUrl(reference.url))) {
    throw new Error('Revise os sites de referência.');
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const data = normalizeSubmission(req.body as BriefingSubmission);
    validateSubmission(data);

    const supabase = getClient();
    const submissionId = randomUUID();
    const { error } = await supabase.from('briefing_responses').insert({
      id: submissionId,
      company_name: data.companyName.trim(),
      domain_status: data.domainStatus,
      domain: data.domain.trim(),
      main_objective: data.mainObjective.trim(),
      target_audience: data.targetAudience.trim(),
      products_services: data.productsServices.trim(),
      products_description: data.productsDescription.trim(),
      mission_vision_values: data.missionVisionValues?.trim() || null,
      address: data.address?.trim() || null,
      contact_info: data.contactInfo?.trim() || null,
      phones: data.phones?.trim() || null,
      emails: data.emails?.trim() || null,
      business_hours: data.businessHours?.trim() || null,
      company_notes: data.companyNotes?.trim() || null,
      // O banco legado exige um array com cinco posições. As referências não
      // preenchidas permanecem vazias, sem obrigar o usuário a informar todas.
      design_references: referencesForStorage(data.references),
      visual_identity_status: data.visualIdentity,
      identity_guide_link: data.identityGuideLink?.trim() || null,
      identity_guide_files: [],
      image_link: data.imageLink?.trim() || null,
      image_files: [],
      video_link: data.videoLink?.trim() || null,
      video_files: [],
      desired_deadline: data.deadline,
      final_notes: data.finalNotes?.trim() || null,
    });

    if (error) {
      console.error('Supabase briefing insert:', error);
      res.status(500).json({ error: 'Não foi possível salvar o briefing. Tente novamente em instantes.' });
      return;
    }

    res.status(200).json({ submissionId });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Dados inválidos.' });
  }
}
