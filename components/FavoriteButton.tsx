'use client';

import { useState } from 'react';

interface FavoriteButtonProps {
  itemId: string;
  itemType: 'word' | 'grammar' | 'conversational';
  isFavorite: boolean;
  onToggle?: (newState: boolean) => void;
}

export default function FavoriteButton({ itemId, itemType, isFavorite: initialFavorite, onToggle }: FavoriteButtonProps) {
  const [isFav, setIsFav] = useState(initialFavorite);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Mise à jour optimiste
    const newState = !isFav;
    setIsFav(newState);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    const body: Record<string, string> = {};
    if (itemType === 'word') body.wordId = itemId;
    else if (itemType === 'grammar') body.grammarStructureId = itemId;
    else if (itemType === 'conversational') body.conversationalItemId = itemId;

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      // Corriger si le serveur renvoie un état différent
      if (data.isFavorite !== undefined && data.isFavorite !== newState) {
        setIsFav(data.isFavorite);
      }

      onToggle?.(data.isFavorite ?? newState);
    } catch (err) {
      // Rollback en cas d'erreur
      setIsFav(!newState);
      console.error('Erreur toggle favori :', err);
    }
  };

  return (
    <button
      className={`btn-favorite ${isFav ? 'active' : ''} ${isAnimating ? 'animating' : ''}`}
      onClick={handleToggle}
      title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      {isFav ? '★' : '☆'}
    </button>
  );
}
