import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getUserId();
    const now = new Date();

    // 1. Réviser les cartes SRS dues pour cet utilisateur (max 10 par session)
    const dueCards = await prisma.sRSCard.findMany({
      where: {
        userId,
        nextReviewDate: { lte: now },
      },
      include: { word: true },
      take: 10,
    });

    // Si pas assez de cartes dues, prendre des cartes en cours d'apprentissage ou au hasard pour cet utilisateur
    let reviewCards = dueCards;
    if (reviewCards.length < 5) {
      const extraCards = await prisma.sRSCard.findMany({
        where: {
          userId,
          id: { notIn: reviewCards.map((c) => c.id) },
        },
        include: { word: true },
        take: 5 - reviewCards.length,
      });
      reviewCards = [...reviewCards, ...extraCards];
    }

    // 2. Sélectionner une structure grammaticale du jour
    const grammarCount = await prisma.grammarStructure.count();
    const randomGrammarIndex = Math.floor(Math.random() * Math.max(1, grammarCount));
    const grammarOfTheDay = await prisma.grammarStructure.findFirst({
      skip: randomGrammarIndex,
    });

    // 3. Sélectionner 3 nouveaux mots à apprendre aujourd'hui (statut NEW pour cet utilisateur)
    const newCards = await prisma.sRSCard.findMany({
      where: { userId, status: 'NEW' },
      include: { word: true },
      take: 3,
    });

    return NextResponse.json({
      reviewCards,
      grammarOfTheDay,
      newCards,
    });
  } catch (error) {
    console.error('Erreur API Daily Session :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
