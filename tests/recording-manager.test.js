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
});
