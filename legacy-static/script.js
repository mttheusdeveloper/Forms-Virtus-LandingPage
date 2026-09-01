/* =========================================================
   ⚙️  CONFIG SUPABASE — ajuste se necessário
   ========================================================= */
const SUPABASE_URL = 'https://tdrunieikwwuwujfxjrs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcnVuaWVpa3d3dXd1amZ4anJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODczNjksImV4cCI6MjA2ODE2MzM2OX0.75yalWDdWGWCouOoKou2vbdhYF4ukrjsx5l-bpeTn0E';
const MONTHS = [
  { key:'janeiro',   short:'Jan', label:'Janeiro',   table:'Caixa Janeiro',   dreCols:['janeiro','jan'],         drePctCols:['j_pct','jan_pct','janeiro_pct'] },
  { key:'fevereiro', short:'Fev', label:'Fevereiro', table:'Caixa Fevereiro', dreCols:['fevereiro','fev'],       drePctCols:['f_pct','fev_pct','fevereiro_pct'] },
  { key:'marco',     short:'Mar', label:'Março',     table:'Caixa Março',     dreCols:['marco','março','mar'],   drePctCols:['mar_pct','marco_pct','março_pct'] },
  { key:'abril',     short:'Abr', label:'Abril',     table:'Caixa Abril',     dreCols:['abril','abr'],           drePctCols:['a_pct','abr_pct','abril_pct'] },
  { key:'maio',      short:'Mai', label:'Maio',      table:'Caixa Maio',      dreCols:['maio','mai'],            drePctCols:['ma_pct','mai_pct','maio_pct'] },
  { key:'junho',     short:'Jun', label:'Junho',     table:'Caixa Junho',     dreCols:['junho','jun'],           drePctCols:['jun_pct','junho_pct'] },
  { key:'julho',     short:'Jul', label:'Julho',     table:'Caixa Julho',     dreCols:['julho','jul'],           drePctCols:['jul_pct','julho_pct'] },
  { key:'agosto',    short:'Ago', label:'Agosto',    table:'Caixa Agosto',    dreCols:['agosto','ago'],          drePctCols:['ago_pct','agosto_pct'] },
  { key:'setembro',  short:'Set', label:'Setembro',  table:'Caixa Setembro',  dreCols:['setembro','set'],        drePctCols:['set_pct','setembro_pct'] },
  { key:'outubro',   short:'Out', label:'Outubro',   table:'Caixa Outubro',   dreCols:['outubro','out'],         drePctCols:['out_pct','outubro_pct'] },
  { key:'novembro',  short:'Nov', label:'Novembro',  table:'Caixa Novembro',  dreCols:['novembro','nov'],        drePctCols:['nov_pct','novembro_pct'] },
  { key:'dezembro',  short:'Dez', label:'Dezembro',  table:'Caixa Dezembro',  dreCols:['dezembro','dez'],        drePctCols:['dez_pct','dezembro_pct'] }
];

// Meses disponíveis no dashboard: somente os meses já passados e o mês atual.
// Em junho, por exemplo, o sistema puxa/mostra Janeiro até Junho e ignora Julho-Dezembro.
const CURRENT_MONTH_LIMIT_INDEX = Math.min(11, Math.max(0, new Date().getMonth()));
const ACTIVE_MONTHS = MONTHS.slice(0, CURRENT_MONTH_LIMIT_INDEX + 1);
const ACTIVE_MONTH_KEYS = new Set(ACTIVE_MONTHS.map(m => m.key));
function isActiveMonthIndex(index){ return index >= 0 && index <= CURRENT_MONTH_LIMIT_INDEX; }
function isActiveMonthKey(key){ return ACTIVE_MONTH_KEYS.has(monthCfg(key)?.key || String(key || '').toLowerCase()); }
function clampAnualRange(){
  if(!state?.anual) return;
  state.anual.mMin = Math.min(Math.max(Number(state.anual.mMin) || 0, 0), CURRENT_MONTH_LIMIT_INDEX);
  state.anual.mMax = Math.min(Math.max(Number(state.anual.mMax) || CURRENT_MONTH_LIMIT_INDEX, 0), CURRENT_MONTH_LIMIT_INDEX);
  if(state.anual.mMin > state.anual.mMax) state.anual.mMin = state.anual.mMax;
}

const TABLES = Object.assign(
  Object.fromEntries(MONTHS.map(m => [m.key, m.table])),
  { anual:'Financeiro 2026', dre:'dre' }
);
const C = { data:'data', conta:'conta', desc:'descricao', cat:'categoria', ent:'entradas', sai:'saidas' };
const A = {
  mes:'Mês', fb:'faturamento_bruto', fl:'faturamento_liquido', caixa:'caixa',
  eb:'ebtida', custos:'custos_operacionais', inv:'investimentos',
  roi:'roi', endiv:'endividamento', lucro:'lucratividade', cresc:'percentual_crescimento'
};
// Fonte oficial do ROI: tabela Financeiro 2026, coluna roi.
// As variações abaixo servem só como compatibilidade caso o Supabase retorne capitalização diferente.
const ROI_FIELD_KEYS = [
  'ROI', A.roi, 'roi', 'Roi', 'R.O.I', 'r.o.i',
  'Retorno sobre Investimento', 'retorno_sobre_investimento', 'retorno sobre investimento',
  'Retorno Investimento', 'retorno_investimento',
  'Retorno dos Investimentos', 'retorno_dos_investimentos'
];
// Campos financeiros que indicam que o mês realmente tem dados consolidados.
// Não uso lucratividade/crescimento aqui porque fórmulas de meses vazios podem virar 0% ou -100% e parecerem bugs no gráfico.
const ANUAL_VALUE_KEYS = [A.fb, A.fl, A.caixa, A.eb, A.custos, A.inv, A.roi, A.endiv];

const CHART_THEME = {
  primary:'#f5f5f5',
  secondary:'#94a3b8',
  accent:'#c4b5fd',
  accent2:'#93c5fd',
  positive:'#86efac',
  negative:'#fca5a5',
  warning:'#fde68a',
  cost:'#f0ab7a',
  muted:'#a1a1aa'
};

const PERFORMANCE_MODE = true;
const UI_RENDER_CHUNK_SIZE = 320;

const LUCRO_META = 27.5;

const MONTH_CHART_COLORS = {
  janeiro:'#fafafa',
  fevereiro:'#d4d4d8',
  marco:'#a1a1aa',
  abril:'#94a3b8',
  maio:'#c4b5fd',
  junho:'#93c5fd',
  julho:'#86efac',
  agosto:'#fde68a',
  setembro:'#fca5a5',
  outubro:'#f9a8d4',
  novembro:'#fdba74',
  dezembro:'#67e8f9'
};

const MOTION_EASE = 'easeinout';
const MOTION_DURATION = PERFORMANCE_MODE ? 120 : 420;
const CHART_MOTION = PERFORMANCE_MODE
  ? {enabled:false}
  : {
      enabled:true,
      easing:MOTION_EASE,
      speed:MOTION_DURATION,
      animateGradually:{enabled:false},
      dynamicAnimation:{enabled:true,speed:300}
    };
const chartMotionTimers = {};
/* ========================================================= */

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const fmtBRL = v => (Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const fmtBRL2 = v => (Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2});
const fmtPct = v => (Number(v)||0).toFixed(1)+'%';
const fmtK = v => { const a=Math.abs(v); if(a>=1e6) return (v/1e6).toFixed(1)+'M'; if(a>=1e3) return (v/1e3).toFixed(1)+'k'; return v.toFixed(0); };
const escapeHtml = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function moneyClass(v, forceOutflow = false){
  if(forceOutflow) return 'money-neg';
  return num(v) < 0 ? 'money-neg' : 'money-pos';
}
function moneyColor(v, forceOutflow = false){
  if(forceOutflow) return 'var(--money-neg)';
  return num(v) < 0 ? 'var(--money-neg)' : 'var(--money-pos)';
}

function lucratividadeClass(v){
  return num(v) >= LUCRO_META ? 'money-pos' : 'money-neg';
}
function lucratividadeColor(v){
  return num(v) >= LUCRO_META ? CHART_THEME.positive : CHART_THEME.negative;
}
function lucroMetaLabel(){
  return `Meta ${String(LUCRO_META).replace('.', ',')}%`;
}
function setLucratividadeText(idOrEl, value){
  const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
  if(!el) return;
  const n = num(value);
  el.textContent = fmtPct(n);
  el.classList.remove('money-pos','money-neg','money-warn');
  el.classList.add(lucratividadeClass(n));
}
function setMoneyText(idOrEl, value, formatter = fmtBRL, forceOutflow = false){
  const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
  if(!el) return;
  const n = num(value);
  el.textContent = formatter(n);
  el.classList.remove('money-pos','money-neg','money-warn');
  el.classList.add(moneyClass(n, forceOutflow));
}
function setPctText(idOrEl, value){
  const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
  if(!el) return;
  const n = num(value);
  el.textContent = fmtPct(n);
  el.classList.remove('money-pos','money-neg','money-warn');
  el.classList.add(n < 0 ? 'money-neg' : 'money-pos');
}

