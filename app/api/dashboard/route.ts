import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getUserId();

    const streak = await prisma.userStreak.findUnique({
      where: { userId },
    });

    const now = new Date();

    const dueCardsCount = await prisma.sRSCard.count({
      where: {
        userId,
        nextReviewDate: {
          lte: now,
        },
      },
    });

    const masteredWordsCount = await prisma.sRSCard.count({
      where: {
        userId,
        status: 'MASTERED',
      },
    });

    const learningWordsCount = await prisma.sRSCard.count({
      where: {
        userId,
        status: { in: ['LEARNING', 'REVIEW'] },
      },
    });

    const hsk1Total = await prisma.word.count({ where: { hskLevel: 1 } });
    const hsk1Mastered = await prisma.sRSCard.count({
      where: { userId, word: { hskLevel: 1 }, status: 'MASTERED' },
    });

    const hsk2Total = await prisma.word.count({ where: { hskLevel: 2 } });
    const hsk2Mastered = await prisma.sRSCard.count({
      where: { userId, word: { hskLevel: 2 }, status: 'MASTERED' },
    });

    const hsk3Total = await prisma.word.count({ where: { hskLevel: 3 } });
    const hsk3Mastered = await prisma.sRSCard.count({
      where: { userId, word: { hskLevel: 3 }, status: 'MASTERED' },
    });

    const totalWordsCount = await prisma.word.count();

    const favoritesCount = await prisma.favorite.count({
      where: { userId },
    });

    const recentSessions = await prisma.userSession.findMany({
      where: { userId },
      take: 7,
      orderBy: { completedAt: 'desc' },
    });

    return NextResponse.json({
      streak: streak || { currentStreak: 0, longestStreak: 0, lastActiveDate: null },
      dueCardsCount,
      learningWordsCount,
      masteredWordsCount,
      totalWordsCount,
      favoritesCount,
      hskStats: {
        hsk1: { total: hsk1Total, mastered: hsk1Mastered },
        hsk2: { total: hsk2Total, mastered: hsk2Mastered },
        hsk3: { total: hsk3Total, mastered: hsk3Mastered },
      },
      recentSessions,
    });
  } catch (error) {
    console.error('Erreur API Dashboard :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
