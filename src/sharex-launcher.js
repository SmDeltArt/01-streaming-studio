export function launchShareX(workflow, region) {
  if (!workflow) {
    throw new Error('workflow is required');
  }
  const base = `sharex-launch://record?wf=${encodeURIComponent(workflow)}`;
  const regionStr = region && typeof region === 'object'
    ? `${region.x},${region.y},${region.width},${region.height}`
    : null;
  const url = regionStr ? `${base}&region=${regionStr}` : base;
  window.location.href = url;
}

export default launchShareX;
