/**
 * Audio synthesis helper (Pure JavaScript):
 * Tries server-side Gemini Flash TTS first for audio in Urdu or English.
 * Seamlessly falls back to browser Web Speech API (speechSynthesis).
 */

let activeAudio = null;

export async function requestTTSAudio(text, language = 'ur') {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.success && data.audioData) {
      return data.audioData;
    }
  } catch (err) {
    console.warn('Backend TTS call failed, will use Web Speech API fallback', err);
  }
  return null;
}

export const requestUrduTTSAudio = (text) => requestTTSAudio(text, 'ur');

export function playWithWebSpeech(
  text,
  language = 'ur',
  rate = 0.95,
  onStart,
  onEnd,
  onError
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError(new Error('Speech synthesis not supported in this browser'));
    return () => {};
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();

  if (language === 'ur') {
    // Look for Urdu or Hindi voice for natural South Asian pronunciation
    const urduVoice = voices.find(
      (v) =>
        v.lang.startsWith('ur') ||
        v.lang.includes('PK') ||
        v.lang.startsWith('hi') ||
        v.name.toLowerCase().includes('urdu')
    );
    if (urduVoice) {
      utterance.voice = urduVoice;
      utterance.lang = urduVoice.lang;
    } else {
      utterance.lang = 'ur-PK';
    }
  } else {
    // English voice
    const engVoice = voices.find(
      (v) =>
        (v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel'))) ||
        v.lang === 'en-US' ||
        v.lang === 'en-GB' ||
        v.lang.startsWith('en')
    );
    if (engVoice) {
      utterance.voice = engVoice;
      utterance.lang = engVoice.lang;
    } else {
      utterance.lang = 'en-US';
    }
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    if (onError) onError(e);
  };

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
  };
}

export function stopAnyActiveAudio() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
