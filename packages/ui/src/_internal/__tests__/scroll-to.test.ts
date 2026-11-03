import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrollTo } from '../scroll-to';

afterEach(() => vi.restoreAllMocks());

describe('Issue #86: CSS smooth scrolling does not override the shared animation', () => {
  it('uses immediate Window coordinates and keeps horizontal position', () => {
    const nativeScroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const done = vi.fn();
    scrollTo(75, { getContainer: () => window, duration: 0, callback: done });
    expect(nativeScroll).toHaveBeenCalledExactlyOnceWith({
      left: window.pageXOffset,
      top: 75,
      behavior: 'instant',
    });
    expect(done).toHaveBeenCalledOnce();
  });

  it('uses the Document scroll root with immediate coordinates', () => {
    const root = document.documentElement;
    const nativeScroll = vi.fn();
    Object.defineProperty(root, 'scrollTo', { configurable: true, value: nativeScroll });
    try {
      scrollTo(25, { getContainer: () => document, duration: 0 });
      expect(nativeScroll).toHaveBeenCalledExactlyOnceWith({
        left: root.scrollLeft,
        top: 25,
        behavior: 'instant',
      });
    } finally {
      Reflect.deleteProperty(root, 'scrollTo');
    }
  });

  it('uses immediate Element coordinates without changing its scroll-behavior style', () => {
    const target = document.createElement('div');
    target.style.scrollBehavior = 'smooth';
    target.scrollLeft = 40;
    const nativeScroll = vi.fn();
    Object.defineProperty(target, 'scrollTo', { configurable: true, value: nativeScroll });
    scrollTo(50, { getContainer: () => target, duration: 0 });
    expect(nativeScroll).toHaveBeenCalledExactlyOnceWith({
      left: 40,
      top: 50,
      behavior: 'instant',
    });
    expect(target.style.scrollBehavior).toBe('smooth');
  });
});
