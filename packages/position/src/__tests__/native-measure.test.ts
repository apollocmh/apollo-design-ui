import { afterEach, describe, expect, it, vi } from 'vitest';
import { collectScroller, getVisibleArea, getWin, measureAlign, measureScale } from '../measure';
import { buildRig, resetDom, stubEle } from './measure-rig';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  resetDom();
});
const full = { left: 0, top: 0, right: 800, bottom: 600 };
const frameDocument = () => {
  const iframe = document.createElement('iframe');
  document.body.append(iframe);
  const doc = iframe.contentDocument;
  if (!doc?.defaultView) throw new Error('Expected a same-origin iframe document');
  return doc;
};

describe('native document and composed-tree measurement', () => {
  it('reads a foreign Document defaultView through its real node identity', () => {
    const doc = frameDocument();
    expect(getWin(doc)).toBe(doc.defaultView);
    expect(getWin(doc.body)).toBe(doc.defaultView);
  });

  it('measures a foreign Element as an element rather than a point tuple', () => {
    const doc = frameDocument();
    const popup = doc.createElement('div');
    const target = doc.createElement('button');
    popup.style.cssText = 'position:absolute;width:80px;height:40px';
    popup.getBoundingClientRect = () => new DOMRect(10, 20, 80, 40);
    target.getBoundingClientRect = () => new DOMRect(40, 70, 30, 20);
    doc.body.append(target, popup);
    const result = measureAlign({ popupEle: popup, target, scrollers: [] });
    expect(result?.target).toEqual({ x: 40, y: 70, width: 30, height: 20 });
    expect(result?.popup).toEqual({ x: 10, y: 20, width: 80, height: 40 });
  });

  it('does not require ambient Element or Document constructors for an owned DOM', () => {
    const { popup, restoreDoc } = buildRig();
    const target = stubEle({ rect: { x: 40, y: 70, width: 30, height: 20 } });
    vi.stubGlobal('Element', undefined);
    vi.stubGlobal('Document', undefined);
    try {
      expect(getWin(document)).toBe(window);
      expect(measureAlign({ popupEle: popup, target, scrollers: [] })?.target.width).toBe(30);
    } finally {
      restoreDoc();
    }
  });

  it('does not crop a foreign body/html shell a second time', () => {
    const doc = frameDocument();
    doc.body.style.overflow = 'hidden';
    doc.documentElement.style.overflow = 'hidden';
    expect(getVisibleArea(full, [doc.body, doc.documentElement])).toEqual(full);
  });

  it('collects clipping hosts across ShadowRoot boundaries', () => {
    const outer = document.createElement('div');
    const host = document.createElement('div');
    const popup = document.createElement('div');
    outer.style.overflow = 'auto';
    host.style.overflow = 'hidden';
    const root = host.attachShadow({ mode: 'closed' });
    root.append(popup);
    outer.append(host);
    document.body.append(outer);
    expect(collectScroller(popup)).toEqual([host, outer]);
  });
});

