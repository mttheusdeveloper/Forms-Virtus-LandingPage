// Porta de aiSend()/aiExtractResponseText() (script.js:3191-3249). Continua
// exatamente com a mesma arquitetura do app original: a chamada vai direto do
// navegador para a OpenAI, sem backend/proxy (não há backend neste projeto).
export const DASHBOARD_AI_SYSTEM_PROMPT = `
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function aiExtractResponseText(data: any): string {
  if (data && data.output_text) return data.output_text;
  const parts: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (data?.output || []).forEach((item: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item.content || []).forEach((c: any) => {
      if (c.text) parts.push(c.text);
      else if (c.value) parts.push(c.value);
      else if (c.type === 'output_text' && c.text) parts.push(c.text);
    });
  });
  if (parts.length) return parts.join('\n');
  if (data?.error?.message) return data.error.message;
  return 'Não consegui ler a resposta da IA.';
}

interface AiSendParams {
  apiKey: string;
  model: string;
  context: unknown;
  historyText: string;
  question: string;
}

export async function aiSend({ apiKey, model, context, historyText, question }: AiSendParams): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model,
      instructions: DASHBOARD_AI_SYSTEM_PROMPT,
      input: `CONTEXTO DO DASHBOARD:\n${JSON.stringify(context, null, 2)}\n\nHISTÓRICO RECENTE:\n${historyText || 'Sem histórico.'}\n\nPERGUNTA DO USUÁRIO:\n${question}`,
      temperature: 0.2,
      max_output_tokens: 1400,
      store: false,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Erro ${res.status} ao chamar a OpenAI.`);
  }

  return aiExtractResponseText(data);
}
