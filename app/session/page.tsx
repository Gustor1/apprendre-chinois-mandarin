'use client';

import { useEffect, useState } from 'react';
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
    exampleSentence?: string;
    examplePinyin?: string;
    exampleTranslation?: string;
  };
}

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

export default function DailySessionPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes = 900 secondes

  const [reviewCards, setReviewCards] = useState<SRSCard[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const [grammar, setGrammar] = useState<GrammarStructure | null>(null);
  const [newCards, setNewCards] = useState<SRSCard[]>([]);

  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [wordsReviewedCount, setWordsReviewedCount] = useState(0);

  // Minuteur de la session
  useEffect(() => {
    if (sessionCompleted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionCompleted]);

  // Chargement des données de session
  useEffect(() => {
    fetch('/api/session/daily')
      .then((res) => res.json())
      .then((d) => {
        setReviewCards(d.reviewCards || []);
        setGrammar(d.grammarOfTheDay || null);
        setNewCards(d.newCards || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleReviewRating = async (quality: number) => {
    const currentCard = reviewCards[currentReviewIndex];
    if (!currentCard) return;

    try {
      await fetch('/api/srs/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: currentCard.id, quality }),
      });
    } catch (err) {
      console.error(err);
    }

    setWordsReviewedCount((prev) => prev + 1);
    setShowAnswer(false);

    if (currentReviewIndex + 1 < reviewCards.length) {
      setCurrentReviewIndex((prev) => prev + 1);
    } else {
      // Étape 1 terminée -> passer à l'Étape 2 (Grammaire)
      setStep(2);
    }
  };

  const handleCompleteSession = async () => {
    try {
      await fetch('/api/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationSeconds: 900 - timeLeft,
          wordsReviewed: wordsReviewedCount,
          wordsLearned: newCards.length,
        }),
      });
      setSessionCompleted(true);
      setStep(5);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Préparation de votre session de 15 minutes...</p>
      </div>
    );
  }

  const currentCard = reviewCards[currentReviewIndex];

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* En-tête de session & Timer */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          background: 'linear-gradient(90deg, #131b2e, #1c2742)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>Session Quotidienne</span>
          <span className="badge badge-streak">Étape {step} / 4</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Étape 1 : Révisions SRS */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Étape 1 : Révisions SRS du jour</h2>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Carte {reviewCards.length > 0 ? currentReviewIndex + 1 : 0} sur {reviewCards.length}
            </span>
          </div>

          {reviewCards.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>🎉 Aucune carteSRS due aujourd'hui !</p>
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Passer à l'Étape 2 (Grammaire) ➔
              </button>
            </div>
          ) : (
            currentCard && (
              <div>
                <div
                  className="flashcard"
                  onClick={() => {
                    setShowAnswer(true);
                    speakChinese(currentCard.word.character);
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span className={`badge badge-hsk${currentCard.word.hskLevel}`}>HSK {currentCard.word.hskLevel}</span>
                  </div>
                  <div className="flashcard-character">{currentCard.word.character}</div>
                  <div className="flashcard-pinyin">{currentCard.word.pinyin}</div>

                  <button
                    className="btn-audio"
                    style={{ marginBottom: '1rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      speakChinese(currentCard.word.character);
                    }}
                  >
                    🔊 Écouter la prononciation
                  </button>

                  {showAnswer ? (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', width: '100%' }}>
                      <div className="flashcard-meaning" style={{ fontWeight: 600, color: '#fff', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
                        {currentCard.word.meaning}
                      </div>

                      {currentCard.word.exampleSentence && (
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '0.5rem', marginTop: '0.75rem', fontSize: '0.95rem' }}>
                          <div className="cn-text" style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>
                            {currentCard.word.exampleSentence}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            {currentCard.word.examplePinyin}
                          </div>
                          <div style={{ fontStyle: 'italic', marginTop: '0.2rem' }}>
                            « {currentCard.word.exampleTranslation} »
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>
                      👉 Cliquez sur la carte pour révéler le sens
                    </p>
                  )}
                </div>

                {showAnswer && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                    <button className="btn" style={{ background: '#7f1d1d', color: '#fca5a5' }} onClick={() => handleReviewRating(1)}>
                      🔴 Difficile
                    </button>
                    <button className="btn" style={{ background: '#78350f', color: '#fde68a' }} onClick={() => handleReviewRating(3)}>
                      🟡 Moyen
                    </button>
                    <button className="btn" style={{ background: '#064e3b', color: '#6ee7b7' }} onClick={() => handleReviewRating(5)}>
                      🟢 Facile
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* Étape 2 : Structure Grammaticale */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2>Étape 2 : Structure de Phrase du Jour</h2>

          {grammar ? (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-hsk2">Structure HSK {grammar.hskLevel}</span>
                <button className="btn-audio" onClick={() => speakChinese(grammar.exampleSentence)}>
                  🔊 Écouter l'exemple
                </button>
              </div>

              <h3 style={{ fontSize: '1.4rem', color: 'var(--accent-cyan)' }}>{grammar.title}</h3>

              <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '0.75rem', fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--accent-amber)' }}>
                {grammar.pattern}
              </div>

              <p style={{ color: 'var(--text-secondary)' }}>{grammar.explanation}</p>

              <div style={{ background: 'rgba(6, 182, 212, 0.08)', borderLeft: '4px solid var(--accent-cyan)', padding: '1rem', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Exemple en contexte :
                </div>
                <div className="cn-text" style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                  {grammar.exampleSentence}
                </div>
                <div style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>{grammar.examplePinyin}</div>
                <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  « {grammar.exampleTranslation} »
                </div>
              </div>

              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setStep(3)}>
                Découvrir le vocabulaire du jour ➔
              </button>
            </div>
          ) : (
            <p>Pas de structure disponible.</p>
          )}
        </div>
      )}

      {/* Étape 3 : Nouveaux Mots */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2>Étape 3 : Vocabulaire du Jour ("Sentence Mining")</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Découvrez ces 3 nouveaux mots directement au sein de phrases modèles.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {newCards.map((card) => (
              <div key={card.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                    <span className="cn-text" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>
                      {card.word.character}
                    </span>
                    <span style={{ color: 'var(--accent-cyan)', fontSize: '1.1rem', fontWeight: 500 }}>
                      {card.word.pinyin}
                    </span>
                    <span className={`badge badge-hsk${card.word.hskLevel}`}>HSK {card.word.hskLevel}</span>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>{card.word.meaning}</span>
                  </div>

                  {card.word.exampleSentence && (
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                      <span className="cn-text" style={{ color: '#fff' }}>{card.word.exampleSentence}</span> — « {card.word.exampleTranslation} »
                    </div>
                  )}
                </div>

                <button className="btn-audio" onClick={() => speakChinese(card.word.exampleSentence || card.word.character)}>
                  🔊 Écouter
                </button>
              </div>
            ))}
          </div>

          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setStep(4)}>
            Passer au Shadowing Oral ➔
          </button>
        </div>
      )}

      {/* Étape 4 : Shadowing Oral */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2>Étape 4 : Shadowing & Pratique Orale</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Écoutez l'extrait audio et répétez à voix haute immédiatement après en imitant la diction et les tons.
          </p>

          {grammar && (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div className="cn-text" style={{ fontSize: '2.2rem', fontWeight: 700, color: '#fff' }}>
                {grammar.exampleSentence}
              </div>
              <div style={{ fontSize: '1.2rem', color: 'var(--accent-cyan)' }}>
                {grammar.examplePinyin}
              </div>
              <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                « {grammar.exampleTranslation} »
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => speakChinese(grammar.exampleSentence, 0.65)}>
                  🐢 Écoute Lente (0.65x)
                </button>
                <button className="btn btn-primary" onClick={() => speakChinese(grammar.exampleSentence, 0.9)}>
                  🔊 Écoute Normale (0.9x)
                </button>
              </div>
            </div>
          )}

          <button className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }} onClick={handleCompleteSession}>
            ✅ Valider & Terminer la Session du Jour
          </button>
        </div>
      )}

      {/* Étape 5 : Bilan */}
      {step === 5 && sessionCompleted && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ fontSize: '4rem' }}>🎉</div>
          <h1 style={{ fontSize: '2rem', color: 'var(--accent-emerald)' }}>
            Session quotidienne terminée !
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '450px' }}>
            Félicitations pour vos 15 minutes de pratique. Votre série (streak) et vos statistiques SRS ont été mises à jour.
          </p>

          <div style={{ display: 'flex', gap: '2rem', margin: '1rem 0' }}>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {wordsReviewedCount}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mots révisés</div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {newCards.length}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nouveaux mots</div>
            </div>
          </div>

          <Link href="/" className="btn btn-primary">
            Retour au Tableau de Bord ➔
          </Link>
        </div>
      )}
    </div>
  );
}
