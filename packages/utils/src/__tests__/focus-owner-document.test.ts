import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { lockFocus, resetFocusLock, triggerFocus, useLockFocus } from '../dom/focus';
import isVisible from '../dom/is-visible';

const ownedNodes: HTMLElement[] = [];
afterEach(() => {
  resetFocusLock();
  vi.restoreAllMocks();
  for (const node of ownedNodes.splice(0)) node.remove();
});
function frameDocument() {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  ownedNodes.push(frame);
  const doc = frame.contentDocument;
  if (!doc?.defaultView) throw new Error('Expected an actual iframe document/window');
  return { doc, view: doc.defaultView };
}
function region(doc: Document, controls = true) {
  const root = doc.createElement('div');
  root.tabIndex = -1;
  const first = doc.createElement('button');
  const last = doc.createElement('button');
  if (controls) root.append(first, last);
  const outside = doc.createElement('button');
  doc.body.append(root, outside);
  ownedNodes.push(root, outside);
  // jsdom has no layout engine. Only supply connected layout for these nodes;
  // the production browser probe verifies real visibility and native focus.
  for (const node of [root, first, last, outside]) {
    Object.defineProperty(node, 'offsetParent', {
      configurable: true,
      get: () => (node.isConnected ? node.parentElement : null),
    });
  }
  return { root, first, last, outside };
}
function deliverMutations(doc: Document) {
  // The repository replaces the main-window observer with a manual-delivery
  // mock. Foreign windows may retain jsdom's native microtask delivery.
  const observerConstructor: unknown = doc.defaultView?.MutationObserver;
  if (
    typeof observerConstructor !== 'function' ||
    !('instances' in observerConstructor) ||
    !(observerConstructor.instances instanceof Set)
  )
    return;
  const instances: Iterable<unknown> = observerConstructor.instances;
  for (const observer of instances) {
    if (
      observer &&
      typeof observer === 'object' &&
      'trigger' in observer &&
      typeof observer.trigger === 'function'
    )
      observer.trigger();
  }
}

