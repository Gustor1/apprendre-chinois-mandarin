// Helper d'intégration pour NVIDIA NIM API (build.nvidia.com) - Endpoint compatible OpenAI
// Supporte le streaming en temps réel (SSE) et l'interchangeabilité des modèles via AI_MODEL

const cacheMap = new Map<string, string>();
let dailyRequestCount = 0;
let lastRequestDate = new Date().toISOString().split('T')[0];

const MAX_DAILY_REQUESTS = 50;

function checkQuota(): boolean {
  const currentDate = new Date().toISOString().split('T')[0];
  if (currentDate !== lastRequestDate) {
    lastRequestDate = currentDate;
    dailyRequestCount = 0;
  }
  return dailyRequestCount < MAX_DAILY_REQUESTS;
}

function incrementQuota() {
  dailyRequestCount++;
}

function createStringStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

/**
 * Génère une réponse streaming mot-par-mot (ReadableStream) compatible Server-Sent Events.
 */
export async function generateStreamWithAI(
  prompt: string,
  systemInstruction?: string
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const apiKey = process.env.NVIDIA_API_KEY;
  let modelName = process.env.AI_MODEL || 'meta/llama-3.3-70b-instruct';

  if (modelName === 'zhipuai/glm-5.2' || modelName === 'glm-5.2') {
    modelName = 'z-ai/glm-5.2';
  }

  // 1. Vérification de la clé API
  if (!apiKey || apiKey === 'your_nvidia_api_key_here') {
    const errorText =
      `⚠️ **Clé API NVIDIA NIM non configurée**\n\n` +
      `Pour activer les réponses en direct via NVIDIA NIM :\n` +
      `1. Récupérez votre clé gratuite sur [build.nvidia.com](https://build.nvidia.com/)\n` +
      `2. Collez la clé dans le fichier \`.env.local\` sous \`NVIDIA_API_KEY=nvapi-...\`\n` +
      `3. Ajustez la variable \`AI_MODEL=${modelName}\` dans \`.env.local\` si besoin.\n`;
    return createStringStream(errorText);
  }

  // 2. Vérification du quota de sécurité
  if (!checkQuota()) {
    return createStringStream(`⚠️ **Plafond quotidien de sécurité atteint (50 requêtes/jour)**. Veuillez réessayer demain pour préserver votre quota.`);
  }

  try {
    const url = 'https://integrate.api.nvidia.com/v1/chat/completions';
    const messages: Array<{ role: string; content: string }> = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: 0.6,
        max_tokens: 1024,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text();
      console.error(`Erreur API NVIDIA NIM (${modelName}) :`, errText);

      if (response.status === 504 || response.status === 503) {
        return createStringStream(`⚠️ **Le modèle \`${modelName}\` sur NVIDIA NIM prend du temps à démarrer (Timeout 504)**.\n\nRéessayez dans un instant, ou basculez sur un modèle ultra-rapide dans votre \`.env.local\` :\n\`AI_MODEL=meta/llama-3.3-70b-instruct\``);
      }

      return createStringStream(`❌ Erreur lors de l'appel à l'Assistant IA (${response.status}). Vérifiez votre clé NVIDIA_API_KEY et le modèle AI_MODEL (${modelName}) dans .env.local.`);
    }

    incrementQuota();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return new ReadableStream({
      async start(controller) {
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const dataStr = trimmed.slice(6);
                if (dataStr === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(dataStr);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(encoder.encode(content));
                  }
                } catch (e) {
                  // ignoré si chunk partiel
                }
              }
            }
          }
          if (buffer.trim().startsWith('data: ')) {
            const dataStr = buffer.trim().slice(6);
            if (dataStr !== '[DONE]') {
              try {
                const parsed = JSON.parse(dataStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch (e) {}
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  } catch (error) {
    console.error('Erreur streaming NVIDIA NIM :', error);
    return createStringStream(`❌ Erreur réseau ou de connexion avec l'Assistant IA.`);
  }
}

/**
 * Fonction classique non-streaming (conservée pour rétro-compatibilité).
 */
export async function generateWithGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const stream = await generateStreamWithAI(prompt, systemInstruction);
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value);
  }
  return result;
}
