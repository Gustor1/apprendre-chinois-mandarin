import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const { durationSeconds = 0, wordsReviewed = 0, level = 1 } = body;

    // Enregistrer la session libre dans l'historique sous le compte de l'utilisateur
    const session = await prisma.userSession.create({
      data: {
        userId,
        durationSeconds: Math.max(0, parseInt(durationSeconds, 10) || 0),
        wordsReviewed: Math.max(0, parseInt(wordsReviewed, 10) || 0),
        wordsLearned: 0,
      },
    });

    return NextResponse.json({
      success: true,
      level,
      session,
    });
  } catch (error) {
    console.error('Erreur validation session libre :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
