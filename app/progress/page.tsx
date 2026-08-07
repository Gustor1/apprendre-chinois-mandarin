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

interface SRSCardItem {
  id: string;
  wordId: string;
  status: 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';
  interval: number;
  repetition: number;
  easeFactor: number;
  nextReviewDate: string;
  lastReviewedAt?: string;
  word: Word;
}

interface ProgressCounts {
  due: number;
  learning: number;
  mastered: number;
  new: number;
  total: number;
}

type StatusFilter = 'all' | 'due' | 'learning' | 'mastered' | 'new';

export default function ProgressPage() {
  const [counts, setCounts] = useState<ProgressCounts>({ due: 0, learning: 0, mastered: 0, new: 0, total: 0 });
  const [cards, setCards] = useState<SRSCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // IA Modal state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTargetData, setAiTargetData] = useState<any>(null);

  const handleOpenAiModal = (character: string, pinyin: string, meaning: string) => {
    setAiTargetData({ character, pinyin, meaning, contextType: 'word' });
    setAiModalOpen(true);
  };

  // Charger les favoris pour afficher l'étoile
  useEffect(() => {
    fetch('/api/favorites?type=word')
      .then((res) => res.json())
      .then((d) => {
        const ids = new Set<string>((d.favorites || []).map((f: any) => f.wordId).filter(Boolean));
        setFavoriteIds(ids);
      })
      .catch(() => {});
  }, []);

  // Fetch les cartes SRS selon les filtres
  const fetchProgressData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedLevel !== 'all') params.append('level', selectedLevel);
    if (selectedStatus !== 'all') params.append('status', selectedStatus);

    fetch(`/api/progress?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.counts) setCounts(data.counts);
        setCards(data.cards || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erreur de chargement de la progression :', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProgressData();
  }, [selectedStatus, selectedLevel]);

  // Helper statut SRS formaté pour l'UI
  const getSRSBadgeInfo = (card: SRSCardItem) => {
    const isDue = new Date(card.nextReviewDate) <= new Date();
    if (isDue) {
      return { label: '⏰ À réviser', class: 'badge-hsk2', color: '#f59e0b' };
    }
    if (card.status === 'MASTERED' || card.interval >= 21) {
      return { label: `🏆 Maîtrisé (${card.interval}j)`, class: 'badge-streak', color: '#10b981' };
    }
    if (card.status === 'NEW' && card.repetition === 0) {
      return { label: '🆕 Nouveau', class: 'badge-hsk1', color: '#06b6d4' };
    }
    return { label: `🧠 En cours (${card.interval}j)`, class: 'badge-hsk3', color: '#8b5cf6' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <AIModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} targetData={aiTargetData} />

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          📈 Progression & Statuts du Moteur SRS
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Visualisez l'état d'assimilation de votre vocabulaire chinois selon l'algorithme SM-2, classé par statut d'ancrage en mémoire.
        </p>
      </div>

      {/* Cartes résumé cliquables */}
      <div className="grid-3">
        {/* À réviser */}
        <div
          className="card"
          style={{
            cursor: 'pointer',
            border: selectedStatus === 'due' ? '2px solid var(--accent-amber)' : '1px solid var(--border-color)',
            background: selectedStatus === 'due' ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-card)',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setSelectedStatus(selectedStatus === 'due' ? 'all' : 'due')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>⏰ À réviser aujourd'hui</span>
            <span className="badge badge-hsk2">{counts.due}</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--accent-amber)', marginTop: '0.25rem' }}>
            {counts.due}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Cartes dont la date de révision est due
          </p>
        </div>

        {/* En cours */}
        <div
          className="card"
          style={{
            cursor: 'pointer',
            border: selectedStatus === 'learning' ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
            background: selectedStatus === 'learning' ? 'rgba(139, 92, 246, 0.12)' : 'var(--bg-card)',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setSelectedStatus(selectedStatus === 'learning' ? 'all' : 'learning')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>🧠 En cours d'apprentissage</span>
            <span className="badge badge-hsk3">{counts.learning}</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--accent-purple)', marginTop: '0.25rem' }}>
            {counts.learning}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Mots étudiés (intervalle &lt; 21 jours)
          </p>
        </div>

        {/* Maîtrisés */}
        <div
          className="card"
          style={{
            cursor: 'pointer',
            border: selectedStatus === 'mastered' ? '2px solid var(--accent-emerald)' : '1px solid var(--border-color)',
            background: selectedStatus === 'mastered' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setSelectedStatus(selectedStatus === 'mastered' ? 'all' : 'mastered')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>🏆 Mots Maîtrisés</span>
            <span className="badge badge-streak">{counts.mastered}</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '0.25rem' }}>
            {counts.mastered}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Mots ancrés à long terme (intervalle &ge; 21j)
          </p>
        </div>
      </div>

      {/* Barre de Filtres par Statut et Niveau HSK */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Filtre par Statut */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Statut SRS :
          </span>
          {([
            ['all', `Tous (${counts.total})`],
            ['due', `⏰ À réviser (${counts.due})`],
            ['learning', `🧠 En cours (${counts.learning})`],
            ['mastered', `🏆 Maîtrisés (${counts.mastered})`],
            ['new', `🆕 Nouveaux (${counts.new})`],
          ] as [StatusFilter, string][]).map(([st, label]) => (
            <button
              key={st}
              className={`btn ${selectedStatus === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', opacity: selectedStatus === st ? 1 : 0.6 }}
              onClick={() => setSelectedStatus(st)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filtre par Niveau HSK */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Niveau HSK :</span>
            {['all', '1', '2', '3'].map((lvl) => (
              <button
                key={lvl}
                className={`badge ${selectedLevel === lvl ? 'badge-streak' : 'badge-hsk1'}`}
                style={{ cursor: 'pointer', padding: '0.3rem 0.75rem', opacity: selectedLevel === lvl ? 1 : 0.6 }}
                onClick={() => setSelectedLevel(lvl)}
              >
                {lvl === 'all' ? 'Tous les niveaux' : `HSK ${lvl}`}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {cards.length} mot{cards.length > 1 ? 's' : ''} affiché{cards.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Grille des cartes de mots */}
      {loading ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
          Chargement des mots et statuts SRS...
        </p>
      ) : cards.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            Aucun mot dans cette catégorie
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
            Aucun mot ne correspond aux filtres sélectionnés. Modifiez les filtres pour voir d'autres catégories.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {cards.map((card) => {
            const w = card.word;
            const srsBadge = getSRSBadgeInfo(card);

            return (
              <div key={card.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  {/* En-tête : Caractère + Pinyin + Badges HSK & SRS */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span className="cn-text" style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginRight: '0.5rem' }}>
                        {w.character}
                      </span>
                      <span style={{ color: 'var(--accent-cyan)', fontSize: '1.1rem', fontWeight: 500 }}>
                        {w.pinyin}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FavoriteButton
                          itemId={w.id}
                          itemType="word"
                          isFavorite={favoriteIds.has(w.id)}
                          onToggle={(newState) => {
                            setFavoriteIds((prev) => {
                              const next = new Set(prev);
                              if (newState) next.add(w.id); else next.delete(w.id);
                              return next;
                            });
                          }}
                        />
                        <span className={`badge badge-hsk${w.hskLevel}`}>HSK {w.hskLevel}</span>
                      </div>
                      <span className={`badge ${srsBadge.class}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                        {srsBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Sens */}
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f3f4f6', marginBottom: '0.5rem' }}>
                    {w.meaning}
                  </div>

                  {/* Catégorie */}
                  {w.category && (
                    <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', color: 'var(--text-muted)' }}>
                      {w.category}
                    </span>
                  )}

                  {/* Phrase exemple */}
                  {w.exampleSentence && (
                    <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '0.5rem', marginTop: '0.75rem', border: '1px solid var(--border-color)' }}>
                      <div className="cn-text" style={{ color: 'var(--accent-cyan)', fontSize: '1rem', fontWeight: 600 }}>
                        {w.exampleSentence}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {w.examplePinyin}
                      </div>
                      <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        « {w.exampleTranslation} »
                      </div>
                    </div>
                  )}
                </div>

                {/* Pied de carte : Actions Audio + IA */}
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleOpenAiModal(w.character, w.pinyin, w.meaning)}
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem', borderColor: 'rgba(6, 182, 212, 0.4)', color: 'var(--accent-cyan)' }}
                  >
                    💡 Expliquer avec l'IA
                  </button>
                  <button className="btn-audio" onClick={() => speakChinese(w.character)}>
                    🔊 Prononcer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