describe('native measurement transaction', () => {
  it('does not leave an empty style attribute on an originally CSS-only popup', () => {
    const { popup, restoreDoc } = buildRig();
    popup.removeAttribute('style');
    try {
      expect(measureAlign({ popupEle: popup, target: [0, 0], scrollers: [] })).not.toBeNull();
      expect(popup.hasAttribute('style')).toBe(false);
    } finally {
      restoreDoc();
    }
  });

  it('restores declaration ordering, longhands and important priority exactly', () => {
    const { popup, container, restoreDoc } = buildRig();
    popup.style.cssText =
      '--marker:before;position:absolute;width:80px;height:40px;left:13px!important;top:17px;overflow-x:scroll!important;overflow-y:auto;right:3px!important;color:red';
    const before = popup.getAttribute('style');
    try {
      expect(measureAlign({ popupEle: popup, target: [0, 0], scrollers: [] })).not.toBeNull();
      expect(popup.getAttribute('style')).toBe(before);
      expect(popup.style.getPropertyPriority('left')).toBe('important');
      expect(popup.style.getPropertyPriority('overflow-x')).toBe('important');
      expect(container.children).toHaveLength(1);
    } finally {
      restoreDoc();
    }
  });

  it('preserves the original measurement error when a placeholder has already been removed', () => {
    const { popup, container, restoreDoc } = buildRig();
    const target = stubEle();
    const before = popup.getAttribute('style');
    target.getBoundingClientRect = () => {
      const placeholder = container.lastElementChild;
      if (placeholder !== popup) placeholder?.remove();
      throw new Error('Target geometry failed');
    };
    try {
      expect(() => measureAlign({ popupEle: popup, target, scrollers: [] })).toThrow(
        'Target geometry failed',
      );
      expect(popup.getAttribute('style')).toBe(before);
      expect(container.children).toHaveLength(1);
    } finally {
      restoreDoc();
    }
  });

  it('keeps the placeholder session inside the actual ShadowRoot parent', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = host.attachShadow({ mode: 'open' });
    const popup = document.createElement('div');
    popup.style.cssText = 'position:absolute;width:80px;height:40px';
    popup.getBoundingClientRect = () => new DOMRect(10, 20, 80, 40);
    root.append(popup);
    let childrenAtRead = 0;
    Object.defineProperty(popup, 'offsetLeft', {
      get: () => {
        childrenAtRead = root.childElementCount;
        return 0;
      },
    });
    const before = popup.style.cssText;
    measureAlign({ popupEle: popup, target: [0, 0], scrollers: [] });
    expect(childrenAtRead).toBe(2);
    expect(root.childElementCount).toBe(1);
    expect(root.firstElementChild).toBe(popup);
    expect(popup.style.cssText).toBe(before);
  });
});

describe('native CSS box and clipping semantics', () => {
  it('consumes native clip-margin reference boxes while preserving the existing px-length form', () => {
    const element = stubEle({
      rect: { x: 100, y: 50, width: 200, height: 100 },
      offset: { width: 200, height: 100 },
      client: { width: 186, height: 86 },
      css: { overflow: 'clip', padding: '12px', border: '7px solid' },
    });
    for (const [value, expected] of [
      ['content-box 9px', { left: 110, top: 60, right: 290, bottom: 140 }],
      ['padding-box 9px', { left: 98, top: 48, right: 302, bottom: 152 }],
      ['border-box 9px', { left: 91, top: 41, right: 309, bottom: 159 }],
      ['9px', { left: 98, top: 48, right: 302, bottom: 152 }],
    ] as const) {
      element.style.overflowClipMargin = value;
      expect(getVisibleArea(full, [element])).toEqual(expected);
    }
  });

  it('content-box padding and borders are dimensions, not a transform scale', () => {
    const element = stubEle({
      rect: { x: 0, y: 0, width: 108, height: 68 },
      css: {
        width: '80px',
        height: '40px',
        padding: '10px',
        border: '4px solid',
        'box-sizing': 'content-box',
      },
    });
    expect(measureScale(element, { x: 0, y: 0, width: 108, height: 68 }, window)).toEqual({
      scaleX: 1,
      scaleY: 1,
    });
    expect(measureScale(element, { x: 0, y: 0, width: 216, height: 34 }, window)).toEqual({
      scaleX: 2,
      scaleY: 0.5,
    });
  });

  it('overflow-x clip does not also crop the visible Y axis', () => {
    const element = stubEle({
      rect: { x: 100, y: 50, width: 200, height: 100 },
      css: { 'overflow-x': 'clip', 'overflow-y': 'visible' },
    });
    expect(getVisibleArea(full, [element])).toEqual({ left: 100, top: 0, right: 300, bottom: 600 });
  });

  it('a cached ancestor that no longer clips does not retain its previous restriction', () => {
    const element = stubEle({
      rect: { x: 100, y: 50, width: 200, height: 100 },
      css: { overflow: 'hidden' },
    });
    expect(getVisibleArea(full, [element])).toEqual({
      left: 100,
      top: 50,
      right: 300,
      bottom: 150,
    });
    element.style.overflow = 'visible';
    element.style.overflowX = 'visible';
    element.style.overflowY = 'visible';
    expect(getVisibleArea(full, [element])).toEqual(full);
  });
});
