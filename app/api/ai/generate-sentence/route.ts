import { generateStreamWithAI } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { word, pinyin, meaning } = body;

    const systemInstruction = `Tu es un assistant linguistique spécialisé dans l'immersion orale à Shanghai. Tu génères des phrases d'exemples réalistes, modernes et utiles pour la vie quotidienne à Shanghai.`;

    const prompt = `Génère 3 phrases d'exemples distinctes en chinois mandarin utilisant le mot "${word}" (${pinyin} : ${meaning}).

Chaque exemple doit être contextualisé à la vie à Shanghai (ex: métro, quartier de Xuhui, café, bureau, Bund, livraison WaiMai, etc.).

Formatte chaque phrase clairement comme suit :
1. [中文] Caractères : ...
   [Pinyin] : ...
   [Français] Traduction : ...
   [Contexte] : ...`;

    const stream = await generateStreamWithAI(prompt, systemInstruction);

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Erreur API AI Generate Sentence :', error);
    return new Response('❌ Erreur lors de la génération de phrases', { status: 500 });
  }
}
