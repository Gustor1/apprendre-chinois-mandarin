'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardData {
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
  };
  dueCardsCount: number;
  learningWordsCount: number;
  masteredWordsCount: number;
  totalWordsCount: number;
  hskStats: {
    hsk1: { total: number; mastered: number };
    hsk2: { total: number; mastered: number };
    hsk3: { total: number; mastered: number };
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Chargement de votre profil d'apprentissage...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--accent-red)' }}>Impossible de charger les données.</p>
      </div>
    );
  }

  const streak = data.streak.currentStreak;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Banner d'accueil */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', background: 'linear-gradient(135deg, #131b2e 0%, #1e2942 100%)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-streak">
              🔥 Série actuelle : {streak} {streak === 1 ? 'jour' : 'jours'}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              (Record : {data.streak.longestStreak} j)
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
            Prêt pour vos 15 minutes du jour ?
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px' }}>
            {data.dueCardsCount > 0
              ? `Vous avez ${data.dueCardsCount} révision(s) SRS en attente.`
              : 'Toutes vos cartes sont à jour ! Démarrez votre session guidée du jour.'}
          </p>
        </div>

        <Link href="/session" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
          ⚡ Lancer la Session (15 min)
        </Link>
      </div>

      {/* Carte d'invitation au Diagnostic */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🎯</span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>
              Test de Diagnostic Adaptatif HSK 1-2
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '600px' }}>
            Évaluez vos acquis existants en 25 questions pour sauter les mots que vous maîtrisez déjà et ajuster automatiquement votre moteur SRS !
          </p>
        </div>

        <Link href="/diagnostic" className="btn btn-secondary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.95rem' }}>
          Passer le Diagnostic ➔
        </Link>
      </div>

      {/* Section Révision Libre par Niveau HSK */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-emerald)' }}>
                Révision Libre Hors-Session (Flashcards par Niveau)
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Révisez le vocabulaire complet d'un niveau à tout moment. Les résultats mettent à jour le moteur SRS sans altérer votre streak quotidien.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.25rem' }}>
          <Link href="/practice?level=1" className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem' }}>
            <span>Réviser tout <strong>HSK 1</strong></span>
            <span className="badge badge-hsk1">{data.hskStats?.hsk1?.total || 307} mots</span>
          </Link>
          <Link href="/practice?level=2" className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem' }}>
            <span>Réviser tout <strong>HSK 2</strong></span>
            <span className="badge badge-hsk2">{data.hskStats?.hsk2?.total || 199} mots</span>
          </Link>
          <Link href="/practice?level=3" className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem' }}>
            <span>Réviser tout <strong>HSK 3</strong></span>
            <span className="badge badge-hsk3">{data.hskStats?.hsk3?.total || 473} mots</span>
          </Link>
        </div>
      </div>

      {/* Cartes de statistiques globales */}
      <div className="grid-3">
        <div className="card">
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            ⏱️ Cartes SRS à réviser
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
            {data.dueCardsCount}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Cartes programmées aujourd'hui
          </p>
        </div>

        <div className="card">
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            🧠 En cours d'apprentissage
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
            {data.learningWordsCount}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Mots en phase d'assimilation
          </p>
        </div>

        <div className="card">
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            🏆 Mots Maîtrisés (SRS &gt; 21j)
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
            {data.masteredWordsCount}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Sur {data.totalWordsCount} mots en base
          </p>
        </div>
      </div>

      {/* Progression par Niveau HSK 3.0 */}
      <div>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>
          🎯 Progression par niveau (Norme HSK 3.0)
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* HSK 1 */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge badge-hsk1">HSK 1</span>
                <span style={{ fontWeight: 600 }}>Niveau Débutant — Fondations</span>
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {data.hskStats.hsk1.mastered} / {data.hskStats.hsk1.total} mots
              </span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${data.hskStats.hsk1.total > 0 ? (data.hskStats.hsk1.mastered / data.hskStats.hsk1.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* HSK 2 */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge badge-hsk2">HSK 2</span>
                <span style={{ fontWeight: 600 }}>Niveau Débutant Avancé — Autonomie simple</span>
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {data.hskStats.hsk2.mastered} / {data.hskStats.hsk2.total} mots
              </span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${data.hskStats.hsk2.total > 0 ? (data.hskStats.hsk2.mastered / data.hskStats.hsk2.total) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, var(--accent-amber), var(--accent-emerald))',
                }}
              />
            </div>
          </div>

          {/* HSK 3 */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge badge-hsk3">HSK 3</span>
                <span style={{ fontWeight: 600 }}>Niveau Intermédiaire — Conversation courante</span>
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {data.hskStats.hsk3.mastered} / {data.hskStats.hsk3.total} mots
              </span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${data.hskStats.hsk3.total > 0 ? (data.hskStats.hsk3.mastered / data.hskStats.hsk3.total) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-emerald))',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