function num(v){
  if(v==null) return 0;
  if(typeof v==='number') return v;
  let s=String(v).trim(); if(!s||s==='-') return 0;
  s=s.replace(/[R$\s]/g,'');
  if(s.includes(',')) s=s.replace(/\./g,'').replace(',', '.');
  const n=parseFloat(s); return isNaN(n)?0:n;
}
function numPct(v){
  if(v == null) return 0;
  let s = String(v).trim();
  if(!s || s === '-' || s === '#ERROR!') return 0;

  s = s.replace('%', '').replace(/\s/g, '');

  // trata formato BR: 0,00 / 12,34
  if(s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');

  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}
function parseDate(v){
  if(v==null) return null;
  if(v instanceof Date) return isNaN(v)?null:v;
  const s=String(v).trim();
  if(!s) return null;
  let m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if(m){ let y=+m[3]; if(y<100) y+=2000; return new Date(y,+m[2]-1,+m[1]); }
  m=s.match(/^(\d{4})-(\d{2})-(\d{2})/); if(m) return new Date(+m[1],+m[2]-1,+m[3]);
  m=s.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if(m){ let y=+m[3]; if(y<100) y+=2000; return new Date(y,+m[2]-1,+m[1]); }
  const d=new Date(s); return isNaN(d)?null:d;
}
const MESES = ACTIVE_MONTHS.map(m => m.short);

// Caches simples para evitar recalcular datas, números e totais em toda renderização.
const monthlyRowInfoCache = new WeakMap();
const mensalCache = { valid:{}, totals:{}, all:[] };
const anualCache = { rows:[], byMonth:[], totalRow:null };
const viewState = { tab:'mensal', anualRendered:false };

function normKey(v){
  return String(v || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normFieldName(v){
  // Normaliza nomes de coluna vindos do Supabase.
  // Assim o ROI é localizado mesmo como roi, ROI, Roi, ROI %, R.O.I etc.
  return normKey(v).replace(/[^a-z0-9]/g, '');
}

function filledValue(v){
  return v !== null && v !== undefined && String(v).trim() !== '';
}

function detectRoiColumn(row, requireFilled = true){
  if(!row) return '';
  const keys = Object.keys(row);
  const hasValue = key => !requireFilled || filledValue(row[key]);

  // 1) prioridade total para coluna exatamente "roi" minúscula, como está no Supabase.
  const lowerExact = keys.find(key => key === 'roi' && hasValue(key));
  if(lowerExact) return lowerExact;

  // 2) compatibilidade por nome normalizado: ROI, Roi, R.O.I, ROI %, etc.
  const normalizedCandidates = new Set((ROI_FIELD_KEYS || []).map(normFieldName).filter(Boolean));
  for(const key of keys){
    const nk = normFieldName(key);
    if(normalizedCandidates.has(nk) && hasValue(key)) return key;
  }

  // 3) fallback mais aberto: qualquer coluna contendo "roi", mesmo com espaço/sufixo.
  // Ex.: "roi " / "roi_2026" / "roi acumulado".
  for(const key of keys){
    const nk = normFieldName(key);
    if(nk.includes('roi') && hasValue(key)) return key;
  }

  // 4) fallback semântico caso a coluna tenha vindo como retorno/retorno investimento.
  for(const key of keys){
    const nk = normFieldName(key);
    if(nk.includes('retorno') && nk.includes('invest') && hasValue(key)) return key;
  }

  return '';
}

function roiColumnLabel(row){
  return detectRoiColumn(row, false) || 'roi';
}

function monthIdx(label){
  if(!label) return -1;
  const s = normKey(label).slice(0,3);
  const map={jan:0,fev:1,mar:2,abr:3,mai:4,jun:5,jul:6,ago:7,set:8,out:9,nov:10,dez:11};
  return s in map?map[s]:-1;
}

function monthCfg(keyOrLabel){
  const idx = monthIdx(keyOrLabel);
  return idx >= 0 ? MONTHS[idx] : null;
}


function annualRoiRaw(row){
  // Base oficial do dashboard: tabela Financeiro 2026, coluna roi.
  // Localiza também variações de nome, mas prioriza a coluna "roi" minúscula.
  // Não usa Caixa nem coluna Rendimento para calcular o ROI do gráfico.
  const roiKey = detectRoiColumn(row, true);
  return roiKey ? num(row[roiKey]) : 0;
}

function currentDashboardMonthIndex(){
  // Para não mostrar ROI negativo de mês futuro por causa de célula vazia/zero.
  // Ex.: estamos em junho, então julho-dezembro ficam sem barra.
  return Math.min(11, Math.max(0, new Date().getMonth()));
}

function visibleRoiDelta(currentRaw, previousRaw, idx){
  const cur = num(currentRaw);
  const prev = num(previousRaw);
  if(idx <= 0) return null;
  if(idx > currentDashboardMonthIndex()) return null;

  // Regra especial pedida: Maio sempre pode aparecer mesmo se Abril estiver zerado/vazio.
  // Assim Maio = ROI Maio - 0, desde que o ROI de Maio tenha valor real.
  const isMay = idx === 4;

  // Para os demais meses, só informa quando mês atual e anterior têm valor.
  // Isso evita queda/negativo falso em mês futuro ou mês ainda sem preenchimento.
  if(Math.abs(cur) < 0.005) return null;
  if(!isMay && Math.abs(prev) < 0.005) return null;

  const diff = cur - (isMay && Math.abs(prev) < 0.005 ? 0 : prev);
  return Math.abs(diff) < 0.005 ? null : diff;
}

function roiMonthValue(idx){
  const b = anualCache.byMonth?.[idx];
  return b && b.roiDelta != null ? num(b.roiDelta) : 0;
}

function roiMonthDisplay(idx){
  const b = anualCache.byMonth?.[idx];
  return b && b.roiDelta != null ? fmtBRL2(b.roiDelta) : '—';
}

function isWithdrawalDescription(row){
  const desc = normKey(row?.[C.desc] || '');
  if(!desc) return false;
  return [
    /valor\s+retirad[oa]s?/,
    /retirad[oa]s?/,
    /saque(?:s)?/,
    /resgate(?:s)?/,
    /resgatad[oa]s?/,
    /valor\s+sacad[oa]s?/,
    /valor\s+resgatad[oa]s?/
  ].some(rx => rx.test(desc));
}

function withdrawalAmount(row){
  return Math.max(Math.abs(num(row?.[C.ent])), Math.abs(num(row?.[C.sai])));
}

function withdrawalRowsForMonth(mesKey){
  const cfg = monthCfg(mesKey);
  if(!cfg) return [];
  // Busca na Caixa bruta para pegar descrição tipo "valor retirado", mesmo se a categoria vier vazia.
  return (state.mensal[cfg.key] || [])
    .filter(row => isWithdrawalDescription(row) && withdrawalAmount(row) > 0)
    .map(row => ({row, _mes:cfg.label, _mesKey:cfg.key}));
}

function monthLabel(keyOrLabel){
  const cfg = monthCfg(keyOrLabel);
  return cfg ? cfg.label : String(keyOrLabel || '');
}

function monthShort(keyOrLabel){
  const cfg = monthCfg(keyOrLabel);
  return cfg ? cfg.short : String(keyOrLabel || '').slice(0,3);
}

function monthChartColor(keyOrLabel){
  const cfg = monthCfg(keyOrLabel);
  return (cfg && MONTH_CHART_COLORS[cfg.key]) || CHART_THEME.muted;
}

function annualRowHasRealFinancialData(row){
  return ANUAL_VALUE_KEYS.some(k => Math.abs(num(firstExistingValue(row, [k]))) > 0)
    || Math.abs(annualRoiRaw(row)) > 0;
}

function annualMonthHasRealData(monthData, monthIndex){
  const cfg = MONTHS[monthIndex];
  const hasMonthlyRows = !!cfg && (monthRows(cfg.key) || []).length > 0;
  return hasMonthlyRows || Boolean(monthData && monthData._hasValue);
}

function monthlyRowInfo(row){
  if(!row || typeof row !== 'object') return {date:null,day:null,cat:'',conta:'',ent:0,sai:0,value:0,valid:false};
  const cached = monthlyRowInfoCache.get(row);
  if(cached) return cached;

  const date = parseDate(row[C.data]);
  const ent = num(row[C.ent]);
  const sai = num(row[C.sai]);
  const cat = String(row[C.cat] || '').trim();
  const conta = String(row[C.conta] || '').trim();
  const info = {
    date,
    day: date ? date.getDate() : null,
    cat,
    conta,
    ent,
    sai,
    value: Math.max(ent, sai),
    valid: !!date && !!cat
  };
  monthlyRowInfoCache.set(row, info);
  return info;
}

function categoryChartName(row){
  const info = monthlyRowInfo(row);
  const current = info.cat || 'Sem categoria';

  // Algumas receitas podem vir descritas no campo Descrição/Conta,
  // mesmo quando a Categoria original está genérica.
  // Aqui só reclassifico ENTRADAS para o gráfico de Categorias,
  // sem alterar Faturamento Bruto nem Custo Operacional.
  // Uso Object.values(row) para pegar também variações como
  // "Mentorias", "Mentoria", "Lançamento" e campos com acento/capitalização diferente.
  const rawText = [
    current,
    row?.[C.desc] || '',
    row?.[C.conta] || '',
    row && typeof row === 'object' ? Object.values(row).join(' ') : ''
  ].join(' ');
  const txt = normKey(rawText);

  const entrada = info.ent || num(row?.Entradas) || num(row?.Entrada) || num(row?.entradas) || num(row?.entrada);
  if(entrada > 0){
    if(/\bmentorias?\b/.test(txt) || txt.includes('mentor')) return 'Mentorias (Receita)';
    if(txt.includes('lancamento') || txt.includes('lancamentos')) return 'Lançamentos (Receita)';
  }

  return current;
}

function dreDesc(row){
  return String(row?.descricao ?? row?.Descrição ?? row?.desc ?? '').trim();
}
function normDreDesc(v){
  return normKey(v).replace(/\s+/g, ' ').trim();
}
function dreRevenueCategoryName(desc){
  const clean = String(desc || '').trim();
  const n = normDreDesc(clean);
  if(!n) return '';

  // Não deixa cabeçalhos/subtotais da DRE virarem categoria.
  if(n === 'receitas' || n === 'receita' || n.includes('total das receitas') || n.includes('total receitas')) return '';

  // Normaliza nomes importantes que você quer ver no gráfico.
  if(n.includes('mentor')) return 'Mentorias (Receita)';
  if(n.includes('lancamento')) return 'Lançamentos (Receita)';
  if(n.includes('trafego')) return 'Tráfego (Receita)';

  // Demais linhas de receita da DRE também entram como Receita.
  return clean.replace(/\s*\((receita|custo|despesa)\)\s*$/i, '').trim() + ' (Receita)';
}
function dreMonthValue(row, mesKey){
  const cfg = MONTHS.find(m => m.key === mesKey);
  if(!cfg) return 0;
  return Math.abs(num(firstExistingValue(row, cfg.dreCols)));
}
function dreRevenueRows(){
  const rows = (state.dre || [])
    .slice()
    .sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

  const start = rows.findIndex(r => normDreDesc(dreDesc(r)) === 'receitas');
  const end = rows.findIndex(r => normDreDesc(dreDesc(r)) === 'custo');

  // Preferência: pegar os filhos da seção RECEITAS até CUSTO.
  // Fallback: se a estrutura da DRE mudar, ainda tenta achar linhas de receita pelo nome.
  const base = start >= 0
    ? rows.slice(start + 1, end > start ? end : rows.length)
    : rows.filter(r => {
        const d = normDreDesc(dreDesc(r));
        return d.includes('mentor') || d.includes('lancamento') || d.includes('trafego');
      });

  return base.filter(r => dreRevenueCategoryName(dreDesc(r)));
}
function dreRevenueCategoryMap(monthKeys){
  const out = Object.fromEntries((monthKeys || []).map(k => [k, {}]));
  dreRevenueRows().forEach(r => {
    const label = dreRevenueCategoryName(dreDesc(r));
    if(!label) return;
    (monthKeys || []).forEach(mesKey => {
      const val = dreMonthValue(r, mesKey);
      if(val <= 0) return;
      out[mesKey] = out[mesKey] || {};
      out[mesKey][label] = (out[mesKey][label] || 0) + val;
    });
  });
  return out;
}
function dreRevenueModalRows(categoria, mesKey){
  const cfg = monthCfg(mesKey);
  if(!cfg) return [];

  return dreRevenueRows()
    .map(r => {
      const label = dreRevenueCategoryName(dreDesc(r));
      const val = dreMonthValue(r, cfg.key);
      if(label !== categoria || val <= 0) return null;
      return {
        row:{
          [C.data]:'',
          [C.conta]:'DRE',
          [C.cat]:label,
          [C.desc]:dreDesc(r) || label,
          [C.ent]:val,
          [C.sai]:0
        },
        _mes:cfg.label,
        _mesKey:cfg.key
      };
    })
    .filter(Boolean);
}

function hasRequiredMonthlyFields(row){
  return monthlyRowInfo(row).valid;
}

function validMensalRows(rows){
  return (rows || []).filter(hasRequiredMonthlyFields);
}

function rebuildMensalCache(){
  mensalCache.valid = {};
  mensalCache.totals = {};
  mensalCache.all = [];

  ACTIVE_MONTHS.forEach(m => {
    const rows = validMensalRows(state.mensal[m.key] || []);
    mensalCache.valid[m.key] = rows;
    mensalCache.all.push(...rows);

    mensalCache.totals[m.key] = rows.reduce((acc, r) => {
      const info = monthlyRowInfo(r);
      acc.entradas += info.ent;
      acc.saidas += info.sai;
      acc.faturamentoBruto += info.ent;
      acc.custoOperacional += info.sai;
      return acc;
    }, {entradas:0, saidas:0, faturamentoBruto:0, custoOperacional:0});
  });
}

function rebuildAnualCache(){
  const rows = (state.anual.rows || []).slice().sort((a,b)=>monthIdx(a[A.mes])-monthIdx(b[A.mes]));
  const byMonth = Array(12).fill(null).map(()=>({fb:0,fl:0,caixa:0,eb:0,custos:0,inv:0,roiRaw:0,roiDelta:null,roi:0,endiv:0,lucro:0,cresc:0,_count:0,_hasValue:false}));

  rows.forEach(r=>{
    const i=monthIdx(r[A.mes]); if(!isActiveMonthIndex(i)) return;
    const b=byMonth[i];
    b.fb+=num(r[A.fb]); b.fl+=num(r[A.fl]); b.caixa+=num(r[A.caixa]);
    b.eb+=num(r[A.eb]); b.custos+=num(r[A.custos]); b.inv+=num(r[A.inv]);
    const roiFinanceiro2026 = annualRoiRaw(r);
    b.roiRaw += roiFinanceiro2026;
    b.roi += roiFinanceiro2026;
    b.endiv+=num(r[A.endiv]);
    b.lucro+=num(r[A.lucro]); b.cresc+=num(r[A.cresc]); b._count++;
    b._hasValue = b._hasValue || annualRowHasRealFinancialData(r);
  });

  byMonth.forEach((b, idx) => {
    const prevRaw = idx > 0 ? byMonth[idx - 1].roiRaw : 0;
    b.roiDelta = visibleRoiDelta(b.roiRaw, prevRaw, idx);
  });

  anualCache.rows = rows.filter(r => isActiveMonthIndex(monthIdx(r[A.mes])));
  anualCache.byMonth = byMonth;
  anualCache.totalRow = null;
  window.debugROI = () => {
    const rowsDebug = (state.anual.rows || [])
      .filter(r => monthIdx(r[A.mes]) >= 0)
      .map(r => {
        const key = detectRoiColumn(r, false);
        const raw = key ? r[key] : '';
        const idx = monthIdx(r[A.mes]);
        const b = anualCache.byMonth[idx] || {};
        return {
          mes: r[A.mes],
          colunaLocalizada: key || 'não localizada',
          valorOriginal: raw,
          valorNumerico: key ? num(raw) : 0,
          roiCalculadoMesContraMes: b.roiDelta
        };
      });
    console.table(rowsDebug);
    return rowsDebug;
  };
}

function monthRows(key){
  // Todas as leituras mensais do dashboard consideram apenas registros com data + categoria.
  return mensalCache.valid[key] || [];
}

function allMensalRows(){
  return mensalCache.all || [];
}

function selectedMonthKeys(){
  const keys = [...state.mensal.mesesSel]
    .filter(k => monthCfg(k))
    .sort((a,b)=>monthIdx(a)-monthIdx(b));
  return keys.length ? keys : state.mensal.mesesDisp.slice();
}

function selectedMonthData(filtered = true){
  return selectedMonthKeys().map(key => ({
    key,
    label: monthLabel(key),
    short: monthShort(key),
    rows: filtered ? applyFilter(monthRows(key), key) : monthRows(key)
  }));
}

function defaultMonthKey(){
  const current = ACTIVE_MONTHS[ACTIVE_MONTHS.length - 1]?.key;
  if(current && state.mensal.mesesDisp.includes(current)) return current;
  return state.mensal.mesesDisp[state.mensal.mesesDisp.length - 1] || '';
}
function resetSelectedMonthToCurrent(){
  const key = defaultMonthKey();
  state.mensal.mesesSel = new Set(key ? [key] : []);
}

function firstExistingValue(row, keys){
  if(!row) return 0;

  // 1) tenta exatamente como está escrito.
  for(const k of keys || []){
    if(Object.prototype.hasOwnProperty.call(row, k) && filledValue(row[k])) return row[k];
  }

  // 2) fallback multifator: compara sem maiúsculas, acentos, espaços, pontos e símbolos.
  // Ex.: ROI, roi, Roi, R.O.I, ROI %, "Retorno sobre Investimento".
  const normalizedRowKeys = Object.keys(row).reduce((acc, key) => {
    const nk = normFieldName(key);
    if(nk && !(nk in acc)) acc[nk] = key;
    return acc;
  }, {});

  for(const k of keys || []){
    const realKey = normalizedRowKeys[normFieldName(k)];
    if(realKey && filledValue(row[realKey])) return row[realKey];
  }

  return 0;
}

function firstExistingText(row, keys){
  const v = firstExistingValue(row, keys);
  return filledValue(v) ? String(v).trim() : '';
}

const state = {
  mensal:{ mesesDisp:[], mesesSel:new Set(), tipo:'all', cat:'all', conta:'all',
           dayMin:null, dayMax:null, valMin:null, valMax:null },
  anual: { rows:[], metric:'fb', mMin:0, mMax:11 },
  dre: [],
  dreContext: null
};
const charts = {};
const chartOptionSignatures = {};
const tableRenderTokens = {};
let kpiModalRenderToken = 0;
let dataVersion = 0;

if(PERFORMANCE_MODE){
  document.documentElement.classList.add('perf-mode');
}

const scheduleIdle = window.requestIdleCallback
  ? cb => window.requestIdleCallback(cb, {timeout:120})
  : cb => setTimeout(() => cb({timeRemaining:()=>0, didTimeout:true}), 0);

/* ---------- TABS ---------- */
document.querySelectorAll('.nav-item').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(s=>s.classList.add('hidden'));
    const tab=btn.dataset.tab;
    viewState.tab = tab;
    document.getElementById('tab-'+tab).classList.remove('hidden');
    const titles={mensal:'Comparativo Mensal',anual:'Visão Anual 2026'};
    document.getElementById('topbar-title').textContent=titles[tab];
    if(tab==='anual'){ viewState.anualRendered = true; requestRenderAnual(); }
    else if(tab==='mensal') requestRenderMensal();
  });
});

/* ---------- FETCH ---------- */
async function fetchTable(name){
  const {data,error}=await sb.from(name).select('*');
  if(error){ console.warn('Erro em',name,error.message); return []; }
  return data||[];
}
function setStatus(msg,cls,count){
  document.getElementById('status').textContent=msg;
  document.getElementById('status').className='text-xs '+(cls||'');
  if(count!=null) document.getElementById('status-count').textContent=count+' registros';
}
async function loadAll(){
  setStatus('Carregando…','text-amber-300');
  try{
    const [mensalResults, anual, dre] = await Promise.all([
      Promise.all(ACTIVE_MONTHS.map(m => fetchTable(TABLES[m.key] || m.table))),
      fetchTable(TABLES.anual),
      fetchTable(TABLES.dre)
    ]);

    MONTHS.forEach(m => { state.mensal[m.key] = []; });
    ACTIVE_MONTHS.forEach((m, i) => {
      state.mensal[m.key] = mensalResults[i] || [];
    });

    state.anual.rows = anual;
    state.dre = dre;

    dataVersion++;
    rebuildMensalCache();
    rebuildAnualCache();
    populateSelects();
    renderMensal();
    if(viewState.tab === 'anual'){
      viewState.anualRendered = true;
      renderAnual();
    }

    const totalMensal = ACTIVE_MONTHS.reduce((acc, m) => acc + monthRows(m.key).length, 0);
    setStatus('Conectado','text-emerald-300', totalMensal + anual.length + dre.length);
  }catch(e){
    console.error(e);
    setStatus('Erro de conexão','text-rose-400');
  }
}

/* ---------- SELECTS ---------- */
function populateSelects(){
  const cats=new Set(), contas=new Set();
  allMensalRows().forEach(r=>{
    if(r[C.cat]) cats.add(r[C.cat]);
    if(r[C.conta]) contas.add(r[C.conta]);
  });
  fillSel('m-filter-categoria',[...cats].sort(),'Todas');
  fillSel('m-filter-conta',[...contas].sort(),'Todas');

  // Janela meses (anual) — mostra apenas meses passados + mês atual.
  const aMin=document.getElementById('a-mes-min');
  const aMax=document.getElementById('a-mes-max');
  const monthOptions = ACTIVE_MONTHS.map(m => `<option value="${monthIdx(m.key)}">${m.short}</option>`).join('');
  aMin.innerHTML=monthOptions;
  aMax.innerHTML=monthOptions;
  clampAnualRange();
  aMin.value=state.anual.mMin;
  aMax.value=state.anual.mMax;

  // Chips de meses (mensal) — sempre de Janeiro até o mês atual, incluindo Junho quando for o mês atual.
  const disp = ACTIVE_MONTHS.map(m => m.key);

  state.mensal.mesesDisp = disp;
  state.mensal.mesesSel = new Set([...state.mensal.mesesSel].filter(m => disp.includes(m)));
  if(state.mensal.mesesSel.size===0) resetSelectedMonthToCurrent();

  const cont = document.getElementById('m-mes-chips');
  cont.innerHTML = disp.map(k=>{
    const active = state.mensal.mesesSel.has(k) ? 'active' : '';
    return `<button class="chip-btn ${active}" data-mes="${k}">${monthLabel(k)}</button>`;
  }).join('') || '<span class="text-xs text-[var(--muted)]">Sem dados</span>';

  cont.querySelectorAll('[data-mes]').forEach(b=>{
    b.addEventListener('click',()=>{
      const k=b.dataset.mes;
      if(state.mensal.mesesSel.has(k) && state.mensal.mesesSel.size>1) state.mensal.mesesSel.delete(k);
      else state.mensal.mesesSel.add(k);
      b.classList.toggle('active', state.mensal.mesesSel.has(k));
      requestRenderMensal();
    });
  });
}
function fillSel(id,arr,label){
  const sel=document.getElementById(id);
  if(!sel) return;
  const cur=sel.value;
  sel.innerHTML=`<option value="all">${label}</option>`+arr.map(c=>`<option value="${c}">${c}</option>`).join('');
  sel.value = Array.from(sel.options).some(o => o.value === cur) ? cur : 'all';
  if(id === 'm-filter-categoria') syncCategoryDropdown();
}

function categoryIcon(value){
  const s = normKey(value);
  if(value === 'all') return '▣';
  if(s.includes('trafego')) return '↗';
  if(s.includes('energia')) return '⚡';
  if(s.includes('imposto')) return '◫';
  if(s.includes('salario') || s.includes('freelance')) return '◌';
  if(s.includes('bancaria') || s.includes('financeira')) return '▦';
  if(s.includes('curso') || s.includes('mentoria')) return '◇';
  if(s.includes('aluguel') || s.includes('limpeza')) return '⌂';
  if(s.includes('receita') || s.includes('lancamento')) return '↥';
  return '•';
}
function categoryTone(value){
  const s = normKey(value);
  if(value === 'all') return '';
  if(s.includes('receita')) return 'cat-tone-receita';
  if(s.includes('financeira')) return 'cat-tone-financeira';
  if(s.includes('despesa')) return 'cat-tone-despesa';
  if(s.includes('custo')) return 'cat-tone-custo';
  return '';
}
function categoryLabel(value){
  if(!value || value === 'all') return 'Todas as categorias';
  return String(value);
}
function categoryOptions(){
  const sel = document.getElementById('m-filter-categoria');
  if(!sel) return [];
  return Array.from(sel.options).map(o => ({value:o.value, label:o.textContent || o.value}));
}
function syncCategoryDropdown(){
  const label = document.getElementById('m-category-label');
  const sel = document.getElementById('m-filter-categoria');
  if(label && sel) label.textContent = categoryLabel(sel.value);
  renderCategoryOptions();
}
function renderCategoryOptions(){
  const box = document.getElementById('m-category-options');
  const search = document.getElementById('m-category-search');
  const sel = document.getElementById('m-filter-categoria');
  if(!box || !sel) return;
  const q = normKey(search ? search.value : '');
  const opts = categoryOptions().filter(o => !q || normKey(o.label).includes(q));
  box.innerHTML = opts.map(o => {
    const active = o.value === sel.value;
    return `<button type="button" class="category-option ${active ? 'active' : ''} ${categoryTone(o.value)}" data-category-value="${escapeHtml(o.value)}" title="${escapeHtml(o.label)}">
      <span class="category-option-icon">${escapeHtml(categoryIcon(o.value))}</span>
      <span class="category-option-label">${escapeHtml(categoryLabel(o.value))}</span>
      ${active ? '<span class="category-option-check">✓</span>' : ''}
    </button>`;
  }).join('') || '<div class="category-option empty">Nenhuma categoria encontrada</div>';

  box.querySelectorAll('[data-category-value]').forEach(btn => {
    btn.addEventListener('click', () => selectCategoryFilter(btn.getAttribute('data-category-value') || 'all'));
  });
}
function selectCategoryFilter(value){
  const sel = document.getElementById('m-filter-categoria');
  const menu = document.getElementById('m-category-menu');
  const wrap = document.getElementById('m-category-select');
  const btn = document.getElementById('m-category-button');
  if(sel) sel.value = value || 'all';
  state.mensal.cat = value || 'all';
  syncCategoryDropdown();
  menu?.classList.add('hidden');
  wrap?.classList.remove('open');
  btn?.setAttribute('aria-expanded','false');
  requestRenderMensal();
}
function initCategoryDropdown(){
  const wrap = document.getElementById('m-category-select');
  const btn = document.getElementById('m-category-button');
  const menu = document.getElementById('m-category-menu');
  const search = document.getElementById('m-category-search');
  if(!wrap || !btn || !menu) return;
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const willOpen = menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !willOpen);
    wrap.classList.toggle('open', willOpen);
    btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    if(willOpen) setTimeout(() => search?.focus(), 40);
  });
  search?.addEventListener('input', renderCategoryOptionsDebounced);
  document.addEventListener('click', e => {
    if(!wrap.contains(e.target)){
      menu.classList.add('hidden');
      wrap.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
    }
  });
}

