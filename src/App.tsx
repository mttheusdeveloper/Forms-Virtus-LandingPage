import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft, ArrowRight, Building2, CalendarClock, Check,
  ClipboardCheck, CloudUpload, FileText, Globe2, Image, Info, LayoutTemplate,
  MessageSquareText, Palette, Paperclip, Sparkles, Target, Video, X,
} from 'lucide-react';
import { OriginButton } from './components/ui/origin-button';
import { resetBriefingSession, submitBriefing } from './lib/briefingSupabase';

type Reference = { url: string; notes: string };
type BriefingData = {
  companyName: string; domainStatus: string; domain: string; mainObjective: string;
  targetAudience: string; productsServices: string; productsDescription: string;
  missionVisionValues: string; address: string; contactInfo: string; phones: string;
  emails: string; businessHours: string; companyNotes: string; references: Reference[];
  visualIdentity: string; identityGuideLink: string; imageLink: string; videoLink: string;
  deadline: string; finalNotes: string;
};
type FileState = { identityGuide: File[]; images: File[]; videos: File[] };

const STORAGE_KEY = 'virtus-briefing-draft-v1';
const INITIAL_DATA: BriefingData = {
  companyName: '', domainStatus: '', domain: '', mainObjective: '', targetAudience: '',
  productsServices: '', productsDescription: '', missionVisionValues: '', address: '',
  contactInfo: '', phones: '', emails: '', businessHours: '', companyNotes: '',
  references: Array.from({ length: 5 }, () => ({ url: '', notes: '' })),
  visualIdentity: '', identityGuideLink: '', imageLink: '', videoLink: '', deadline: '', finalNotes: '',
};
const INITIAL_FILES: FileState = { identityGuide: [], images: [], videos: [] };

const STEPS = [
  { title: 'Identificação e Domínio', short: 'Identificação', description: 'Dados iniciais da sua empresa', icon: Building2 },
  { title: 'Objetivo e Público-Alvo', short: 'Objetivo', description: 'O que o projeto precisa alcançar', icon: Target },
  { title: 'Sobre a Empresa', short: 'Empresa', description: 'Conteúdo, contato e posicionamento', icon: FileText },
  { title: 'Referências de Design', short: 'Referências', description: 'Sites e experiências que inspiram', icon: LayoutTemplate },
  { title: 'Identidade Visual', short: 'Identidade', description: 'Marca, cores e materiais existentes', icon: Palette },
  { title: 'Materiais de Mídia', short: 'Mídia', description: 'Imagens e vídeos para o projeto', icon: Image },
  { title: 'Prazo', short: 'Prazo', description: 'Quando você deseja colocar o site no ar', icon: CalendarClock },
  { title: 'Observações Finais', short: 'Finalização', description: 'Revise e compartilhe os últimos detalhes', icon: MessageSquareText },
];

function Field({ label, hint, required, children, className = '' }: { label: string; hint?: string; required?: boolean; children: ReactNode; className?: string }) {
  return <label className={`form-field ${className}`}>
    {hint && <span className="field-hint">{hint}</span>}
    <div className="floating-field-control">
      {children}
      <span className="field-label floating-field-label">{label} {required ? <span className="required-mark">*</span> : <span className="optional-mark">opcional</span>}</span>
    </div>
  </label>;
}

function ChoiceGroup({ label, value, options, onChange, invalid = false }: { label: string; value: string; options: string[]; onChange: (value: string) => void; invalid?: boolean }) {
  return <fieldset className={`choice-field ${invalid ? 'has-error' : ''}`}>
    <legend className="field-label">{label} <span className="required-mark">*</span></legend>
    <div className="choice-grid">{options.map((option) => <OriginButton effectOnly active={value === option} type="button" className={`choice-card ${value === option ? 'selected' : ''}`} onClick={() => onChange(option)} aria-pressed={value === option} aria-invalid={invalid || undefined} key={option}>
      <span className="choice-radio">{value === option && <Check size={12} strokeWidth={3} />}</span>{option}
    </OriginButton>)}</div>
  </fieldset>;
}

