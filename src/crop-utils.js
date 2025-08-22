export function cropStreamToRegion(stream, region, frameRate = 30) {
  if (!stream || !region) return stream;

  const [videoTrack] = stream.getVideoTracks();
  if (!videoTrack) return stream;

  const audioTracks = stream.getAudioTracks();
  const video = document.createElement('video');
  video.srcObject = new MediaStream([videoTrack]);
  video.play();

  const canvas = document.createElement('canvas');
  canvas.width = region.width;
  canvas.height = region.height;
  const ctx = canvas.getContext('2d');

  function draw() {
    ctx.drawImage(
      video,
      region.x,
      region.y,
      region.width,
      region.height,
      0,
      0,
      region.width,
      region.height
    );
    requestAnimationFrame(draw);
  }
  draw();

  const canvasStream = canvas.captureStream(frameRate);
  audioTracks.forEach(track => canvasStream.addTrack(track));
  return canvasStream;
}

export async function applyRegionCrop(
  stream,
  region,
  contentElement,
  frameRate = 30,
  cropper = cropStreamToRegion
) {
  if (!stream || !region) return stream;
  const [track] = stream.getVideoTracks();
  if (!track) return stream;

  if (typeof track.cropTo === 'function' && globalThis?.CropTarget?.fromElement) {
    try {
      const target = await globalThis.CropTarget.fromElement(contentElement);
      await track.cropTo(target);
      return stream;
    } catch (err) {
      console.warn('Native cropTo failed:', err);
    }
  }

  return cropper(stream, region, frameRate);
}

export async function cropBlobToRegion(blob, region, frameRate = 30) {
  if (!blob || !region) return blob;

  const video = document.createElement('video');
  const src = URL.createObjectURL(blob);
  video.src = src;
  await video.play();

  const canvas = document.createElement('canvas');
  canvas.width = region.width;
  canvas.height = region.height;
  const ctx = canvas.getContext('2d');

  const stream = canvas.captureStream(frameRate);
  const recorder = new MediaRecorder(stream, { mimeType: blob.type });
  const chunks = [];
  recorder.ondataavailable = e => e.data.size && chunks.push(e.data);
  recorder.start();

  function draw() {
    ctx.drawImage(
      video,
      region.x,
      region.y,
      region.width,
      region.height,
      0,
      0,
      region.width,
      region.height
    );
    if (!video.paused && !video.ended) {
      requestAnimationFrame(draw);
    }
  }

  video.addEventListener('play', draw);

  return new Promise(resolve => {
    video.addEventListener('ended', () => recorder.stop(), { once: true });
    recorder.addEventListener(
      'stop',
      () => {
        const cropped = new Blob(chunks, { type: blob.type });
        URL.revokeObjectURL(src);
        resolve(cropped);
      },
      { once: true }
    );
  });
}