/* ---------- FILTRO ---------- */
function applyFilter(rows, mesLabel){
  const f=state.mensal;
  if(mesLabel && !state.mensal.mesesSel.has(mesLabel.toLowerCase())) return [];

  const out = [];
  for(const r of rows){
    const info = monthlyRowInfo(r);
    if(!info.valid) continue;
    if(f.tipo==='entrada' && !(info.ent>0)) continue;
    if(f.tipo==='saida' && !(info.sai>0)) continue;
    if(f.cat!=='all' && info.cat!==f.cat) continue;
    if(f.conta!=='all' && info.conta!==f.conta) continue;
    if(f.dayMin!=null && info.day!=null && info.day<f.dayMin) continue;
    if(f.dayMax!=null && info.day!=null && info.day>f.dayMax) continue;
    if(f.valMin!=null && info.value<f.valMin) continue;
    if(f.valMax!=null && info.value>f.valMax) continue;
    out.push(r);
  }
  return out;
}

/* ---------- RENDER ABA MENSAL ---------- */
function renderMensal(){
  const mesesFiltrados = selectedMonthData(true);
  const all = mesesFiltrados.flatMap(m => m.rows);

  const sumInfo=(rows,field)=>rows.reduce((a,r)=>a+monthlyRowInfo(r)[field],0);
  const eTot=sumInfo(all,'ent'), sTot=sumInfo(all,'sai');

  // --- Consolidado (Financeiro 2026) filtrado pelos meses selecionados ---
  // ⚙️ Ajuste TABLES.anual se o nome da tabela "Consolidado" for diferente
  const selIdx = new Set(selectedMonthKeys().map(monthIdx).filter(isActiveMonthIndex));
  const consolAll = state.anual.rows
    .filter(r => isActiveMonthIndex(monthIdx(r[A.mes])))
    .sort((a,b)=>monthIdx(a[A.mes])-monthIdx(b[A.mes]));
  const consol = selIdx.size ? consolAll.filter(r=>selIdx.has(monthIdx(r[A.mes]))) : consolAll;

  // Caixa Total do Ano considera apenas Janeiro até o mês atual, sem meses futuros.
  const caixaAno = consolAll.reduce((a,r)=>a+num(r[A.caixa]),0);
  const lucrAtivos = consol.filter(r=>num(r[A.lucro])!==0);
  const lucrAvg = lucrAtivos.length ? lucrAtivos.reduce((a,r)=>a+num(r[A.lucro]),0)/lucrAtivos.length : 0;

  // Caixa do "mês atual": último mês selecionado com dados (fallback: último do recorte)
  const comDados = consol.filter(r=>num(r[A.caixa])!==0);
  const mesRow = comDados[comDados.length-1] || consol[consol.length-1];
  const caixaMes = mesRow ? num(mesRow[A.caixa]) : 0;
  const crescimentoMes = mesRow ? num(mesRow[A.cresc]) : 0;

  setMoneyText('kpi-ent', eTot);
  setMoneyText('kpi-sai', sTot, fmtBRL, true);
  setMoneyText('kpi-sal', caixaMes);
  document.getElementById('kpi-sal-sub').textContent = mesRow ? `Caixa de ${mesRow[A.mes]}` : 'Sem dados';
  setLucratividadeText('kpi-lucr', lucrAvg);
  setPctText('kpi-cresc', crescimentoMes);
  document.getElementById('kpi-cresc-sub').textContent = mesRow ? `Crescimento de ${mesRow[A.mes]}` : 'Sem dados';
  setMoneyText('kpi-caixa-ano', caixaAno);

  const monthTotals = mesesFiltrados.map(m => ({
    ...m,
    entradas: sumInfo(m.rows, 'ent'),
    saidas: sumInfo(m.rows, 'sai')
  }));
  const refMonth = [...monthTotals].reverse().find(m => m.rows.length) || monthTotals[monthTotals.length-1];
  document.getElementById('kpi-ent-pill').textContent = refMonth && eTot ? `${Math.round(refMonth.entradas/(eTot||1)*100)}% ${refMonth.short.toUpperCase()}` : '—';
  document.getElementById('kpi-sai-pill').textContent = refMonth && sTot ? `${Math.round(refMonth.saidas/(sTot||1)*100)}% ${refMonth.short.toUpperCase()}` : '—';

  // Sparklines entradas/saídas — soma todos os meses selecionados
  const dEnt=Array(31).fill(0), dSai=Array(31).fill(0);
  all.forEach(r=>{
    const info = monthlyRowInfo(r);
    if(info.day){
      dEnt[info.day-1]+=info.ent;
      dSai[info.day-1]+=info.sai;
    }
  });
  renderSpark('spark-ent', dEnt, CHART_THEME.positive);
  renderSpark('spark-sai', dSai, CHART_THEME.negative);

  // Gráficos principais agora vêm das tabelas Caixa Janeiro...Caixa Dezembro.
  // Faturamento Bruto = somente entradas com data + categoria.
  // Custo Operacional = somente saídas com data + categoria.
  const caixaMensalAll = ACTIVE_MONTHS.map(m => {
    const rows = monthRows(m.key);
    const totals = mensalCache.totals[m.key] || {faturamentoBruto:0, custoOperacional:0};
    return {
      ...m,
      rows,
      faturamentoBruto: totals.faturamentoBruto,
      custoOperacional: totals.custoOperacional
    };
  });

  const caixaTotalAll = {
    key:'total',
    short:'Total',
    label:'Total',
    table:'Todas as tabelas Caixa',
    rows: caixaMensalAll.flatMap(m => m.rows),
    faturamentoBruto: caixaMensalAll.reduce((acc, m) => acc + m.faturamentoBruto, 0),
    custoOperacional: caixaMensalAll.reduce((acc, m) => acc + m.custoOperacional, 0)
  };
  const caixaChartItems = [...caixaMensalAll, caixaTotalAll];

  const fbLabelsAll = caixaChartItems.map(m => m.short);
  const fbDataAll = caixaChartItems.map(m => m.faturamentoBruto);
  renderBar(
    'chart-comparativo',
    [{name:'Faturamento Bruto',data:fbDataAll}],
    fbLabelsAll,
    [CHART_THEME.primary],
    false,
    {
      chart:{events:{dataPointSelection:(event, chartContext, config)=>{
        const item = caixaChartItems[config.dataPointIndex];
        if(item) openMonthlyChartModal('faturamento', item.key);
      }}},
      plotOptions:{bar:{columnWidth:'48%'}}
    }
  );

  const custoDataAll = caixaChartItems.map(m => m.custoOperacional);
  renderBar(
    'chart-fluxo',
    [{name:'Custo Operacional',data:custoDataAll}],
    fbLabelsAll,
    [CHART_THEME.primary],
    false,
    {
      yaxis:{min:0},
      chart:{height:490,events:{dataPointSelection:(event, chartContext, config)=>{
        const item = caixaChartItems[config.dataPointIndex];
        if(item) openMonthlyChartModal('custo', item.key);
      }}},
      plotOptions:{bar:{columnWidth:'64%'}}
    }
  );

  // CORREÇÃO 2: DRE para o Gráfico de Mix - DINÂMICO POR MÊS SELECIONADO
  // Agora o Top Categorias acompanha todos os chips de mês disponíveis.
  const DRE_MONTHS = Object.fromEntries(ACTIVE_MONTHS.map(m => [
    m.key,
    { label:m.label, cols:m.dreCols, pctCols:m.drePctCols }
  ]));

  const mesesDreAtivos = selectedMonthKeys().filter(m => DRE_MONTHS[m]);
  const mesesDre = mesesDreAtivos.length ? mesesDreAtivos : ACTIVE_MONTHS.map(m => m.key);
  const mesesDreLabel = mesesDre.map(m => DRE_MONTHS[m].label).join(' + ');

  const normDre = s => String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

  // Ordena pelo id da DRE para manter a estrutura original da tabela
  const dreRows = (state.dre || [])
    .slice()
    .sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

  const getDreIndex = desc => dreRows.findIndex(r => normDre(r.descricao) === normDre(desc));
  const getDreRow = desc => dreRows[getDreIndex(desc)] || null;

  function valorDreRow(r){
    if(!r) return 0;
    return mesesDre.reduce((acc, mesKey) => {
      const cfg = DRE_MONTHS[mesKey];
      return acc + num(firstExistingValue(r, cfg.cols));
    }, 0);
  }

  const totalReceitasDre = Math.abs(valorDreRow(getDreRow('Total das receitas')));

  function pctDreRow(r, valorOriginal){
    if(!r) return '';

    // Quando só tem um mês selecionado, usa a porcentagem original da DRE, se existir.
    if(mesesDre.length === 1){
      const cfg = DRE_MONTHS[mesesDre[0]];
      const pctOriginal = firstExistingText(r, cfg.pctCols);
      if(pctOriginal) return pctOriginal;
    }

    // Quando tem mais de um mês, recalcula a % em cima do Total das receitas do recorte.
    if(!totalReceitasDre) return '';
    const pctCalc = (valorOriginal / totalReceitasDre) * 100;
    if(!isFinite(pctCalc) || Math.abs(pctCalc) < 0.005) return '';
    return pctCalc.toFixed(2) + '%';
  }

  function itemFromRow(r){
    if(!r) return null;

    const desc = String(r.descricao || '').trim();
    if(!desc) return null;

    const valorOriginal = valorDreRow(r);
    const val = Math.abs(valorOriginal);
    const pctTexto = pctDreRow(r, valorOriginal);
    const pctValor = numPct(pctTexto);

    // ignora valor zerado
    if(val === 0) return null;

    // ignora percentual zerado quando vier preenchido como 0%, 0.00%, 0,00%, etc.
    if(pctTexto && pctValor === 0) return null;

    return { desc, valorOriginal, val, pct: pctTexto };
  }

  function itemByDesc(desc){
    return itemFromRow(getDreRow(desc));
  }

  function rowsEntre(inicio, fim){
    const i = getDreIndex(inicio);
    if(i < 0) return [];

    const f = fim ? getDreIndex(fim) : -1;
    const end = f > i ? f : dreRows.length;

    return dreRows.slice(i + 1, end);
  }

  function montarGrupoSecao({ label, inicio, fim, total }){
    const totalItem = total ? itemByDesc(total) : itemByDesc(inicio || label);
    const totalNorm = normDre(total || '');
    const inicioNorm = normDre(inicio || label);

    // Pega todos os filhos da seção automaticamente.
    // Assim, ao passar o mouse em CUSTO, aparecem todos os custos não zerados.
    const detalhes = rowsEntre(inicio || label, fim)
      .map(itemFromRow)
      .filter(Boolean)
      .filter(item => {
        const d = normDre(item.desc);
        if(d === inicioNorm) return false;
        if(totalNorm && d === totalNorm) return false;
        return true;
      });

    const value = totalItem
      ? totalItem.val
      : detalhes.reduce((acc, item) => acc + item.val, 0);

    if(value === 0) return null;

    return { label, value, totalItem, detalhes, periodo: mesesDreLabel };
  }

  function montarGrupoUnico({ label, desc }){
    const totalItem = itemByDesc(desc || label);
    if(!totalItem) return null;
    return {
      label,
      value: totalItem.val,
      totalItem,
      detalhes: [],
      periodo: mesesDreLabel
    };
  }

  const gruposDre = [
    montarGrupoSecao({
      label: 'RECEITAS',
      inicio: 'RECEITAS',
      fim: 'CUSTO',
      total: 'Total das receitas'
    }),

    montarGrupoSecao({
      label: 'CUSTO',
      inicio: 'CUSTO',
      fim: 'EBITDA',
      total: 'Fixos e Variáveis'
    }),

    montarGrupoUnico({
      label: 'EBITDA',
      desc: 'EBITDA'
    }),

    montarGrupoSecao({
      label: 'DESPESAS',
      inicio: 'Despesas',
      fim: 'Despesas Financeiras',
      total: 'Despesas'
    }),

    montarGrupoSecao({
      label: 'DESPESAS FINANCEIRAS',
      inicio: 'Despesas Financeiras',
      fim: 'Total das despesas',
      total: 'Despesas Financeiras'
    }),

    montarGrupoUnico({
      label: 'TOTAL DAS DESPESAS',
      desc: 'Total das despesas'
    }),

    montarGrupoUnico({
      label: 'RESULTADO DO EXERCÍCIO',
      desc: 'RESULTADO DO EXERCÍCIO'
    })
  ].filter(Boolean);

  const donutLabels = gruposDre.map(g => g.label);
  const donutData = gruposDre.map(g => g.value);

  state.dreContext = {
    grupos: gruposDre,
    totalReceitas: totalReceitasDre,
    periodoLabel: mesesDreLabel,
    meses: mesesDre
  };

  renderDonutDre(
    'chart-cat',
    donutData.length ? donutData : [0],
    donutLabels.length ? donutLabels : ['Sem dados'],
    gruposDre,
    totalReceitasDre,
    mesesDreLabel
  );

  renderDreWaterfall(gruposDre, mesesDreLabel);
  renderMonthComparison(consolAll, selIdx);
  renderFinancialTraffic(consolAll, selIdx);

  // Comparativo categoria — dinâmico conforme meses selecionados.
  // Importante: este gráfico deve mostrar o mix completo de categorias, como no modelo da imagem.
  // Por isso ele usa Entradas + Saídas por categoria e ignora apenas os filtros de tipo/categoria,
  // mantendo os filtros de mês, conta, dia e faixa de valor.
  const categoriaChartRows = rows => rows.filter(r => {
    const info = monthlyRowInfo(r);
    if(!info.valid) return false;
    if(state.mensal.conta !== 'all' && info.conta !== state.mensal.conta) return false;
    if(state.mensal.dayMin != null && info.day != null && info.day < state.mensal.dayMin) return false;
    if(state.mensal.dayMax != null && info.day != null && info.day > state.mensal.dayMax) return false;
    if(state.mensal.valMin != null && info.value < state.mensal.valMin) return false;
    if(state.mensal.valMax != null && info.value > state.mensal.valMax) return false;
    return true;
  });

  const categoriaValorTotal = r => {
    const info = monthlyRowInfo(r);
    return Math.abs(info.ent || 0) + Math.abs(info.sai || 0);
  };

  let mesesData = selectedMonthData(false)
    .map(m => ({...m, rows: categoriaChartRows(m.rows)}))
    .filter(m => m.rows.length > 0);

  // Se não houver meses selecionados ou dados, força um placeholder
  if (mesesData.length === 0) {
    mesesData = [{ nome: 'Sem dados', label:'Sem dados', rows: [] }];
  }

  // Monta lista completa de categorias presentes nos meses selecionados.
  // Aqui NÃO mexe no cálculo do Faturamento Bruto; ele continua sendo somente Entradas.
  // Correção: receitas que não aparecem na Caixa, como Mentorias, vêm da DRE.
  // Para não duplicar Tráfego/Lançamentos, a DRE só completa uma categoria quando
  // aquele mês não tem essa categoria vinda da Caixa.
  const caixaCatByMonth = {};
  let catTot = {};

  mesesData.forEach(mesObj => {
    const mesKey = mesObj.key || '';
    caixaCatByMonth[mesKey] = caixaCatByMonth[mesKey] || {};

    mesObj.rows.forEach(r => {
      const valor = categoriaValorTotal(r);
      if(valor <= 0) return;
      const k = categoryChartName(r);
      caixaCatByMonth[mesKey][k] = (caixaCatByMonth[mesKey][k] || 0) + valor;
      catTot[k] = (catTot[k] || 0) + valor;
    });
  });

  const monthKeysForDre = mesesData.map(m => m.key).filter(Boolean);
  const dreCatByMonth = dreRevenueCategoryMap(monthKeysForDre);

  monthKeysForDre.forEach(mesKey => {
    const dreCats = dreCatByMonth[mesKey] || {};
    Object.entries(dreCats).forEach(([cat, val]) => {
      if(val <= 0) return;
      const caixaVal = (caixaCatByMonth[mesKey] && caixaCatByMonth[mesKey][cat]) || 0;
      if(caixaVal > 0) return; // evita duplicar receita que já veio da Caixa
      catTot[cat] = (catTot[cat] || 0) + val;
    });
  });

  let catList = Object.keys(catTot)
    .filter(k => (catTot[k] || 0) > 0)
    .sort((a,b)=>(catTot[b]||0)-(catTot[a]||0));
  if (catList.length === 0) catList = ['Sem dados'];

  // Para cada mês selecionado, gera os totais de Entradas + Saídas por categoria,
  // completando receitas faltantes pela DRE.
  let series = mesesData.map(mesObj => ({
    name: mesObj.label || mesObj.nome,
    key: mesObj.key || '',
    data: catList.map(c => {
      const mesKey = mesObj.key || '';
      const caixaVal = (caixaCatByMonth[mesKey] && caixaCatByMonth[mesKey][c]) || 0;
      if(caixaVal > 0) return caixaVal;
      return (dreCatByMonth[mesKey] && dreCatByMonth[mesKey][c]) || 0;
    })
  }));
  // Se não houver dados, preenche com zero
  if (series.length === 0) {
    series = [{ name: 'Sem dados', key:'', data: [0] }];
  } else {
    // Se alguma série não tiver dados, preenche com zero
    series.forEach(s => { if (!s.data || s.data.length === 0) s.data = [0]; });
  }

  const cores = series.map(s => monthChartColor(s.key || s.name));
  renderBarH('chart-cat-comp', series, catList, cores, {
    height: Math.max(460, catList.length * Math.max(36, (series.length * 6) + 28)),
    barHeight: catList.length >= 8 ? '58%' : '62%',
    chart:{
      events:{
        dataPointSelection:(event, chartContext, config)=>{
          const serie = series[config.seriesIndex];
          const categoria = catList[config.dataPointIndex];
          if(serie && serie.key) openCategoryChartModal(categoria, serie.key);
        }
      }
    }
  });

}

/* ---------- MODAL DETALHE POR MÊS NOS GRÁFICOS ---------- */
const txModalState = {
  kind:'',
  rows:[],
  emptyMsg:'Nenhum registro',
  colSpan:7
};

