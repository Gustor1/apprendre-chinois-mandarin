import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Récupérer tous les mots HSK 1 et HSK 2
    const hsk1Words = await prisma.word.findMany({ where: { hskLevel: 1 } });
    const hsk2Words = await prisma.word.findMany({ where: { hskLevel: 2 } });

    // Mélanger et sélectionner 15 mots HSK 1 et 10 mots HSK 2
    const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    const selectedHsk1 = shuffle(hsk1Words).slice(0, 15);
    const selectedHsk2 = shuffle(hsk2Words).slice(0, 10);
    const quizWords = [...selectedHsk1, ...selectedHsk2];

    const allMeanings = (await prisma.word.findMany({ select: { meaning: true } })).map((w) => w.meaning);

    // Générer les QCM avec 4 choix
    const questions = quizWords.map((word) => {
      const distractors = shuffle(allMeanings.filter((m) => m !== word.meaning)).slice(0, 3);
      const options = shuffle([word.meaning, ...distractors]);

      return {
        wordId: word.id,
        character: word.character,
        pinyin: word.pinyin,
        hskLevel: word.hskLevel,
        meaning: word.meaning,
        options,
        exampleSentence: word.exampleSentence,
        examplePinyin: word.examplePinyin,
        exampleTranslation: word.exampleTranslation,
      };
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Erreur API Diagnostic GET :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const { masterWordIds = [], failedWordIds = [] }: { masterWordIds: string[]; failedWordIds: string[] } = body;

    console.log(`[Diagnostic API] Enregistrement pour userId: ${userId}. Réussis (${masterWordIds.length}), Échoués (${failedWordIds.length}).`);

    const now = new Date();

    // 1. Mots réussis -> Statut MASTERED (Intervalle 21 jours)
    if (masterWordIds.length > 0) {
      const nextReviewDateMastered = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
      await Promise.all(
        masterWordIds.map((wordId) =>
          prisma.sRSCard.upsert({
            where: {
              userId_wordId: {
                userId,
                wordId,
              },
            },
            update: {
              status: 'MASTERED',
              interval: 21,
              repetition: 2,
              easeFactor: 2.5,
              nextReviewDate: nextReviewDateMastered,
              lastReviewedAt: now,
            },
            create: {
              userId,
              wordId,
              status: 'MASTERED',
              interval: 21,
              repetition: 2,
              easeFactor: 2.5,
              nextReviewDate: nextReviewDateMastered,
              lastReviewedAt: now,
            },
          })
        )
      );
    }

    // 2. Mots ratés ou non connus -> Statut LEARNING (Intervalle 0 j, Révision immédiate aujourd'hui)
    if (failedWordIds.length > 0) {
      await Promise.all(
        failedWordIds.map((wordId) =>
          prisma.sRSCard.upsert({
            where: {
              userId_wordId: {
                userId,
                wordId,
              },
            },
            update: {
              status: 'LEARNING',
              interval: 0,
              repetition: 0,
              easeFactor: 2.5,
              nextReviewDate: now,
              lastReviewedAt: now,
            },
            create: {
              userId,
              wordId,
              status: 'LEARNING',
              interval: 0,
              repetition: 0,
              easeFactor: 2.5,
              nextReviewDate: now,
              lastReviewedAt: now,
            },
          })
        )
      );
    }

    const hsk1Total = await prisma.word.count({ where: { hskLevel: 1 } });
    const hsk1Mastered = await prisma.sRSCard.count({
      where: { userId, word: { hskLevel: 1 }, status: 'MASTERED' },
    });

    const hsk2Total = await prisma.word.count({ where: { hskLevel: 2 } });
    const hsk2Mastered = await prisma.sRSCard.count({
      where: { userId, word: { hskLevel: 2 }, status: 'MASTERED' },
    });

    console.log(`[Diagnostic API] Succès pour ${userId}. HSK1: ${hsk1Mastered}/${hsk1Total}, HSK2: ${hsk2Mastered}/${hsk2Total}.`);

    return NextResponse.json({
      success: true,
      masteredCount: masterWordIds.length,
      failedCount: failedWordIds.length,
      stats: {
        hsk1Percent: hsk1Total > 0 ? Math.round((hsk1Mastered / hsk1Total) * 100) : 0,
        hsk2Percent: hsk2Total > 0 ? Math.round((hsk2Mastered / hsk2Total) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Erreur API Diagnostic POST :', error);
    return NextResponse.json({ error: 'Erreur lors de l’enregistrement du diagnostic', details: String(error) }, { status: 500 });
  }
}
