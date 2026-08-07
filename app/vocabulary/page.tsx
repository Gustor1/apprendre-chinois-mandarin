'use client';

import { useEffect, useState } from 'react';
import { speakChinese } from '@/lib/audio';
import Link from 'next/link';
import AIModal from '@/components/AIModal';
import FavoriteButton from '@/components/FavoriteButton';

interface Word {
  id: string;
  character: string;
  pinyin: string;
  meaning: string;
  hskLevel: number;
  category?: string;
  orderIndex?: number;
  exampleSentence?: string;
  examplePinyin?: string;
  exampleTranslation?: string;
}

export default function VocabularyPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Charger les IDs des favoris de type 'word'
  useEffect(() => {
    fetch('/api/favorites?type=word')
      .then((res) => res.json())
      .then((d) => {
        const ids = new Set<string>((d.favorites || []).map((f: any) => f.wordId).filter(Boolean));
        setFavoriteIds(ids);
      })
      .catch(() => {});
  }, []);

  const fetchWords = (level: string, query: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (level !== 'all') params.append('level', level);
    if (query) params.append('query', query);

    fetch(`/api/words?${params.toString()}`)
      .then((res) => res.json())
      .then((d) => {
        const fetchedWords: Word[] = d.words || [];
        // Tri garanti côté client (numérique pour HSK et orderIndex)
        fetchedWords.sort((a, b) => {
          if (a.hskLevel !== b.hskLevel) return a.hskLevel - b.hskLevel;
          const idxA = a.orderIndex ?? 0;
          const idxB = b.orderIndex ?? 0;
          if (idxA !== idxB) return idxA - idxB;
          return a.pinyin.localeCompare(b.pinyin, 'zh');
        });
        setWords(fetchedWords);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWords(selectedLevel, searchQuery);
  }, [selectedLevel]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWords(selectedLevel, searchQuery);
  };

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTargetData, setAiTargetData] = useState<any>(null);

  const handleOpenAiModal = (character: string, pinyin: string, meaning: string) => {
    setAiTargetData({ character, pinyin, meaning, contextType: 'word' });
    setAiModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <AIModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} targetData={aiTargetData} />
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          📚 Explorateur de Vocabulaire HSK 3.0
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Consultez et écoutez l'intégralité du vocabulaire officiel et des phrases modèles.
        </p>
      </div>

      {/* Barre de recherche et Filtres */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Rechercher par caractère, pinyin ou sens (ex: 上海, nǐ hǎo, manger)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '250px',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-main)',
              color: '#fff',
              fontSize: '0.95rem',
            }}
          />
          <button type="submit" className="btn btn-primary">
            🔍 Rechercher
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
              Niveau HSK :
            </span>
            {['all', '1', '2', '3'].map((lvl) => (
              <button
                key={lvl}
                className={`badge ${selectedLevel === lvl ? 'badge-streak' : 'badge-hsk1'}`}
                style={{
                  cursor: 'pointer',
                  padding: '0.4rem 0.9rem',
                  fontSize: '0.85rem',
                  opacity: selectedLevel === lvl ? 1 : 0.6,
                }}
                onClick={() => setSelectedLevel(lvl)}
              >
                {lvl === 'all' ? 'Tous les niveaux' : `HSK ${lvl}`}
              </button>
            ))}
          </div>

          <Link
            href={selectedLevel === 'all' ? '/practice' : `/practice?level=${selectedLevel}`}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.4)' }}
          >
            ⚡ Réviser {selectedLevel === 'all' ? 'par Niveau' : `HSK ${selectedLevel}`} (Flashcards) ➔
          </Link>
        </div>
      </div>

      {/* Liste des cartes de vocabulaire */}
      {loading ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
          Chargement du vocabulaire...
        </p>
      ) : words.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Aucun mot ne correspond à votre recherche.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {words.map((word) => (
            <div key={word.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span className="cn-text" style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginRight: '0.5rem' }}>
                      {word.character}
                    </span>
                    <span style={{ color: 'var(--accent-cyan)', fontSize: '1.1rem', fontWeight: 500 }}>
                      {word.pinyin}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FavoriteButton
                      itemId={word.id}
                      itemType="word"
                      isFavorite={favoriteIds.has(word.id)}
                      onToggle={(newState) => {
                        setFavoriteIds((prev) => {
                          const next = new Set(prev);
                          if (newState) next.add(word.id); else next.delete(word.id);
                          return next;
                        });
                      }}
                    />
                    <span className={`badge badge-hsk${word.hskLevel}`}>HSK {word.hskLevel}</span>
                  </div>
                </div>

                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f3f4f6', marginBottom: '0.5rem' }}>
                  {word.meaning}
                </div>

                {word.category && (
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', color: 'var(--text-muted)' }}>
                    {word.category}
                  </span>
                )}

                {word.exampleSentence && (
                  <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '0.5rem', marginTop: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <div className="cn-text" style={{ color: 'var(--accent-cyan)', fontSize: '1rem', fontWeight: 600 }}>
                      {word.exampleSentence}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {word.examplePinyin}
                    </div>
                    <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      « {word.exampleTranslation} »
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleOpenAiModal(word.character, word.pinyin, word.meaning)}
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem', borderColor: 'rgba(6, 182, 212, 0.4)', color: 'var(--accent-cyan)' }}
                >
                  💡 Expliquer avec l'IA
                </button>
                <button className="btn-audio" onClick={() => speakChinese(word.character)}>
                  🔊 Prononcer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
