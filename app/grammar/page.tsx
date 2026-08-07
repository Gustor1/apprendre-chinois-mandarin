'use client';

import { useEffect, useState } from 'react';
import { speakChinese } from '@/lib/audio';
import AIModal from '@/components/AIModal';
import FavoriteButton from '@/components/FavoriteButton';

interface GrammarStructure {
  id: string;
  title: string;
  hskLevel: number;
  pattern: string;
  explanation: string;
  exampleSentence: string;
  examplePinyin: string;
  exampleTranslation: string;
}

export default function GrammarPage() {
  const [structures, setStructures] = useState<GrammarStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Charger les IDs des favoris de type 'grammar'
  useEffect(() => {
    fetch('/api/favorites?type=grammar')
      .then((res) => res.json())
      .then((d) => {
        const ids = new Set<string>((d.favorites || []).map((f: any) => f.grammarStructureId).filter(Boolean));
        setFavoriteIds(ids);
      })
      .catch(() => {});
  }, []);

  const fetchStructures = (level: string) => {
    setLoading(true);
    const url = level === 'all' ? '/api/grammar' : `/api/grammar?level=${level}`;
    fetch(url)
      .then((res) => res.json())
      .then((d) => {
        setStructures(d.structures || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStructures(selectedLevel);
  }, [selectedLevel]);

  // Regrouper par niveau HSK
  const groupedByLevel: Record<number, GrammarStructure[]> = {};
  structures.forEach((st) => {
    if (!groupedByLevel[st.hskLevel]) {
      groupedByLevel[st.hskLevel] = [];
    }
    groupedByLevel[st.hskLevel].push(st);
  });

  const levelLabels: Record<number, { title: string; desc: string }> = {
    1: { title: 'HSK 1 — Structures Fondamentales', desc: 'Les patrons de base pour former vos premières phrases.' },
    2: { title: 'HSK 2 — Structures Intermédiaires', desc: 'Enrichissez vos phrases avec des nuances temporelles, comparatives et modales.' },
    3: { title: 'HSK 3 — Structures Avancées', desc: 'Maîtrisez les constructions complexes pour une conversation fluide.' },
  };

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTargetData, setAiTargetData] = useState<any>(null);

  const handleOpenAiModal = (title: string, pattern: string, meaning: string) => {
    setAiTargetData({ title, pattern, meaning, contextType: 'grammar' });
    setAiModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <AIModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} targetData={aiTargetData} />

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          🧩 Structures de Phrases (Grammaire HSK)
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Retrouvez les patrons grammaticaux essentiels par niveau HSK.
          Chaque structure est illustrée par un exemple audio.
        </p>
      </div>

      {/* Filtres par Niveau HSK */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Niveau HSK :
          </span>
          {['all', '1', '2', '3'].map((lvl) => (
            <button
              key={lvl}
              className={`btn ${selectedLevel === lvl ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                padding: '0.4rem 1rem',
                fontSize: '0.85rem',
                opacity: selectedLevel === lvl ? 1 : 0.6,
              }}
              onClick={() => setSelectedLevel(lvl)}
            >
              {lvl === 'all' ? 'Tous les niveaux' : `HSK ${lvl}`}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {structures.length} structure{structures.length !== 1 ? 's' : ''} grammaticale{structures.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
          Chargement des structures grammaticales...
        </p>
      ) : structures.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            Aucune structure grammaticale trouvée pour ce niveau.
          </p>
        </div>
      ) : (
        Object.keys(groupedByLevel)
          .sort((a, b) => Number(a) - Number(b))
          .map((levelKey) => {
            const level = Number(levelKey);
            const items = groupedByLevel[level];
            const label = levelLabels[level] || { title: `HSK ${level}`, desc: '' };

            return (
              <div key={level} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* En-tête de section par niveau */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <span className={`badge badge-hsk${level}`}>HSK {level}</span>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', marginBottom: '0.1rem' }}>{label.title}</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label.desc}</p>
                  </div>
                </div>

                {/* Cartes de structures */}
                {items.map((structure) => (
                  <div
                    key={structure.id}
                    className="card"
                    style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                  >
                    {/* Header : Titre + Badge + Pattern */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                          {structure.title}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FavoriteButton
                            itemId={structure.id}
                            itemType="grammar"
                            isFavorite={favoriteIds.has(structure.id)}
                            onToggle={(newState) => {
                              setFavoriteIds((prev) => {
                                const next = new Set(prev);
                                if (newState) next.add(structure.id); else next.delete(structure.id);
                                return next;
                              });
                            }}
                          />
                          <span className={`badge badge-hsk${structure.hskLevel}`}>
                            HSK {structure.hskLevel}
                          </span>
                        </div>
                      </div>

                      {/* Patron */}
                      <div
                        style={{
                          background: 'var(--bg-main)',
                          padding: '0.65rem 1rem',
                          borderRadius: '0.5rem',
                          border: '1px solid var(--border-color)',
                          fontFamily: 'monospace',
                          fontSize: '0.9rem',
                          color: 'var(--accent-cyan)',
                          fontWeight: 500,
                        }}
                      >
                        📐 Patron : {structure.pattern}
                      </div>
                    </div>

                    {/* Explication */}
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {structure.explanation}
                    </p>

                    {/* Phrase d'exemple */}
                    <div
                      style={{
                        background: 'var(--bg-main)',
                        padding: '1rem 1.25rem',
                        borderRadius: '0.75rem',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                      }}
                    >
                      <div className="cn-text" style={{ fontSize: '1.15rem', fontWeight: 600, color: '#fff' }}>
                        {structure.exampleSentence}
                      </div>
                      <div style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>
                        {structure.examplePinyin}
                      </div>
                      <div style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        « {structure.exampleTranslation} »
                      </div>

                      <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleOpenAiModal(structure.title, structure.pattern, structure.explanation)}
                          style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem', borderColor: 'rgba(6, 182, 212, 0.4)', color: 'var(--accent-cyan)' }}
                        >
                          💡 Expliquer avec l'IA
                        </button>
                        <button
                          className="btn-audio"
                          onClick={() => speakChinese(structure.exampleSentence)}
                        >
                          🔊 Prononcer l'exemple
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
      )}
    </div>
  );
}
