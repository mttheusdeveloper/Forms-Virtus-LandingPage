import { A, C, MONTHS } from './constants';
import type { RawRow } from '../types';

// Dados fictícios com a MESMA estrutura das tabelas reais do Supabase
// (Caixa <Mês>, Financeiro 2026, dre) — usados como fallback quando o
// Supabase não retorna nada (ex.: permissão de leitura faltando no banco).
// Nunca usar isso como se fosse dado real: sempre acompanhado de um aviso
// visível na UI (ver DemoModeBanner) quando estiver ativo.

// ---- Metas mensais (Jan..Ago) que alimentam Financeiro 2026, dre e Caixa ----
const FB = [42000, 45000, 48000, 51000, 55000, 58000, 62000, 67000]; // faturamento bruto
const CUSTOS = [30000, 31500, 37000, 34500, 36500, 44000, 40000, 42500]; // custo operacional
const INV = [2000, 1500, 3000, 2500, 4000, 3500, 5000, 4500]; // investimentos
const ROI = [3000, 6800, 9200, 14500, 19800, 23200, 29500, 36800]; // roi acumulado
const ENDIV = [15000, 14000, 13000, 12500, 11500, 10500, 9500, 8500];

const N = FB.length; // 8 meses ativos (Jan..Ago)

function round(v: number): number {
  return Math.round(v);
}

// ---------------- Financeiro 2026 ----------------
export function buildMockAnualRows(): RawRow[] {
  return MONTHS.slice(0, N).map((m, i): RawRow => {
    const fb = FB[i];
    const custos = CUSTOS[i];
    const fl = round(fb * 0.91);
    const eb = fb - custos;
    const inv = INV[i];
    const caixa = round(fl - custos - inv);
    const lucro = round(((fb - custos) / fb) * 1000) / 10;
    const cresc = i === 0 ? 5 : round(((FB[i] - FB[i - 1]) / FB[i - 1]) * 1000) / 10;

    return {
      [A.mes]: m.label,
      [A.fb]: fb,
      [A.fl]: fl,
      [A.caixa]: caixa,
      [A.eb]: eb,
      [A.custos]: custos,
      [A.inv]: inv,
      roi: ROI[i],
      [A.endiv]: ENDIV[i],
      [A.lucro]: lucro,
      [A.cresc]: cresc,
    };
  });
}

// ---------------- dre ----------------
export function buildMockDreRows(): RawRow[] {
  const mentorias = FB.map((v) => round(v * 0.6));
  const lancamentos = FB.map((v) => round(v * 0.25));
  const trafego = FB.map((v) => round(v * 0.15));

  const pessoal = CUSTOS.map((v) => round(v * 0.7));
  const ferramentas = CUSTOS.map((v) => round(v * 0.3));

  const ebitda = FB.map((v, i) => v - CUSTOS[i]);
  const despAdm = ebitda.map((v) => round(v * 0.35));
  const marketing = despAdm.map((v) => round(v * 0.6));
  const administrativo = despAdm.map((v) => round(v * 0.4));

  const despFin = ebitda.map((v) => round(v * 0.04));
  const totalDespesas = despAdm.map((v, i) => v + despFin[i]);
  const resultado = ebitda.map((v, i) => v - totalDespesas[i]);

  const monthCols = (values: number[]) => {
    const row: RawRow = {};
    MONTHS.slice(0, N).forEach((m, i) => {
      row[m.dreCols[0]] = values[i];
    });
    return row;
  };

  let id = 1;
  const row = (descricao: string, values: number[] | null): RawRow => ({
    id: id++,
    descricao,
    ...(values ? monthCols(values) : {}),
  });

  return [
    row('RECEITAS', null),
    row('Mentorias', mentorias),
    row('Lançamentos', lancamentos),
    row('Tráfego', trafego),
    row('Total das receitas', FB),
    row('CUSTO', null),
    row('Custos com pessoal', pessoal),
    row('Ferramentas e software', ferramentas),
    row('Fixos e Variáveis', CUSTOS),
    row('EBITDA', ebitda),
    row('Despesas', despAdm),
    row('Marketing', marketing),
    row('Administrativo', administrativo),
    row('Despesas Financeiras', despFin),
    row('Juros e taxas', despFin),
    row('Total das despesas', totalDespesas),
    row('RESULTADO DO EXERCÍCIO', resultado),
  ];
}

