import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('⚡ Seed ultra-rapide en masse sur Supabase PostgreSQL...');

  // 1. Initialiser UserStreak
  await prisma.userStreak.upsert({
    where: { userId: 'user_default' },
    update: {},
    create: {
      userId: 'user_default',
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    },
  });

  // 2. Charger les fichiers HSK et tout insérer en 1 seule requête bulk createMany
  const hskFiles = ['hsk1.json', 'hsk2.json', 'hsk3.json'];
  const wordsToInsert: any[] = [];

  for (const file of hskFiles) {
    const filePath = path.join(process.cwd(), 'data', file);
    const levelFromFilename = parseInt(file.replace('hsk', '').replace('.json', ''), 10);

    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        wordsToInsert.push({
          character: item.character,
          pinyin: item.pinyin,
          meaning: item.meaning,
          hskLevel: item.hskLevel || levelFromFilename,
          category: item.category || 'Général',
          orderIndex: item.orderIndex ?? (i + 1),
          exampleSentence: item.exampleSentence || null,
          examplePinyin: item.examplePinyin || null,
          exampleTranslation: item.exampleTranslation || null,
        });
      }
    }
  }

  // Insertion en masse des mots
  if (wordsToInsert.length > 0) {
    await prisma.word.createMany({
      data: wordsToInsert,
      skipDuplicates: true,
    });
  }

  // Récupérer tous les mots en base pour générer les cartes SRS en 1 seule requête bulk
  const allWords = await prisma.word.findMany({ select: { id: true } });
  const srsCardsToInsert = allWords.map((w) => ({
    userId: 'user_default',
    wordId: w.id,
    status: 'NEW',
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    nextReviewDate: new Date(),
  }));

  if (srsCardsToInsert.length > 0) {
    await prisma.sRSCard.createMany({
      data: srsCardsToInsert,
      skipDuplicates: true,
    });
  }

  // 3. Importation de la grammaire
  const grammarPath = path.join(process.cwd(), 'data', 'grammar.json');
  if (fs.existsSync(grammarPath)) {
    const grammarData = JSON.parse(fs.readFileSync(grammarPath, 'utf-8'));
    await prisma.grammarStructure.createMany({
      data: grammarData.map((g: any) => ({
        title: g.title,
        hskLevel: g.hskLevel,
        pattern: g.pattern,
        explanation: g.explanation,
        exampleSentence: g.exampleSentence,
        examplePinyin: g.examplePinyin,
        exampleTranslation: g.exampleTranslation,
      })),
      skipDuplicates: true,
    });
  }

  // 4. Importation du chinois conversationnel
  const convPath = path.join(process.cwd(), 'data', 'conversational.json');
  if (fs.existsSync(convPath)) {
    const convData = JSON.parse(fs.readFileSync(convPath, 'utf-8'));
    await prisma.conversationalItem.createMany({
      data: convData.map((c: any) => ({
        type: c.type,
        title: c.title,
        spokenForm: c.spokenForm || null,
        standardForm: c.standardForm || null,
        pattern: c.pattern || null,
        meaning: c.meaning,
        explanation: c.explanation || null,
        theme: c.theme,
        hskLevel: c.hskLevel || 1,
        exampleSentence: c.exampleSentence,
        examplePinyin: c.examplePinyin,
        exampleTranslation: c.exampleTranslation,
      })),
      skipDuplicates: true,
    });
  }

  console.log('✅ Seed Supabase PostgreSQL bulk terminé avec succès en temps record !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur durant le seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