function toggleClearButton(inputId, buttonId){
  const input = document.getElementById(inputId);
  const btn = document.getElementById(buttonId);
  if(!btn) return;
  btn.classList.toggle('hidden', !(input && String(input.value || '').trim()));
}
function clearSearchInput(inputId, buttonId, afterClear){
  const input = document.getElementById(inputId);
  if(input){
    input.value = '';
    input.focus();
  }
  toggleClearButton(inputId, buttonId);
  if(typeof afterClear === 'function') afterClear();
}
let savedPageScrollY = 0;
function setPageScrollLocked(lock){
  const html = document.documentElement;
  const body = document.body;

  if(lock){
    // Salva a posição atual apenas na primeira abertura de modal.
    // Não usa body position:fixed, porque isso faz os gráficos recalcularem largura e darem um "pulo" lateral.
    if(!body.classList.contains('modal-open')){
      savedPageScrollY = window.scrollY || html.scrollTop || body.scrollTop || 0;
      const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);
      body.style.setProperty('--scrollbar-compensation', `${scrollbarWidth}px`);
    }
    html.classList.add('modal-open');
    body.classList.add('modal-open');
    return;
  }

  const restoreY = savedPageScrollY || window.scrollY || html.scrollTop || body.scrollTop || 0;
  html.classList.remove('modal-open');
  body.classList.remove('modal-open');
  body.style.removeProperty('--scrollbar-compensation');

  requestAnimationFrame(() => {
    window.scrollTo(0, restoreY);
  });
}
function modalIsOpen(id){
  const el = document.getElementById(id);
  return !!el && !el.classList.contains('hidden');
}
function unlockPageIfNoModalOpen(){
  if(!modalIsOpen('modal-tx') && !modalIsOpen('modal-dre') && !modalIsOpen('modal-anual-summary') && !modalIsOpen('modal-kpi-chart')) setPageScrollLocked(false);
}
function openTxContainer(){
  const m=document.getElementById('modal-tx');
  if(!m) return;
  m.classList.remove('hidden');
  m.classList.add('flex');
  setPageScrollLocked(true);
}
function setModalHead(html){
  const head = document.getElementById('modal-head');
  if(head) head.innerHTML = html;
}
function setTxModalRows({kind, rows, emptyMsg, colSpan}){
  txModalState.kind = kind || 'movimentacoes';
  txModalState.rows = rows || [];
  txModalState.emptyMsg = emptyMsg || 'Nenhum registro';
  txModalState.colSpan = colSpan || 7;

  const search = document.getElementById('modal-search');
  if(search) search.value = '';
  updateModalSearchUI();
  renderTxModalRows();
}
function updateModalSearchUI(){
  toggleClearButton('modal-search', 'modal-search-clear');
}
function updateDreSearchUI(){
  toggleClearButton('dre-modal-search', 'dre-modal-search-clear');
}
function modalRowHaystack(item){
  const r = item.row || item;
  const d = parseDate(r[C.data]);
  const entrada = num(r[C.ent]);
  const saida = num(r[C.sai]);
  const total = entrada + saida;
  return normKey([
    d ? d.toLocaleDateString('pt-BR') : '',
    item._mes || r._mes || '',
    item._mesKey || r._mesKey || '',
    r[C.conta] || '',
    r[C.cat] || '',
    r[C.desc] || '',
    entrada ? fmtBRL2(entrada) : '',
    saida ? fmtBRL2(saida) : '',
    total ? fmtBRL2(total) : ''
  ].join(' '));
}
function txRowHtml(item){
  const r = item.row || item;
  const d = parseDate(r[C.data]);
  const mes = item._mes || r._mes || '-';
  const mesKey = item._mesKey || r._mesKey || '';
  const entrada = num(r[C.ent]);
  const saida = num(r[C.sai]);
  const total = entrada + saida;
  const pillClass = mesKey === 'total' ? 'pill-up' : 'pill-amber';

  return `<tr>
    <td class="mono">${d ? d.toLocaleDateString('pt-BR') : '-'}</td>
    <td><span class="pill ${pillClass}">${escapeHtml(mes)}</span></td>
    <td>${escapeHtml(r[C.conta] || '-')}</td>
    <td>${escapeHtml(r[C.cat] || '-')}</td>
    <td class="modal-desc-cell">${escapeHtml(r[C.desc] || '-')}</td>
    <td class="text-right mono money-pos modal-money">${entrada ? fmtBRL2(entrada) : '-'}</td>
    <td class="text-right mono money-neg modal-money">${saida ? fmtBRL2(saida) : '-'}</td>
  </tr>`;
}

function setBodyRowsChunked(body, rows, rowRenderer, emptyHtml, tokenKey, chunkSize = UI_RENDER_CHUNK_SIZE){
  if(!body) return;
  const token = (tableRenderTokens[tokenKey] || 0) + 1;
  tableRenderTokens[tokenKey] = token;

  if(!rows || !rows.length){
    body.innerHTML = emptyHtml;
    return;
  }

  // Para listas pequenas, mantém o render instantâneo. Para listas grandes,
  // divide em blocos para não congelar a UI por centenas/milhares de linhas.
  if(rows.length <= chunkSize){
    body.innerHTML = rows.map(rowRenderer).join('');
    return;
  }

  body.innerHTML = rows.slice(0, chunkSize).map(rowRenderer).join('');
  let index = chunkSize;

  const appendNext = () => {
    if(tableRenderTokens[tokenKey] !== token) return;
    const next = rows.slice(index, index + chunkSize).map(rowRenderer).join('');
    if(next) body.insertAdjacentHTML('beforeend', next);
    index += chunkSize;
    if(index < rows.length) scheduleIdle(appendNext);
  };

  scheduleIdle(appendNext);
}

function renderTxModalRows(){
  const search = document.getElementById('modal-search');
  updateModalSearchUI();
  const q = normKey(search ? search.value : '');
  const terms = q.split(/\s+/).filter(Boolean);
  const filtered = terms.length
    ? txModalState.rows.filter(item => {
        const hay = modalRowHaystack(item);
        return terms.every(t => hay.includes(t));
      })
    : txModalState.rows;

  const count = document.getElementById('modal-count');
  if(count) count.textContent = terms.length
    ? `${filtered.length} de ${txModalState.rows.length} registros`
    : `${txModalState.rows.length} registros`;

  const filterCount = document.getElementById('modal-filter-count');
  if(filterCount) filterCount.textContent = terms.length
    ? `Filtrando: ${filtered.length}/${txModalState.rows.length}`
    : 'Pesquise em todas as colunas do pop-up';

  const body = document.getElementById('modal-body');
  if(!body) return;
  setBodyRowsChunked(
    body,
    filtered,
    txRowHtml,
    `<tr><td colspan="${txModalState.colSpan}" class="text-center text-[var(--muted)] py-10">${escapeHtml(txModalState.emptyMsg)}</td></tr>`,
    'modal-body'
  );
}
function rowsForMonthlyModal(mesKey){
  if(mesKey === 'total'){
    return ACTIVE_MONTHS.flatMap(m => monthRows(m.key).map(row => ({row, _mes:m.label, _mesKey:m.key})));
  }

  const cfg = monthCfg(mesKey);
  if(!cfg) return [];
  return monthRows(cfg.key).map(row => ({row, _mes:cfg.label, _mesKey:cfg.key}));
}
function openMonthlyChartModal(tipo, mesKey){
  const isTotal = mesKey === 'total';
  const cfg = isTotal ? {key:'total', label:'Total', table:'Todas as tabelas Caixa'} : monthCfg(mesKey);
  if(!cfg) return;

  const isCusto = tipo === 'custo';
  const rows = rowsForMonthlyModal(mesKey)
    .filter(item => {
      const r = item.row || item;
      return isCusto ? num(r[C.sai]) > 0 : num(r[C.ent]) > 0;
    })
    .sort((a,b)=>(parseDate((b.row||b)[C.data])||0)-(parseDate((a.row||a)[C.data])||0));

  document.getElementById('modal-title').textContent = isCusto
    ? `Custo Operacional — ${cfg.label}`
    : `Faturamento Bruto — ${cfg.label}`;
  document.getElementById('modal-eyebrow').textContent = isTotal
    ? (isCusto ? 'Saídas de todas as tabelas Caixa' : 'Somente entradas de todas as tabelas Caixa')
    : (isCusto ? `Saídas da tabela ${TABLES[cfg.key] || cfg.table}` : `Somente entradas da tabela ${TABLES[cfg.key] || cfg.table}`);

  if(isCusto){
    setModalHead('<th>Data</th><th>Mês</th><th>Conta</th><th>Categoria</th><th>Descrição</th><th class="text-right">Entradas</th><th class="text-right">Saídas</th>');
    setTxModalRows({
      kind:'custo',
      rows,
      colSpan:7,
      emptyMsg: isTotal ? 'Nenhuma saída encontrada' : 'Nenhuma saída encontrada para este mês'
    });
  }else{
    setModalHead('<th>Data</th><th>Mês</th><th>Conta</th><th>Categoria</th><th>Descrição</th><th class="text-right">Entradas</th><th class="text-right">Saídas</th>');
    setTxModalRows({
      kind:'faturamento',
      rows,
      colSpan:7,
      emptyMsg: isTotal ? 'Nenhuma entrada encontrada' : 'Nenhuma entrada encontrada para este mês'
    });
  }

  openTxContainer();
}


function isInvestmentRow(row){
  const hay = normKey([row?.[C.cat] || '', row?.[C.desc] || '', row?.[C.conta] || ''].join(' '));
  if(!hay.trim()) return false;

  // Regra rígida: evita falsos positivos como "Criativos", que contém "ativo" no meio da palavra.
  const patterns = [
    /\binvest(?:imento|imentos|ir|ido|ida)?\b/,
    /\baporte(?:s)?\b/,
    /\bcapex\b/,
    /\bequip(?:amento|amentos)?\b/,
    /\binfra(?:estrutura)?\b/,
    /\bativo(?:s)?\b/,
    /\bimobiliz(?:ado|ados|acao|acoes)?\b/,
    /\bferramenta(?:s)?\b/,
    /\blicenca(?:s)?\b/,
    /\bsoftware(?:s)?\b/,
    /\basset(?:s)?\b/
  ];

  return patterns.some(rx => rx.test(hay));
}

function openInvestmentMonthModal(mesKey){
  const cfg = monthCfg(mesKey);
  if(!cfg) return;

  const annualRow = (state.anual.rows || []).find(r => monthIdx(r[A.mes]) === monthIdx(cfg.key));
  const valorInvestimento = annualRow ? num(annualRow[A.inv]) : 0;

  let rows = rowsForMonthlyModal(cfg.key)
    .filter(item => {
      const r = item.row || item;
      return isInvestmentRow(r) && (num(r[C.ent]) > 0 || num(r[C.sai]) > 0);
    })
    .sort((a,b)=>(parseDate((b.row||b)[C.data])||0)-(parseDate((a.row||a)[C.data])||0));

  // Se a Caixa do mês não tiver linhas claramente marcadas como investimento,
  // mostra somente o valor consolidado correto vindo do Financeiro 2026.
  if(!rows.length){
    rows = [{
      row:{
        [C.data]:'',
        [C.conta]:'Investimento consolidado',
        [C.cat]:'Investimentos',
        [C.desc]:'Valor consolidado do mês no Financeiro 2026',
        [C.ent]:0,
        [C.sai]:Math.abs(valorInvestimento)
      },
      _mes:cfg.label,
      _mesKey:cfg.key
    }];
  }

  document.getElementById('modal-title').textContent = `Investimentos — ${cfg.label}`;
  document.getElementById('modal-eyebrow').textContent = `Valor consolidado: ${fmtBRL2(valorInvestimento)} • Fonte: Financeiro 2026`;
  setModalHead('<th>Data</th><th>Mês</th><th>Conta</th><th>Categoria</th><th>Descrição</th><th class="text-right">Entradas</th><th class="text-right">Saídas</th>');
  setTxModalRows({
    kind:'investimentos',
    rows,
    colSpan:7,
    emptyMsg:'Nenhum lançamento de investimento encontrado para este mês'
  });
  openTxContainer();
}


function openRoiMonthModal(mesKey){
  const cfg = monthCfg(mesKey);
  if(!cfg) return;

  const idx = monthIdx(cfg.key);
  const current = anualCache.byMonth[idx] || {roiRaw:0,roiDelta:null};
  const previousRaw = idx > 0 ? num(anualCache.byMonth[idx - 1]?.roiRaw) : 0;
  const roiDelta = current.roiDelta;

  const rows = [];
  if(roiDelta != null){
    rows.push({
      row:{
        [C.data]:'',
        [C.conta]:'Financeiro 2026',
        [C.cat]:'ROI',
        [C.desc]:`ROI calculado mês contra mês: ${fmtBRL2(num(current.roiRaw))} - ${fmtBRL2(previousRaw)}`,
        [C.ent]: roiDelta >= 0 ? roiDelta : 0,
        [C.sai]: roiDelta < 0 ? Math.abs(roiDelta) : 0
      },
      _mes:cfg.label,
      _mesKey:cfg.key
    });
  }

  document.getElementById('modal-title').textContent = `ROI — ${cfg.label}`;
  document.getElementById('modal-eyebrow').textContent = roiDelta != null
    ? `Financeiro 2026 • roi atual ${fmtBRL2(num(current.roiRaw))} - roi anterior ${fmtBRL2(previousRaw)} = ${fmtBRL2(roiDelta)}`
    : 'Sem roi informado na tabela Financeiro 2026 para este mês ou mês anterior';
  setModalHead('<th>Data</th><th>Mês</th><th>Conta</th><th>Categoria</th><th>Descrição</th><th class="text-right">Entradas</th><th class="text-right">Saídas</th>');
  setTxModalRows({
    kind:'roi',
    rows,
    colSpan:7,
    emptyMsg:'Nenhum ROI encontrado para este mês'
  });
  openTxContainer();
}

function openCategoryChartModal(categoria, mesKey){
  const cfg = monthCfg(mesKey);
  if(!cfg || !categoria || categoria === 'Sem dados') return;

  const caixaRows = monthRows(cfg.key)
    .filter(row => categoryChartName(row) === categoria)
    .map(row => ({row, _mes:cfg.label, _mesKey:cfg.key}));

  // Se a categoria foi completada pela DRE (ex.: Mentorias), mostra a linha consolidada da DRE.
  // Se já existe na Caixa, não soma de novo para não duplicar Tráfego/Lançamentos.
  const dreRows = caixaRows.length ? [] : dreRevenueModalRows(categoria, cfg.key);

  const rows = caixaRows
    .concat(dreRows)
    .sort((a,b)=>(parseDate((b.row||b)[C.data])||0)-(parseDate((a.row||a)[C.data])||0));

  document.getElementById('modal-title').textContent = `Categoria — ${categoria}`;
  document.getElementById('modal-eyebrow').textContent = dreRows.length && !caixaRows.length
    ? `Valor puxado da DRE de ${cfg.label}`
    : `Entradas e saídas de ${cfg.label} na tabela ${TABLES[cfg.key] || cfg.table}`;
  setModalHead('<th>Data</th><th>Mês</th><th>Conta</th><th>Categoria</th><th>Descrição</th><th class="text-right">Entradas</th><th class="text-right">Saídas</th>');
  setTxModalRows({
    kind:'faturamento',
    rows,
    colSpan:7,
    emptyMsg:'Nenhum registro encontrado para esta categoria'
  });
  openTxContainer();
}

/* ---------- MODAL ENTRADA/SAÍDA ---------- */
function openTxModal(tipo){
  setModalHead('<th>Data</th><th>Mês</th><th>Conta</th><th>Categoria</th><th>Descrição</th><th class="text-right">Entradas</th><th class="text-right">Saídas</th>');
  // Filtra pelos meses selecionados
  const srcs = selectedMonthData(false).flatMap(m =>
    m.rows.map(row => ({row, _mes:m.label, _mesKey:m.key}))
  );
  const rows = srcs.filter(item=>{
    const r = item.row || item;
    const d=parseDate(r[C.data]);
    const categoria=(r[C.cat]||'').toString().trim();
    if(!d || !categoria) return false;
    const e=num(r[C.ent]), s=num(r[C.sai]);
    if(tipo==='entrada' && !(e>0)) return false;
    if(tipo==='saida'   && !(s>0)) return false;
    return true;
  }).sort((a,b)=>(parseDate((b.row||b)[C.data])||0)-(parseDate((a.row||a)[C.data])||0));

  document.getElementById('modal-title').textContent = tipo==='entrada' ? '↑ Entradas' : '↓ Saídas';
  document.getElementById('modal-eyebrow').textContent = tipo==='entrada' ? 'Movimentações de entrada' : 'Movimentações de saída';
  setTxModalRows({
    kind:'movimentacoes',
    rows,
    colSpan:7,
    emptyMsg:'Nenhum registro'
  });
  openTxContainer();
}

function buildKpiModalItems(key){
  const rows = anualCache.rows.length ? anualCache.rows : (state.anual.rows || []).filter(r => isActiveMonthIndex(monthIdx(r[A.mes])));
  const byMonth = anualCache.byMonth.length ? anualCache.byMonth : (() => {
    const arr = Array(12).fill(null).map(()=>({caixa:0,lucro:0,cresc:0,_count:0,_hasValue:false}));
    rows.forEach(r => {
      const i = monthIdx(r[A.mes]);
      if(i < 0) return;
      arr[i].caixa += num(r[A.caixa]);
      arr[i].lucro += num(r[A.lucro]);
      arr[i].cresc += num(r[A.cresc]);
      arr[i]._count++;
      arr[i]._hasValue = arr[i]._hasValue || annualRowHasRealFinancialData(r);
    });
    arr.forEach(m => {
      if(m._count > 1){
        m.lucro = m.lucro / m._count;
        m.cresc = m.cresc / m._count;
      }
    });
    return arr;
  })();

  return ACTIVE_MONTHS.map((m, i) => {
    const hasData = annualMonthHasRealData(byMonth[i], i);
    return {
      label:m.short,
      fullLabel:m.label,
      // Mantém todos os meses no eixo X. Quando o mês ainda não tem dado real,
      // o valor fica null para não criar queda falsa para 0% / -100%.
      value:hasData ? num(byMonth[i]?.[key]) : null,
      rawValue:num(byMonth[i]?.[key]),
      hasData
    };
  });
}

function splitLucratividadeSeries(data){
  const good = data.map(v => {
    const n = Number(v);
    return v !== null && v !== undefined && Number.isFinite(n) && n >= LUCRO_META ? n : null;
  });
  const bad = data.map(v => {
    const n = Number(v);
    return v !== null && v !== undefined && Number.isFinite(n) && n < LUCRO_META ? n : null;
  });
  return {good, bad};
}

function lucroPointAnnotations(items){
  return (items || []).map((item, idx) => {
    const v = item && item.value;
    const n = Number(v);
    if(v === null || v === undefined || !Number.isFinite(n)) return null;
    return {
      x:item.label,
      y:n,
      marker:{
        size:6,
        fillColor:lucratividadeColor(n),
        strokeColor:'#0a0a0a',
        strokeWidth:2,
        radius:99
      }
    };
  }).filter(Boolean);
}

