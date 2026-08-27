import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Send, X, User, ArrowRight, RotateCcw } from 'lucide-react';
import { CartoonBotAvatar, type BotMood } from './CartoonBotAvatar';

// ── Lightweight Inline Markdown Renderer ──────────────────────────────────
function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  const parseInline = (line: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let buf = '';
    let j = 0;
    while (j < line.length) {
      if (line[j] === '`' && line.indexOf('`', j + 1) > j) {
        const end = line.indexOf('`', j + 1);
        if (buf) parts.push(buf); buf = '';
        parts.push(<code key={j} style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4, fontSize: '0.85em', fontFamily: 'monospace' }}>{line.slice(j + 1, end)}</code>);
        j = end + 1; continue;
      }
      if (line[j] === '*' && line[j + 1] === '*') {
        const end = line.indexOf('**', j + 2);
        if (end > j) {
          if (buf) parts.push(buf); buf = '';
          parts.push(<strong key={j}>{line.slice(j + 2, end)}</strong>);
          j = end + 2; continue;
        }
      }
      if (line[j] === '*' && line[j + 1] !== '*') {
        const end = line.indexOf('*', j + 1);
        if (end > j) {
          if (buf) parts.push(buf); buf = '';
          parts.push(<em key={j}>{line.slice(j + 1, end)}</em>);
          j = end + 1; continue;
        }
      }
      buf += line[j]; j++;
    }
    if (buf) parts.push(buf);
    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]); i++;
      }
      elements.push(
        <pre key={i} style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '8px 12px', overflowX: 'auto', fontSize: '0.8em', margin: '6px 0', fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.08)' }}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++; continue;
    }

    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ fontSize: '0.92em', fontWeight: 700, margin: '8px 0 3px', color: 'var(--text-primary)' }}>{parseInline(line.slice(4))}</h3>);
      i++; continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ fontSize: '0.98em', fontWeight: 700, margin: '8px 0 3px', color: 'var(--text-primary)' }}>{parseInline(line.slice(3))}</h2>);
      i++; continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} style={{ fontSize: '1.02em', fontWeight: 800, margin: '8px 0 3px', color: 'var(--text-primary)' }}>{parseInline(line.slice(2))}</h1>);
      i++; continue;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(<li key={i} style={{ marginBottom: 2 }}>{parseInline(lines[i].slice(2))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} style={{ paddingLeft: 16, margin: '4px 0', listStyleType: 'disc' }}>{items}</ul>);
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i} style={{ marginBottom: 2 }}>{parseInline(lines[i].replace(/^\d+\.\s/, ''))}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} style={{ paddingLeft: 16, margin: '4px 0' }}>{items}</ol>);
      continue;
    }

    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '6px 0' }} />);
      i++; continue;
    }

    if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 3 }} />);
      i++; continue;
    }

    elements.push(<p key={i} style={{ margin: '2px 0', lineHeight: 1.5 }}>{parseInline(line)}</p>);
    i++;
  }

  return <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{elements}</div>;
}

// ── Types ─────────────────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestedActions?: string[];
  streaming?: boolean;
}

interface AssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Suggested starter prompts ──────────────────────────────────────────────
const STARTERS = [
  'Why did my roadmap prioritize this skill?',
  'Explain key concepts of my current milestone',
  'What hands-on project should I build next?',
  'How do prerequisite DAG multipliers work?',
];

// ── Ultra-fast smooth streaming hook ─────────────────────────────────────────
function useTypewriter(text: string, enabled: boolean, onDone?: () => void) {
  const [displayed, setDisplayed] = useState(enabled ? '' : text);
  const [done, setDone] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setDisplayed(text);
      setDone(true);
      return;
    }
    setDisplayed('');
    setDone(false);

    let i = 0;
    const chunkSize = Math.max(10, Math.floor(text.length / 30));
    const timer = setInterval(() => {
      i += chunkSize;
      if (i >= text.length) {
        setDisplayed(text);
        setDone(true);
        if (onDone) onDone();
        clearInterval(timer);
      } else {
        setDisplayed(text.slice(0, i));
      }
    }, 10);

    return () => clearInterval(timer);
  }, [text, enabled]);

  return { displayed, done };
}

