'use client';

import { useEffect, useState } from 'react';
import { speakChinese } from '@/lib/audio';
import AIModal from '@/components/AIModal';
import FavoriteButton from '@/components/FavoriteButton';

interface ConversationalItem {
  id: string;
  type: 'CONNECTOR' | 'CONTRACTION';
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
  inSRS: boolean;
}

export default function ConversationalPage() {
  const [items, setItems] = useState<ConversationalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [addingSrsId, setAddingSrsId] = useState<string | null>(null);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTargetData, setAiTargetData] = useState<any>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Charger les IDs des favoris de type 'conversational'
  useEffect(() => {
    fetch('/api/favorites?type=conversational')
      .then((res) => res.json())
      .then((d) => {
        const ids = new Set<string>((d.favorites || []).map((f: any) => f.conversationalItemId).filter(Boolean));
        setFavoriteIds(ids);
      })
      .catch(() => {});
  }, []);

  const handleOpenAiModal = (title: string, pattern: string, meaning: string) => {
    setAiTargetData({ title, pattern, meaning, contextType: 'grammar' });
    setAiModalOpen(true);
  };

  const fetchItems = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedType !== 'all') params.append('type', selectedType);
    if (selectedTheme !== 'all') params.append('theme', selectedTheme);

    fetch(`/api/conversational?${params.toString()}`)
      .then((res) => res.json())
      .then((d) => {
        setItems(d.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchItems();
  }, [selectedType, selectedTheme]);

  // Ajouter au SRS en 1-clic
  const handleAddToSRS = async (itemId: string) => {
    setAddingSrsId(itemId);
    try {
      const res = await fetch('/api/conversational', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) =>
          prev.map((it) => (it.id === itemId ? { ...it, inSRS: true } : it))
        );
      }
    } catch (err) {
      console.error('Erreur lors de l’ajout au SRS :', err);
    } finally {
      setAddingSrsId(null);
    }
  };

  // Liste unique des thèmes disponibles
  const availableThemes = Array.from(new Set(items.map((i) => i.theme))).filter(Boolean);

  const connectorCount = items.filter((i) => i.type === 'CONNECTOR').length;
  const contractionCount = items.filter((i) => i.type === 'CONTRACTION').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <AIModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} targetData={aiTargetData} />
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          🗣️ Chinois Quotidien & Expressions Orales
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Découvrez les connecteurs oraux et les contractions dites par les natifs (« comme les Chinois parlent vraiment »).
          Écoutez la prononciation audio et ajoutez-les au SRS en 1-clic.
        </p>
      </div>

      {/* Barre de filtre & Stats */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Filtre principal par Type */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Catégorie :
          </span>
          <button
            className={`btn ${selectedType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            onClick={() => setSelectedType('all')}
          >
            Tous ({items.length})
          </button>
          <button
            className={`btn ${selectedType === 'CONNECTOR' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            onClick={() => setSelectedType('CONNECTOR')}
          >
            🔗 Connecteurs Oraux ({connectorCount})
          </button>
          <button
            className={`btn ${selectedType === 'CONTRACTION' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            onClick={() => setSelectedType('CONTRACTION')}
          >
            💬 Contractions Natives ({contractionCount})
          </button>
        </div>

        {/* Filtre secondaire par Thème */}
        {availableThemes.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Thèmes :
            </span>
            <button
              className={`badge ${selectedTheme === 'all' ? 'badge-streak' : 'badge-hsk1'}`}
              style={{ cursor: 'pointer', padding: '0.3rem 0.75rem', opacity: selectedTheme === 'all' ? 1 : 0.6 }}
              onClick={() => setSelectedTheme('all')}
            >
              Tous les thèmes
            </button>
            {availableThemes.map((th) => (
              <button
                key={th}
                className={`badge ${selectedTheme === th ? 'badge-streak' : 'badge-hsk1'}`}
                style={{ cursor: 'pointer', padding: '0.3rem 0.75rem', opacity: selectedTheme === th ? 1 : 0.6 }}
                onClick={() => setSelectedTheme(th)}
              >
                {th}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contenu */}
      {loading ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
          Chargement des expressions conversationnelles...
        </p>
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            Aucune expression trouvée pour ces filtres.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {items.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem' }}
            >
              {/* En-tête de la carte */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                  <span className={`badge ${item.type === 'CONNECTOR' ? 'badge-hsk1' : 'badge-hsk2'}`}>
                    {item.type === 'CONNECTOR' ? '🔗 Connecteur Oral' : '💬 Expression Native'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FavoriteButton
                      itemId={item.id}
                      itemType="conversational"
                      isFavorite={favoriteIds.has(item.id)}
                      onToggle={(newState) => {
                        setFavoriteIds((prev) => {
                          const next = new Set(prev);
                          if (newState) next.add(item.id); else next.delete(item.id);
                          return next;
                        });
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-main)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                      {item.theme}
                    </span>
                  </div>
                </div>

                {/* Titre & Formes comparatives */}
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                  {item.title}
                </h3>

                {/* Si Contraction Native : Comparaison côte à côte */}
                {item.type === 'CONTRACTION' && item.spokenForm && (
                  <div
                    style={{
                      background: 'var(--bg-main)',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.6rem',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'center',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🗣️ Forme Orale</div>
                      <div className="cn-text" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {item.spokenForm}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>vs</div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📖 Forme Manuel</div>
                      <div className="cn-text" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', textDecoration: 'line-through opacity(0.7)' }}>
                        {item.standardForm}
                      </div>
                    </div>
                  </div>
                )}

                {/* Si Connecteur : Patron mis en valeur */}
                {item.type === 'CONNECTOR' && item.pattern && (
                  <div
                    style={{
                      background: 'var(--bg-main)',
                      padding: '0.65rem 1rem',
                      borderRadius: '0.6rem',
                      border: '1px solid var(--border-color)',
                      fontFamily: 'monospace',
                      fontSize: '0.95rem',
                      color: 'var(--accent-cyan)',
                      fontWeight: 600,
                      marginBottom: '0.75rem',
                    }}
                  >
                    📐 Patron : {item.pattern}
                  </div>
                )}

                {/* Sens en français */}
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '0.4rem' }}>
                  💡 {item.meaning}
                </div>

                {/* Explication */}
                {item.explanation && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1rem' }}>
                    {item.explanation}
                  </p>
                )}
              </div>

              {/* Exemple & Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Bloc exemple */}
                <div
                  style={{
                    background: 'var(--bg-main)',
                    padding: '0.85rem 1rem',
                    borderRadius: '0.6rem',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div className="cn-text" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>
                    {item.exampleSentence}
                  </div>
                  <div style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                    {item.examplePinyin}
                  </div>
                  <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    « {item.exampleTranslation} »
                  </div>
                </div>

                {/* Boutons d'action : TTS + AI + SRS 1-clic */}
                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      className="btn-audio"
                      onClick={() => speakChinese(item.exampleSentence)}
                      style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
                    >
                      🔊 Écouter
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleOpenAiModal(item.title, item.pattern || item.spokenForm || '', item.meaning)}
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem', color: 'var(--accent-cyan)', borderColor: 'rgba(6,182,212,0.4)' }}
                    >
                      💡 Expliquer avec l'IA
                    </button>
                  </div>

                  <button
                    className={`btn ${item.inSRS ? 'btn-secondary' : 'btn-primary'}`}
                    disabled={item.inSRS || addingSrsId === item.id}
                    onClick={() => handleAddToSRS(item.id)}
                    style={{
                      fontSize: '0.85rem',
                      padding: '0.4rem 0.9rem',
                      opacity: item.inSRS ? 0.7 : 1,
                      cursor: item.inSRS ? 'default' : 'pointer',
                    }}
                  >
                    {item.inSRS
                      ? '✅ Intégré au SRS'
                      : addingSrsId === item.id
                      ? 'Ajout...'
                      : '🧠 Ajouter au SRS'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
