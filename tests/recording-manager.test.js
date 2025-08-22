import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/crop-utils.js', () => ({
  applyRegionCrop: vi.fn(),
  cropBlobToRegion: vi.fn().mockResolvedValue(new Blob(['cropped'], { type: 'video/webm' }))
}));

import RecordingManager from '../src/recording-manager.js';

import { cropBlobToRegion, applyRegionCrop } from '../src/crop-utils.js';

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


describe('RecordingManager region calculation', () => {
  it('uses device-pixel-aware region when size is auto', async () => {
    document.body.innerHTML = `
      <select id="recordingSize"><option value="auto">auto</option></select>
      <span id="currentSize"></span>
      <select id="frameRateSelect"><option value="30">30</option></select>
      <select id="recordingFormat"><option value="webm">webm</option></select>
      <div id="recordingStatus"></div>
      <div id="recordingIndicator"></div>
      <div id="recordingStatusText"></div>
      <div id="recordingTimer"></div>
      <button id="pauseBtn"><span class="label"></span><span class="icon"></span></button>
    `;

    const content = document.createElement('div');
    content.getBoundingClientRect = () => ({ left: 0, top: 100, width: 512, height: 512 });

    const recordBtn = {
      setAttribute: vi.fn(),
      querySelector: () => ({ innerHTML: '', textContent: '' })
    };
    const stopBtn = { disabled: true };
    const app = {
      contentDisplay: content,
      contentFrame: document.createElement('iframe'),
      cameraManager: { mediaStream: null },
      updateStatus: vi.fn(),
      recordBtn,
      stopBtn
    };

    Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });

    navigator.mediaDevices = {
      getDisplayMedia: vi.fn().mockResolvedValue({
        getVideoTracks: () => [],
        getAudioTracks: () => [],
        addTrack: vi.fn(),
        getTracks: () => []
      })
    };

    applyRegionCrop.mockResolvedValue({
      getVideoTracks: () => [],
      getAudioTracks: () => [],
      addTrack: vi.fn(),
      getTracks: () => []
    });

    class FakeRecorder {
      constructor(stream) {
        this.stream = stream;
        this.state = 'inactive';
      }
      start() { this.state = 'recording'; }
      stop() { this.state = 'inactive'; if (this.onstop) this.onstop(); }
    }
    FakeRecorder.isTypeSupported = () => true;
    global.MediaRecorder = FakeRecorder;

    const manager = new RecordingManager(app);
    await manager.startRecording();

    expect(manager.lastRegion).toEqual({ x: 0, y: 200, width: 1024, height: 1024 });
    expect(applyRegionCrop).toHaveBeenCalledWith(expect.any(Object), manager.lastRegion, content, 30);
  });
});

