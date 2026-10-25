import { describe, expect, it, vi } from 'vitest';
import { getTargetScrollBarSize, isBodyOverflowing } from '../dom/get-scroll-bar-size';

describe('scrollbar geometry belongs to the target document', () => {
  it('measures a native foreign-realm element in its own body and removes its probe', () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    const doc = frame.contentDocument;
    if (!doc) throw new Error('Expected native frame document');
    const main = vi.spyOn(document.body, 'appendChild');
    const owner = vi.spyOn(doc.body, 'appendChild');
    try {
      expect(getTargetScrollBarSize(doc.body)).toEqual({ width: 0, height: 0 });
      expect(owner).toHaveBeenCalledOnce();
      expect(owner.mock.calls[0]?.[0].ownerDocument).toBe(doc);
      expect(main).not.toHaveBeenCalled();
      expect(doc.querySelector('[id^="apollo-scrollbar-measure"]')).toBeNull();
    } finally {
      main.mockRestore();
      owner.mockRestore();
      frame.remove();
    }
  });
  it('reads overflow geometry from the requested window, independently of the main body', () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    const doc = frame.contentDocument;
    if (!doc?.defaultView) throw new Error('Expected native frame document');
    Object.defineProperty(doc.defaultView, 'innerHeight', { configurable: true, value: 100 });
    Object.defineProperty(doc.defaultView, 'innerWidth', { configurable: true, value: 800 });
    Object.defineProperty(doc.body, 'scrollHeight', { configurable: true, value: 500 });
    Object.defineProperty(doc.body, 'offsetWidth', { configurable: true, value: 780 });
    try {
      expect(isBodyOverflowing(doc)).toBe(true);
      expect(isBodyOverflowing()).toBe(false);
      expect(isBodyOverflowing(null)).toBe(false);
    } finally {
      frame.remove();
    }
  });
});
