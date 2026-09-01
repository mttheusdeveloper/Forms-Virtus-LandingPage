import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { OPENAI_MODEL_DEFAULT } from '../../lib/constants';
import { aiSend } from '../../lib/aiClient';
import { buildDashboardAIContext } from '../../lib/aiContext';
import { useDashboard } from '../../state/DashboardContext';
import { useMensalDerived } from '../../hooks/useMensalDerived';
import { useDreContext } from '../../hooks/useDreContext';
import { useLocalStorageState } from '../../hooks/useLocalStorageState';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: ReactNode;
}

function linesToNodes(text: string): ReactNode {
  return text.split('\n').map((line, i, arr) => (
    <span key={i}>
      {line}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'assistant',
    content: (
      <>
        Olá! Eu posso analisar este dashboard. Exemplos: <strong>qual mês teve maior custo?</strong>, <strong>qual categoria mais pesa?</strong> ou{' '}
        <strong>resuma meu DRE</strong>.
      </>
    ),
  },
];

const SUGGESTIONS = [
  { label: 'Resumo geral', prompt: 'Resuma a situação financeira atual do dashboard.' },
  { label: 'Maior custo', prompt: 'Qual mês teve maior custo operacional e por quê?' },
  { label: 'Top categorias', prompt: 'Quais categorias mais pesam no resultado?' },
  { label: 'Explicar DRE', prompt: 'Me explique a DRE em linguagem simples.' },
];

// Porta do assistente de IA (script.js:2997-3301). Mantém a arquitetura
// original: usuário cola a própria key da OpenAI, fica em localStorage
// (mesmas chaves nebula_openai_*), chamada direta do navegador pra OpenAI.
export function AiChatWidget() {
  const { state } = useDashboard();
  const mensalDerived = useMensalDerived(state.mensalRows);
  const dreContext = useDreContext(state.dreRows, state.mensalFilters);

  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useLocalStorageState('nebula_openai_api_key', '');
  const [model, setModel] = useLocalStorageState('nebula_openai_model', OPENAI_MODEL_DEFAULT);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const historyRef = useRef<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  async function send(question: string) {
    const q = question.trim();
    if (!q) return;

    if (!apiKey) {
      setMessages((m) => [
        ...m,
        {
          role: 'system',
          content: (
            <>
              Cole sua OpenAI API key no campo acima e clique em <strong>Salvar</strong> antes de perguntar.
            </>
          ),
        },
      ]);
      return;
    }

    setMessages((m) => [...m, { role: 'user', content: linesToNodes(q) }, { role: 'assistant', content: 'Analisando os dados do dashboard…' }]);
    setSending(true);

    const context = buildDashboardAIContext(state.mensalFilters, mensalDerived, dreContext, state.anualRows);
    const historyText = historyRef.current
      .slice(-6)
      .map((h) => `${h.role === 'user' ? 'Usuário' : 'Assistente'}: ${h.text}`)
      .join('\n');

    try {
      const answer = await aiSend({ apiKey, model, context, historyText, question: q });
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: 'assistant', content: linesToNodes(answer) };
        return next;
      });
      historyRef.current.push({ role: 'user', text: q }, { role: 'assistant', text: answer });
    } catch (err) {
      const errMsg =
        'Não consegui chamar a IA. Verifique se a API key está correta, se há saldo/tokens disponíveis, se o modelo escolhido está liberado na sua conta e se o navegador permitiu a chamada direta para a OpenAI. Erro: ' +
        (err instanceof Error ? err.message : String(err));
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: 'assistant', content: linesToNodes(errMsg) };
        return next;
      });
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = input;
    setInput('');
    void send(q);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const q = input;
      setInput('');
      void send(q);
    }
  }

  function saveKey() {
    setMessages((m) => [
      ...m,
      {
        role: 'system',
        content: (
          <>
            API key e modelo salvos neste navegador. Modelo atual: <strong>{model}</strong>.
          </>
        ),
      },
    ]);
  }

  function changeModel(next: string) {
    setModel(next);
    setMessages((m) => [
      ...m,
      {
        role: 'system',
        content: (
          <>
            Modelo alterado para <strong>{next}</strong>.
          </>
        ),
      },
    ]);
  }

  return (
    <>
      <button className="ai-chat-toggle" type="button" title="Perguntar à IA sobre o dashboard" onClick={() => setOpen((o) => !o)}>
        <span>AI</span>
      </button>
      <div className={`ai-chat-panel ${open ? '' : 'hidden'}`} aria-live="polite">
        <div className="ai-chat-head">
          <div>
            <div className="ai-chat-title">Assistente Financeiro</div>
            <div className="ai-chat-sub">Pergunte sobre meses, custos, categorias, DRE e tendências do dashboard.</div>
          </div>
          <button className="ai-chat-close" type="button" onClick={() => setOpen(false)}>
            Fechar
          </button>
        </div>

        <div className="ai-key-box">
          <div className="ai-key-row">
            <input type="password" autoComplete="off" placeholder="Cole sua OpenAI API key aqui" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            <button type="button" onClick={saveKey}>
              Salvar
            </button>
          </div>
          <div className="ai-model-row">
            <label htmlFor="ai-model-select">Modelo</label>
            <select id="ai-model-select" value={model} onChange={(e) => changeModel(e.target.value)}>
              <option value="gpt-5.5">GPT-5.5 — melhor análise</option>
              <option value="gpt-5.4-mini">GPT-5.4 mini — equilibrado</option>
              <option value="gpt-5.4-nano">GPT-5.4 nano — rápido/barato</option>
              <option value="gpt-4.1-mini">GPT-4.1 mini — compatibilidade</option>
            </select>
          </div>
          <div className="ai-key-help">A chave e o modelo ficam salvos apenas neste navegador via localStorage. Para trocar, altere e clique em Salvar.</div>
        </div>

        <div className="ai-chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`ai-msg ${m.role === 'user' ? 'ai-user' : m.role === 'system' ? 'ai-system' : 'ai-assistant'}`}>
              {m.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-chat-suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s.label} type="button" onClick={() => void send(s.prompt)}>
              {s.label}
            </button>
          ))}
        </div>

        <form className="ai-chat-form" onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            placeholder="Faça uma pergunta sobre o dashboard..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" disabled={sending}>
            Enviar
          </button>
        </form>
      </div>
    </>
  );
}
