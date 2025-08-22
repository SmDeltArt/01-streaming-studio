
import RecordingManager from '../src/recording-manager.js';
import { jest } from '@jest/globals';

test('togglePause handles missing pause button gracefully', async () => {
  const manager = Object.create(RecordingManager.prototype);
  manager.isRecording = true;
  manager.mediaRecorder = { pause: jest.fn(), resume: jest.fn() };
  manager.isPaused = false;
  manager.pauseBtn = null;
  manager.updateRecordingStatus = jest.fn();

  await manager.togglePause();
  expect(manager.mediaRecorder.pause).not.toHaveBeenCalled();
  expect(manager.mediaRecorder.resume).not.toHaveBeenCalled();

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