// ── Single chat bubble (assistant with cute companion avatar) ─────────────
const AssistantBubble: React.FC<{
  msg: Message;
  onAction: (a: string) => void;
  isLatest: boolean;
}> = ({ msg, onAction, isLatest }) => {
  const [isSpeaking, setIsSpeaking] = useState(msg.streaming);
  const { displayed, done } = useTypewriter(msg.content, Boolean(msg.streaming && isLatest), () => {
    setIsSpeaking(false);
  });

  const mood: BotMood = isSpeaking ? 'speaking' : 'idle';

  return (
    <div className="flex gap-2.5 justify-start animate-fade-up">
      <div className="shrink-0 mt-0.5">
        <CartoonBotAvatar mood={mood} size={30} interactive={false} />
      </div>

      <div className="space-y-1.5 max-w-[88%] min-w-0">
        <div
          className="rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm border border-cyan-500/20 bg-[#0c1220]/90 text-[var(--text-primary)]"
        >
          <SimpleMarkdown text={msg.streaming && isLatest ? displayed : msg.content} />

          {msg.streaming && isLatest && !done && (
            <span className="inline-block w-1.5 h-3 ml-1 bg-cyan-400 animate-pulse align-middle" />
          )}
        </div>

        {done && msg.suggestedActions && msg.suggestedActions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {msg.suggestedActions.map((action, i) => (
              <button
                key={i}
                onClick={() => onAction(action)}
                className="text-[10.5px] font-mono px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 active:scale-95 bg-white/[0.04] text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/15 hover:border-cyan-500/50"
              >
                <span>{action}</span>
                <ArrowRight size={9} className="text-cyan-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const AssistantModal: React.FC<AssistantModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Beep boop! 👋 I'm **Pathy**, your AI learning companion. Ask me any technical questions, request explanations, or test your readiness!",
      suggestedActions: STARTERS,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [botMood, setBotMood] = useState<BotMood>('idle');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setBotMood('happy');
      const timer = setTimeout(() => setBotMood('idle'), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setBotMood('thinking');

    const historyPayload = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));

    try {
      const response = await api.askAssistant(textToSend, historyPayload);
      setBotMood('speaking');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.answer,
          suggestedActions: response.suggestedActions,
          streaming: true,
        },
      ]);
      setTimeout(() => setBotMood('happy'), 2000);
      setTimeout(() => setBotMood('idle'), 3500);
    } catch {
      setBotMood('idle');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Beep... I ran into an issue connecting to my model. Please ask again!',
          streaming: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([{
      role: 'assistant',
      content: "Beep boop! 👋 I'm **Pathy**, your AI learning companion. Ask me any technical questions, request explanations, or test your readiness!",
      suggestedActions: STARTERS,
    }]);
    setInput('');
    setBotMood('happy');
    setTimeout(() => setBotMood('idle'), 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Pathwise AI Assistant"
      onClick={onClose}
    >
      <div
        className="flex flex-col w-full max-w-lg sm:max-w-xl h-[90vh] sm:h-[82vh] max-h-none sm:max-h-[620px] rounded-t-3xl sm:rounded-2xl overflow-hidden animate-fade-up border-t sm:border border-cyan-500/30 shadow-[0_20px_60px_-10px_rgba(14,165,233,0.35)]"
        style={{
          background: 'linear-gradient(180deg, #090e1c 0%, #050812 100%)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Fixed Compact Header ── */}
        <div
          className="flex items-center justify-between px-4 sm:px-5 py-3 shrink-0 border-b border-white/[0.08] bg-white/[0.02]"
        >
          <div className="flex items-center gap-3">
            <CartoonBotAvatar mood={botMood} size={38} interactive={true} />

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-display tracking-tight">
                  Pathy AI Companion
                </h3>
                <span className="badge badge-cyan text-[8px] font-mono font-bold uppercase">
                  {botMood === 'thinking' ? 'Thinking...' : botMood === 'speaking' ? 'Speaking' : 'Online'}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {botMood === 'thinking'
                  ? 'Searching prerequisite graph…'
                  : botMood === 'speaking'
                  ? 'Explaining roadmap concept…'
                  : 'Interactive Learning & DAG Mentor'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
              aria-label="Reset conversation"
              title="Reset conversation"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
              aria-label="Close assistant"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Messages Container ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
          {messages.map((msg, idx) => {
            const isLatest = idx === messages.length - 1;
            if (msg.role === 'user') {
              return (
                <div key={idx} className="flex gap-2.5 justify-end animate-fade-up">
                  <div className="chat-bubble-user max-w-[82%] text-xs">{msg.content}</div>
                  <div
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300"
                  >
                    <User size={13} />
                  </div>
                </div>
              );
            }
            return (
              <AssistantBubble
                key={idx}
                msg={msg}
                onAction={handleSend}
                isLatest={isLatest}
              />
            );
          })}

          {loading && (
            <div className="flex items-center gap-2.5 animate-fade-in pl-1">
              <CartoonBotAvatar mood="thinking" size={26} interactive={false} />
              <div className="p-2.5 px-3 rounded-xl bg-white/[0.04] border border-cyan-500/20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[11px] font-mono text-cyan-300">
                  Thinking and checking your DAG…
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Fixed Compact Footer ── */}
        <div
          className="shrink-0 px-4 py-3 border-t border-white/[0.08] bg-black/40 backdrop-blur-md space-y-1.5"
        >
          <form
            onSubmit={e => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => {
                setInput(e.target.value);
                if (e.target.value.length > 0 && botMood === 'idle') {
                  setBotMood('happy');
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask Pathy about roadmap steps, concepts, code…"
              className="flex-1 bg-white/[0.04] border border-white/[0.12] focus:border-cyan-400/60 rounded-xl text-white text-xs px-3.5 py-2.5 outline-none transition-all placeholder:text-slate-500"
              disabled={loading}
              aria-label="Ask Pathy AI"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:opacity-40 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white shadow-md active:scale-90"
              aria-label="Send message"
            >
              <Send size={14} />
            </button>
          </form>

          <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-400 px-1">
            <span>✨ Tap Pathy to poke</span>
            <span>Groq LLaMA 3.3 70B</span>
          </div>
        </div>
      </div>

      {/* Backdrop click to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};
