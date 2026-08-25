import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Sparkles, Send, X, Bot, User, ArrowRight, RotateCcw } from 'lucide-react';

// ── Lightweight Inline Markdown Renderer ──────────────────────────────────
function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  const parseInline = (line: string): React.ReactNode => {
    // Handle inline code, bold, italic
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

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]); i++;
      }
      elements.push(
        <pre key={i} style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 8, padding: '10px 12px', overflowX: 'auto', fontSize: '0.8em', margin: '8px 0', fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.08)' }}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++; continue;
    }

    // Heading h1-h3
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ fontSize: '0.95em', fontWeight: 700, margin: '10px 0 4px', color: 'var(--text-primary)' }}>{parseInline(line.slice(4))}</h3>);
      i++; continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ fontSize: '1em', fontWeight: 700, margin: '10px 0 4px', color: 'var(--text-primary)' }}>{parseInline(line.slice(3))}</h2>);
      i++; continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} style={{ fontSize: '1.05em', fontWeight: 800, margin: '10px 0 4px', color: 'var(--text-primary)' }}>{parseInline(line.slice(2))}</h1>);
      i++; continue;
    }

    // Bullet list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(<li key={i} style={{ marginBottom: 2 }}>{parseInline(lines[i].slice(2))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} style={{ paddingLeft: 16, margin: '6px 0', listStyleType: 'disc' }}>{items}</ul>);
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i} style={{ marginBottom: 2 }}>{parseInline(lines[i].replace(/^\d+\.\s/, ''))}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} style={{ paddingLeft: 16, margin: '6px 0' }}>{items}</ol>);
      continue;
    }

    // Horizontal rule
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />);
      i++; continue;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 4 }} />);
      i++; continue;
    }

    // Paragraph
    elements.push(<p key={i} style={{ margin: '3px 0', lineHeight: 1.55 }}>{parseInline(line)}</p>);
    i++;
  }

  return <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{elements}</div>;
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
  'Explain the core concepts of my next milestone',
  'How do prerequisite unlock multipliers work in Pathwise?',
  'What project can I build to demonstrate mastery?',
];

// ── Ultra-fast smooth streaming hook ─────────────────────────────────────────
function useTypewriter(text: string, enabled: boolean) {
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

    // Fast streaming: chunk 12-24 characters every 8ms
    let i = 0;
    const chunkSize = Math.max(12, Math.floor(text.length / 30));
    const timer = setInterval(() => {
      i += chunkSize;
      if (i >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(timer);
      } else {
        setDisplayed(text.slice(0, i));
      }
    }, 8);

    return () => clearInterval(timer);
  }, [text, enabled]);

  return { displayed, done };
}

