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
  const [failedQuestions, setFailedQuestions] = useState<DiagnosticQuestion[]>([]);

  const [quizFinished, setQuizFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalStats, setFinalStats] = useState<{ hsk1Percent: number; hsk2Percent: number } | null>(null);

  // Prononcer automatiquement le mot quand une nouvelle question apparaît
  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length && !quizFinished) {
      speakChinese(questions[currentIndex].character);
    }
  }, [currentIndex, questions, quizFinished]);

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

    const isCorrect = selectedOption === currentQ.meaning;
    let updatedMastered = masteredWordIds;
    let updatedFailed = failedQuestions;

    if (isCorrect) {
      updatedMastered = [...masteredWordIds, currentQ.wordId];
      setMasteredWordIds(updatedMastered);
    } else {
      updatedFailed = [...failedQuestions, currentQ];
      setFailedQuestions(updatedFailed);
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      const failedIds = updatedFailed.map((q) => q.wordId);
      finishDiagnostic(updatedMastered, failedIds);
    }
  };

  const finishDiagnostic = async (validatedIds: string[], failedIds: string[]) => {
    setSaving(true);
    try {
      console.log('[Diagnostic UI] Soumission - Validés :', validatedIds.length, 'Échoués :', failedIds.length);
      const res = await fetch('/api/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterWordIds: validatedIds,
          failedWordIds: failedIds,
        }),
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
      console.error('[Diagnostic UI] Erreur lors de la sauvegarde :', err);
      alert("Impossible d'enregistrer vos résultats de diagnostic. Veuillez réessayer.");
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

  const currentQ = questions[currentIndex] || questions[0];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Question {currentIndex + 1} sur {questions.length}</span>
              <span className={`badge badge-hsk${currentQ.hskLevel}`}>HSK {currentQ.hskLevel}</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

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
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ fontSize: '4rem' }}>🏆</div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-emerald)' }}>
            Diagnostic terminé !
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '550px' }}>
            Vos résultats ont été enregistrés en BDD. Les <strong>{masteredWordIds.length} mots réussis</strong> sont désormais marqués comme <strong>Maîtrisés</strong> (SRS 21j) et les <strong>{failedQuestions.length} mots ratés</strong> ont été placés directement dans vos cartes <strong>À réviser aujourd&apos;hui</strong>.
          </p>

          <div className="grid-3" style={{ width: '100%', margin: '0.5rem 0' }}>
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

          {failedQuestions.length > 0 && (
            <div style={{ width: '100%', textAlign: 'left', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-red)' }}>
                  Mots à réviser en priorité ({failedQuestions.length})
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {failedQuestions.map((q) => (
                  <div
                    key={q.wordId}
                    className="card"
                    style={{
                      padding: '0.85rem 1rem',
                      background: 'var(--bg-main)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                        {q.character} <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 400 }}>({q.pinyin})</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {q.meaning}
                      </div>
                    </div>
                    <span className={`badge badge-hsk${q.hskLevel}`} style={{ fontSize: '0.75rem' }}>
                      HSK {q.hskLevel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
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
