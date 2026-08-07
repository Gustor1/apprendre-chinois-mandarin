import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateSM2 } from '@/lib/srs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cardId, quality } = body; // quality: 1 = Difficile, 3 = Moyen, 5 = Facile

    if (!cardId || typeof quality !== 'number') {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const card = await prisma.sRSCard.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 });
    }

    const sm2Result = calculateSM2({
      cardId: card.id,
      quality,
      interval: card.interval,
      repetition: card.repetition,
      easeFactor: card.easeFactor,
    });

    const updatedCard = await prisma.sRSCard.update({
      where: { id: cardId },
      data: {
        interval: sm2Result.interval,
        repetition: sm2Result.repetition,
        easeFactor: sm2Result.easeFactor,
        status: sm2Result.status,
        nextReviewDate: sm2Result.nextReviewDate,
        lastReviewedAt: new Date(),
      },
      include: {
        word: true,
      },
    });

    return NextResponse.json({ success: true, card: updatedCard });
  } catch (error) {
    console.error('Erreur API SRS Review :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
