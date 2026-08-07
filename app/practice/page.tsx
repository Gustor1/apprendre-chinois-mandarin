'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { speakChinese } from '@/lib/audio';
import Link from 'next/link';

interface SRSCard {
  id: string;
  word: {
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
}

function PracticeContent() {
  const searchParams = useSearchParams();
  const levelQuery = searchParams.get('level');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(
    levelQuery ? parseInt(levelQuery, 10) : null
  );

  const [cards, setCards] = useState<SRSCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);

  // Statistiques de la session en cours
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [ratingsCount, setRatingsCount] = useState<{ again: number; hard: number; easy: number }>({
    again: 0,
    hard: 0,
    easy: 0,
  });

  // Totaux dynamiques par niveau HSK
  const [hskTotals, setHskTotals] = useState<{ hsk1: number; hsk2: number; hsk3: number }>({
    hsk1: 307,
    hsk2: 199,
    hsk3: 473,
  });

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.hskStats) {
          setHskTotals({
            hsk1: data.hskStats.hsk1?.total || 307,
            hsk2: data.hskStats.hsk2?.total || 199,
            hsk3: data.hskStats.hsk3?.total || 473,
          });
        }
      })
      .catch((err) => console.error('Erreur de chargement des totaux HSK :', err));
  }, []);

  // Minuteur d'étude
  useEffect(() => {
    if (!selectedLevel || sessionFinished || loading) return;
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedLevel, sessionFinished, loading, startTime]);

  // Chargement des cartes pour le niveau sélectionné
  const loadCards = (lvl: number) => {
    setSelectedLevel(lvl);
    setLoading(true);
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionFinished(false);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setRatingsCount({ again: 0, hard: 0, easy: 0 });

    fetch(`/api/session/free?level=${lvl}`)
      .then((res) => res.json())
      .then((data) => {
        setCards(data.cards || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (levelQuery) {
      const lvl = parseInt(levelQuery, 10);
      if ([1, 2, 3].includes(lvl)) {
        loadCards(lvl);
      }
    }
  }, [levelQuery]);

  // Prononcer automatiquement le caractère lorsqu'une carte apparaît
  useEffect(() => {
    if (cards.length > 0 && currentIndex < cards.length && !sessionFinished) {
      speakChinese(cards[currentIndex].word.character);
    }
  }, [currentIndex, cards, sessionFinished]);

  const handleRating = async (quality: number) => {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    // Compter la note
    if (quality < 3) {
      setRatingsCount((prev) => ({ ...prev, again: prev.again + 1 }));
    } else if (quality === 3) {
      setRatingsCount((prev) => ({ ...prev, hard: prev.hard + 1 }));
    } else {
      setRatingsCount((prev) => ({ ...prev, easy: prev.easy + 1 }));
    }

    // Mettre à jour le moteur SRS en arrière-plan
    fetch('/api/srs/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: currentCard.id, quality }),
    }).catch((err) => console.error(err));

    setShowAnswer(false);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishFreeSession();
    }
  };

  const finishFreeSession = async () => {
    setSessionFinished(true);
    const finalDuration = Math.floor((Date.now() - startTime) / 1000);

    // Enregistrer le temps et les révisions sans altérer le streak
    try {
      await fetch('/api/session/free-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationSeconds: finalDuration,
          wordsReviewed: cards.length,
          level: selectedLevel,
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

  // Écran 1 : Sélection du niveau si aucun niveau sélectionné
  if (!selectedLevel) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            ⚡ Révision Libre par Niveau HSK
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Révisez les flashcards de tout un niveau HSK à votre propre rythme, hors de la routine quotidienne.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {/* Card HSK 1 */}
          <div
            className="card"
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'pointer', border: '1px solid var(--border-color)' }}
            onClick={() => loadCards(1)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-hsk1">HSK 1</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{hskTotals.hsk1} mots</span>
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Réviser tout HSK 1</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Fondations & vocabulaire de base (salutations, chiffres, verbes essentiels).
              </p>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 'auto' }}>
              ▶ Démarrer HSK 1
            </button>
          </div>

          {/* Card HSK 2 */}
          <div
            className="card"
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'pointer', border: '1px solid var(--border-color)' }}
            onClick={() => loadCards(2)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-hsk2">HSK 2</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{hskTotals.hsk2} mots</span>
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Réviser tout HSK 2</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Niveau débutant avancé (expressions pratiques, lieux, météo, vie quotidienne).
              </p>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 'auto' }}>
              ▶ Démarrer HSK 2
            </button>
          </div>

          {/* Card HSK 3 */}
          <div
            className="card"
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'pointer', border: '1px solid var(--border-color)' }}
            onClick={() => loadCards(3)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-hsk3">HSK 3</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{hskTotals.hsk3} mots</span>
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Réviser tout HSK 3</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Niveau intermédiaire (vocabulaire de conversation autonome).
              </p>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 'auto' }}>
              ▶ Démarrer HSK 3
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chargement
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Chargement des cartes HSK {selectedLevel}...</p>
      </div>
    );
  }

  // Bilan de fin de session libre
  if (sessionFinished) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', padding: '2.5rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          Révision HSK {selectedLevel} Terminée !
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Vous avez révisé l'ensemble des <strong>{cards.length} mots</strong> du niveau HSK {selectedLevel}.
        </p>

        <div className="grid-3" style={{ marginBottom: '2rem' }}>
          <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Temps d'étude</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {formatTimer(elapsedSeconds)}
            </div>
          </div>

          <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mots faciles</div>
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
          <button className="btn btn-primary" onClick={() => loadCards(selectedLevel)}>
            🔄 Recommencer HSK {selectedLevel}
          </button>
          <button className="btn btn-secondary" onClick={() => setSelectedLevel(null)}>
            🎯 Autre niveau HSK
          </button>
          <Link href="/" className="btn btn-secondary">
            🏠 Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  if (!currentCard) return null;

  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '650px', margin: '0 auto' }}>
      {/* Header avec sélecteur & Compteur de progression */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`badge badge-hsk${selectedLevel}`}>HSK {selectedLevel}</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Révision Libre
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ⏱️ {formatTimer(elapsedSeconds)}
          </span>
          <button
            onClick={() => setSelectedLevel(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Changer de niveau
          </button>
        </div>
      </div>

      {/* Barre de progression */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
          <span>Progression</span>
          <span style={{ fontWeight: 600, color: '#fff' }}>
            {currentIndex + 1} / {cards.length} mots ({progressPercent}%)
          </span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Carte Flashcard (Mode Reconnaissance) */}
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
        {/* Catégorie & Audio */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {currentCard.word.category ? (
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', color: 'var(--text-muted)' }}>
              {currentCard.word.category}
            </span>
          ) : <span />}

          <button className="btn-audio" onClick={() => speakChinese(currentCard.word.character)}>
            🔊 Écouter
          </button>
        </div>

        {/* Mot Chinois & Pinyin */}
        <div style={{ margin: '1.5rem 0' }}>
          <div className="cn-text" style={{ fontSize: '3.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem', letterSpacing: '2px' }}>
            {currentCard.word.character}
          </div>
          <div style={{ fontSize: '1.3rem', color: 'var(--accent-cyan)', fontWeight: 500 }}>
            {currentCard.word.pinyin}
          </div>
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
            {/* Définition et Exemple */}
            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', textAlign: 'left' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
                {currentCard.word.meaning}
              </div>

              {currentCard.word.exampleSentence && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                  <div className="cn-text" style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem', fontWeight: 600 }}>
                    {currentCard.word.exampleSentence}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {currentCard.word.examplePinyin}
                  </div>
                  <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    « {currentCard.word.exampleTranslation} »
                  </div>
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

export default function FreePracticePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>Chargement de la révision libre...</div>}>
      <PracticeContent />
    </Suspense>
  );
}
