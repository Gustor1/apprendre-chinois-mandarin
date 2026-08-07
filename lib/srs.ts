export interface SRSReviewInput {
  cardId: string;
  quality: number; // 1 = Difficile, 3 = Moyen, 5 = Facile
  interval: number;
  repetition: number;
  easeFactor: number;
}

export interface SRSReviewResult {
  interval: number;
  repetition: number;
  easeFactor: number;
  nextReviewDate: Date;
  status: 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';
}

/**
 * Algorithme SM-2 de répétition espacée.
 * Ajuste les fréquences de révision en fonction de l'auto-évaluation de l'utilisateur.
 */
export function calculateSM2(input: SRSReviewInput): SRSReviewResult {
  const { quality, interval: prevInterval, repetition: prevRepetition, easeFactor: prevEase } = input;

  let interval: number;
  let repetition: number;
  let easeFactor: number;
  let status: 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';

  // Calcul du nouveau facteur d'aisance (ease factor)
  easeFactor = prevEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  if (quality < 3) {
    // Échec / Réponse difficile -> Remise à zéro des répétitions
    repetition = 0;
    interval = 1;
    status = 'LEARNING';
  } else {
    // Réussite (Moyen ou Facile)
    if (prevRepetition === 0) {
      interval = 1;
    } else if (prevRepetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * easeFactor);
    }
    repetition = prevRepetition + 1;
    status = interval >= 21 ? 'MASTERED' : 'REVIEW';
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    interval,
    repetition,
    easeFactor,
    nextReviewDate,
    status,
  };
}
