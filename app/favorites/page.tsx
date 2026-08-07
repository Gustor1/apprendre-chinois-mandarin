'use client';

import { useEffect, useState } from 'react';
import { speakChinese } from '@/lib/audio';
import FavoriteButton from '@/components/FavoriteButton';
import Link from 'next/link';

interface FavoriteItem {
  id: string;
  wordId: string | null;
  grammarStructureId: string | null;
  conversationalItemId: string | null;
  createdAt: string;
  word?: {
    id: string;
    character: string;
    pinyin: string;
    meaning: string;
    hskLevel: number;
    category?: string;
    exampleSentence?: string;
    examplePinyin?: string;
    exampleTranslation?: string;
  };
  grammarStructure?: {
    id: string;
    title: string;
    hskLevel: number;
    pattern: string;
    explanation: string;
    exampleSentence: string;
    examplePinyin: string;
    exampleTranslation: string;
  };
  conversationalItem?: {
    id: string;
    type: string;
    title: string;
    spokenForm?: string;
    standardForm?: string;
    pattern?: string;
    meaning: string;
    explanation?: string;
    theme: string;
    hskLevel: number;
    exampleSentence: string;
    examplePinyin: string;
    exampleTranslation: string;
  };
}

interface Flashcard {
  favoriteId: string;
  type: 'word' | 'grammar' | 'conversational';
  id: string;
  cardId: string | null;
  title: string;
  character: string;
  pinyin: string;
  meaning: string;
  pattern: string | null;
  hskLevel: number;
  category: string;
  explanation: string | null;
  exampleSentence: string | null;
  examplePinyin: string | null;
  exampleTranslation: string | null;
}

