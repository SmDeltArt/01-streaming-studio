import { describe, it, expect, vi } from 'vitest';
import RecordingManager from '../src/recording-manager.js';

describe('RecordingManager togglePause', () => {
  it('does nothing when not recording', async () => {
    const mgr = new RecordingManager({});
    const pause = vi.fn();
    mgr.mediaRecorder = { pause };
    await mgr.togglePause();
    expect(pause).not.toHaveBeenCalled();
    expect(mgr.isPaused).toBe(false);
  });

  it('pauses and resumes recording', async () => {
    const mgr = new RecordingManager({});
    mgr.isRecording = true;
    const pause = vi.fn();
    const resume = vi.fn();
    mgr.mediaRecorder = { pause, resume };

    await mgr.togglePause();
    expect(pause).toHaveBeenCalled();
    expect(mgr.isPaused).toBe(true);

    await mgr.togglePause();
    expect(resume).toHaveBeenCalled();
    expect(mgr.isPaused).toBe(false);
  });
});
