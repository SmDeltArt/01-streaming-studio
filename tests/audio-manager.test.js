import AudioManager from "../src/audio-manager.js";

let created = 0;
class FakeAudioContext {
  constructor() { created++; }
  createAnalyser() { return {}; }
  createMediaStreamSource() { return {}; }
  close() {}
}

describe("audio-manager setupAudioVisualizer", () => {
  beforeAll(() => {
    globalThis.AudioContext = FakeAudioContext;
    globalThis.webkitAudioContext = FakeAudioContext;
  });

  beforeEach(() => { created = 0; });

  it("does nothing and does not throw when mediaStream is null/undefined", () => {
    const mgr = new AudioManager({});
    expect(() => mgr.setupAudioVisualizer?.(null)).not.toThrow();
    expect(() => mgr.setupAudioVisualizer?.(undefined)).not.toThrow();
    expect(created).toBe(0);
  });
});