describe('focus ownership across actual documents', () => {
  it('preserves an editor in an open descendant shadow tree when outside focus is refused', () => {
    const nodes = region(document);
    const host = document.createElement('span');
    nodes.root.insertBefore(host, nodes.last);
    const shadow = host.attachShadow({ mode: 'open' });
    const input = document.createElement('input');
    shadow.append(input);
    Object.defineProperty(input, 'offsetParent', { configurable: true, get: () => host });
    const release = lockFocus(nodes.root, 'descendant-shadow');
    try {
      input.focus();
      nodes.outside.focus();
      expect(shadow.activeElement).toBe(input);
    } finally {
      release();
    }
  });
  for (const mode of ['open', 'closed'] as const) {
    it(`keeps the current control and cycles Tab inside an actual ${mode} ShadowRoot`, () => {
      const host = document.createElement('div');
      document.body.append(host);
      ownedNodes.push(host);
      const shadow = host.attachShadow({ mode });
      const nodes = region(document);
      shadow.append(nodes.root);
      const release = lockFocus(nodes.root, `shadow-${mode}`);
      try {
        nodes.last.focus();
        expect(shadow.activeElement).toBe(nodes.last);
        const tab = new KeyboardEvent('keydown', {
          key: 'Tab',
          bubbles: true,
          composed: true,
          cancelable: true,
        });
        nodes.last.dispatchEvent(tab);
        expect(tab.defaultPrevented).toBe(true);
        expect(shadow.activeElement).toBe(nodes.first);
        nodes.last.focus();
        nodes.outside.focus();
        expect(shadow.activeElement).toBe(nodes.last);
      } finally {
        release();
      }
    });
  }
  it('shares one document observer while locks are active and disconnects after the last release', () => {
    const first = region(document);
    const second = region(document);
    const observe = vi.spyOn(window.MutationObserver.prototype, 'observe');
    const disconnect = vi.spyOn(window.MutationObserver.prototype, 'disconnect');
    const releaseFirst = lockFocus(first.root, 'observer-first');
    const releaseSecond = lockFocus(second.root, 'observer-second');
    expect(observe).toHaveBeenCalledTimes(1);
    releaseFirst();
    expect(disconnect).not.toHaveBeenCalled();
    releaseSecond();
    expect(disconnect).toHaveBeenCalledTimes(1);
    const reopened = lockFocus(first.root, 'observer-reopened');
    expect(observe).toHaveBeenCalledTimes(2);
    reopened();
    expect(disconnect).toHaveBeenCalledTimes(2);
  });
  it('does not register a delayed retry after its Vue scope has stopped', async () => {
    const nodes = region(document);
    const element = ref<HTMLElement | null>(null);
    const add = vi.spyOn(window, 'addEventListener');
    const scope = effectScope();
    scope.run(() => useLockFocus(true, element));
    scope.stop();
    element.value = nodes.root;
    await nextTick();
    await nextTick();
    expect(add).not.toHaveBeenCalledWith('focusin', expect.any(Function));
    nodes.outside.focus();
    expect(document.activeElement).toBe(nodes.outside);
  });
  it('preserves the remembered editor when a locked region moves to another parent in the same document', async () => {
    const nodes = region(document);
    const holder = document.createElement('section');
    document.body.append(holder);
    ownedNodes.push(holder);
    const release = lockFocus(nodes.root, 'same-document-move');
    nodes.last.focus();
    holder.append(nodes.root);
    deliverMutations(document);
    await nextTick();
    expect(document.activeElement).toBe(nodes.last);
    release();
  });
  it('moves the same locked node between documents and releases listeners from its current owner', async () => {
    const { doc, view } = frameDocument();
    const nodes = region(document);
    const add = vi.spyOn(view, 'addEventListener');
    const remove = vi.spyOn(view, 'removeEventListener');
    const release = lockFocus(nodes.root, 'adopt');
    nodes.last.focus();
    doc.body.append(nodes.root);
    deliverMutations(document);
    await nextTick();
    await nextTick();
    expect(doc.activeElement).toBe(nodes.last);
    expect(add).toHaveBeenCalledWith('focusin', expect.any(Function));
    const outside = doc.createElement('button');
    doc.body.append(outside);
    outside.focus();
    expect(doc.activeElement).toBe(nodes.last);
    document.body.append(nodes.root);
    deliverMutations(doc);
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(nodes.last);
    release();
    expect(remove).toHaveBeenCalledWith(
      'focusin',
      add.mock.calls.find(([name]) => name === 'focusin')?.[1],
    );
    nodes.outside.focus();
    expect(document.activeElement).toBe(nodes.outside);
  });
  it('uses the owning window for listeners, visibility, focus escape and Tab direction', () => {
    const { doc, view } = frameDocument();
    const nodes = region(doc);
    const add = vi.spyOn(view, 'addEventListener');
    const remove = vi.spyOn(view, 'removeEventListener');
    const addMain = vi.spyOn(window, 'addEventListener');
    expect(isVisible(nodes.first)).toBe(true);
    const release = lockFocus(nodes.root, 'frame');
    expect(add).toHaveBeenCalledWith('focusin', expect.any(Function));
    expect(addMain).not.toHaveBeenCalledWith('focusin', expect.any(Function));
    expect(doc.activeElement).toBe(nodes.first);
    nodes.last.focus();
    nodes.last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    nodes.outside.focus();
    expect(doc.activeElement).toBe(nodes.first);
    nodes.first.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    );
    nodes.outside.focus();
    expect(doc.activeElement).toBe(nodes.last);
    release();
    expect(remove).toHaveBeenCalledWith(
      'focusin',
      add.mock.calls.find(([name]) => name === 'focusin')?.[1],
    );
    nodes.outside.focus();
    expect(doc.activeElement).toBe(nodes.outside);
  });
  it('keeps document stacks independent and restores the previous local lock after a nested release', () => {
    const { doc } = frameDocument();
    const main = region(document);
    const frame = region(doc);
    const nested = region(doc);
    const releaseMain = lockFocus(main.root, 'main');
    const releaseFrame = lockFocus(frame.root, 'frame');
    frame.last.focus();
    const releaseNested = lockFocus(nested.root, 'nested');
    main.outside.focus();
    expect(main.root.contains(document.activeElement)).toBe(true);
    nested.outside.focus();
    expect(nested.root.contains(doc.activeElement)).toBe(true);
    releaseNested();
    nested.outside.focus();
    expect(frame.root.contains(doc.activeElement)).toBe(true);
    expect(doc.activeElement).toBe(frame.last);
    releaseMain();
    frame.outside.focus();
    expect(frame.root.contains(doc.activeElement)).toBe(true);
    releaseFrame();
  });
  it('traps a programmatically focusable region even when slots leave no tabbable children', () => {
    const { root, outside } = region(document, false);
    const release = lockFocus(root, 'empty');
    expect(document.activeElement).toBe(root);
    outside.focus();
    expect(document.activeElement).toBe(root);
    release();
  });
  it('cycles Tab synchronously at document boundaries while respecting child preventDefault', () => {
    const nodes = region(document);
    const release = lockFocus(nodes.root, 'tab-boundary');
    nodes.last.focus();
    const prevented = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    nodes.last.addEventListener('keydown', (event) => event.preventDefault(), { once: true });
    nodes.last.dispatchEvent(prevented);
    expect(document.activeElement).toBe(nodes.last);
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    nodes.last.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(nodes.first);
    release();
  });
  it('does not let a stale release remove a replacement with the same public lock id', () => {
    const first = region(document);
    const second = region(document);
    const releaseOld = lockFocus(first.root, 'replace');
    const releaseCurrent = lockFocus(second.root, 'replace');
    releaseOld();
    second.outside.focus();
    expect(second.root.contains(document.activeElement)).toBe(true);
    releaseCurrent();
  });
  it('sets an actual foreign input selection through triggerFocus', () => {
    const { doc } = frameDocument();
    const input = doc.createElement('input');
    input.value = 'Frame input';
    doc.body.append(input);
    triggerFocus(input, { cursor: 'end' });
    expect(doc.activeElement).toBe(input);
    expect([input.selectionStart, input.selectionEnd]).toEqual([11, 11]);
  });
});
