import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const levelParam = searchParams.get('level'); // 'all' | '1' | '2' | '3'
    const statusParam = searchParams.get('status'); // 'all' | 'due' | 'learning' | 'mastered' | 'new'

    const now = new Date();

    // Condition sur le niveau HSK et l'utilisateur
    const whereCondition: any = { userId };
    if (levelParam && levelParam !== 'all') {
      const level = parseInt(levelParam, 10);
      whereCondition.word = { hskLevel: level };
    }

    const cards = await prisma.sRSCard.findMany({
      where: whereCondition,
      include: {
        word: true,
      },
      orderBy: {
        nextReviewDate: 'asc',
      },
    });

    // Catégoriser chaque carte
    const dueCards: typeof cards = [];
    const learningCards: typeof cards = [];
    const masteredCards: typeof cards = [];
    const newCards: typeof cards = [];

    cards.forEach((card) => {
      const isDue = new Date(card.nextReviewDate) <= now;
      if (isDue) {
        dueCards.push(card);
      } else if (card.status === 'MASTERED' || card.interval >= 21) {
        masteredCards.push(card);
      } else if (card.status === 'NEW' && card.repetition === 0) {
        newCards.push(card);
      } else {
        learningCards.push(card);
      }
    });

    // Sélectionner les cartes à renvoyer selon le filtre de statut
    let selectedCards = cards;
    if (statusParam === 'due') {
      selectedCards = dueCards;
    } else if (statusParam === 'learning') {
      selectedCards = learningCards;
    } else if (statusParam === 'mastered') {
      selectedCards = masteredCards;
    } else if (statusParam === 'new') {
      selectedCards = newCards;
    }

    return NextResponse.json({
      counts: {
        due: dueCards.length,
        learning: learningCards.length,
        mastered: masteredCards.length,
        new: newCards.length,
        total: cards.length,
      },
      cards: selectedCards,
    });
  } catch (error) {
    console.error('Erreur API Progress GET :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