function renderPercentModalChart({id, title, seriesName, items, color, showMeta=false}){
  const data = items.map(i=>i.value);
  const values = data
    .filter(v => v !== null && v !== undefined && Number.isFinite(Number(v)))
    .map(Number);
  const yaxis = {
    labels:{style:{colors:'#737373',fontFamily:'IBM Plex Mono',fontSize:'11px'},formatter:v=>`${Number(v).toFixed(0)}%`}
  };

  if(showMeta){
    const minValue = values.length ? Math.min(...values, LUCRO_META) : 0;
    const maxValue = values.length ? Math.max(...values, LUCRO_META) : LUCRO_META;
    yaxis.min = Math.min(0, Math.floor(minValue / 5) * 5);
    yaxis.max = Math.max(35, Math.ceil((maxValue + 5) / 5) * 5);
  }

  const baseOptions = {
    chart:{type:'line',height:360,background:'transparent',toolbar:{show:false},foreColor:'#737373',fontFamily:'Sora'},
    stroke:{curve:'smooth',lineCap:'round'},
    markers:{size:5,strokeWidth:0,hover:{size:8}},
    dataLabels:{enabled:false},
    grid:baseGrid,
    xaxis:{...baseAxis,categories:items.map(i=>i.label)},
    yaxis,
    tooltip:{theme:'dark',y:{formatter:v=>v == null ? 'Sem dados' : `${Number(v).toFixed(2)}%`}},
    legend:legendOptions(),
    annotations: showMeta ? {
      yaxis:[{
        y:LUCRO_META,
        borderColor:'#d6b77a',
        strokeDashArray:6,
        label:{
          text:lucroMetaLabel(),
          borderColor:'#d6b77a',
          style:{background:'#111',color:'#d6b77a',fontSize:'11px',fontFamily:'Sora',fontWeight:800}
        }
      }],
      points:lucroPointAnnotations(items)
    } : undefined
  };

  if(showMeta){
    const split = splitLucratividadeSeries(data);
    upsert(id, mergeOptions(baseOptions, {
      series:[
        {name:'Lucratividade %', data},
        {name:`Acima da meta`, data:split.good},
        {name:`Abaixo da meta`, data:split.bad}
      ],
      colors:['rgba(255,255,255,.22)', CHART_THEME.positive, CHART_THEME.negative],
      stroke:{width:[2,4,4],curve:'smooth',lineCap:'round'},
      markers:{size:[0,5,5],strokeWidth:0,hover:{size:8}},
      legend:legendOptions({customLegendItems:[`Lucratividade %`, `Acima da meta`, `Abaixo da meta`]})
    }));
    return;
  }

  upsert(id, mergeOptions(baseOptions, {
    series:[{name:seriesName,data}],
    colors:[color],
    stroke:{width:3,curve:'smooth',lineCap:'round'},
    markers:{size:5,strokeWidth:0,colors:[color],hover:{size:8}}
  }));
}

function openKpiIndicatorModal(origem='caixa'){
  const configMap = {
    saldo:{label:'Saldo Líquido', title:'Caixa por Mês', type:'money', key:'caixa', seriesName:'Caixa', color:CHART_THEME.accent2, note:'Este gráfico usa a coluna Caixa da tabela Financeiro 2026, mês a mês.'},
    caixa:{label:'Caixa', title:'Caixa por Mês', type:'money', key:'caixa', seriesName:'Caixa', color:CHART_THEME.accent2, note:'Este gráfico usa a coluna Caixa da tabela Financeiro 2026, mês a mês.'},
    lucratividade:{label:'Lucratividade', title:'Lucratividade por Mês', type:'percent', key:'lucro', seriesName:'Lucratividade %', color:CHART_THEME.positive, note:'Este gráfico usa a coluna Lucratividade da tabela Financeiro 2026, mês a mês.', meta:true},
    anualLucratividade:{label:'Lucratividade Média', title:'Lucratividade por Mês', type:'percent', key:'lucro', seriesName:'Lucratividade %', color:CHART_THEME.positive, note:'Este gráfico usa a coluna Lucratividade da tabela Financeiro 2026, mês a mês.', meta:true},
    crescimento:{label:'Crescimento', title:'Crescimento por Mês', type:'percent', key:'cresc', seriesName:'Crescimento %', color:CHART_THEME.accent, note:'Este gráfico usa a coluna Percentual de Crescimento da tabela Financeiro 2026, mês a mês.'}
  };
  const cfg = configMap[origem] || configMap.caixa;

  const title = document.getElementById('kpi-chart-title');
  const eyebrow = document.getElementById('kpi-chart-eyebrow');
  const count = document.getElementById('kpi-chart-count');
  const note = document.getElementById('kpi-chart-note');

  if(title) title.textContent = cfg.title;
  if(eyebrow) eyebrow.textContent = `Aberto pelo indicador: ${cfg.label}`;
  if(note) note.textContent = cfg.note;

  const chartItems = buildKpiModalItems(cfg.key);
  const ativos = chartItems.filter(i => i.hasData);
  if(count) count.textContent = `12 meses exibidos • ${ativos.length || 0} com dados`;

  const modal = document.getElementById('modal-kpi-chart');
  if(!modal) return;
  const renderToken = ++kpiModalRenderToken;
  destroyChart('modal-kpi-chart-graph');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setPageScrollLocked(true);

  requestAnimationFrame(() => {
    if(renderToken !== kpiModalRenderToken || modal.classList.contains('hidden')) return;
    if(cfg.type === 'percent'){
      renderPercentModalChart({
        id:'modal-kpi-chart-graph',
        title:cfg.title,
        seriesName:cfg.seriesName,
        items:chartItems,
        color:cfg.color,
        showMeta:!!cfg.meta
      });
      return;
    }

    renderBar(
      'modal-kpi-chart-graph',
      [{name:cfg.seriesName, data:chartItems.map(i => i.value)}],
      chartItems.map(i => i.label),
      [cfg.color],
      false,
      {
        chart:{height:360},
        plotOptions:{bar:{columnWidth:'52%'}},
        yaxis:{labels:{style:{colors:'#737373',fontFamily:'IBM Plex Mono',fontSize:'11px'},formatter:v=>'R$ '+fmtK(v)}},
        tooltip:{theme:'dark',y:{formatter:v=>v == null ? 'Sem dados' : fmtBRL2(v)}}
      }
    );
  });
}

// Compatibilidade: se algum HTML antigo ainda chamar openKpiCaixaModal(...), continua funcionando.
window.openKpiIndicatorModal = openKpiIndicatorModal;
window.openKpiCaixaModal = openKpiIndicatorModal;

function closeKpiCaixaModal(){
  const modal = document.getElementById('modal-kpi-chart');
  if(!modal) return;
  kpiModalRenderToken++;
  destroyChart('modal-kpi-chart-graph');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  unlockPageIfNoModalOpen();
}

function closeTxModal(){
  const m=document.getElementById('modal-tx');
  if(!m) return;
  m.classList.add('hidden');
  m.classList.remove('flex');
  const search = document.getElementById('modal-search');
  if(search) search.value = '';
  unlockPageIfNoModalOpen();
}