function FileDrop({ title, description, accept, files, icon, onFiles, onRemove }: { title: string; description: string; accept: string; files: File[]; icon: ReactNode; onFiles: (files: File[]) => void; onRemove: (index: number) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length) onFiles(selected);
    event.target.value = '';
  };
  return <div className="upload-wrap">
    <OriginButton effectOnly type="button" className="upload-zone" onClick={() => inputRef.current?.click()}>
      <span className="upload-icon">{icon}</span><span className="upload-copy"><strong>{title}</strong><small>{description}</small></span>
      <span className="upload-action"><CloudUpload size={15} /> Selecionar</span>
    </OriginButton>
    <input ref={inputRef} type="file" hidden accept={accept} multiple onChange={handleFiles} />
    {files.length > 0 && <div className="file-list">{files.map((file, index) => <div className="file-row" key={`${file.name}-${file.lastModified}-${index}`}>
      <Paperclip size={14} /><span>{file.name}</span><small>{formatFileSize(file.size)}</small>
      <OriginButton effectOnly type="button" onClick={() => onRemove(index)} aria-label={`Remover ${file.name}`}><X size={14} /></OriginButton>
    </div>)}</div>}
  </div>;
}

function formatFileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function loadDraft(): BriefingData {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}-submitted`);
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL_DATA;
    const parsed = JSON.parse(saved) as Partial<BriefingData>;
    return { ...INITIAL_DATA, ...parsed, references: Array.from({ length: 5 }, (_, index) => ({ ...INITIAL_DATA.references[index], ...(parsed.references?.[index] ?? {}) })) };
  } catch { return INITIAL_DATA; }
}

function BriefingIntro({ onStart }: { onStart: () => void }) {
  return <section className="briefing-intro" aria-labelledby="briefing-intro-title">
    <header className="briefing-intro-header">
      <span className="briefing-intro-icon"><ClipboardCheck size={22} /></span>
      <div><p className="section-eyebrow">Antes de começar</p><h1 id="briefing-intro-title">Prepare seus materiais</h1></div>
    </header>
    <p className="briefing-intro-lead">Este briefing coleta informações essenciais para desenvolver seu site ou landing page. Para agilizar o processo, organize todo o material necessário antes de começar. Informações completas e detalhadas nos ajudam a criar o produto ideal.</p>
    <div className="briefing-intro-grid">
      <div className="briefing-intro-section">
        <h2>Organização do material <span>essencial</span></h2>
        <ul>
          <li><Check size={13} /><span>Tenha tudo em mãos ou em uma pasta na nuvem, como o Google Drive.</span></li>
          <li><Check size={13} /><span>Organize os arquivos por assunto e use nomes claros.</span></li>
          <li><Check size={13} /><span><strong>Referências:</strong> separe de 1 a 5 endereços de outros sites que inspiram você.</span></li>
          <li><Check size={13} /><span><strong>Materiais em texto:</strong> sobre a empresa, produtos e serviços, descrições, missão, visão e valores, endereço, contatos e horários.</span></li>
          <li><Check size={13} /><span><strong>Materiais em arquivo:</strong> imagens, vídeos, logotipos, guias de estilo e exemplos de sites.</span></li>
        </ul>
      </div>
      <aside className="briefing-benefits">
        <h2>Benefícios da organização</h2>
        <ul>
          <li><span>01</span><p><strong>Mais agilidade</strong>Processo fluido e sem atrasos.</p></li>
          <li><span>02</span><p><strong>Mais precisão</strong>Resultado alinhado à sua visão.</p></li>
        </ul>
      </aside>
    </div>
    <footer className="briefing-intro-actions">
      <OriginButton effectOnly type="button" className="primary-button" onClick={onStart}>Começar briefing <ArrowRight size={16} /></OriginButton>
    </footer>
  </section>;
}

function App() {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<BriefingData>(loadDraft);
  const [files, setFiles] = useState<FileState>(INITIAL_FILES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const progress = Math.round(((currentStep + 1) / STEPS.length) * 100);
  const StepIcon = STEPS[currentStep].icon;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [data]);

  function update<K extends keyof BriefingData>(key: K, value: BriefingData[K]) {
    setData((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => { if (!previous[key]) return previous; const next = { ...previous }; delete next[key]; return next; });
  }
  function updateReference(index: number, key: keyof Reference, value: string) {
    setData((previous) => ({ ...previous, references: previous.references.map((reference, referenceIndex) => referenceIndex === index ? { ...reference, [key]: value } : reference) }));
    setErrors((previous) => { if (!previous.references) return previous; const next = { ...previous }; delete next.references; return next; });
  }
  function updateFiles(key: keyof FileState, incoming: File[]) { setFiles((previous) => ({ ...previous, [key]: [...previous[key], ...incoming] })); }
  function removeFile(key: keyof FileState, index: number) { setFiles((previous) => ({ ...previous, [key]: previous[key].filter((_, fileIndex) => fileIndex !== index) })); }
  function goToStep(step: number) { setCurrentStep(step); setErrors({}); window.requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }
  function focusFirstInvalid() {
    window.requestAnimationFrame(() => {
      const invalid = document.querySelector<HTMLElement>('.form-content .field-error, .form-content .has-error button, .form-content .consent-input');
      invalid?.focus({ preventScroll: true });
      invalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
  function nextStep() {
    const validation = validateStep(currentStep, data);
    if (Object.keys(validation).length) { setErrors(validation); focusFirstInvalid(); return; }
    if (currentStep < STEPS.length - 1) goToStep(currentStep + 1);
  }
  function previousStep() { if (currentStep > 0) goToStep(currentStep - 1); }

  async function submitForm(event: FormEvent) {
    event.preventDefault();
    for (let step = 0; step < STEPS.length - 1; step++) {
      const validation = validateStep(step, data);
      if (Object.keys(validation).length) {
        setCurrentStep(step);
        setErrors(validation);
        window.requestAnimationFrame(() => { topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); focusFirstInvalid(); });
        return;
      }
    }
    if (!consent) { setErrors({ consent: 'Marque a confirmação para enviar o briefing.' }); focusFirstInvalid(); return; }
    setSubmitting(true);
    try {
      const newSubmissionId = await submitBriefing(data, files);
      setSubmissionId(newSubmissionId);
      sessionStorage.removeItem(STORAGE_KEY);
      setSubmitted(true); window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) { setErrors({ submit: error instanceof Error ? error.message : 'Não foi possível enviar agora.' }); }
    finally { setSubmitting(false); }
  }
  async function resetForm() { await resetBriefingSession(); sessionStorage.removeItem(STORAGE_KEY); setData(INITIAL_DATA); setFiles(INITIAL_FILES); setCurrentStep(0); setStarted(false); setSubmitted(false); setConsent(false); setErrors({}); setSubmissionId(null); }

  if (submitted) return <main className="briefing-app success-screen">
    <section className="success-card">
      <header className="success-brand"><div className="brand-mark"><img src="/assets/logo-virtus.png" alt="Virtus" /></div></header>
      <span className="success-icon" aria-hidden="true"><Check size={30} strokeWidth={2.25} /></span>
      <p className="success-eyebrow">Briefing recebido</p>
      <h1>Obrigado, {data.companyName}!</h1>
      <p className="success-description">As informações do seu projeto chegaram até nós. Agora, nossa equipe vai analisar cada detalhe para preparar os próximos passos.</p>
      <div className="success-details">
        <div className="success-confirmation"><Check size={13} strokeWidth={2.6} /> Recebimento confirmado</div>
        {submissionId && <p className="success-protocol">Protocolo <strong>{submissionId.slice(0, 8).toUpperCase()}</strong></p>}
      </div>
      <div className="success-actions"><OriginButton effectOnly type="button" className="primary-button success-cta" onClick={resetForm}>Preencher novo briefing <ArrowRight size={15} /></OriginButton></div>
    </section>
  </main>;

  if (!started) return <main className="briefing-app" ref={topRef}>
    <div className="ambient-glow" />
    <header className="briefing-header"><div className="header-inner">
      <div className="brand-lockup"><div className="brand-mark"><img src="/assets/logo-virtus.png" alt="Virtus" /></div></div>
    </div></header>
    <div className="briefing-shell briefing-intro-shell"><section className="form-column">
      <BriefingIntro onStart={() => { setStarted(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
    </section></div>
  </main>;

  return <main className="briefing-app" ref={topRef}>
    <div className="ambient-glow" />
    <header className="briefing-header"><div className="header-inner">
      <div className="brand-lockup"><div className="brand-mark"><img src="/assets/logo-virtus.png" alt="Virtus" /></div></div>
    </div></header>
    <div className="briefing-shell">
      <section className="form-column">
        <div className="progress-card"><div className="progress-copy"><span>Etapa {currentStep + 1} de {STEPS.length}</span></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div>
        <form className="briefing-form" onSubmit={submitForm} noValidate>
          <div className="form-heading"><span className="heading-icon"><StepIcon size={21} /></span><div><p className="section-eyebrow">Etapa {String(currentStep + 1).padStart(2, '0')}</p><h2>{STEPS[currentStep].title}</h2><span>{STEPS[currentStep].description}</span></div></div>
          <div className="form-content">
            {Object.keys(errors).some((key) => key !== 'submit') && <div className="validation-notice" role="alert"><Info size={16} /><span><strong>Antes de continuar</strong>Preencha os campos obrigatórios destacados abaixo.</span></div>}
            {currentStep === 0 && <>
              <Field label="Nome da empresa" required><input className={errors.companyName ? 'field-error' : ''} value={data.companyName} onChange={(e) => update('companyName', e.target.value)} placeholder="Ex.: Virtus Tecnologia" autoFocus />{errors.companyName && <span className="error-message">{errors.companyName}</span>}</Field>
              <ChoiceGroup label="Já possui domínio e hospedagem?" value={data.domainStatus} options={['Sim', 'Não']} onChange={(value) => update('domainStatus', value)} invalid={Boolean(errors.domainStatus)} />{errors.domainStatus && <span className="error-message choice-error">{errors.domainStatus}</span>}
              <Field label="Domínio desejado ou já registrado" hint="Caso ainda não tenha definido, informe uma sugestão." required><div className="input-with-icon"><Globe2 size={16} /><input className={errors.domain ? 'field-error' : ''} value={data.domain} onChange={(e) => update('domain', e.target.value)} placeholder="www.suaempresa.com.br" /></div>{errors.domain && <span className="error-message">{errors.domain}</span>}</Field>
            </>}
            {currentStep === 1 && <>
              <Field label="Objetivo principal do site ou landing page" hint="Conte qual resultado faria este projeto ser um sucesso." required><textarea className={errors.mainObjective ? 'field-error' : ''} rows={5} value={data.mainObjective} onChange={(e) => update('mainObjective', e.target.value)} placeholder="Ex.: Gerar leads qualificados, aumentar as vendas e fortalecer o reconhecimento da marca..." autoFocus />{errors.mainObjective && <span className="error-message">{errors.mainObjective}</span>}</Field>
              <Field label="Público-alvo" hint="Inclua perfil demográfico, interesses, necessidades e principais dores." required><textarea className={errors.targetAudience ? 'field-error' : ''} rows={6} value={data.targetAudience} onChange={(e) => update('targetAudience', e.target.value)} placeholder="Descreva quem você deseja alcançar e quais problemas essa pessoa precisa resolver..." />{errors.targetAudience && <span className="error-message">{errors.targetAudience}</span>}</Field>
            </>}
            {currentStep === 2 && <>
              <Field label="Produtos e serviços" hint="Liste as principais soluções oferecidas pela empresa." required><textarea className={errors.productsServices ? 'field-error' : ''} rows={4} value={data.productsServices} onChange={(e) => update('productsServices', e.target.value)} placeholder="Ex.: Consultoria, desenvolvimento de sites, gestão de tráfego..." autoFocus />{errors.productsServices && <span className="error-message">{errors.productsServices}</span>}</Field>
              <Field label="Descrição dos produtos e serviços" required><textarea className={errors.productsDescription ? 'field-error' : ''} rows={5} value={data.productsDescription} onChange={(e) => update('productsDescription', e.target.value)} placeholder="Explique como funcionam, seus diferenciais e benefícios para o cliente..." />{errors.productsDescription && <span className="error-message">{errors.productsDescription}</span>}</Field>
              <Field label="Missão, visão e valores"><textarea rows={4} value={data.missionVisionValues} onChange={(e) => update('missionVisionValues', e.target.value)} placeholder="Compartilhe os princípios que orientam a marca..." /></Field>
              <div className="field-grid two-columns"><Field label="Endereço"><input value={data.address} onChange={(e) => update('address', e.target.value)} placeholder="Rua, número, cidade e estado" /></Field><Field label="Dias e horários de funcionamento"><input value={data.businessHours} onChange={(e) => update('businessHours', e.target.value)} placeholder="Seg. a sex., 8h às 18h" /></Field></div>
              <Field label="Informações de contato"><input value={data.contactInfo} onChange={(e) => update('contactInfo', e.target.value)} placeholder="Responsável, setor ou canal preferencial" /></Field>
              <div className="field-grid two-columns"><Field label="Telefone(s)"><input type="tel" value={data.phones} onChange={(e) => update('phones', e.target.value)} placeholder="(00) 00000-0000" /></Field><Field label="E-mail(s)"><input value={data.emails} onChange={(e) => update('emails', e.target.value)} placeholder="contato@suaempresa.com.br" /></Field></div>
              <Field label="Outras informações relevantes sobre a empresa"><textarea rows={4} value={data.companyNotes} onChange={(e) => update('companyNotes', e.target.value)} placeholder="História, diferenciais, prêmios, certificações ou qualquer contexto importante..." /></Field>
            </>}
            {currentStep === 3 && <>
              <div className="form-callout"><Sparkles size={17} /><p><strong>Compartilhe de 1 a 5 sites que inspiram você.</strong><span>Não é necessário preencher todos os cinco. Adicione somente as referências que fizerem sentido para o seu projeto.</span></p></div>
              <div className="references-list">{data.references.slice(0, visibleReferenceCount(data.references)).map((reference, index) => <div className="reference-card reference-card-enter" key={index}><span className="reference-number">{String(index + 1).padStart(2, '0')}</span><div className="reference-fields">
                <Field label={`Site de referência ${index + 1}`} required={index === 0}><div className="input-with-icon"><Globe2 size={15} /><input className={errors.references && !reference.url.trim() ? 'field-error' : ''} type="text" inputMode="url" value={reference.url} onChange={(e) => updateReference(index, 'url', e.target.value)} placeholder="exemplo.com.br" /></div></Field>
                <Field label="O que você gosta neste site?" required={index === 0}><textarea className={errors.references && !reference.notes.trim() ? 'field-error' : ''} rows={3} value={reference.notes} onChange={(e) => updateReference(index, 'notes', e.target.value)} placeholder="Ex.: Gosto das cores, da organização e das animações..." /></Field>
              </div></div>)}</div>{errors.references && <span className="error-message">{errors.references}</span>}
            </>}
            {currentStep === 4 && <>
              <ChoiceGroup label="A empresa possui identidade visual?" value={data.visualIdentity} options={['Sim', 'Não', 'Em desenvolvimento']} onChange={(value) => update('visualIdentity', value)} invalid={Boolean(errors.visualIdentity)} />{errors.visualIdentity && <span className="error-message choice-error">{errors.visualIdentity}</span>}
              <FileDrop title="Guia de identidade visual" description="PDF, AI, EPS, SVG, PNG ou ZIP · até 25 MB por arquivo" accept=".pdf,.ai,.eps,.svg,.png,.jpg,.jpeg,.zip" files={files.identityGuide} icon={<Palette size={20} />} onFiles={(incoming) => updateFiles('identityGuide', incoming)} onRemove={(index) => removeFile('identityGuide', index)} />
              <div className="or-divider"><span>ou compartilhe um link</span></div>
              <Field label="Link do Google Drive"><div className="input-with-icon"><Globe2 size={16} /><input type="text" inputMode="url" value={data.identityGuideLink} onChange={(e) => update('identityGuideLink', e.target.value)} placeholder="drive.google.com/..." /></div></Field>
            </>}
            {currentStep === 5 && <>
              <FileDrop title="Imagens em alta resolução" description="JPG, PNG, WEBP ou ZIP · selecione quantas precisar" accept="image/*,.zip" files={files.images} icon={<Image size={20} />} onFiles={(incoming) => updateFiles('images', incoming)} onRemove={(index) => removeFile('images', index)} />
              <Field label="Link para pasta de imagens"><div className="input-with-icon"><Globe2 size={16} /><input type="text" inputMode="url" value={data.imageLink} onChange={(e) => update('imageLink', e.target.value)} placeholder="drive.google.com/..." /></div></Field><div className="content-divider" />
              <FileDrop title="Vídeos para o site" description="MP4, MOV, WEBM ou ZIP · arquivos de até 100 MB" accept="video/*,.zip" files={files.videos} icon={<Video size={20} />} onFiles={(incoming) => updateFiles('videos', incoming)} onRemove={(index) => removeFile('videos', index)} />
              <Field label="Link para pasta de vídeos"><div className="input-with-icon"><Globe2 size={16} /><input type="text" inputMode="url" value={data.videoLink} onChange={(e) => update('videoLink', e.target.value)} placeholder="drive.google.com/..." /></div></Field>
              <div className="form-callout subtle"><Info size={17} /><p><strong>Não possui os materiais agora?</strong><span>Sem problema. Você pode enviar os arquivos posteriormente para nossa equipe.</span></p></div>
            </>}
            {currentStep === 6 && <>
              <div className="deadline-intro"><CalendarClock size={25} /><p><strong>Qual é o prazo ideal para o lançamento?</strong><span>O prazo começa a contar após a entrega de todos os materiais e aprovação do escopo.</span></p></div>
              <div className={`deadline-grid ${errors.deadline ? 'has-error' : ''}`}>{['15 dias', '30 dias', '45 dias', '60 dias'].map((option, index) => <OriginButton effectOnly active={data.deadline === option} type="button" key={option} className={`deadline-card ${data.deadline === option ? 'selected' : ''}`} onClick={() => update('deadline', option)} aria-invalid={Boolean(errors.deadline) || undefined}>
                <span className="deadline-check">{data.deadline === option && <Check size={13} strokeWidth={3} />}</span><strong>{option.replace(' dias', '')}</strong><small>dias</small><em>{index === 0 ? 'Prioridade máxima' : index === 1 ? 'Mais escolhido' : index === 2 ? 'Prazo confortável' : 'Maior flexibilidade'}</em>
              </OriginButton>)}</div>{errors.deadline && <span className="error-message">{errors.deadline}</span>}
            </>}
            {currentStep === 7 && <>
              <Field label="Outras informações que queira compartilhar" hint="Use este espaço para restrições, preferências, ideias ou qualquer detalhe que ainda não apareceu no briefing."><textarea rows={7} value={data.finalNotes} onChange={(e) => update('finalNotes', e.target.value)} placeholder="Escreva aqui suas observações finais..." autoFocus /></Field>
              <div className="review-card"><div className="review-title"><ClipboardCheck size={18} /><div><strong>Revise antes de enviar</strong><span>Você pode voltar a qualquer etapa para fazer ajustes.</span></div></div><div className="review-grid">
                <OriginButton effectOnly type="button" onClick={() => goToStep(0)}><small>Empresa</small><strong>{data.companyName || 'Não informado'}</strong></OriginButton><OriginButton effectOnly type="button" onClick={() => goToStep(1)}><small>Objetivo</small><strong>{truncate(data.mainObjective) || 'Não informado'}</strong></OriginButton><OriginButton effectOnly type="button" onClick={() => goToStep(4)}><small>Identidade visual</small><strong>{data.visualIdentity || 'Não informado'}</strong></OriginButton><OriginButton effectOnly type="button" onClick={() => goToStep(6)}><small>Prazo desejado</small><strong>{data.deadline || 'Não informado'}</strong></OriginButton>
              </div></div>
              <label className={`consent-row ${consent ? 'checked' : ''}`}><input className="consent-input" type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setErrors((previous) => { const next = { ...previous }; delete next.consent; return next; }); }} /><span className="consent-check" aria-hidden="true">{consent && <Check size={13} strokeWidth={3} />}</span><span>Confirmo que as informações preenchidas estão corretas e autorizo o contato da equipe Virtus sobre este projeto.</span></label>{errors.consent && <span className="error-message">{errors.consent}</span>}{errors.submit && <div className="submit-error">{errors.submit}</div>}
            </>}
          </div>
          <footer className="form-footer"><OriginButton effectOnly type="button" className="secondary-button" onClick={previousStep} disabled={currentStep === 0}><ArrowLeft size={16} /> Voltar</OriginButton>{currentStep < STEPS.length - 1 ? <OriginButton effectOnly type="button" className="primary-button" onClick={nextStep}>Continuar <ArrowRight size={16} /></OriginButton> : <OriginButton effectOnly type="submit" className="primary-button submit-button" disabled={submitting}>{submitting ? 'Enviando...' : 'Enviar briefing'} {!submitting && <Check size={16} />}</OriginButton>}</footer>
        </form><p className="privacy-note">Seus dados são utilizados apenas para a preparação e o contato sobre este projeto.</p>
      </section>
    </div>
  </main>;
}

function truncate(value: string, max = 45) { return value.length > max ? `${value.slice(0, max).trim()}...` : value; }
function visibleReferenceCount(references: Reference[]) {
  let count = 1;
  while (count < references.length && references[count - 1].url.trim() && references[count - 1].notes.trim()) count++;
  return count;
}
function validateStep(step: number, data: BriefingData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 0) { if (!data.companyName.trim()) errors.companyName = 'Informe o nome da empresa.'; if (!data.domainStatus) errors.domainStatus = 'Selecione uma opção.'; if (!data.domain.trim()) errors.domain = 'Informe o domínio ou uma sugestão.'; }
  if (step === 1) { if (!data.mainObjective.trim()) errors.mainObjective = 'Descreva o objetivo principal do projeto.'; if (!data.targetAudience.trim()) errors.targetAudience = 'Descreva o público-alvo.'; }
  if (step === 2) { if (!data.productsServices.trim()) errors.productsServices = 'Liste os produtos e serviços.'; if (!data.productsDescription.trim()) errors.productsDescription = 'Adicione uma breve descrição.'; }
  if (step === 3) {
    const filledReferences = data.references.filter((reference) => reference.url.trim() || reference.notes.trim());
    if (filledReferences.length === 0) errors.references = 'Informe pelo menos um site de referência.';
    else if (filledReferences.some((reference) => !reference.url.trim() || !reference.notes.trim())) errors.references = 'Complete o link e a observação da referência iniciada.';
  }
  if (step === 4 && !data.visualIdentity) errors.visualIdentity = 'Selecione uma opção.';
  if (step === 6 && !data.deadline) errors.deadline = 'Selecione o prazo desejado.';
  return errors;
}

export default App;
