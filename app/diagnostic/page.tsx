'use client';

import { useEffect, useState } from 'react';
import { speakChinese } from '@/lib/audio';
import Link from 'next/link';

interface DiagnosticQuestion {
  wordId: string;
  character: string;
  pinyin: string;
  hskLevel: number;
  meaning: string;
  options: string[];
  exampleSentence?: string;
  examplePinyin?: string;
  exampleTranslation?: string;
}

export default function DiagnosticPage() {
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [masteredWordIds, setMasteredWordIds] = useState<string[]>([]);
  const [hsk1Correct, setHsk1Correct] = useState(0);
  const [hsk2Correct, setHsk2Correct] = useState(0);

  const [quizFinished, setQuizFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalStats, setFinalStats] = useState<{ hsk1Percent: number; hsk2Percent: number } | null>(null);

  // Prononcer automatiquement le mot quand une nouvelle question apparaît
  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      speakChinese(questions[currentIndex].character);
    }
  }, [currentIndex, questions]);

  useEffect(() => {
    fetch('/api/diagnostic')
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data.questions || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleAnswer = (selectedOption: string | null) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    // L'audio est géré par le useEffect sur currentIndex (pas ici pour éviter le décalage)

    const isCorrect = selectedOption === currentQ.meaning;
    let updatedMastered = masteredWordIds;

    if (isCorrect) {
      updatedMastered = [...masteredWordIds, currentQ.wordId];
      setMasteredWordIds(updatedMastered);

      if (currentQ.hskLevel === 1) setHsk1Correct((prev) => prev + 1);
      if (currentQ.hskLevel === 2) setHsk2Correct((prev) => prev + 1);
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishDiagnostic(updatedMastered);
    }
  };

  const finishDiagnostic = async (validatedIds: string[]) => {
    setSaving(true);
    try {
      console.log('[Diagnostic UI] Soumission des mots maîtrisés :', validatedIds);
      const res = await fetch('/api/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterWordIds: validatedIds }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erreur HTTP ' + res.status);
      }

      const data = await res.json();
      console.log('[Diagnostic UI] Résultats enregistrés avec succès :', data);
      setFinalStats(data.stats);
      setQuizFinished(true);
    } catch (err) {
      console.error('[Diagnostic UI] Erreur lors de l’enregistrement des résultats :', err);
      alert('Impossible d’enregistrer vos résultats de diagnostic. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Préparation de votre test de diagnostic adaptatif...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--accent-red)' }}>Impossible de charger le test de diagnostic.</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* En-tête de diagnostic */}
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>
          🎯 Test de Diagnostic Initial Adaptatif
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Évaluez vos acquis HSK 1-2 pour marquer les mots connus et ajuster votre point de départ SRS.
        </p>
      </div>

      {!quizFinished ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Barre de progression */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Question {currentIndex + 1} sur {questions.length}</span>
              <span className={`badge badge-hsk${currentQ.hskLevel}`}>HSK {currentQ.hskLevel}</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {/* Card de Question */}
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div className="flashcard-character" style={{ fontSize: '4.5rem' }}>
              {currentQ.character}
            </div>
            <div className="flashcard-pinyin" style={{ fontSize: '1.6rem' }}>
              {currentQ.pinyin}
            </div>

            <button className="btn-audio" onClick={() => speakChinese(currentQ.character)}>
              🔊 Prononcer le caractère
            </button>

            <div style={{ width: '100%', marginTop: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Quel est le sens de ce mot ?
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {currentQ.options.map((opt, i) => (
                  <button
                    key={i}
                    className="btn btn-secondary"
                    style={{
                      padding: '1rem',
                      textAlign: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      whiteSpace: 'normal',
                      height: '100%',
                    }}
                    onClick={() => handleAnswer(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <button
                className="btn"
                style={{
                  marginTop: '1rem',
                  width: '100%',
                  background: 'transparent',
                  border: '1px dashed var(--border-color)',
                  color: 'var(--text-muted)',
                }}
                onClick={() => handleAnswer(null)}
              >
                🤷 Je ne connais pas ce mot
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Écran de Résultats */
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ fontSize: '4rem' }}>🏆</div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-emerald)' }}>
            Diagnostic terminé !
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px' }}>
            Vos résultats ont été enregistrés en base. Les mots validés sont désormais marqués comme <strong>Maîtrisés</strong> dans votre moteur SRS.
          </p>

          <div className="grid-3" style={{ width: '100%', margin: '1rem 0' }}>
            <div className="card" style={{ background: 'var(--bg-main)' }}>
              <div style={{ color: 'var(--accent-cyan)', fontSize: '1.8rem', fontWeight: 700 }}>
                {masteredWordIds.length} / {questions.length}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mots validés au test</div>
            </div>

            <div className="card" style={{ background: 'var(--bg-main)' }}>
              <div style={{ color: 'var(--accent-amber)', fontSize: '1.8rem', fontWeight: 700 }}>
                {finalStats?.hsk1Percent || 0}%
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Maîtrise HSK 1 globale</div>
            </div>

            <div className="card" style={{ background: 'var(--bg-main)' }}>
              <div style={{ color: 'var(--accent-purple)', fontSize: '1.8rem', fontWeight: 700 }}>
                {finalStats?.hsk2Percent || 0}%
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Maîtrise HSK 2 globale</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/" className="btn btn-secondary">
              📊 Voir le Tableau de Bord
            </Link>
            <Link href="/session" className="btn btn-primary">
              ⚡ Démarrer une Session 15M ➔
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
