// Tiny Speech-to-Text adapter with Websim → fallback chain.
// Fallback 1: Browser Web Speech API (free, live-only, Chrome/Edge/WebKit).
// You can plug another HTTP-based free API later in the `fallbackHttpProvider` hook.

const STT_TIMEOUT_MS = 6000; // if Websim doesn't respond in time, we fallback

function withTimeout(promise, ms = STT_TIMEOUT_MS, tag = 'op') {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`[timeout] ${tag}`)), ms);
    promise.then(v => { clearTimeout(t); resolve(v); },
                 e => { clearTimeout(t); reject(e); });
  });
}

function isWebsimHost() {
  const h = (location && location.hostname) ? location.hostname.toLowerCase() : '';
  return h.endsWith('.websim.ai') || h === 'websim.ai';
}

function hasWebsimAPI() {
  // Prefer an injected API (e.g., window.websim.speechToText)
  const w = (typeof window !== 'undefined') ? window : {};
  return !!(w.websim && typeof w.websim.speechToText === 'function')
      || !!(w.Websim && typeof w.Websim.speechToText === 'function');
}

async function tryWebsimSTT(blob, { lang = 'en' } = {}) {
  const w = (typeof window !== 'undefined') ? window : {};
  const api = (w.websim && w.websim.speechToText) || (w.Websim && w.Websim.speechToText);
  if (!api) throw new Error('no-websim-stt');

  // Many environments expect (blob|File, options) and resolve to { text }
  // Adjust if your local wrapper differs.
  const res = await withTimeout(api(blob, { lang }), STT_TIMEOUT_MS, 'websim-stt');
  if (!res) throw new Error('websim-empty');
  return typeof res === 'string' ? res : (res.text || '');
}

/* ------- Fallback A: Browser Web Speech API (live, mic-only) ------- */
// This cannot transcribe a finished Blob; it’s for *live* captions while recording.
function canUseWebSpeech() {
  const w = (typeof window !== 'undefined') ? window : {};
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

function startLiveRecognition({ lang = 'en-US', interim = true, onPartial, onFinal, onError } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) throw new Error('no-webspeech');

  const rec = new SR();
  rec.lang = lang;
  rec.interimResults = interim;
  rec.continuous = true;

  rec.onresult = (evt) => {
    for (let i = evt.resultIndex; i < evt.results.length; i++) {
      const r = evt.results[i];
      const text = r[0]?.transcript || '';
      if (r.isFinal) onFinal && onFinal(text);
      else onPartial && onPartial(text);
    }
  };
  rec.onerror = (e) => onError && onError(e);
  rec.start();

  return {
    stop: () => { try { rec.stop(); } catch {} },
    abort: () => { try { rec.abort(); } catch {} },
    recognition: rec
  };
}

/* ------- Fallback B: HTTP API hook (optional; keep disabled by default) ------- */
// If you later adopt a free HTTP STT service, implement it here.
async function fallbackHttpProvider(/* blob, { lang } */) {
  // Example shape (pseudo):
  // const fd = new FormData(); fd.append('file', blob, 'audio.webm'); fd.append('lang', lang);
  // const r = await fetch('https://your-free-stt.example.com/transcribe', { method: 'POST', body: fd });
  // const j = await r.json(); return j.text;
  throw new Error('no-external-http-stt-configured');
}

/* ------- Public API ------- */

export async function transcribeOnce(blob, { lang = 'en' } = {}) {
  // 1) Prefer Websim when hosted there AND API exists
  if (isWebsimHost() && hasWebsimAPI()) {
    try {
      const text = await tryWebsimSTT(blob, { lang });
      if (text && text.trim()) return { source: 'websim', text };
    } catch (e) {
      // fall through to fallback
    }
  }

  // 2) Optional HTTP provider (disabled by default; see hook above)
  try {
    const text = await fallbackHttpProvider(blob, { lang });
    if (text && text.trim()) return { source: 'http', text };
  } catch (e) {
    // ignore; proceed to final fallback report
  }

  // 3) Final advice if nothing else worked
  return {
    source: 'none',
    text: '',
    error: 'NO_STT_AVAILABLE',
    hint: canUseWebSpeech()
      ? 'Enable Live STT (Web Speech) during recording.'
      : 'No STT provider available; configure an HTTP fallback or use Websim hosting.'
  };
}

export const LiveSTT = {
  available: canUseWebSpeech,
  start: startLiveRecognition
};
