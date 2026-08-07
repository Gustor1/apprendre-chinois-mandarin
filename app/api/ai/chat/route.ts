import { generateStreamWithAI } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, scenario } = body;

    const scenarioDescriptions: Record<string, string> = {
      cafe: "Tu es un barista amical dans un café artisanal du quartier de Xuhui à Shanghai. Tu accueilles le client et prends sa commande.",
      taxi: "Tu es un chauffeur de taxi/DiDi expérimenté à Shanghai. Tu demandes la destination du passager (ex: Aéroport de Pudong, Gare de Hongqiao) et discutes de la route.",
      restaurant: "Tu es le serveur d'un restaurant typique de Shanghai spécialisé dans les Shengjianbao. Tu conseilles les spécialités et prends la commande.",
      work: "Tu es un collègue de travail chinois bienveillant dans une entreprise à Lujiazui. Tu discutes de la journée de travail, de la pause café ou des projets du week-end."
    };

    const scenarioPrompt = scenarioDescriptions[scenario] || scenarioDescriptions.cafe;

    const systemInstruction = `${scenarioPrompt}
Règles strictes de réponse :
1. Réponds TOUJOURS en adoptant ton personnage de manière naturelle et courte (1 à 3 phrases grand maximum).
2. Fournis ta réponse structurée de cette manière exacte (sans emojis drapeaux) :
   [中文] Chinois : [Ta réplique en caractères chinois]
   [Pinyin] : [Le pinyin avec tons]
   [Français] Traduction : [La traduction en français]
   [Conseil] : [Si le message de l'utilisateur contenait une faute ou s'il y a une alternative orale plus naturelle, indique-la gentiment ici. Sinon écris "Très bon chinois !"]`;

    // Concaténer le fil de discussion
    const lastUserMessage = messages[messages.length - 1]?.content || 'Bonjour !';
    const conversationHistory = messages.slice(0, -1).map((m: any) => `${m.role === 'user' ? 'Client' : 'Assistant'}: ${m.content}`).join('\n');

    const fullPrompt = `${conversationHistory ? `Historique de la conversation :\n${conversationHistory}\n\n` : ''}Dernier message du client/utilisateur : "${lastUserMessage}"\n\nRéponds maintenant selon ton personnage.`;

    const stream = await generateStreamWithAI(fullPrompt, systemInstruction);

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Erreur API AI Chat :', error);
    return new Response('❌ Erreur lors du traitement de la conversation', { status: 500 });
  }
}
