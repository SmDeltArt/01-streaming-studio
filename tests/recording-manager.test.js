import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/crop-utils.js', () => ({
  applyRegionCrop: vi.fn(),
  cropBlobToRegion: vi.fn().mockResolvedValue(new Blob(['cropped'], { type: 'video/webm' }))
}));

import RecordingManager from '../src/recording-manager.js';
import { cropBlobToRegion } from '../src/crop-utils.js';

describe('RecordingManager showRecordingComplete', () => {
  it('adds Same Frame Only button and crops on click', async () => {
    document.body.innerHTML = `
      <select id="recordingSize"></select>
      <span id="currentSize"></span>
      <select id="frameRateSelect"></select>
      <select id="recordingFormat"></select>
      <div id="recordingStatus"></div>
      <div id="recordingIndicator"></div>
      <div id="recordingStatusText"></div>
      <div id="recordingTimer"></div>
      <button id="pauseBtn"><span class="label"></span><span class="icon"></span></button>
    `;

    global.URL.createObjectURL = vi.fn(() => 'blob:url');
    global.URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();

    const app = {
      contentDisplay: document.createElement('div'),
      updateStatus: vi.fn(),
      cameraManager: { mediaStream: null }
    };

    const manager = new RecordingManager(app);
    manager.lastRegion = { x: 0, y: 0, width: 100, height: 100 };

    const blob = new Blob(['video'], { type: 'video/webm' });
    manager.showRecordingComplete('blob:url', 'test.webm', blob);

    const btn = document.querySelector('.same-frame-btn');
    expect(btn).toBeTruthy();

    btn.click();
    await Promise.resolve();

    expect(cropBlobToRegion).toHaveBeenCalledWith(blob, manager.lastRegion);
  });
});