/* ---------- RENDER ABA ANUAL ---------- */
function renderAnual(){
  clampAnualRange();
  const rows = anualCache.rows.length ? anualCache.rows : (state.anual.rows || []).filter(r => isActiveMonthIndex(monthIdx(r[A.mes])));
  const byMonth = anualCache.byMonth.length ? anualCache.byMonth : Array(12).fill(null).map(()=>({fb:0,fl:0,caixa:0,eb:0,custos:0,inv:0,roi:0,endiv:0,lucro:0,cresc:0,_count:0}));

  const {mMin,mMax}=state.anual;
  const sliceIdx=(arr)=>arr.slice(mMin,mMax+1);
  const labels=sliceIdx(MESES);
  const get=k=>sliceIdx(byMonth.map(b=>b[k]));

  const totFB=get('fb').reduce((a,b)=>a+b,0);
  const totFL=get('fl').reduce((a,b)=>a+b,0);
  const totEB=get('eb').reduce((a,b)=>a+b,0);
  const totInv=get('inv').reduce((a,b)=>a+b,0);
  const totRoi=get('roiDelta').reduce((a,b)=>a+num(b),0);
  const active=get('fb').filter((_,i)=>byMonth[mMin+i]._count).length||1;
  const lucroAvg=get('lucro').reduce((a,b)=>a+b,0)/active;

  setMoneyText('a-kpi-fb', totFB);
  setMoneyText('a-kpi-fl', totFL);
  setMoneyText('a-kpi-eb', totEB);
  setMoneyText('a-kpi-inv', totInv);
  setMoneyText('a-kpi-rend', totRoi);
  setLucratividadeText('a-kpi-lu', lucroAvg);

  renderArea('chart-faturamento',[
    {name:'Bruto',data:get('fb')},{name:'Líquido',data:get('fl')}
  ],[CHART_THEME.primary,CHART_THEME.secondary],320,labels);

  renderBar('chart-caixa',[{name:'Caixa',data:get('caixa')}],labels,[CHART_THEME.accent2]);
  renderArea('chart-ebitda',[{name:'EBITDA',data:get('eb')}],[CHART_THEME.positive],260,labels);

  // Custo Operacional na visão anual: total apenas do recorte ativo/selecionado.
  const custoTotalAnual = get('custos').reduce((acc, v) => acc + Math.abs(num(v)), 0);
  const custoLabels = [...labels, 'Total'];
  const custoData = [...get('custos').map(v=>Math.abs(v)), custoTotalAnual];
  const custoKeys = [...ACTIVE_MONTHS.slice(mMin, mMax + 1).map(m => m.key), 'total'];
  renderBar('chart-custos',[{name:'Custo Operacional',data:custoData}],custoLabels,[CHART_THEME.primary],false,{
    yaxis:{min:0},
    chart:{
      events:{
        dataPointSelection:(event, chartContext, config)=>{
          const key = custoKeys[config.dataPointIndex];
          if(key) openMonthlyChartModal('custo', key);
        }
      }
    }
  });
  const investimentoKeys = ACTIVE_MONTHS.slice(mMin, mMax + 1).map(m => m.key);
  const investimentoSeries = get('inv').map(v => Math.abs(v));
  const roiSeries = get('roiDelta');
  renderBar('chart-investimentos',[
    {name:'Investimentos',data:investimentoSeries},
    {name:'ROI',data:roiSeries}
  ],labels,[CHART_THEME.accent, CHART_THEME.positive],true,{
    chart:{
      events:{
        dataPointSelection:(event, chartContext, config)=>{
          const key = investimentoKeys[config.dataPointIndex];
          if(!key) return;
          if(config.seriesIndex === 0) openInvestmentMonthModal(key);
          if(config.seriesIndex === 1 && roiSeries[config.dataPointIndex] != null) openRoiMonthModal(key);
        }
      }
    },
    plotOptions:{bar:{columnWidth:'70%'}},
    tooltip:{
      theme:'dark',
      shared:false,
      intersect:true,
      fixed:{enabled:true,position:'topLeft',offsetX:12,offsetY:10},
      custom:({series,seriesIndex,dataPointIndex,w})=>{
        const nome = w?.globals?.seriesNames?.[seriesIndex] || '';
        const mes = w?.globals?.categoryLabels?.[dataPointIndex] || labels[dataPointIndex] || '';
        const valor = series?.[seriesIndex]?.[dataPointIndex];
        if(valor == null) return '';
        const isRoi = nome === 'ROI';
        return `
          <div class="safe-chart-tooltip">
            <div class="safe-chart-tooltip-month">${escapeHtml(mes)}</div>
            <div class="safe-chart-tooltip-row">
              <span class="safe-chart-tooltip-dot" style="background:${isRoi ? CHART_THEME.positive : CHART_THEME.accent}"></span>
              <span>${escapeHtml(nome)}</span>
              <strong>${fmtBRL2(valor)}</strong>
            </div>
            <div class="safe-chart-tooltip-source">${isRoi ? 'Financeiro 2026 • coluna roi • mês atual - mês anterior' : 'Financeiro 2026 • coluna Investimentos'}</div>
          </div>
        `;
      }
    }
  });
  renderLine('chart-lucro',[{name:'Lucro %',data:get('lucro')}],labels,[CHART_THEME.positive]);
  renderLine('chart-cresc',[{name:'Crescimento %',data:get('cresc')}],labels,[CHART_THEME.accent]);

  document.getElementById('a-table-body').innerHTML=rows.map(r=>{
    const lucro=num(r[A.lucro]), cresc=num(r[A.cresc]);
    const mesKey = monthCfg(r[A.mes])?.key || '';
    const roiIdx = mesKey ? monthIdx(mesKey) : -1;
    const roiDisplay = mesKey ? roiMonthDisplay(roiIdx) : fmtBRL2(anualCache.byMonth.reduce((acc, b) => acc + num(b.roiDelta), 0));
    const roiValue = roiIdx >= 0 ? roiMonthValue(roiIdx) : anualCache.byMonth.reduce((acc, b) => acc + num(b.roiDelta), 0);
    return `<tr>
      <td class="font-semibold">${mesKey ? `<button type="button" class="annual-invest-btn" data-open-invest-month="${mesKey}">${escapeHtml(r[A.mes]||'-')}</button>` : escapeHtml(r[A.mes]||'-')}</td>
      <td class="text-right mono ${moneyClass(num(r[A.fb]))}">${fmtBRL2(num(r[A.fb]))}</td>
      <td class="text-right mono ${moneyClass(num(r[A.fl]))}">${fmtBRL2(num(r[A.fl]))}</td>
      <td class="text-right mono ${moneyClass(num(r[A.caixa]))}">${fmtBRL2(num(r[A.caixa]))}</td>
      <td class="text-right mono ${moneyClass(num(r[A.eb]))}">${fmtBRL2(num(r[A.eb]))}</td>
      <td class="text-right mono ${moneyClass(num(r[A.custos]))}">${fmtBRL2(num(r[A.custos]))}</td>
      <td class="text-right mono ${moneyClass(num(r[A.inv]))}">${mesKey ? `<button type="button" class="annual-invest-cell-btn ${moneyClass(num(r[A.inv]))}" data-open-invest-month="${mesKey}">${fmtBRL2(num(r[A.inv]))}</button>` : fmtBRL2(num(r[A.inv]))}</td>
      <td class="text-right mono ${moneyClass(roiValue)}">${roiDisplay}</td>
      <td class="text-right mono ${lucratividadeClass(lucro)}">${fmtPct(lucro)}</td>
      <td class="text-right mono ${cresc>=0?'text-fuchsia-300':'text-rose-300'}">${fmtPct(cresc)}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="10" class="text-center text-[var(--muted)] py-10">Sem dados</td></tr>';

  document.querySelectorAll('[data-open-invest-month]').forEach(btn=>{
    btn.addEventListener('click', ()=> openInvestmentMonthModal(btn.dataset.openInvestMonth));
  });
}


/* ---------- CHART HELPERS ---------- */
function prefersReducedMotion(){
  return typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function chartMotionOptions(){
  return (PERFORMANCE_MODE || prefersReducedMotion()) ? {enabled:false} : CHART_MOTION;
}

function markChartMotion(id, className, duration=180){
  const el = document.getElementById(id);
  if(!el || PERFORMANCE_MODE || prefersReducedMotion()) return;
  clearTimeout(chartMotionTimers[id + ':' + className]);
  el.classList.add(className);
  chartMotionTimers[id + ':' + className] = setTimeout(()=>{
    el.classList.remove(className);
  }, duration);
}

function normalizeChartOptions(opt){
  opt = opt || {};
  opt.chart = mergeOptions(opt.chart || {}, {
    animations:chartMotionOptions(),
    toolbar:{show:false},
    redrawOnParentResize:false,
    redrawOnWindowResize:false
  });
  opt.states = mergeOptions({
    normal:{filter:{type:'none'}},
    hover:{filter:{type:'lighten',value:.035}},
    active:{allowMultipleDataPointsSelection:false,filter:{type:'none'}}
  }, opt.states || {});
  return opt;
}
function chartOptionSignature(opt){
  try{
    return JSON.stringify({dataVersion,opt}, (key, value) => typeof value === 'function' ? '__fn__' : value);
  }catch(e){
    return String(Date.now());
  }
}
function upsert(id,opt){
  const el=document.querySelector('#'+id); if(!el) return;
  const card = el.closest?.('.card');
  if(card) card.classList.add('chart-card');

  opt = normalizeChartOptions(opt);
  opt.chart = mergeOptions(opt.chart || {}, {id});
  const nextType = opt?.chart?.type || 'line';
  const signature = chartOptionSignature(opt);

  // Se nada mudou, não chama updateOptions. Isso evita repaints caros ao clicar em filtros
  // que não alteram o dataset final do gráfico.
  if(charts[id] && charts[id].__type === nextType && chartOptionSignatures[id] === signature) return;

  // ApexCharts costuma falhar quando tentamos trocar o tipo do mesmo gráfico
  // (bar -> line ou line -> bar) usando apenas updateOptions. Nesses casos, recria.
  if(charts[id] && charts[id].__type !== nextType){
    markChartMotion(id, 'chart-soft-exit', 120);
    destroyChart(id);
  }

  chartOptionSignatures[id] = signature;

  if(charts[id]){
    markChartMotion(id, 'chart-soft-update', 180);
    charts[id].updateOptions(opt, false, false, false);
  } else {
    el.innerHTML = '';
    markChartMotion(id, 'chart-soft-enter', 220);
    charts[id]=new ApexCharts(el,opt);
    charts[id].__type = nextType;
    charts[id].render().then(()=>markChartMotion(id, 'chart-soft-ready', 220));
  }
}
function destroyChart(id){
  if(charts[id]){
    try{ charts[id].destroy(); }catch(e){ console.warn('Erro ao destruir gráfico', id, e); }
    delete charts[id];
    delete chartOptionSignatures[id];
  }
  const el=document.querySelector('#'+id);
  if(el) el.innerHTML='';
}
const baseGrid={borderColor:'#1f1f1f',strokeDashArray:4,padding:{left:8,right:8}};
const baseAxis={labels:{style:{colors:'#737373',fontSize:'11px',fontFamily:'IBM Plex Mono'}},axisBorder:{show:false},axisTicks:{show:false}};
function mergeOptions(base, extra={}){
  const out = {...base};
  Object.keys(extra || {}).forEach(k=>{
    const bv = out[k];
    const ev = extra[k];
    const bothObjects = bv && ev && typeof bv === 'object' && typeof ev === 'object' && !Array.isArray(bv) && !Array.isArray(ev);
    out[k] = bothObjects ? mergeOptions(bv, ev) : ev;
  });
  return out;
}

function legendOptions(extra={}){
  const base = {
    show:true,
    showForSingleSeries:true,
    position:'bottom',
    horizontalAlign:'center',
    floating:false,
    fontSize:'12px',
    fontFamily:'Sora',
    fontWeight:650,
    labels:{colors:'#f5f5f5',useSeriesColors:false},
    markers:{width:10,height:10,radius:99,offsetX:0,offsetY:0},
    itemMargin:{horizontal:6,vertical:6},
    onItemClick:{toggleDataSeries:true},
    onItemHover:{highlightDataSeries:true}
  };
  return mergeOptions(base, extra);
}

function renderArea(id,series,colors,height=300,categories){
  upsert(id,{
    chart:{type:'area',height,background:'transparent',toolbar:{show:false},foreColor:'#737373',fontFamily:'Sora',animations:chartMotionOptions()},
    series,colors,
    stroke:{curve:'smooth',width:3,lineCap:'round'},
    fill:{type:'gradient',gradient:{shadeIntensity:1,opacityFrom:.55,opacityTo:.02,stops:[0,95],colorStops:colors.map(c=>[
      {offset:0,color:c,opacity:.55},{offset:100,color:c,opacity:0}
    ])[0]}},
    dataLabels:{enabled:false},
    grid:baseGrid,
    markers:{size:0,hover:{size:6}},
    xaxis:{...baseAxis,categories:categories||Array.from({length:series[0].data.length},(_,i)=>String(i+1))},
    yaxis:{labels:{style:{colors:'#737373',fontFamily:'IBM Plex Mono',fontSize:'11px'},formatter:v=>'R$ '+fmtK(v)}},
    tooltip:{theme:'dark',y:{formatter:v=>fmtBRL2(v)}},
    legend:legendOptions({markers:{width:10,height:10,radius:99}}),
  });
}
function renderBar(id,series,categories,colors,grouped=false,extraOpts={}){
  const baseOpt = {
    chart:{type:'bar',height:260,background:'transparent',toolbar:{show:false},foreColor:'#737373',fontFamily:'Sora'},
    series,colors,
    plotOptions:{bar:{borderRadius:6,borderRadiusApplication:'end',columnWidth:grouped?'70%':'55%'}},
    fill:{type:'gradient',gradient:{shade:'dark',type:'vertical',shadeIntensity:.5,opacityFrom:1,opacityTo:.65}},
    dataLabels:{enabled:false},
    grid:baseGrid,
    xaxis:{...baseAxis,categories},
    yaxis:{labels:{style:{colors:'#737373',fontFamily:'IBM Plex Mono',fontSize:'11px'},formatter:v=>'R$ '+fmtK(v)}},
    tooltip:{theme:'dark',y:{formatter:v=>fmtBRL2(v)}},
    legend:legendOptions(),
  };
  const opts = {...extraOpts};
  if(opts.chart){ baseOpt.chart = {...baseOpt.chart, ...opts.chart}; delete opts.chart; }
  if(opts.plotOptions){ baseOpt.plotOptions = {...baseOpt.plotOptions, ...opts.plotOptions}; delete opts.plotOptions; }
  if(opts.xaxis){ baseOpt.xaxis = {...baseOpt.xaxis, ...opts.xaxis}; delete opts.xaxis; }
  if(opts.yaxis){ baseOpt.yaxis = {...baseOpt.yaxis, ...opts.yaxis}; delete opts.yaxis; }
  upsert(id,Object.assign(baseOpt, opts));
}
function renderBarStacked(id,series,categories,colors){
  upsert(id,{
    chart:{type:'bar',height:300,background:'transparent',toolbar:{show:false},foreColor:'#737373',stacked:true,stackType:'normal',fontFamily:'Sora'},
    series,colors,
    plotOptions:{bar:{borderRadius:3,columnWidth:'70%'}},
    dataLabels:{enabled:false},
    grid:baseGrid,
    xaxis:{...baseAxis,categories},
    yaxis:{labels:{style:{colors:'#737373',fontFamily:'IBM Plex Mono',fontSize:'11px'},formatter:v=>'R$ '+fmtK(Math.abs(v))}},
    tooltip:{theme:'dark',y:{formatter:v=>fmtBRL2(Math.abs(v))}},
    legend:legendOptions(),
  });
}
function renderBarH(id,series,categories,colors,opts={}){
  const height = opts.height || Math.max(360, categories.length * 40);
  const barHeight = opts.barHeight || '68%';
  const baseOpt = {
    chart:{type:'bar',height,background:'transparent',toolbar:{show:false},foreColor:'#737373',fontFamily:'Sora'},
    series,colors,
    stroke:{show:true,width:1,colors:['#0a0a0a']},
    plotOptions:{bar:{horizontal:true,borderRadius:6,borderRadiusApplication:'end',barHeight}},
    fill:{type:'gradient',gradient:{shade:'dark',type:'horizontal',shadeIntensity:.25,opacityFrom:.98,opacityTo:.78,stops:[0,100]}},
    dataLabels:{enabled:false},
    grid:baseGrid,
    xaxis:{...baseAxis,categories,labels:{style:{colors:'#737373',fontFamily:'IBM Plex Mono',fontSize:'11px'},formatter:v=>'R$ '+fmtK(v)}},
    yaxis:{labels:{style:{colors:'#fafafa',fontSize:'12px'}}},
    tooltip:{theme:'dark',y:{formatter:v=>fmtBRL2(v)}},
    legend:legendOptions({markers:{width:10,height:10,radius:99},itemMargin:{horizontal:7,vertical:6}}),
  };

  const extra = {...opts};
  delete extra.height;
  delete extra.barHeight;
  if(extra.chart){ baseOpt.chart = mergeOptions(baseOpt.chart, extra.chart); delete extra.chart; }
  if(extra.plotOptions){ baseOpt.plotOptions = mergeOptions(baseOpt.plotOptions, extra.plotOptions); delete extra.plotOptions; }
  if(extra.xaxis){ baseOpt.xaxis = mergeOptions(baseOpt.xaxis, extra.xaxis); delete extra.xaxis; }
  if(extra.yaxis){ baseOpt.yaxis = mergeOptions(baseOpt.yaxis, extra.yaxis); delete extra.yaxis; }

  upsert(id,Object.assign(baseOpt, extra));
}
function renderLine(id,series,categories,colors){
  const opt = {
    chart:{type:'line',height:240,background:'transparent',toolbar:{show:false},foreColor:'#737373',fontFamily:'Sora'},
    series,colors,
    stroke:{curve:'smooth',width:3,lineCap:'round'},
    markers:{size:5,strokeWidth:0,colors,hover:{size:8}},
    dataLabels:{enabled:false},
    grid:baseGrid,
    xaxis:{...baseAxis,categories},
    yaxis:{labels:{style:{colors:'#737373',fontFamily:'IBM Plex Mono',fontSize:'11px'},formatter:v=>v.toFixed(0)+'%'}},
    tooltip:{theme:'dark',y:{formatter:v=>v == null ? 'Sem dados' : `${Number(v).toFixed(2)}%`}},
    legend:legendOptions(),
  };

  if(id === 'chart-lucro'){
    const data = (series[0]?.data || []).map(v => v === null || v === undefined ? null : Number(v));
    const values = data.filter(v => v !== null && Number.isFinite(Number(v))).map(Number);
    const minValue = values.length ? Math.min(...values, LUCRO_META) : 0;
    const maxValue = values.length ? Math.max(...values, LUCRO_META) : LUCRO_META;
    const items = categories.map((label, idx) => ({label, value:data[idx]}));
    const split = splitLucratividadeSeries(data);

    opt.series = [
      {name:'Lucratividade %', data},
      {name:'Acima da meta', data:split.good},
      {name:'Abaixo da meta', data:split.bad}
    ];
    opt.colors = ['rgba(255,255,255,.22)', CHART_THEME.positive, CHART_THEME.negative];
    opt.stroke = {curve:'smooth',width:[2,4,4],lineCap:'round'};
    opt.markers = {size:[0,5,5],strokeWidth:0,hover:{size:8}};
    opt.yaxis.min = Math.min(0, Math.floor(minValue / 5) * 5);
    opt.yaxis.max = Math.max(35, Math.ceil((maxValue + 5) / 5) * 5);
    opt.legend = legendOptions({customLegendItems:['Lucratividade %','Acima da meta','Abaixo da meta']});
    opt.annotations = {
      yaxis:[{
        y:LUCRO_META,
        borderColor:'#d6b77a',
        strokeDashArray:6,
        label:{
          text:lucroMetaLabel(),
          borderColor:'#d6b77a',
          style:{background:'#111',color:'#d6b77a',fontSize:'11px',fontFamily:'Sora',fontWeight:800}
        }
      }],
      points:lucroPointAnnotations(items)
    };
  }

  upsert(id,opt);
}

const PALETTE=[CHART_THEME.primary, CHART_THEME.secondary, CHART_THEME.accent, CHART_THEME.accent2, CHART_THEME.positive, CHART_THEME.warning, CHART_THEME.negative, CHART_THEME.cost, CHART_THEME.muted];

const chartLegendHidden = {};
function chartLegendSet(id){
  if(!chartLegendHidden[id]) chartLegendHidden[id] = new Set();
  return chartLegendHidden[id];
}
function smoothLegendToggle(id, btn, action){
  if(btn){
    btn.classList.add('is-toggling');
    btn.disabled = true;
  }
  markChartMotion(id, 'chart-series-switching', 360);
  requestAnimationFrame(()=>{
    try{ action(); }
    finally{
      setTimeout(()=>{
        if(btn){
          btn.classList.remove('is-toggling');
          btn.disabled = false;
        }
      }, (PERFORMANCE_MODE || prefersReducedMotion()) ? 0 : 120);
    }
  });
}
function renderCustomChartLegend(id, labels, colors){
  const chartEl = document.getElementById(id);
  if(!chartEl) return;

  let legend = document.getElementById(id + '-custom-legend');
  if(!legend){
    legend = document.createElement('div');
    legend.id = id + '-custom-legend';
    legend.className = 'chart-custom-legend';
    chartEl.insertAdjacentElement('afterend', legend);
  }

  const hidden = chartLegendSet(id);
  Array.from(hidden).forEach(label => {
    if(!labels.includes(label)) hidden.delete(label);
  });

  legend.innerHTML = labels.map((label, idx) => {
    const safeLabel = escapeHtml(label);
    const hiddenCls = hidden.has(label) ? ' is-hidden' : '';
    const state = hidden.has(label) ? 'oculto' : 'ativo';
    const color = colors[idx % colors.length] || CHART_THEME.muted;
    return `
      <button type="button" class="chart-legend-btn${hiddenCls}" data-label="${safeLabel}" title="Clique para ${hidden.has(label) ? 'ativar' : 'ocultar'} ${safeLabel}">
        <span class="legend-dot" style="background:${color}"></span>
        <span class="legend-label">${safeLabel}</span>
        <span class="legend-state">${state}</span>
      </button>
    `;
  }).join('');

  legend.querySelectorAll('[data-label]').forEach(btn => {
    btn.addEventListener('click', () => {
      const label = btn.getAttribute('data-label') || '';
      const shouldHide = !hidden.has(label);
      if(shouldHide) hidden.add(label);
      else hidden.delete(label);

      const chart = charts[id];
      smoothLegendToggle(id, btn, () => {
        if(chart){
          try{
            if(shouldHide && typeof chart.hideSeries === 'function') chart.hideSeries(label);
            else if(!shouldHide && typeof chart.showSeries === 'function') chart.showSeries(label);
            else if(typeof chart.toggleSeries === 'function') chart.toggleSeries(label);
          }catch(e){
            console.warn('Falha ao alternar legenda', label, e);
          }
        }
        renderCustomChartLegend(id, labels, colors);
      });
    });
  });
}
function applyCustomLegendState(id, labels){
  const chart = charts[id];
  if(!chart) return;
  const hidden = chartLegendSet(id);
  requestAnimationFrame(() => {
    markChartMotion(id, 'chart-series-switching', 320);
    labels.forEach(label => {
      try{
        if(hidden.has(label) && typeof chart.hideSeries === 'function') chart.hideSeries(label);
        if(!hidden.has(label) && typeof chart.showSeries === 'function') chart.showSeries(label);
      }catch(e){
        console.warn('Falha ao restaurar legenda', label, e);
      }
    });
  });
}
function renderDonutDre(id, series, labels, grupos, totalOverride = null, periodoLabel = ''){
  const escHtml = v => String(v ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[m]));

  function getTooltipEl(){
    let el = document.getElementById('dre-chart-tooltip');
    if(!el){
      el = document.createElement('div');
      el.id = 'dre-chart-tooltip';
      el.style.position = 'fixed';
      el.style.zIndex = '999999';
      el.style.pointerEvents = 'none';
      el.style.opacity = '0';
      el.style.transition = 'opacity .08s ease';
      document.body.appendChild(el);
    }
    return el;
  }

  let tooltipMoveFrame = null;
  let tooltipMoveEvent = null;
  function moveTooltipNow(event){
    const el = getTooltipEl();
    if(!event) return;

    let x = event.clientX + 16;
    let y = event.clientY + 16;

    const rect = el.getBoundingClientRect();

    if(x + rect.width > window.innerWidth - 12){
      x = event.clientX - rect.width - 16;
    }

    if(y + rect.height > window.innerHeight - 12){
      y = event.clientY - rect.height - 16;
    }

    el.style.left = Math.max(12, x) + 'px';
    el.style.top = Math.max(12, y) + 'px';
  }

  function moveTooltip(event){
    tooltipMoveEvent = event;
    if(tooltipMoveFrame) return;
    tooltipMoveFrame = requestAnimationFrame(() => {
      tooltipMoveFrame = null;
      moveTooltipNow(tooltipMoveEvent);
    });
  }

  function hideTooltip(){
    const el = document.getElementById('dre-chart-tooltip');
    if(el) el.style.opacity = '0';
  }

  function linhaTooltip(item){
    const pct = item.pct
      ? `<span style="color:#a3a3a3;margin-left:4px;">(${escHtml(item.pct)})</span>`
      : '';

    return `
      <div style="display:grid;grid-template-columns:1fr auto;gap:14px;margin:5px 0;align-items:start;">
        <span style="color:#e5e5e5;max-width:210px;white-space:normal;line-height:1.25;">
          ${escHtml(item.desc)}
        </span>
        <span style="font-family:IBM Plex Mono,monospace;color:${moneyColor(item.valorOriginal)};white-space:nowrap;text-align:right;">
          ${fmtBRL2(item.valorOriginal)}${pct}
        </span>
      </div>
    `;
  }

  function showTooltip(event, idx){
    const grupo = grupos[idx];
    if(!grupo) return;

    const totalPizza = series.reduce((acc, v) => acc + (Number(v) || 0), 0);
    const pctFatia = totalPizza ? ((Number(series[idx]) || 0) / totalPizza * 100).toFixed(2) + '%' : '';

    const linhas = [];

    if(grupo.totalItem){
      linhas.push(linhaTooltip(grupo.totalItem));
    }else{
      linhas.push(`
        <div style="display:grid;grid-template-columns:1fr auto;gap:14px;margin:5px 0;align-items:start;">
          <span style="color:#e5e5e5;">${escHtml(grupo.label)}</span>
          <span style="font-family:IBM Plex Mono,monospace;color:${moneyColor(grupo.value)};white-space:nowrap;">
            ${fmtBRL2(grupo.value)}
          </span>
        </div>
      `);
    }

    if(grupo.detalhes && grupo.detalhes.length){
      const cols = grupo.detalhes.length > 7 ? 2 : 1;
      const detalhesHtml = grupo.detalhes.map(item => linhaTooltip(item)).join('');

      linhas.push(`<div style="height:1px;background:#2a2a2a;margin:9px 0;"></div>`);
      linhas.push(`
        <div style="
          display:grid;
          grid-template-columns:repeat(${cols}, minmax(250px, 1fr));
          column-gap:18px;
          row-gap:1px;
          align-items:start;
        ">
          ${detalhesHtml}
        </div>
      `);
    }

    const el = getTooltipEl();
    el.innerHTML = `
      <div style="
        min-width:320px;
        max-width:min(820px, calc(100vw - 24px));
        padding:12px;
        background:#111;
        border:1px solid #2a2a2a;
        border-radius:8px;
        box-shadow:0 10px 30px rgba(0,0,0,.45);
      ">
        <div style="
          font-size:11px;
          color:#737373;
          text-transform:uppercase;
          letter-spacing:.12em;
          margin-bottom:8px;
        ">
          ${escHtml(grupo.label)} ${pctFatia ? `• ${pctFatia} da pizza` : ''}
        </div>
        <div style="font-size:11px;color:#a3a3a3;margin:-4px 0 8px 0;">
          Período: ${escHtml(grupo.periodo || periodoLabel || '')}
        </div>
        ${linhas.join('')}
      </div>
    `;

    el.style.opacity = '1';
    moveTooltip(event);
  }

  upsert(id,{
    chart:{
      type:'donut',
      height:380,
      background:'transparent',
      foreColor:'#737373',
      fontFamily:'Sora',
      events:{
        dataPointMouseEnter:function(event, chartContext, config){
          // Em donut/pie, a fatia correta normalmente vem em dataPointIndex.
          // seriesIndex pode vir como 0 para todas as fatias, o que fazia o hover
          // mostrar sempre só o primeiro grupo.
          const idx = (typeof config.dataPointIndex === 'number' && config.dataPointIndex >= 0)
            ? config.dataPointIndex
            : config.seriesIndex;

          showTooltip(event, idx);
        },
        mouseMove:function(event){
          moveTooltip(event);
        },
        dataPointMouseLeave:function(){
          hideTooltip();
        },
        mouseLeave:function(){
          hideTooltip();
        }
      }
    },

    series,
    labels,
    colors:PALETTE,

    stroke:{
      colors:['#000000'],
      width:3
    },

    legend:{
      show:false
    },

    plotOptions:{
      pie:{
        customScale:.72,
        donut:{
          size:'66%',
          labels:{
            show:true,
            name:{
              color:'#8a8a8a',
              fontSize:'14px',
              fontFamily:'Sora',
              fontWeight:650
            },
            value:{
              color:'#fafafa',
              fontSize:'22px',
              fontFamily:'IBM Plex Mono',
              fontWeight:700,
              formatter:v=>fmtBRL(v)
            },
            total:{
              show:true,
              label:'Total Receitas',
              fontSize:'14px',
              fontFamily:'Sora',
              fontWeight:650,
              color:'#8a8a8a',
              formatter:w=>{
                const totalSeries = w.globals.seriesTotals.reduce((a,b)=>a+b,0);
                return fmtBRL(totalOverride ?? totalSeries);
              }
            }
          }
        }
      }
    },

    dataLabels:{
      enabled:false
    },

    // Desliga o tooltip padrão do Apex e usa o tooltip manual acima.
    // Assim ele não fica preso dentro do SVG/card e aparece corretamente no hover.
    tooltip:{
      enabled:false
    }
  });

  renderCustomChartLegend(id, labels, PALETTE);
  applyCustomLegendState(id, labels);
}

function renderDreWaterfall(grupos, periodoLabel){
  const el = document.getElementById('dre-waterfall');
  if(!el) return;

  const byLabel = label => grupos.find(g => String(g.label).toUpperCase() === label);
  const rows = [
    {label:'Receitas', item: byLabel('RECEITAS'), kind:'pos'},
    {label:'Fixos e Variáveis', item: byLabel('CUSTO'), kind:'neg'},
    {label:'EBITDA', item: byLabel('EBITDA'), kind:'pos'},
    {label:'Despesas', item: byLabel('DESPESAS'), kind:'neg'},
    {label:'Desp. financeiras', item: byLabel('DESPESAS FINANCEIRAS'), kind:'neg'},
    {label:'Resultado', item: byLabel('RESULTADO DO EXERCÍCIO'), kind:'pos'}
  ].filter(r => r.item && Number(r.item.value));

  const maxVal = Math.max(1, ...rows.map(r => Math.abs(r.item.value)));
  el.innerHTML = `
    <div class="text-[.7rem] text-[var(--muted)] mb-3">Período: ${periodoLabel || '-'}</div>
    ${rows.map(r => {
      const original = r.item.totalItem ? r.item.totalItem.valorOriginal : r.item.value;
      const width = Math.max(3, Math.abs(r.item.value) / maxVal * 100);
      const cls = original < 0 || r.kind === 'neg' ? 'neg' : 'pos';
      return `
        <div class="waterfall-row">
          <div class="text-xs text-[var(--muted-2)] truncate" title="${r.label}">${r.label}</div>
          <div class="waterfall-track"><div class="waterfall-fill ${cls}" style="width:${width}%"></div></div>
          <div class="mono text-xs text-right ${moneyClass(original, r.kind === 'neg')}">${fmtBRL2(original)}</div>
        </div>
      `;
    }).join('')}
  `;
}

function getMonthRowsForComparison(consolAll, selIdx){
  const valid = consolAll
    .filter(r => monthIdx(r[A.mes]) >= 0)
    .sort((a,b)=>monthIdx(a[A.mes])-monthIdx(b[A.mes]));

  if(!valid.length) return {cur:null, prev:null};

  const selectedIdxs = [...selIdx].filter(i => i >= 0).sort((a,b)=>a-b);
  const currentIdx = selectedIdxs.length ? selectedIdxs[selectedIdxs.length - 1] : monthIdx(valid[valid.length - 1][A.mes]);
  const cur = valid.find(r => monthIdx(r[A.mes]) === currentIdx) || valid[valid.length - 1];
  const prev = valid.filter(r => monthIdx(r[A.mes]) < monthIdx(cur[A.mes])).pop() || null;

  return {cur, prev};
}

function renderMonthComparison(consolAll, selIdx){
  const el = document.getElementById('mom-comparison');
  if(!el) return;

  const {cur, prev} = getMonthRowsForComparison(consolAll, selIdx);
  if(!cur || !prev){
    el.innerHTML = '<div class="text-sm text-[var(--muted)]">Sem mês anterior suficiente para comparar.</div>';
    return;
  }

  const metrics = [
    {label:'Faturamento', key:A.fb, money:true},
    {label:'EBITDA', key:A.eb, money:true},
    {label:'Caixa', key:A.caixa, money:true},
    {label:'Lucratividade', key:A.lucro, money:false}
  ];

  el.innerHTML = `
    <div class="text-[.7rem] text-[var(--muted)] mb-3">${cur[A.mes]} vs ${prev[A.mes]}</div>
    <table class="w-full dre-mini-table">
      <tbody>
        ${metrics.map(m => {
          const atual = num(cur[m.key]);
          const anterior = num(prev[m.key]);
          const delta = atual - anterior;
          const pct = anterior ? (delta / Math.abs(anterior)) * 100 : 0;
          const cls = delta < 0 ? 'money-neg' : 'money-pos';
          const atualFmt = m.money ? fmtBRL2(atual) : fmtPct(atual);
          return `
            <tr>
              <td class="text-[var(--muted-2)]">${m.label}</td>
              <td class="text-right mono ${m.money ? moneyClass(atual) : lucratividadeClass(atual)}">${atualFmt}</td>
              <td class="text-right mono ${cls}">${delta >= 0 ? '+' : ''}${pct.toFixed(1)}%</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderFinancialTraffic(consolAll, selIdx){
  const el = document.getElementById('finance-traffic');
  if(!el) return;

  const valid = consolAll.filter(r => monthIdx(r[A.mes]) >= 0 && num(r[A.fb]) !== 0);
  const {cur, prev} = getMonthRowsForComparison(consolAll, selIdx);

  if(!cur){
    el.innerHTML = '<div class="text-sm text-[var(--muted)]">Sem dados para status.</div>';
    return;
  }

  const receitaCrescendo = prev ? num(cur[A.fb]) > num(prev[A.fb]) : false;
  const custoPerc = num(cur[A.fb]) ? Math.abs(num(cur[A.custos])) / Math.abs(num(cur[A.fb])) * 100 : 0;
  const ebitdaOk = num(cur[A.eb]) > 0;
  const caixaMedia = valid.length ? valid.reduce((a,r)=>a+num(r[A.caixa]),0)/valid.length : 0;
  const caixaBaixo = caixaMedia ? num(cur[A.caixa]) < caixaMedia : false;

  const items = [
    {
      label:'Receita crescendo',
      value: prev ? `${cur[A.mes]} ${receitaCrescendo ? 'acima' : 'abaixo'} de ${prev[A.mes]}` : 'Sem mês anterior',
      status: receitaCrescendo ? 'good' : 'bad'
    },
    {
      label:'Custo sobre receita',
      value: `${custoPerc.toFixed(1)}% da receita`,
      status: custoPerc > 70 ? 'bad' : (custoPerc > 55 ? 'warn' : 'good')
    },
    {
      label:'EBITDA saudável',
      value: fmtBRL2(num(cur[A.eb])),
      status: ebitdaOk ? 'good' : 'bad',
      money: num(cur[A.eb])
    },
    {
      label:'Caixa vs média',
      value: `${fmtBRL2(num(cur[A.caixa]))} / média ${fmtBRL2(caixaMedia)}`,
      status: caixaBaixo ? 'warn' : 'good',
      money: num(cur[A.caixa])
    }
  ];

  el.innerHTML = `
    <div class="text-[.7rem] text-[var(--muted)] mb-3">Base: ${cur[A.mes]}</div>
    <div class="space-y-3">
      ${items.map(it => `
        <div class="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-2 last:border-b-0 last:pb-0">
          <div class="flex items-center gap-2">
            <span class="status-dot-mini ${it.status}"></span>
            <span class="text-xs text-[var(--muted-2)]">${it.label}</span>
          </div>
          <div class="text-right text-xs mono ${typeof it.money === 'number' ? moneyClass(it.money) : ''}">${it.value}</div>
        </div>
      `).join('')}
    </div>
  `;
}

const dreModalState = {
  rows:[],
  title:'Detalhamento da DRE',
  eyebrow:'DRE completa'
};

function buildDreModalRows(){
  const ctx = state.dreContext;

  if(!ctx || !ctx.grupos || !ctx.grupos.length){
    dreModalState.rows = [];
    dreModalState.title = 'Detalhamento da DRE';
    dreModalState.eyebrow = 'Sem dados da DRE';
    return;
  }

  dreModalState.title = `Detalhamento da DRE — ${ctx.periodoLabel || ''}`;
  dreModalState.eyebrow = `Total receitas: ${fmtBRL2(ctx.totalReceitas || 0)}`;
  dreModalState.rows = [];

  ctx.grupos.forEach(grupo => {
    dreModalState.rows.push({ type:'group', group:grupo.label, html:`
      <tr class="bg-[#0a0a0a] dre-group-row" data-dre-group="${escapeHtml(grupo.label)}">
        <td colspan="4" class="text-[.68rem] uppercase tracking-[.14em] text-[var(--muted)] font-semibold">${escapeHtml(grupo.label)}</td>
      </tr>
    `});

    const makeItem = (item, tipo='Total') => {
      const row = {
        type:'item',
        group:grupo.label,
        tipo,
        desc:item.desc,
        valor:item.valorOriginal,
        pct:item.pct || '-',
      };
      row.html = `
        <tr>
          <td class="text-xs text-[var(--muted)]">${escapeHtml(tipo)}</td>
          <td class="text-xs">${escapeHtml(item.desc)}</td>
          <td class="text-right mono ${moneyClass(item.valorOriginal)}">${fmtBRL2(item.valorOriginal)}</td>
          <td class="text-right mono text-[var(--muted-2)]">${escapeHtml(item.pct || '-')}</td>
        </tr>
      `;
      return row;
    };

    if(grupo.totalItem) dreModalState.rows.push(makeItem(grupo.totalItem, 'Total'));
    (grupo.detalhes || []).forEach(item => dreModalState.rows.push(makeItem(item, 'Item')));
  });
}
function dreModalHaystack(row){
  return normKey([
    row.group || '',
    row.tipo || '',
    row.desc || '',
    row.valor ? fmtBRL2(row.valor) : '',
    row.pct || ''
  ].join(' '));
}
function renderDreFullModal(){
  const body = document.getElementById('dre-modal-body');
  const title = document.getElementById('dre-modal-title');
  const eyebrow = document.getElementById('dre-modal-eyebrow');
  if(!body) return;

  if(title) title.textContent = dreModalState.title || 'Detalhamento da DRE';
  if(eyebrow) eyebrow.textContent = dreModalState.eyebrow || 'DRE completa';

  const search = document.getElementById('dre-modal-search');
  updateDreSearchUI();
  const q = normKey(search ? search.value : '');
  const terms = q.split(/\s+/).filter(Boolean);

  if(!dreModalState.rows.length){
    body.innerHTML = '<tr><td colspan="4" class="text-center text-[var(--muted)] py-10">Sem dados da DRE</td></tr>';
    const count = document.getElementById('dre-modal-filter-count');
    if(count) count.textContent = 'Sem dados para pesquisar';
    return;
  }

  let rowsToRender = [];
  if(terms.length){
    const matchedGroups = new Set(
      dreModalState.rows
        .filter(row => row.type === 'item' && terms.every(t => dreModalHaystack(row).includes(t)))
        .map(row => row.group)
    );

    rowsToRender = dreModalState.rows.filter(row => {
      if(row.type === 'group') return matchedGroups.has(row.group);
      return matchedGroups.has(row.group) && terms.every(t => dreModalHaystack(row).includes(t));
    });
  }else{
    rowsToRender = dreModalState.rows;
  }

  const itemTotal = dreModalState.rows.filter(r => r.type === 'item').length;
  const itemFiltered = terms.length ? rowsToRender.filter(r => r.type === 'item').length : itemTotal;
  const count = document.getElementById('dre-modal-filter-count');
  if(count) count.textContent = terms.length
    ? `Filtrando: ${itemFiltered}/${itemTotal}`
    : 'Pesquise em todas as colunas da DRE';

  setBodyRowsChunked(
    body,
    rowsToRender,
    row => row.html,
    '<tr><td colspan="4" class="text-center text-[var(--muted)] py-10">Nenhum item encontrado</td></tr>',
    'dre-modal-body'
  );
}

function openDreModal(){
  buildDreModalRows();
  const search = document.getElementById('dre-modal-search');
  if(search) search.value = '';
  updateDreSearchUI();
  renderDreFullModal();
  const m = document.getElementById('modal-dre');
  if(!m) return;
  m.classList.remove('hidden');
  m.classList.add('flex');
  setPageScrollLocked(true);
}

function closeDreModal(){
  const m = document.getElementById('modal-dre');
  const search = document.getElementById('dre-modal-search');
  if(search) search.value = '';
  updateDreSearchUI();
  if(!m) return;
  m.classList.add('hidden');
  m.classList.remove('flex');
  unlockPageIfNoModalOpen();
}

function openAnnualSummaryModal(){
  renderAnual();
  const m = document.getElementById('modal-anual-summary');
  if(!m) return;
  m.classList.remove('hidden');
  m.classList.add('flex');
  setPageScrollLocked(true);
}

function closeAnnualSummaryModal(){
  const m = document.getElementById('modal-anual-summary');
  if(!m) return;
  m.classList.add('hidden');
  m.classList.remove('flex');
  unlockPageIfNoModalOpen();
}

function renderPolar(id,series,labels){
  upsert(id,{
    chart:{type:'polarArea',height:320,background:'transparent',foreColor:'#737373',fontFamily:'Sora'},
    series,labels,colors:PALETTE,
    stroke:{colors:['#000000'],width:2},
    fill:{opacity:.85},
    legend:legendOptions(),
    yaxis:{show:false},
    plotOptions:{polarArea:{rings:{strokeColor:'#1f1f1f'},spokes:{strokeColor:'#1f1f1f'}}},
    tooltip:{theme:'dark',y:{formatter:v=>fmtBRL2(v)}},
  });
}
function renderRadialSingle(id,value,label){
  upsert(id,{
    chart:{type:'radialBar',height:260,background:'transparent',foreColor:'#737373',fontFamily:'Sora'},
    series:[value],labels:[label],colors:[CHART_THEME.accent],
    plotOptions:{radialBar:{hollow:{size:'62%',background:'transparent'},track:{background:'#1f1f1f',strokeWidth:'100%'},dataLabels:{name:{color:'#737373',fontSize:'.8rem'},value:{color:'#fafafa',fontFamily:'IBM Plex Mono',fontSize:'1.7rem',formatter:v=>v.toFixed(1)+'%'}}}},
    fill:{type:'gradient',gradient:{shade:'dark',type:'horizontal',gradientToColors:[CHART_THEME.primary],stops:[0,100]}},
  });
}
function renderSpark(id,data,color){
  upsert(id,{
    chart:{type:'area',height:50,sparkline:{enabled:true},background:'transparent',animations:{enabled:false}},
    series:[{data}],colors:[color],
    stroke:{curve:'smooth',width:2},
    fill:{type:'gradient',gradient:{opacityFrom:.5,opacityTo:0}},
    tooltip:{enabled:false},
  });
}
function renderHeatmap(id,series){
  upsert(id,{
    chart:{type:'heatmap',height:240,background:'transparent',toolbar:{show:false},foreColor:'#737373',fontFamily:'Sora'},
    series,
    dataLabels:{enabled:false},
    plotOptions:{heatmap:{radius:4,enableShades:true,shadeIntensity:.5,colorScale:{ranges:[
      {from:0,to:0,color:'#0a0a0a',name:'sem dados'},
      {from:1,to:5000,color:'#262626',name:'baixo'},
      {from:5001,to:25000,color:'#525252',name:'médio'},
      {from:25001,to:100000,color:'#a3a3a3',name:'alto'},
      {from:100001,to:Number.MAX_SAFE_INTEGER,color:'#ffffff',name:'pico'},
    ]}}},
    grid:baseGrid,
    xaxis:{...baseAxis,type:'category'},
    yaxis:{labels:{style:{colors:'#fafafa'}}},
    tooltip:{theme:'dark',y:{formatter:v=>fmtBRL2(v)}},
    legend:legendOptions(),
  });
}
function renderTreemap(id,series){
  upsert(id,{
    chart:{type:'treemap',height:360,background:'transparent',toolbar:{show:false},foreColor:'#ece9ff',fontFamily:'Sora'},
    series,
    legend:{show:false},
    dataLabels:{enabled:true,style:{fontSize:'12px',fontFamily:'Sora',fontWeight:600},formatter:(t,o)=>[t, fmtBRL(o.value)]},
    plotOptions:{treemap:{distributed:true,enableShades:false,colorScale:{ranges:PALETTE.map((c,i)=>({from:i*1,to:(i+1)*1e9,color:c}))}}},
    tooltip:{theme:'dark',y:{formatter:v=>fmtBRL2(v)}},
  });
}
function renderRadar(id,series,categories){
  upsert(id,{
    chart:{type:'radar',height:380,background:'transparent',toolbar:{show:false},foreColor:'#ece9ff',fontFamily:'Sora'},
    series,colors:['#ffffff'],
    xaxis:{categories,labels:{style:{colors:Array(categories.length).fill('#ece9ff'),fontSize:'12px'}}},
    yaxis:{show:false,max:100},
    fill:{opacity:.35},
    stroke:{width:2},
    markers:{size:5,colors:['#ffffff']},
    plotOptions:{radar:{polygons:{strokeColors:'#1f1f1f',connectorColors:'#1f1f1f',fill:{colors:['#0a0a0a','#111111']}}}},
    tooltip:{theme:'dark'},
  });
}



/* ---------- ASSISTENTE IA DO DASHBOARD ---------- */
const OPENAI_MODEL_DEFAULT = 'gpt-5.4-mini';
const DASHBOARD_AI_SYSTEM_PROMPT = `
Objetivo
Você é um especialista em planejamento financeiro e controle de metas empresariais.
Sua função é atuar como controlador financeiro anual da agência Virtus, usando os dados do dashboard Virtus Ads Finance e os fechamentos mensais enviados pelo usuário.
Ignore Bossa Nova completamente. Não crie análises, metas ou tabelas para Bossa Nova.

Metas anuais da Virtus
- Faturamento anual: R$ 600.000
- Lucro anual: R$ 165.000

Como você deve funcionar
Sempre que o usuário enviar o fechamento de um mês, aceite o formato:

<mes> {{MÊS}} </mes>
<virtus_faturamento> {{VALOR}} </virtus_faturamento>
<virtus_lucro> {{VALOR}} </virtus_lucro>

Você deve:
1. Atualizar o acumulado do ano da Virtus.
2. Calcular:
   - Percentual da meta anual atingida.
   - Percentual ideal acumulado até o mês atual, usando Meta ÷ 12 × número de meses decorridos.
   - Diferença em pontos percentuais entre realizado e ideal.
   - Faturamento restante para atingir a meta.
   - Lucro restante para atingir a meta.
   - Margem de lucro do mês.
   - Margem de lucro acumulada.
   - Média mensal necessária para bater a meta.
   - Projeção anual considerando que o ritmo médio atual continue.
3. Manter histórico acumulado mês a mês com base no contexto do dashboard e no histórico da conversa enviado.
4. Nunca apagar dados anteriores que estejam no histórico ou no contexto.
5. Sempre considerar o número exato de meses já informados no ano.
6. O % Ideal no Mês deve ser acumulado proporcionalmente ao número de meses decorridos.

Estrutura obrigatória da resposta
Quando a pergunta envolver fechamento mensal, metas, faturamento, lucro ou acompanhamento anual, responda sempre com estas seções:
1. Resultado do mês.
2. Acumulado do ano.
3. Percentual da meta atingida.
   A tabela deste tópico deve conter obrigatoriamente as colunas:
   - Meta Anual
   - Realizado
   - % Atingido
   - % Ideal no Mês
   - Diferença (em pontos percentuais)
4. Quanto falta para bater a meta.
5. Projeção anual no ritmo atual.
6. Resumo executivo consolidado.
7. Alertas estratégicos.
8. Recomendações práticas baseadas nos números.

Regras importantes
- Não usar emojis.
- Não escrever textos longos e emocionais.
- Ser analítico, direto e executivo.
- Use listas e tabelas organizadas.
- Use linguagem objetiva.
- Use apenas dados enviados no CONTEXTO DO DASHBOARD e na conversa. Não invente valores, meses, categorias ou causas.
- Quando citar dinheiro, use formato brasileiro: R$ 1.234,56.
- Se algum dado estiver ausente, diga exatamente que o dashboard não enviou esse dado.
- Quando comparar meses, deixe claro se está falando de dados filtrados/selecionados ou do consolidado geral.
- Se o usuário pedir recomendação, dê ações práticas, mas sinalize que é uma análise gerencial e não consultoria contábil/legal.
`;

const aiChatHistory = [];

function aiApiKey(){
  return localStorage.getItem('nebula_openai_api_key') || '';
}
function aiSetApiKey(value){
  localStorage.setItem('nebula_openai_api_key', String(value || '').trim());
}
function aiModel(){
  return localStorage.getItem('nebula_openai_model') || OPENAI_MODEL_DEFAULT;
}
function aiSetModel(value){
  localStorage.setItem('nebula_openai_model', String(value || OPENAI_MODEL_DEFAULT).trim());
}
function aiMoney(v){ return (Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2}); }
function aiSumRows(rows){
  return (rows || []).reduce((acc, r) => {
    const entradas = num(r[C.ent]);
    const saidas = num(r[C.sai]);
    acc.registros += 1;
    acc.entradas += entradas;
    acc.saidas += saidas;
    acc.faturamentoBruto += entradas;
    acc.saldoEntradasMenosSaidas += entradas - saidas;
    return acc;
  }, {registros:0, entradas:0, saidas:0, faturamentoBruto:0, saldoEntradasMenosSaidas:0});
}
function buildDashboardAIContext(){
  const selectedKeys = selectedMonthKeys();
  const selectedLabels = selectedKeys.map(monthLabel);
  const mesesTodos = ACTIVE_MONTHS.map(m => {
    const rows = monthRows(m.key);
    const totals = aiSumRows(rows);
    return {
      chave:m.key,
      mes:m.label,
      registros:totals.registros,
      entradas:totals.entradas,
      saidas:totals.saidas,
      faturamentoBruto:totals.faturamentoBruto,
      saldoEntradasMenosSaidas:totals.saldoEntradasMenosSaidas
    };
  });

  const mesesFiltrados = selectedMonthData(true).map(m => {
    const totals = aiSumRows(m.rows);
    return {
      chave:m.key,
      mes:m.label,
      registros:totals.registros,
      entradas:totals.entradas,
      saidas:totals.saidas,
      faturamentoBruto:totals.faturamentoBruto,
      saldoEntradasMenosSaidas:totals.saldoEntradasMenosSaidas
    };
  });
  const allFilteredRows = selectedMonthData(true).flatMap(m => m.rows.map(r => ({...r, _mes:m.label, _mesKey:m.key})));
  const resumoFiltrado = aiSumRows(allFilteredRows);

  const categorias = {};
  allFilteredRows.forEach(r => {
    const key = String(r[C.cat] || 'Sem categoria').trim() || 'Sem categoria';
    if(!categorias[key]) categorias[key] = {categoria:key, registros:0, entradas:0, saidas:0, faturamentoBruto:0};
    categorias[key].registros += 1;
    categorias[key].entradas += num(r[C.ent]);
    categorias[key].saidas += num(r[C.sai]);
    categorias[key].faturamentoBruto += num(r[C.ent]);
  });
  const topCategorias = Object.values(categorias)
    .sort((a,b)=>Math.abs(b.faturamentoBruto)-Math.abs(a.faturamentoBruto))
    .slice(0,12);

  const dre = state.dreContext ? {
    periodo: state.dreContext.periodoLabel,
    totalReceitas: state.dreContext.totalReceitas,
    grupos: (state.dreContext.grupos || []).map(g => ({
      grupo:g.label,
      valor:g.value,
      totalOriginal:g.totalItem ? g.totalItem.valorOriginal : g.value,
      detalhes:(g.detalhes || []).slice(0,12).map(d => ({descricao:d.desc, valor:d.valorOriginal, percentual:d.pct || ''}))
    }))
  } : null;

  const financeiro2026 = (state.anual.rows || [])
    .filter(r => isActiveMonthIndex(monthIdx(r[A.mes])))
    .map(r => ({
    mes:r[A.mes],
    faturamentoBruto:num(r[A.fb]),
    faturamentoLiquido:num(r[A.fl]),
    caixa:num(r[A.caixa]),
    ebitda:num(r[A.eb]),
    custosOperacionais:num(r[A.custos]),
    investimentos:num(r[A.inv]),
    lucratividade:num(r[A.lucro]),
    crescimento:num(r[A.cresc])
  })).filter(r => String(r.mes || '').trim()).slice(0,20);

  return {
    dashboard:'Virtus Ads Finance',
    geradoEm:new Date().toLocaleString('pt-BR'),
    filtrosAtuais:{
      mesesSelecionados:selectedLabels,
      tipo:state.mensal.tipo,
      categoria:state.mensal.cat,
      conta:state.mensal.conta,
      observacao:'Registros mensais considerados apenas quando possuem data válida + categoria.'
    },
    resumoFiltrado,
    mesesSelecionadosFiltrados:mesesFiltrados,
    mesesTodosSemFiltro:mesesTodos,
    topCategoriasFiltradas:topCategorias,
    dre,
    financeiro2026
  };
}
function aiAddMessage(role, html){
  const box = document.getElementById('ai-chat-messages');
  if(!box) return;
  const div = document.createElement('div');
  div.className = 'ai-msg ' + (role === 'user' ? 'ai-user' : role === 'system' ? 'ai-system' : 'ai-assistant');
  div.innerHTML = html;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}
function aiTextToHtml(text){
  return escapeHtml(text || '').replace(/\n/g,'<br>');
}
function aiExtractResponseText(data){
  if(data && data.output_text) return data.output_text;
  const parts = [];
  (data?.output || []).forEach(item => {
    (item.content || []).forEach(c => {
      if(c.text) parts.push(c.text);
      else if(c.value) parts.push(c.value);
      else if(c.type === 'output_text' && c.text) parts.push(c.text);
    });
  });
  if(parts.length) return parts.join('\n');
  if(data?.error?.message) return data.error.message;
  return 'Não consegui ler a resposta da IA.';
}
async function aiSend(question){
  const q = String(question || '').trim();
  if(!q) return;

  const key = aiApiKey();
  if(!key){
    aiAddMessage('system','Cole sua OpenAI API key no campo acima e clique em <strong>Salvar</strong> antes de perguntar.');
    return;
  }

  aiAddMessage('user', aiTextToHtml(q));
  const loading = aiAddMessage('assistant','Analisando os dados do dashboard…');

  const context = buildDashboardAIContext();
  const historyText = aiChatHistory.slice(-6).map(h => `${h.role === 'user' ? 'Usuário' : 'Assistente'}: ${h.text}`).join('\n');

  try{
    const res = await fetch('https://api.openai.com/v1/responses', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer ' + key
      },
      body:JSON.stringify({
        model:aiModel(),
        instructions:DASHBOARD_AI_SYSTEM_PROMPT,
        input:`CONTEXTO DO DASHBOARD:\n${JSON.stringify(context, null, 2)}\n\nHISTÓRICO RECENTE:\n${historyText || 'Sem histórico.'}\n\nPERGUNTA DO USUÁRIO:\n${q}`,
        temperature:0.2,
        max_output_tokens:1400,
        store:false
      })
    });

    const data = await res.json().catch(()=>({}));
    if(!res.ok){
      throw new Error(data?.error?.message || `Erro ${res.status} ao chamar a OpenAI.`);
    }

    const answer = aiExtractResponseText(data);
    loading.innerHTML = aiTextToHtml(answer);
    aiChatHistory.push({role:'user',text:q},{role:'assistant',text:answer});
  }catch(err){
    loading.innerHTML = aiTextToHtml('Não consegui chamar a IA. Verifique se a API key está correta, se há saldo/tokens disponíveis, se o modelo escolhido está liberado na sua conta e se o navegador permitiu a chamada direta para a OpenAI. Erro: ' + (err?.message || err));
  }
}
function initAIChat(){
  const toggle = document.getElementById('ai-chat-toggle');
  const panel = document.getElementById('ai-chat-panel');
  const close = document.getElementById('ai-chat-close');
  const keyInput = document.getElementById('ai-api-key');
  const modelSelect = document.getElementById('ai-model-select');
  const saveKey = document.getElementById('ai-save-key');
  const form = document.getElementById('ai-chat-form');
  const input = document.getElementById('ai-chat-input');
  const sendBtn = document.getElementById('ai-chat-send');
  if(!toggle || !panel) return;

  if(keyInput) keyInput.value = aiApiKey();
  if(modelSelect) modelSelect.value = aiModel();

  toggle.addEventListener('click',()=>{
    panel.classList.toggle('hidden');
    if(!panel.classList.contains('hidden')) setTimeout(()=>input?.focus(),50);
  });
  close?.addEventListener('click',()=>panel.classList.add('hidden'));
  saveKey?.addEventListener('click',()=>{
    aiSetApiKey(keyInput?.value || '');
    aiSetModel(modelSelect?.value || OPENAI_MODEL_DEFAULT);
    aiAddMessage('system','API key e modelo salvos neste navegador. Modelo atual: <strong>' + escapeHtml(aiModel()) + '</strong>.');
  });
  modelSelect?.addEventListener('change',()=>{
    aiSetModel(modelSelect.value || OPENAI_MODEL_DEFAULT);
    aiAddMessage('system','Modelo alterado para <strong>' + escapeHtml(aiModel()) + '</strong>.');
  });
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const q = input?.value || '';
    if(input) input.value = '';
    if(sendBtn) sendBtn.disabled = true;
    await aiSend(q);
    if(sendBtn) sendBtn.disabled = false;
    input?.focus();
  });
  input?.addEventListener('keydown', e => {
    if(e.key === 'Enter' && !e.shiftKey){
      e.preventDefault();
      form?.requestSubmit();
    }
  });
  document.querySelectorAll('[data-ai-prompt]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const q = btn.getAttribute('data-ai-prompt') || '';
      if(input) input.value = q;
      form?.requestSubmit();
    });
  });
}

function debounce(fn, delay=120){
  let t;
  return (...args)=>{
    clearTimeout(t);
    t=setTimeout(()=>fn(...args), delay);
  };
}

let mensalRenderFrame = null;
let anualRenderFrame = null;
function requestRenderMensal(){
  if(mensalRenderFrame) cancelAnimationFrame(mensalRenderFrame);
  mensalRenderFrame = requestAnimationFrame(()=>{
    mensalRenderFrame = null;
    renderMensal();
  });
}
function requestRenderAnual(){
  if(anualRenderFrame) cancelAnimationFrame(anualRenderFrame);
  anualRenderFrame = requestAnimationFrame(()=>{
    anualRenderFrame = null;
    renderAnual();
  });
}
const requestRenderMensalDebounced = debounce(requestRenderMensal, 140);
const requestRenderAnualDebounced = debounce(requestRenderAnual, 120);
const renderTxModalRowsDebounced = debounce(renderTxModalRows, 90);
const renderDreFullModalDebounced = debounce(renderDreFullModal, 90);
const renderCategoryOptionsDebounced = debounce(renderCategoryOptions, 80);

/* ---------- EVENTS ---------- */
function bindChipGroup(selector, onPick){
  document.querySelectorAll(selector).forEach(b=>{
    b.addEventListener('click',()=>{
      document.querySelectorAll(selector).forEach(x=>x.classList.remove('active'));
      b.classList.add('active'); onPick(b);
    });
  });
}
// chips de meses são vinculados dinamicamente em populateSelects()
bindChipGroup('[data-tipo]', b=>{
  state.mensal.tipo=b.dataset.tipo; requestRenderMensal();
});
document.getElementById('modal-close').addEventListener('click',closeTxModal);
document.getElementById('modal-search')?.addEventListener('input',renderTxModalRowsDebounced);
document.getElementById('modal-search-clear')?.addEventListener('click',()=>{
  clearSearchInput('modal-search', 'modal-search-clear', renderTxModalRows);
});
document.getElementById('modal-tx').addEventListener('click',e=>{ if(e.target.id==='modal-tx') closeTxModal(); });
document.getElementById('dre-open')?.addEventListener('click',openDreModal);
document.getElementById('dre-modal-close')?.addEventListener('click',closeDreModal);
document.getElementById('dre-modal-search')?.addEventListener('input',renderDreFullModalDebounced);
document.getElementById('dre-modal-search-clear')?.addEventListener('click',()=>{
  clearSearchInput('dre-modal-search', 'dre-modal-search-clear', renderDreFullModal);
});
document.getElementById('modal-dre')?.addEventListener('click',e=>{ if(e.target.id==='modal-dre') closeDreModal(); });

// Aqui é onde conectamos os cards de Saldo Líquido, Lucratividade e Crescimento ao pop-up.
// No HTML, basta colocar data-open-kpi-chart="lucratividade" ou data-open-kpi-chart="crescimento" no card.
document.querySelectorAll('[data-open-kpi-chart], [data-open-kpi-caixa]').forEach(card=>{
  card.addEventListener('click',()=>openKpiIndicatorModal(card.dataset.openKpiChart || card.dataset.openKpiCaixa || 'caixa'));
});

document.getElementById('a-summary-open')?.addEventListener('click',openAnnualSummaryModal);
document.getElementById('anual-summary-close')?.addEventListener('click',closeAnnualSummaryModal);
document.getElementById('modal-anual-summary')?.addEventListener('click',e=>{ if(e.target.id==='modal-anual-summary') closeAnnualSummaryModal(); });
document.getElementById('kpi-chart-close')?.addEventListener('click',closeKpiCaixaModal);
document.getElementById('modal-kpi-chart')?.addEventListener('click',e=>{ if(e.target.id==='modal-kpi-chart') closeKpiCaixaModal(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ closeTxModal(); closeDreModal(); closeAnnualSummaryModal(); closeKpiCaixaModal(); } });
bindChipGroup('[data-metric]', b=>{state.anual.metric=b.dataset.metric; requestRenderAnual();});

document.getElementById('m-filter-categoria')?.addEventListener('change',e=>{state.mensal.cat=e.target.value; syncCategoryDropdown(); requestRenderMensal();});
document.getElementById('m-filter-conta')?.addEventListener('change',e=>{state.mensal.conta=e.target.value; requestRenderMensal();});
document.getElementById('m-day-min')?.addEventListener('input',e=>{state.mensal.dayMin=e.target.value?+e.target.value:null; requestRenderMensalDebounced();});
document.getElementById('m-day-max')?.addEventListener('input',e=>{state.mensal.dayMax=e.target.value?+e.target.value:null; requestRenderMensalDebounced();});
document.getElementById('m-val-min')?.addEventListener('input',e=>{state.mensal.valMin=e.target.value?+e.target.value:null; requestRenderMensalDebounced();});
document.getElementById('m-val-max')?.addEventListener('input',e=>{state.mensal.valMax=e.target.value?+e.target.value:null; requestRenderMensalDebounced();});
document.getElementById('m-clear').addEventListener('click',()=>{
  Object.assign(state.mensal,{tipo:'all',cat:'all',conta:'all',dayMin:null,dayMax:null,valMin:null,valMax:null});
  resetSelectedMonthToCurrent();
  ['m-filter-categoria','m-filter-conta','m-day-min','m-day-max','m-val-min','m-val-max'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  if(document.getElementById('m-filter-categoria')) document.getElementById('m-filter-categoria').value='all';
  syncCategoryDropdown();
  if(document.getElementById('m-filter-conta')) document.getElementById('m-filter-conta').value='all';
  document.querySelectorAll('#m-mes-chips [data-mes]').forEach(b=>b.classList.toggle('active', state.mensal.mesesSel.has(b.dataset.mes)));
  document.querySelectorAll('[data-tipo]').forEach(b=>b.classList.toggle('active',b.dataset.tipo==='all'));
  requestRenderMensal();
});

document.getElementById('a-mes-min').addEventListener('change',e=>{state.anual.mMin=+e.target.value; clampAnualRange(); populateSelects(); requestRenderAnual();});
document.getElementById('a-mes-max').addEventListener('change',e=>{state.anual.mMax=+e.target.value; clampAnualRange(); populateSelects(); requestRenderAnual();});
document.getElementById('a-clear').addEventListener('click',()=>{
  state.anual.mMin=0; state.anual.mMax=CURRENT_MONTH_LIMIT_INDEX;
  document.getElementById('a-mes-min').value=0; document.getElementById('a-mes-max').value=CURRENT_MONTH_LIMIT_INDEX;
  requestRenderAnual();
});

// Microinteração global nas legendas nativas do ApexCharts.
// Deixa o liga/desliga das séries mais suave e evita a sensação de travamento visual.
document.addEventListener('pointerdown', e=>{
  const legendItem = e.target.closest?.('.apexcharts-legend-series');
  if(!legendItem) return;
  const chartEl = legendItem.closest('[id^="chart-"], #modal-kpi-chart-graph, #modal-dre-chart, #modal-tx-chart');
  if(chartEl?.id) markChartMotion(chartEl.id, 'chart-series-switching', 160);
  legendItem.classList.add('is-toggling');
  setTimeout(()=>legendItem.classList.remove('is-toggling'), (PERFORMANCE_MODE || prefersReducedMotion()) ? 0 : 160);
});

document.getElementById('reload-all').addEventListener('click',loadAll);

initAIChat();
initCategoryDropdown();

loadAll();