type FilterType = 'all' | 'word' | 'grammar' | 'conversational';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Mode Réviser mes favoris (Flashcards)
  const [inPracticeMode, setInPracticeMode] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);

  // Statistiques de la session
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [ratingsCount, setRatingsCount] = useState({ again: 0, hard: 0, easy: 0 });

  const fetchFavorites = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType !== 'all') params.append('type', filterType);
    if (filterLevel !== 'all') params.append('level', filterLevel);
    params.append('sort', sortOrder);

    fetch(`/api/favorites?${params.toString()}`)
      .then((res) => res.json())
      .then((d) => {
        setFavorites(d.favorites || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFavorites();
  }, [filterType, filterLevel, sortOrder]);

  // Minuteur de session favoris
  useEffect(() => {
    if (!inPracticeMode || sessionFinished || practiceLoading) return;
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [inPracticeMode, sessionFinished, practiceLoading, startTime]);

  // Lancer la session de révision des favoris
  const startFavoritesPractice = () => {
    setPracticeLoading(true);
    const params = new URLSearchParams();
    if (filterType !== 'all') params.append('type', filterType);
    if (filterLevel !== 'all') params.append('level', filterLevel);

    fetch(`/api/session/favorites?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setCards(data.cards || []);
        setCurrentIndex(0);
        setShowAnswer(false);
        setSessionFinished(false);
        setStartTime(Date.now());
        setElapsedSeconds(0);
        setRatingsCount({ again: 0, hard: 0, easy: 0 });
        setInPracticeMode(true);
        setPracticeLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setPracticeLoading(false);
      });
  };

  // Prononcer le caractère à l'apparition de chaque carte
  useEffect(() => {
    if (inPracticeMode && cards.length > 0 && currentIndex < cards.length && !sessionFinished) {
      const card = cards[currentIndex];
      if (card.character) {
        speakChinese(card.character);
      }
    }
  }, [inPracticeMode, currentIndex, cards, sessionFinished]);

  // Gestion des notes SM-2
  const handleRating = async (quality: number) => {
    const card = cards[currentIndex];
    if (!card) return;

    if (quality < 3) {
      setRatingsCount((prev) => ({ ...prev, again: prev.again + 1 }));
    } else if (quality === 3) {
      setRatingsCount((prev) => ({ ...prev, hard: prev.hard + 1 }));
    } else {
      setRatingsCount((prev) => ({ ...prev, easy: prev.easy + 1 }));
    }

    // Si la carte a une carte SRS associée (mot)
    if (card.cardId) {
      fetch('/api/srs/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.cardId, quality }),
      }).catch((err) => console.error('Erreur SRS :', err));
    }

    // Si expression conversationnelle
    if (card.type === 'conversational' && quality >= 3) {
      fetch('/api/conversational', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: card.id }),
      }).catch((err) => console.error('Erreur SRS :', err));
    }

    setShowAnswer(false);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishPracticeSession();
    }
  };

  const finishPracticeSession = async () => {
    setSessionFinished(true);
    const finalDuration = Math.floor((Date.now() - startTime) / 1000);

    try {
      await fetch('/api/session/free-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationSeconds: finalDuration,
          wordsReviewed: cards.length,
          level: filterLevel === 'all' ? 1 : parseInt(filterLevel, 10),
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const handleRemoveFavorite = (fav: FavoriteItem) => {
    setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
  };

  const getItemType = (fav: FavoriteItem): 'word' | 'grammar' | 'conversational' => {
    if (fav.wordId) return 'word';
    if (fav.grammarStructureId) return 'grammar';
    return 'conversational';
  };

  const getItemId = (fav: FavoriteItem): string => {
    return fav.wordId || fav.grammarStructureId || fav.conversationalItemId || '';
  };

  const getHskLevel = (fav: FavoriteItem): number => {
    if (fav.word) return fav.word.hskLevel;
    if (fav.grammarStructure) return fav.grammarStructure.hskLevel;
    if (fav.conversationalItem) return fav.conversationalItem.hskLevel;
    return 0;
  };

  const wordCount = favorites.filter((f) => f.wordId).length;
  const grammarCount = favorites.filter((f) => f.grammarStructureId).length;
  const convCount = favorites.filter((f) => f.conversationalItemId).length;

  // -------------------------------------------------------------
  // VUE MODE RÉVISION FLASHCARDS DES FAVORIS
  // -------------------------------------------------------------
  if (inPracticeMode) {
    if (practiceLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
          Chargement de votre session favoris...
        </div>
      );
    }

    if (cards.length === 0) {
      return (
        <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', padding: '2.5rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Aucun favori à réviser</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Aucun favori ne correspond à vos filtres actuels.
          </p>
          <button className="btn btn-primary" onClick={() => setInPracticeMode(false)}>
            ↩ Retour à la liste des favoris
          </button>
        </div>
      );
    }

    if (sessionFinished) {
      return (
        <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', padding: '2.5rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
            Révision des Favoris Terminée !
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Vous avez révisé vos <strong>{cards.length} favoris</strong> avec succès.
          </p>

          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Temps d'étude</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {formatTimer(elapsedSeconds)}
              </div>
            </div>

            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Faciles / Bons</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {ratingsCount.easy}
              </div>
            </div>

            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>À revoir / Difficile</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                {ratingsCount.again + ratingsCount.hard}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={startFavoritesPractice}>
              🔄 Recommencer cette session
            </button>
            <button className="btn btn-secondary" onClick={() => setInPracticeMode(false)}>
              ⭐ Liste des favoris
            </button>
            <Link href="/" className="btn btn-secondary">
              🏠 Dashboard
            </Link>
          </div>
        </div>
      );
    }

    const card = cards[currentIndex];
    const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '650px', margin: '0 auto' }}>
        {/* Header & Compteur de progression */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => setInPracticeMode(false)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              ✕ Quitter
            </button>
            <span className="badge badge-streak">
              ⭐ Révision Favoris ({currentIndex + 1}/{cards.length})
            </span>
          </div>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ⏱️ {formatTimer(elapsedSeconds)}
          </span>
        </div>

        {/* Barre de progression */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            <span>Compteur de révision</span>
            <span style={{ fontWeight: 600, color: '#fff' }}>
              {currentIndex + 1} / {cards.length} favoris révisés ({progressPercent}%)
            </span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Carte Flashcard */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '2.5rem 1.5rem',
            minHeight: '340px',
            justifyContent: 'space-between',
          }}
        >
          {/* Header de la carte */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className={`badge badge-hsk${card.hskLevel}`}>HSK {card.hskLevel}</span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', color: 'var(--text-muted)' }}>
                {card.category}
              </span>
            </div>

            <button className="btn-audio" onClick={() => card.character && speakChinese(card.character)}>
              🔊 Écouter
            </button>
          </div>

          {/* Caractère / Patron / Titre principal */}
          <div style={{ margin: '1.5rem 0' }}>
            <div className="cn-text" style={{ fontSize: card.character.length > 8 ? '2.2rem' : '3.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
              {card.character}
            </div>
            {card.pinyin && (
              <div style={{ fontSize: '1.3rem', color: 'var(--accent-cyan)', fontWeight: 500 }}>
                {card.pinyin}
              </div>
            )}
            {card.type === 'grammar' && (
              <div style={{ fontSize: '1.1rem', color: 'var(--accent-purple)', fontWeight: 600, marginTop: '0.25rem' }}>
                {card.title}
              </div>
            )}
          </div>

          {/* Bouton Révéler / Verso Révélé */}
          {!showAnswer ? (
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '1rem' }}
              onClick={() => setShowAnswer(true)}
            >
              👁️ Afficher la réponse
            </button>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Définition et Explication */}
              <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', textAlign: 'left' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>
                  💡 {card.meaning}
                </div>

                {card.explanation && (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {card.explanation}
                  </p>
                )}

                {card.exampleSentence && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <div className="cn-text" style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem', fontWeight: 600 }}>
                      {card.exampleSentence}
                    </div>
                    {card.examplePinyin && (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {card.examplePinyin}
                      </div>
                    )}
                    {card.exampleTranslation && (
                      <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        « {card.exampleTranslation} »
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Évaluation SRS SM-2 */}
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Évaluez votre mémorisation (Moteur SRS) :
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  <button
                    className="btn"
                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}
                    onClick={() => handleRating(1)}
                  >
                    🔴 À revoir
                  </button>
                  <button
                    className="btn"
                    style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}
                    onClick={() => handleRating(3)}
                  >
                    🟠 Difficile
                  </button>
                  <button
                    className="btn"
                    style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}
                    onClick={() => handleRating(5)}
                  >
                    🟢 Bon / Facile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VUE NORMALE LISTE DES FAVORIS
  // -------------------------------------------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
            ⭐ Mes Favoris
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Retrouvez tous les éléments que vous avez marqués comme favoris, tous types confondus.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={startFavoritesPractice}
          disabled={favorites.length === 0}
          style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
        >
          ⚡ Réviser mes favoris ({favorites.length})
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid-3">
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{wordCount}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📚 Mots</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-purple)' }}>{grammarCount}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>🧩 Grammaire</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>{convCount}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>🗣️ Expressions</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Filtre par type */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Type :
          </span>
          {([['all', `Tous (${favorites.length})`], ['word', `📚 Mots (${wordCount})`], ['grammar', `🧩 Grammaire (${grammarCount})`], ['conversational', `🗣️ Expressions (${convCount})`]] as [FilterType, string][]).map(
            ([type, label]) => (
              <button
                key={type}
                className={`btn ${filterType === type ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', opacity: filterType === type ? 1 : 0.6 }}
                onClick={() => setFilterType(type)}
              >
                {label}
              </button>
            )
          )}
        </div>

        {/* Filtre par niveau HSK + Tri */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Niveau HSK :</span>
            {['all', '1', '2', '3'].map((lvl) => (
              <button
                key={lvl}
                className={`badge ${filterLevel === lvl ? 'badge-streak' : 'badge-hsk1'}`}
                style={{ cursor: 'pointer', padding: '0.3rem 0.75rem', opacity: filterLevel === lvl ? 1 : 0.6 }}
                onClick={() => setFilterLevel(lvl)}
              >
                {lvl === 'all' ? 'Tous' : `HSK ${lvl}`}
              </button>
            ))}
          </div>

          <button
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
            onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
          >
            {sortOrder === 'newest' ? '📅 Plus récents d\'abord ↓' : '📅 Plus anciens d\'abord ↑'}
          </button>
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
          Chargement de vos favoris...
        </p>
      ) : favorites.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            Aucun favori pour le moment
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
            Explorez le vocabulaire, la grammaire ou les expressions quotidiennes et cliquez sur l'étoile ☆ pour ajouter des éléments à vos favoris.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {favorites.map((fav) => {
            const itemType = getItemType(fav);
            const itemId = getItemId(fav);
            const hskLevel = getHskLevel(fav);

            // Carte MOT
            if (fav.word) {
              const w = fav.word;
              return (
                <div key={fav.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <span className="cn-text" style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginRight: '0.5rem' }}>
                          {w.character}
                        </span>
                        <span style={{ color: 'var(--accent-cyan)', fontSize: '1.1rem', fontWeight: 500 }}>
                          {w.pinyin}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FavoriteButton
                          itemId={itemId}
                          itemType={itemType}
                          isFavorite={true}
                          onToggle={(newState) => { if (!newState) handleRemoveFavorite(fav); }}
                        />
                        <span className={`badge badge-hsk${hskLevel}`}>HSK {hskLevel}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f3f4f6', marginBottom: '0.5rem' }}>
                      {w.meaning}
                    </div>
                    {w.category && (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', color: 'var(--text-muted)' }}>
                        📚 Mot · {w.category}
                      </span>
                    )}
                    {w.exampleSentence && (
                      <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '0.5rem', marginTop: '0.75rem', border: '1px solid var(--border-color)' }}>
                        <div className="cn-text" style={{ color: 'var(--accent-cyan)', fontSize: '1rem', fontWeight: 600 }}>{w.exampleSentence}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{w.examplePinyin}</div>
                        <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>« {w.exampleTranslation} »</div>
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn-audio" onClick={() => speakChinese(w.character)}>
                      🔊 Prononcer
                    </button>
                  </div>
                </div>
              );
            }

            // Carte GRAMMAIRE
            if (fav.grammarStructure) {
              const g = fav.grammarStructure;
              return (
                <div key={fav.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>{g.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FavoriteButton
                          itemId={itemId}
                          itemType={itemType}
                          isFavorite={true}
                          onToggle={(newState) => { if (!newState) handleRemoveFavorite(fav); }}
                        />
                        <span className={`badge badge-hsk${hskLevel}`}>HSK {hskLevel}</span>
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-main)', padding: '0.65rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--accent-cyan)', fontWeight: 500 }}>
                      📐 Patron : {g.pattern}
                    </div>
                    <span style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.75rem', background: 'rgba(139,92,246,0.12)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', color: 'var(--accent-purple)' }}>
                      🧩 Structure grammaticale
                    </span>
                  </div>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{g.explanation}</p>
                  <div style={{ background: 'var(--bg-main)', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div className="cn-text" style={{ fontSize: '1.15rem', fontWeight: 600, color: '#fff' }}>{g.exampleSentence}</div>
                    <div style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>{g.examplePinyin}</div>
                    <div style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-muted)' }}>« {g.exampleTranslation} »</div>
                    <button className="btn-audio" onClick={() => speakChinese(g.exampleSentence)} style={{ alignSelf: 'flex-end', marginTop: '0.5rem' }}>
                      🔊 Prononcer l'exemple
                    </button>
                  </div>
                </div>
              );
            }

            // Carte EXPRESSION CONVERSATIONNELLE
            if (fav.conversationalItem) {
              const c = fav.conversationalItem;
              return (
                <div key={fav.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                      <span className={`badge ${c.type === 'CONNECTOR' ? 'badge-hsk1' : 'badge-hsk2'}`}>
                        {c.type === 'CONNECTOR' ? '🔗 Connecteur' : '💬 Expression'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FavoriteButton
                          itemId={itemId}
                          itemType={itemType}
                          isFavorite={true}
                          onToggle={(newState) => { if (!newState) handleRemoveFavorite(fav); }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-main)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                          {c.theme}
                        </span>
                      </div>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{c.title}</h3>
                    {c.pattern && (
                      <div style={{ background: 'var(--bg-main)', padding: '0.65rem 1rem', borderRadius: '0.6rem', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '0.75rem' }}>
                        📐 Patron : {c.pattern}
                      </div>
                    )}
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '0.4rem' }}>
                      💡 {c.meaning}
                    </div>
                    {c.explanation && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{c.explanation}</p>
                    )}
                    <span style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.75rem', background: 'rgba(16,185,129,0.12)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', color: 'var(--accent-emerald)' }}>
                      🗣️ Chinois Quotidien
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--bg-main)', padding: '0.85rem 1rem', borderRadius: '0.6rem', border: '1px solid var(--border-color)' }}>
                      <div className="cn-text" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>{c.exampleSentence}</div>
                      <div style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>{c.examplePinyin}</div>
                      <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)' }}>« {c.exampleTranslation} »</div>
                    </div>
                    <button className="btn-audio" onClick={() => speakChinese(c.exampleSentence)} style={{ alignSelf: 'flex-end' }}>
                      🔊 Écouter
                    </button>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}