// ---------------- Caixa <Mês> ----------------
const CONTAS = ['Banco Principal', 'Conta PJ', 'Nubank PJ'];

interface CategoryTemplate {
  categoria: string;
  descricao: string;
  share: number; // fração do total do mês
  tipo: 'entrada' | 'saida';
}

const ENTRADA_TEMPLATES: CategoryTemplate[] = [
  { categoria: 'Mentorias', descricao: 'Venda de mentoria', share: 0.55, tipo: 'entrada' },
  { categoria: 'Lançamentos', descricao: 'Lançamento de curso', share: 0.28, tipo: 'entrada' },
  { categoria: 'Consultoria', descricao: 'Consultoria de tráfego pago', share: 0.17, tipo: 'entrada' },
];

const SAIDA_TEMPLATES: CategoryTemplate[] = [
  { categoria: 'Salários', descricao: 'Folha de pagamento', share: 0.4, tipo: 'saida' },
  { categoria: 'Marketing', descricao: 'Campanhas de anúncio', share: 0.2, tipo: 'saida' },
  { categoria: 'Ferramentas', descricao: 'Assinatura de software', share: 0.12, tipo: 'saida' },
  { categoria: 'Impostos', descricao: 'Guia de impostos do mês', share: 0.13, tipo: 'saida' },
  { categoria: 'Freelancers', descricao: 'Pagamento de freelancer', share: 0.1, tipo: 'saida' },
  { categoria: 'Aluguel', descricao: 'Aluguel do escritório', share: 0.05, tipo: 'saida' },
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function buildMockMensalRows(): Record<string, RawRow[]> {
  const out: Record<string, RawRow[]> = {};

  MONTHS.forEach((m, i) => {
    if (i >= N) {
      out[m.key] = [];
      return;
    }

    const fb = FB[i];
    const custos = CUSTOS[i];
    const inv = INV[i];
    const monthNumber = i + 1;
    const rows: RawRow[] = [];
    let day = 2;

    const nextDay = () => {
      day += 3;
      if (day > 27) day = ((day - 3) % 5) + 2;
      return day;
    };

    ENTRADA_TEMPLATES.forEach((tpl, idx) => {
      rows.push({
        [C.data]: `${pad2(nextDay())}/${pad2(monthNumber)}/2026`,
        [C.conta]: CONTAS[idx % CONTAS.length],
        [C.desc]: tpl.descricao,
        [C.cat]: tpl.categoria,
        [C.ent]: round(fb * tpl.share),
        [C.sai]: 0,
      });
    });

    SAIDA_TEMPLATES.forEach((tpl, idx) => {
      rows.push({
        [C.data]: `${pad2(nextDay())}/${pad2(monthNumber)}/2026`,
        [C.conta]: CONTAS[(idx + 1) % CONTAS.length],
        [C.desc]: tpl.descricao,
        [C.cat]: tpl.categoria,
        [C.ent]: 0,
        [C.sai]: round(custos * tpl.share),
      });
    });

    // Investimento do mês (alimenta o modal de Investimentos e o gráfico Investimentos x Rendimento)
    rows.push({
      [C.data]: `${pad2(nextDay())}/${pad2(monthNumber)}/2026`,
      [C.conta]: 'Banco Principal',
      [C.desc]: 'Compra de equipamento',
      [C.cat]: 'Investimentos',
      [C.ent]: 0,
      [C.sai]: inv,
    });

    // Retirada de sócio (exercita a detecção de "retirada/saque" — não entra no faturamento)
    if (i % 2 === 0) {
      rows.push({
        [C.data]: `${pad2(nextDay())}/${pad2(monthNumber)}/2026`,
        [C.conta]: 'Conta PJ',
        [C.desc]: 'Retirada de lucros do sócio',
        [C.cat]: 'Distribuição',
        [C.ent]: 0,
        [C.sai]: round(fb * 0.03),
      });
    }

    out[m.key] = rows;
  });

  return out;
}
