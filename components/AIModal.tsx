'use client';

import { useEffect, useState } from 'react';
import { speakChinese } from '@/lib/audio';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetData: {
    character?: string;
    pinyin?: string;
    meaning?: string;
    pattern?: string;
    title?: string;
    contextType: 'word' | 'grammar';
  } | null;
}

export default function AIModal({ isOpen, onClose, targetData }: AIModalProps) {
  const [activeTab, setActiveTab] = useState<'explain' | 'generate'>('explain');
  const [explanationText, setExplanationText] = useState<string>('');
  const [generatedSentences, setGeneratedSentences] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && targetData) {
      setExplanationText('');
      setGeneratedSentences('');
      setActiveTab('explain');
      fetchExplanation();
    }
  }, [isOpen, targetData]);

  const fetchExplanation = async () => {
    if (!targetData) return;
    setLoading(true);
    setExplanationText('');

    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetData),
      });

      if (!res.body) {
        setExplanationText('❌ Aucune réponse reçue.');
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
        setExplanationText((prev) => prev + chunk);
      }
    } catch (err) {
      console.error(err);
      setExplanationText('❌ Erreur de connexion avec l’Assistant IA.');
      setLoading(false);
    }
  };

  const fetchGenerateSentences = async () => {
    if (!targetData) return;
    setLoading(true);
    setGeneratedSentences('');

    try {
      const res = await fetch('/api/ai/generate-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: targetData.character || targetData.title || '',
          pinyin: targetData.pinyin || targetData.pattern || '',
          meaning: targetData.meaning || '',
        }),
      });

      if (!res.body) {
        setGeneratedSentences('❌ Aucune réponse reçue.');
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
        setGeneratedSentences((prev) => prev + chunk);
      }
    } catch (err) {
      console.error(err);
      setGeneratedSentences('❌ Erreur de connexion avec l’Assistant IA.');
      setLoading(false);
    }
  };

  if (!isOpen || !targetData) return null;

  const targetTitle = targetData.character || targetData.title || 'Mot / Structure';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          border: '1px solid var(--accent-cyan)',
        }}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <span className="badge badge-streak" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              🤖 Assistant IA
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
              💡 Analyse de « {targetTitle} »
            </h2>
          </div>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '0.4rem 0.8rem', fontSize: '1.1rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <button
            className={`btn ${activeTab === 'explain' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
            onClick={() => {
              setActiveTab('explain');
              if (!explanationText) fetchExplanation();
            }}
          >
            💡 Nuances & Explication
          </button>
          {targetData.contextType === 'word' && (
            <button
              className={`btn ${activeTab === 'generate' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
              onClick={() => {
                setActiveTab('generate');
                if (!generatedSentences) fetchGenerateSentences();
              }}
            >
              📝 Phrases inédites
            </button>
          )}
        </div>

        {/* Contenu */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--bg-main)',
            padding: '1.25rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
              <p>🤖 L'IA réfléchit et rédige votre réponse...</p>
            </div>
          ) : activeTab === 'explain' ? (
            explanationText
          ) : (
            generatedSentences
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Propulsé par l'Assistant IA
          </span>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
