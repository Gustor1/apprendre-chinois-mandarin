import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateDailyStreak } from '@/lib/streak';
import { getUserId } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const { durationSeconds = 900, wordsReviewed = 0, wordsLearned = 0 } = body;

    // Enregistrer la session
    const session = await prisma.userSession.create({
      data: {
        userId,
        durationSeconds,
        wordsReviewed,
        wordsLearned,
      },
    });

    // Mettre à jour le streak de l'utilisateur
    const updatedStreak = await updateDailyStreak(userId);

    return NextResponse.json({
      success: true,
      session,
      streak: updatedStreak,
    });
  } catch (error) {
    console.error('Erreur validation session :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
