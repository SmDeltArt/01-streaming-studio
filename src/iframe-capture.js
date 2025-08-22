export async function captureIframeStream(iframe, includeAudio = true) {
  try {
    const win = iframe?.contentWindow;
    if (!win || typeof win.captureStream !== 'function') {
      return null;
    }
    const stream = win.captureStream();
    if (includeAudio && navigator?.mediaDevices?.getUserMedia) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getAudioTracks().forEach(track => {
          stream.addTrack(track);
        });
      } catch (err) {
        console.warn('Microphone capture failed:', err);
      }
    }
    return stream;
  } catch (err) {
    console.warn('Iframe captureStream failed:', err);
    return null;
  }
}
