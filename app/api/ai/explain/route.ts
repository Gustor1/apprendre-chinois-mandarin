import { generateStreamWithAI } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { character, meaning, pinyin, pattern, title, contextType } = body;

    let prompt = '';
    const systemInstruction = `Tu es un professeur expert en mandarin oral et en sociolinguistique à Shanghai. Tes explications sont claires, structurées en Markdown, vivantes et pédagogiques. Donne des conseils d'utilisation orale pratique.`;

    if (contextType === 'grammar') {
      prompt = `Explique la structure grammaticale chinoise suivante :
- Titre : "${title}"
- Patron : "${pattern}"
- Explication de base : "${meaning}"

Fournis :
1. Une explication approfondie et simple de la nuance (quand l'utiliser à l'oral vs ce qu'il faut éviter).
2. 2 phrases d'exemples naturelles contextualisées à la vie quotidienne à Shanghai (caractères + Pinyin + traduction française).
3. Une astuce mnémonique pour s'en souvenir facilement.`;
    } else {
      prompt = `Explique le mot chinois suivant :
- Caractère : "${character}"
- Pinyin : "${pinyin}"
- Sens : "${meaning}"

Fournis :
1. Les nuances de sens et les associations courantes à l'oral au quotidien.
2. La différence avec des synonymes proches si applicable (ex: 想 vs 要, 看看 vs 看).
3. 2 phrases d'exemples très naturelles situées à Shanghai (caractères + Pinyin + traduction française).`;
    }

    const stream = await generateStreamWithAI(prompt, systemInstruction);

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Erreur API AI Explain :', error);
    return new Response('❌ Erreur lors de la génération', { status: 500 });
  }
}
