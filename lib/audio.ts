/**
 * Service de synthèse vocale pour le mandarin (zh-CN) avec Web Speech API.
 */
export function speakChinese(text: string, rate: number = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn("La synthèse vocale Web Speech API n'est pas supportée par ce navigateur.");
      resolve();
      return;
    }

    // Annuler les lectures en cours
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = rate; // Débit légèrement ralenti pour la clarté orale
    utterance.pitch = 1.0;

    // Chercher une voix zh-CN ou zh-TW si disponible
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(
      (v) => v.lang.startsWith('zh') || v.lang.includes('CN') || v.lang.includes('Chinese')
    );
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      console.error('Erreur synthèse vocale :', e);
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}
