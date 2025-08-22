import { describe, it, expect, vi } from 'vitest';
import { captureIframeStream } from '../src/iframe-capture.js';

describe('captureIframeStream', () => {
  it('returns null when captureStream is unavailable', async () => {
    const iframe = {};
    const result = await captureIframeStream(iframe);
    expect(result).toBeNull();
  });

  it('returns stream and attaches audio track when available', async () => {
    const audioTrack = {};
    const audioStream = { getAudioTracks: () => [audioTrack] };
    const getUserMedia = vi.fn().mockResolvedValue(audioStream);
    const addTrack = vi.fn();
    const capturedStream = { addTrack };
    const iframe = { contentWindow: { captureStream: () => capturedStream } };
    const originalNavigator = global.navigator;
    global.navigator = { mediaDevices: { getUserMedia } };

    const result = await captureIframeStream(iframe);

    expect(result).toBe(capturedStream);
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(addTrack).toHaveBeenCalledWith(audioTrack);

    global.navigator = originalNavigator;
  });
});
