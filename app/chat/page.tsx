'use client';

import { useEffect, useState, useRef } from 'react';
import { speakChinese } from '@/lib/audio';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const SCENARIOS = [
  { id: 'cafe', title: '☕ Commander un café à Xuhui', prompt: 'Bonjour ! Qu’aimeriez-vous boire aujourd’hui ?' },
  { id: 'taxi', title: '🚕 Prendre un Taxi / DiDi', prompt: '师傅，您好！去哪里？' },
  { id: 'restaurant', title: '🥟 Le Resto de Shengjianbao', prompt: '欢迎光临！几位？想吃点什么？' },
  { id: 'work', title: '💼 Pause café au bureau (Lujiazui)', prompt: '早啊！画面今天工作忙不忙？' },
];

export default function ChatPage() {
  const [selectedScenario, setSelectedScenario] = useState('cafe');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialiser la discussion lors du changement de scénario
  useEffect(() => {
    const activeSc = SCENARIOS.find((s) => s.id === selectedScenario);
    if (activeSc) {
      setMessages([
        {
          id: 'init',
          role: 'assistant',
          content: `[中文] Chinois : ${activeSc.prompt}\n[Pinyin] : Bienvenue !\n[Français] Traduction : Bonjour, bienvenue ! Que puis-je faire pour vous ?\n[Conseil] : Vous pouvez répondre en chinois simple (ex: 我想要一杯拿铁 - Je voudrais un latte).`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [selectedScenario]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || loading) return;

    const userText = inputMsg.trim();
    setInputMsg('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    const initialBotMessage: ChatMessage = {
      id: botMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, initialBotMessage]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          scenario: selectedScenario,
        }),
      });

      if (!res.body) {
        setMessages((prev) =>
          prev.map((m) => (m.id === botMessageId ? { ...m, content: '❌ Aucune réponse reçue de l’assistant.' } : m))
        );
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      setLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === botMessageId ? { ...m, content: m.content + chunk } : m))
        );
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMessageId ? { ...m, content: '❌ Erreur de connexion avec l’Assistant IA.' } : m
        )
      );
      setLoading(false);
    }
  };

  // Extraire la phrase chinoise pour le bouton audio TTS
  const extractChineseText = (content: string): string => {
    const match = content.match(/\[中文\]\s*Chinois\s*:\s*([^\n]+)/) || content.match(/🇨🇳\s*Chinois\s*:\s*([^\n]+)/);
    return match ? match[1].trim() : content;
  };

  // Formater les marqueurs [中文], [Français], [Pinyin], [Conseil]
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      let styledLine: React.ReactNode = line;

      if (line.includes('[中文]')) {
        const parts = line.split('[中文]');
        styledLine = (
          <span>
            {parts[0]}
            <span style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600, marginRight: '0.4rem' }}>
              中文
            </span>
            {parts[1]}
          </span>
        );
      } else if (line.includes('[Français]')) {
        const parts = line.split('[Français]');
        styledLine = (
          <span>
            {parts[0]}
            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600, marginRight: '0.4rem' }}>
              Français
            </span>
            {parts[1]}
          </span>
        );
      } else if (line.includes('[Pinyin]')) {
        const parts = line.split('[Pinyin]');
        styledLine = (
          <span>
            {parts[0]}
            <span style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600, marginRight: '0.4rem' }}>
              Pinyin
            </span>
            {parts[1]}
          </span>
        );
      } else if (line.includes('[Conseil]')) {
        const parts = line.split('[Conseil]');
        styledLine = (
          <span>
            {parts[0]}
            <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600, marginRight: '0.4rem' }}>
              Conseil
            </span>
            {parts[1]}
          </span>
        );
      }

      return (
        <div key={idx} style={{ marginBottom: idx < lines.length - 1 ? '0.35rem' : 0 }}>
          {styledLine}
        </div>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '850px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          🤖 Chatbot Oral & Jeux de Rôle
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Pratiquez le dialogue oral en immersion dans des situations réelles à Shanghai. L'assistant IA corrige vos phrases et fournit pinyin et traductions.
        </p>
      </div>

      {/* Choix des Scénarios */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.6rem' }}>
          Choisissez un scénario de dialogue :
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem' }}>
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              className={`btn ${selectedScenario === sc.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem', textAlign: 'left' }}
              onClick={() => setSelectedScenario(sc.id)}
            >
              {sc.title}
            </button>
          ))}
        </div>
      </div>

      {/* Fenêtre de discussion */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '520px',
          padding: '1.25rem',
          justifyContent: 'space-between',
        }}
      >
        {/* Liste des messages */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: m.role === 'user' ? 'right' : 'left' }}>
                {m.role === 'user' ? 'Vous' : '🤖 Assistant IA'} • {m.timestamp}
              </div>

              <div
                style={{
                  background: m.role === 'user' ? 'var(--accent-cyan)' : 'var(--bg-main)',
                  color: m.role === 'user' ? '#000' : 'var(--text-primary)',
                  fontWeight: m.role === 'user' ? 600 : 400,
                  padding: '1rem 1.2rem',
                  borderRadius: '1rem',
                  borderTopRightRadius: m.role === 'user' ? '0.2rem' : '1rem',
                  borderTopLeftRadius: m.role === 'assistant' ? '0.2rem' : '1rem',
                  border: m.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                }}
              >
                {m.content ? (
                  renderFormattedContent(m.content)
                ) : (
                  <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>🤖 L'IA réfléchit...</span>
                )}
              </div>

              {m.role === 'assistant' && m.content && (
                <button
                  className="btn-audio"
                  onClick={() => speakChinese(extractChineseText(m.content))}
                  style={{ alignSelf: 'flex-start', padding: '0.25rem 0.6rem', fontSize: '0.75rem', marginTop: '0.2rem' }}
                >
                  🔊 Écouter la réplique
                </button>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              🤖 L'IA réfléchit et rédige sa réponse...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <input
            type="text"
            placeholder="Répondez en chinois ou pinyin (ex: 我要一杯美式咖啡)..."
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              color: '#fff',
              padding: '0.75rem 1rem',
              borderRadius: '0.6rem',
              fontSize: '0.95rem',
            }}
          />
          <button className="btn btn-primary" type="submit" disabled={loading || !inputMsg.trim()} style={{ padding: '0.75rem 1.5rem' }}>
            Envoyer ➔
          </button>
        </form>
      </div>
    </div>
  );
}
