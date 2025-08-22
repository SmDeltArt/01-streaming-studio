import { describe, it, expect, vi } from 'vitest';
import * as utils from '../src/crop-utils.js';

describe('applyRegionCrop', () => {
  it('uses track.cropTo when available', async () => {
    const track = { cropTo: vi.fn().mockResolvedValue(), kind: 'video' };
    const stream = { getVideoTracks: () => [track] };
    globalThis.CropTarget = { fromElement: vi.fn().mockResolvedValue('target') };

    await utils.applyRegionCrop(stream, { x: 0, y: 0, width: 100, height: 100 }, {}, 30);

    expect(track.cropTo).toHaveBeenCalledWith('target');
  });

  it('falls back to canvas cropping when cropTo is unavailable', async () => {
    const track = { kind: 'video' };
    const stream = {
      getVideoTracks: () => [track],
      getAudioTracks: () => []
    };
    const cropper = vi.fn().mockReturnValue(stream);

    const result = await utils.applyRegionCrop(
      stream,
      { x: 0, y: 0, width: 100, height: 100 },
      {},
      30,
      cropper
    );

    expect(cropper).toHaveBeenCalled();
    expect(result).toBe(stream);
  });
});
