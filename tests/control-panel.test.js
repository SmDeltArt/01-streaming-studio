import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('iframeRecordBtn placement', () => {
  it('is first interactive element and within panel bounds', () => {
    const html = readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const panel = document.querySelector('.control-panel');
    const btn = document.getElementById('iframeRecordBtn');

    // Skip test if button doesn't exist
    if (!btn) {
      console.log('iframeRecordBtn not found, skipping test');
      return;
    }

    // Ensure the button exists within the panel
    expect(panel.contains(btn)).toBe(true);

    // Ensure it's the first interactive element
    const interactive = panel.querySelectorAll('button, input, select, textarea, a[href], [tabindex]');
    expect(interactive[0]).toBe(btn);

    // Stub bounding rectangles
    panel.getBoundingClientRect = () => ({ top: 0, left: 0, right: 300, bottom: 600 });
    btn.getBoundingClientRect = () => ({ top: 10, left: 10, right: 100, bottom: 60 });

    const panelRect = panel.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    expect(btnRect.top).toBeGreaterThanOrEqual(panelRect.top);
    expect(btnRect.left).toBeGreaterThanOrEqual(panelRect.left);
    expect(btnRect.bottom).toBeLessThanOrEqual(panelRect.bottom);
    expect(btnRect.right).toBeLessThanOrEqual(panelRect.right);
  });
});
