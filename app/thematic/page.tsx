'use client';

import { useEffect, useState } from 'react';
import { speakChinese } from '@/lib/audio';
import AIModal from '@/components/AIModal';
import FavoriteButton from '@/components/FavoriteButton';

interface Word {
  id: string;
  character: string;
  pinyin: string;
  meaning: string;
  hskLevel: number;
  category?: string;
  exampleSentence?: string;
  examplePinyin?: string;
  exampleTranslation?: string;
}

interface SRSCard {
  id: string;
  word: Word;
}

interface CategoryStat {
  id: string;
  name: string;
  icon: string;
  count: number;
  masteredCount: number;
}

export default function ThematicVocabularyPage() {
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Transport');
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  // SRS Flashcard Session Mode
  const [inPracticeMode, setInPracticeMode] = useState(false);
  const [cards, setCards] = useState<SRSCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [ratingsCount, setRatingsCount] = useState({ again: 0, hard: 0, easy: 0 });

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTargetData, setAiTargetData] = useState<any>(null);
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

  const handleOpenAiModal = (character: string, pinyin: string, meaning: string) => {
    setAiTargetData({ character, pinyin, meaning, contextType: 'word' });
    setAiModalOpen(true);
  };

  // 1. Charger la liste des catégories thématiques
  useEffect(() => {
    fetch('/api/thematic')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // 2. Charger les mots de la catégorie sélectionnée
  useEffect(() => {
    if (!selectedCategory) return;
    setLoading(true);
    fetch(`/api/thematic?category=${encodeURIComponent(selectedCategory)}`)
      .then((res) => res.json())
      .then((data) => {
        setWords(data.words || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedCategory]);

  // Prononcer automatiquement le mot dans la session flashcard
  useEffect(() => {
    if (inPracticeMode && cards.length > 0 && currentIndex < cards.length && !sessionFinished) {
      speakChinese(cards[currentIndex].word.character);
    }
  }, [inPracticeMode, currentIndex, cards, sessionFinished]);

  // Lancer la session SRS Flashcard pour la catégorie courante
  const startThematicPractice = () => {
    setLoading(true);
    fetch(`/api/session/theme?category=${encodeURIComponent(selectedCategory)}`)
      .then((res) => res.json())
      .then((data) => {
        setCards(data.cards || []);
        setCurrentIndex(0);
        setShowAnswer(false);
        setSessionFinished(false);
        setRatingsCount({ again: 0, hard: 0, easy: 0 });
        setInPracticeMode(true);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleRating = async (quality: number) => {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    if (quality < 3) {
      setRatingsCount((prev) => ({ ...prev, again: prev.again + 1 }));
    } else if (quality === 3) {
      setRatingsCount((prev) => ({ ...prev, hard: prev.hard + 1 }));
    } else {
      setRatingsCount((prev) => ({ ...prev, easy: prev.easy + 1 }));
    }

    try {
      await fetch('/api/srs/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: currentCard.id, quality }),
      });
    } catch (err) {
      console.error('Erreur SRS :', err);
    }

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
    } else {
      setSessionFinished(true);
    }
  };

  const currentCategoryInfo = categories.find((c) => c.id === selectedCategory);

  // Vue Session Flashcard SRS
  if (inPracticeMode) {
    if (sessionFinished) {
      return (
        <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', padding: '2.5rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
            Révision Thématique Terminée !
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Vous avez révisé l'ensemble des <strong>{cards.length} mots</strong> du thème <strong>{selectedCategory}</strong>.
          </p>

          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-rose)' }}>{ratingsCount.again}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>À revoir</div>
            </div>
            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-amber)' }}>{ratingsCount.hard}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Difficile</div>
            </div>
            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>{ratingsCount.easy}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bien / Facile</div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={() => setInPracticeMode(false)}>
            ↩ Retour à la liste du thème
          </button>
        </div>
      );
    }

    const card = cards[currentIndex];
    if (!card) return null;

    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Barre de progression */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => setInPracticeMode(false)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            ✕ Quitter la révision
          </button>
          <span className="badge badge-hsk1">
            Thème : {selectedCategory} ({currentIndex + 1} / {cards.length})
          </span>
        </div>

        {/* Flashcard */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem', padding: '3rem 2rem' }}>
          <span className={`badge badge-hsk${card.word.hskLevel}`}>
            HSK {card.word.hskLevel}
          </span>

          <div className="cn-text" style={{ fontSize: '4.5rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>
            {card.word.character}
          </div>

          <div style={{ fontSize: '1.4rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
            {card.word.pinyin}
          </div>

          <button className="btn-audio" onClick={() => speakChinese(card.word.character)}>
            🔊 Écouter la prononciation
          </button>

          {!showAnswer ? (
            <button className="btn btn-primary" style={{ width: '100%', maxWidth: '300px', marginTop: '1rem' }} onClick={() => setShowAnswer(true)}>
              👁️ Afficher la réponse
            </button>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>
                  {card.word.meaning}
                </div>

                {card.word.exampleSentence && (
                  <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.6rem', border: '1px solid var(--border-color)', marginTop: '0.75rem' }}>
                    <div className="cn-text" style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.25rem' }}>
                      {card.word.exampleSentence}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '0.2rem' }}>
                      {card.word.examplePinyin}
                    </div>
                    <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      « {card.word.exampleTranslation} »
                    </div>
                  </div>
                )}
              </div>

              {/* Boutons de notation SM-2 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                <button className="btn" style={{ background: 'rgba(244,63,94,0.2)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.4)', padding: '0.6rem 0.4rem', fontSize: '0.8rem' }} onClick={() => handleRating(1)}>
                  ❌ À revoir
                </button>
                <button className="btn" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)', padding: '0.6rem 0.4rem', fontSize: '0.8rem' }} onClick={() => handleRating(3)}>
                  😬 Difficile
                </button>
                <button className="btn" style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)', padding: '0.6rem 0.4rem', fontSize: '0.8rem' }} onClick={() => handleRating(4)}>
                  👍 Bon
                </button>
                <button className="btn" style={{ background: 'rgba(56,189,248,0.2)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.4)', padding: '0.6rem 0.4rem', fontSize: '0.8rem' }} onClick={() => handleRating(5)}>
                  ⚡ Facile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vue Liste par Catégorie Thématique
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <AIModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} targetData={aiTargetData} />
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          🏷️ Vocabulaire Thématique (Par Catégories)
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Apprenez et révisez le vocabulaire chinois regroupé par thèmes de la vie quotidienne (Transport, Couleurs, Météo, Espace, Temps, etc.), indépendamment du niveau HSK.
        </p>
      </div>

      {/* Block complet des catégories thématiques (Grille) */}
      <div>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.85rem', color: 'var(--text-secondary)' }}>
          Sélectionnez un thème ({categories.length} catégories disponibles) :
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem' }}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <div
                key={cat.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-card)',
                  transition: 'all 0.2s ease',
                  padding: '1.25rem 1rem',
                  boxShadow: isSelected ? '0 0 15px rgba(6, 182, 212, 0.2)' : 'none',
                }}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.8rem' }}>{cat.icon}</span>
                  <span className="badge badge-streak" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}>
                    {cat.count} mots
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: isSelected ? 'var(--accent-cyan)' : '#fff', marginBottom: '0.2rem' }}>
                    {cat.name}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)', marginTop: 'auto', fontWeight: isSelected ? 600 : 400 }}>
                  {isSelected ? '✓ Thème actif' : 'Explorer ce thème →'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* En-tête de la catégorie sélectionnée + Bouton Réviser SRS */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{currentCategoryInfo?.icon}</span>
            <span>{currentCategoryInfo?.name || selectedCategory}</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {words.length} mots répertoriés dans cette catégorie thématique.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={startThematicPractice}
          disabled={words.length === 0}
          style={{ padding: '0.6rem 1.25rem', fontSize: '0.95rem' }}
        >
          ⚡ Réviser ce thème (SRS {words.length} mots)
        </button>
      </div>

      {/* Liste des mots du thème */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
          Chargement du vocabulaire thématique...
        </p>
      ) : words.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Aucun mot disponible dans cette catégorie.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {words.map((word) => (
            <div key={word.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className={`badge badge-hsk${word.hskLevel}`}>
                    HSK {word.hskLevel}
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
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
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleOpenAiModal(word.character, word.pinyin, word.meaning)}
                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', color: 'var(--accent-cyan)', borderColor: 'rgba(6,182,212,0.4)' }}
                    >
                      💡 Expliquer avec l'IA
                    </button>
                    <button className="btn-audio" onClick={() => speakChinese(word.character)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                      🔊 Prononcer
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <span className="cn-text" style={{ fontSize: '2.2rem', fontWeight: 700, color: '#fff' }}>
                    {word.character}
                  </span>
                  <span style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    {word.pinyin}
                  </span>
                </div>

                <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '0.75rem' }}>
                  {word.meaning}
                </div>

                {word.exampleSentence && (
                  <div style={{ background: 'var(--bg-main)', padding: '0.75rem 0.9rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                    <div className="cn-text" style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.2rem' }}>
                      {word.exampleSentence}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginBottom: '0.15rem' }}>
                      {word.examplePinyin}
                    </div>
                    <div style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      « {word.exampleTranslation} »
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