// ── Single chat bubble (assistant with typewriter) ─────────────────────────
const AssistantBubble: React.FC<{
  msg: Message;
  onAction: (a: string) => void;
  isLatest: boolean;
}> = ({ msg, onAction, isLatest }) => {
  const { displayed, done } = useTypewriter(msg.content, isLatest && msg.role === 'assistant');
  const text = isLatest && msg.role === 'assistant' ? displayed : msg.content;

  return (
    <div className="flex gap-3 justify-start animate-fade-up">
      {/* Avatar */}
      <div
        className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5"
        style={{ background: 'rgba(79,70,229,0.15)', border: '1.5px solid rgba(99,102,241,0.3)' }}
      >
        <Bot size={14} className="text-[var(--primary-400)]" />
      </div>

      <div className="flex-1 min-w-0 space-y-2.5">
        {/* Bubble */}
        <div className="chat-bubble-ai">
          <SimpleMarkdown text={text} />
          {isLatest && !done && <span className="typewriter-cursor" />}
        </div>

        {/* Suggested actions — show after typing done */}
        {(done || !isLatest) && msg.suggestedActions && msg.suggestedActions.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-fade-up">
            {msg.suggestedActions.map((action, i) => (
              <button
                key={i}
                onClick={() => onAction(action)}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border cursor-pointer transition-all hover:scale-[1.02]"
                style={{
                  background: 'rgba(79,70,229,0.08)',
                  borderColor: 'rgba(99,102,241,0.3)',
                  color: 'var(--primary-300)',
                }}
              >
                <span>{action}</span>
                <ArrowRight size={10} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Loading typing indicator ───────────────────────────────────────────────
const TypingIndicator: React.FC = () => (
  <div className="flex gap-3 justify-start animate-fade-in">
    <div
      className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
      style={{ background: 'rgba(79,70,229,0.15)', border: '1.5px solid rgba(99,102,241,0.3)' }}
    >
      <Sparkles size={14} className="text-[var(--primary-400)] animate-glow-pulse" />
    </div>
    <div className="chat-bubble-ai flex items-center gap-1.5 px-4 py-3.5">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  </div>
);

// ── Main Modal ─────────────────────────────────────────────────────────────
export const AssistantModal: React.FC<AssistantModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your Pathwise AI learning mentor. I have real-time access to your prerequisite DAG, skill gap analysis, and target career roadmap. Ask me any technical questions, roadmap explanations, or concept breakdowns!",
      suggestedActions: STARTERS,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const historyPayload = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));

    try {
      const response = await api.askAssistant(textToSend, historyPayload);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.answer,
          suggestedActions: response.suggestedActions,
          streaming: true,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I ran into an issue fetching your learner context. Please try again in a moment.',
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
      content: "Hello! I'm your Pathwise AI learning mentor. I have real-time access to your prerequisite DAG, skill gap analysis, and target career roadmap. Ask me any technical questions, roadmap explanations, or concept breakdowns!",
      suggestedActions: STARTERS,
    }]);
    setInput('');
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
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Pathwise AI Assistant"
    >
      <div
        className="flex flex-col w-full sm:max-w-xl h-[90vh] sm:h-[680px] rounded-t-2xl sm:rounded-2xl overflow-hidden animate-fade-up"
        style={{
          background: 'var(--bg-base)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 24px 64px -12px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border-dim)', background: 'var(--bg-surface)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(79,70,229,0.15)', border: '1.5px solid rgba(99,102,241,0.35)' }}
            >
              <Sparkles size={16} className="text-[var(--primary-400)] animate-glow-pulse" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[var(--text-primary)]">Pathwise AI</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success-400)] animate-pulse" />
                <span className="text-[10px] text-[var(--text-muted)]">Educational & DAG Mentor · Live state</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] transition-all cursor-pointer"
              aria-label="Reset conversation"
              title="Reset conversation"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-all cursor-pointer"
              aria-label="Close assistant"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {messages.map((msg, idx) => {
            const isLatest = idx === messages.length - 1;
            if (msg.role === 'user') {
              return (
                <div key={idx} className="flex gap-3 justify-end animate-fade-up">
                  <div className="chat-bubble-user">{msg.content}</div>
                  <div
                    className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5"
                    style={{ background: 'var(--bg-raised)', border: '1.5px solid var(--border-muted)' }}
                  >
                    <User size={14} className="text-[var(--text-secondary)]" />
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

          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div
          className="shrink-0 px-4 py-3.5"
          style={{ borderTop: '1px solid var(--border-dim)', background: 'var(--bg-surface)' }}
        >
          <form
            onSubmit={e => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your roadmap, coding concepts, interview prep, or prerequisite DAG…"
              className="flex-1 bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-[13px] px-4 py-2.5 outline-none transition-all"
              style={{ fontFamily: 'var(--font-sans)' }}
              disabled={loading}
              aria-label="Ask the AI assistant"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="ripple-container w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:opacity-40"
              style={{ background: 'var(--primary-600)', color: 'white', boxShadow: '0 4px 12px -4px rgba(79,70,229,0.5)' }}
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </form>
          <p className="text-[10px] text-[var(--text-muted)] mt-2 text-center">
            Pathwise AI · Specialized in Technical Education & DAG Learning Paths
          </p>
        </div>
      </div>

      {/* Backdrop click to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};
