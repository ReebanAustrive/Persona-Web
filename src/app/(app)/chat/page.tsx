'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, RotateCcw } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

const STARTER_PROMPTS = [
  'How consistent was I this week?',
  'Which bucket am I neglecting?',
  'What should I focus on today?',
  'Give me a streak analysis.',
  'Am I on track for my craft goals?',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [streamText, setStreamText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', parts: [{ text }] };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setStreamText('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error('Chat failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamText(fullText);
      }

      setMessages((prev) => [...prev, { role: 'model', parts: [{ text: fullText }] }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'model', parts: [{ text: "I'm having trouble connecting right now. Please check your Gemini API key in `.env.local`." }] }]);
    } finally {
      setLoading(false);
      setStreamText('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: '1.5rem 0 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--project) 0%, var(--craft) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>Persona AI Coach</h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Powered by Gemini · reads your progress data</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            id="chat-clear-btn"
            onClick={() => setMessages([])}
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem', gap: '4px' }}
          >
            <RotateCcw size={14} /> Clear
          </button>
        )}
      </motion.div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 0' }}>
        {messages.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✦</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Ask about your progress
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              I have access to your tracks, logs, and streaks — ask me anything.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.82rem', borderColor: 'var(--border-strong)' }}
                >
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '1.25rem',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'user' ? 'var(--project-dim)' : 'linear-gradient(135deg, var(--project), var(--craft))',
                border: msg.role === 'user' ? '1px solid var(--project-glow)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {msg.role === 'user' ? <User size={16} color="var(--project)" /> : <Bot size={16} color="white" />}
              </div>
              <div
                className="glass"
                style={{
                  padding: '0.875rem 1rem',
                  maxWidth: '75%',
                  fontSize: '0.9rem',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  background: msg.role === 'user' ? 'var(--project-dim)' : 'var(--bg-card)',
                  border: `1px solid ${msg.role === 'user' ? 'var(--project-glow)' : 'var(--border)'}`,
                }}
              >
                {msg.parts[0].text}
              </div>
            </motion.div>
          ))}

          {/* Streaming */}
          {loading && streamText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--project), var(--craft))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Bot size={16} color="white" />
              </div>
              <div className="glass" style={{ padding: '0.875rem 1rem', maxWidth: '75%', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', borderRadius: '4px 16px 16px 16px' }}>
                {streamText}
                <span style={{ display: 'inline-block', width: '2px', height: '1em', background: 'var(--craft)', marginLeft: '2px', animation: 'pulse-ring 1s infinite', verticalAlign: 'text-bottom' }} />
              </div>
            </motion.div>
          )}

          {/* Thinking indicator */}
          {loading && !streamText && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--project), var(--craft))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={16} color="white" />
              </div>
              <div className="glass" style={{ padding: '0.875rem 1rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0, 0.15, 0.3].map((d, i) => (
                  <motion.div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)' }}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: d }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding: '1rem 0 1.5rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <textarea
            id="chat-input"
            className="input"
            rows={1}
            placeholder="Ask about your progress…"
            value={input}
            onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }}
            onKeyDown={handleKeyDown}
            style={{ flex: 1, resize: 'none', maxHeight: '120px', fontFamily: 'inherit', overflowY: 'auto' }}
          />
          <button
            id="chat-send-btn"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="btn btn-primary"
            style={{ padding: '0.625rem', minWidth: '44px', justifyContent: 'center', opacity: !input.trim() || loading ? 0.5 : 1 }}
          >
            <Send size={18} />
          </button>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
          Reads your last 30 days of progress. Press Enter to send, Shift+Enter for new line.
        </p>
      </div>
    </div>
  );
}
