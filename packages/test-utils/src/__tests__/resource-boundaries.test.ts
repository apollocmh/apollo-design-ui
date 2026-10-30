import { observeResize } from '@apollo-design/utils';
import { expect, it, vi } from 'vitest';
import { defineComponent, h, onBeforeUnmount, onMounted, onScopeDispose, ref } from 'vue';
import { describeObserverLeaks, snapshotObservers } from '../mount-test';
import { mountCase } from '../render';
import { flushAll } from '../timing';
import { assertNoUnexpectedWarnings, captureWarnings } from '../warnings';

it('removes its host and stops rendering when the render factory throws during mount', async () => {
  const before = [...document.body.childNodes];
  const failure = new Error('render failed');
  const version = ref(0);
  const render = vi.fn(() => {
    void version.value;
    throw failure;
  });
  const capture = captureWarnings();
  try {
    expect(() => mountCase(render)).toThrow(failure);
    expect([...document.body.childNodes]).toEqual(before);
    version.value += 1;
    await expect(flushAll()).resolves.toBeUndefined();
    expect(render).toHaveBeenCalledTimes(1);
  } finally {
    capture.restore();
    document.body.replaceChildren(...before);
  }
});

it('disposes a mounted child and its observer after its mounted hook fails', () => {
  const before = [...document.body.childNodes];
  const baseline = snapshotObservers();
  const failure = new Error('mounted failed');
  let released = false;
  const Broken = defineComponent({
    setup() {
      const element = ref<HTMLElement | null>(null);
      let release = () => {};
      onScopeDispose(() => {
        released = true;
        release();
      });
      onMounted(() => {
        if (!element.value) throw new Error('Expected the mounted element');
        release = observeResize(element.value, () => {});
        throw failure;
      });
      return () => h('div', { ref: element });
    },
  });
  const capture = captureWarnings();
  try {
    expect(() => mountCase(() => h(Broken))).toThrow(failure);
    expect(released).toBe(true);
    expect(describeObserverLeaks(baseline)).toEqual([]);
    expect([...document.body.childNodes]).toEqual(before);
  } finally {
    capture.restore();
    document.body.replaceChildren(...before);
  }
});

it('removes its host even when an unmount hook throws', () => {
  const baseline = snapshotObservers();
  const failure = new Error('unmount failed');
  let failed = false;
  let released = false;
  const Broken = defineComponent({
    setup() {
      const element = ref<HTMLElement | null>(null);
      let release = () => {};
      onMounted(() => {
        if (element.value) release = observeResize(element.value, () => {});
      });
      onScopeDispose(() => {
        release();
        released = true;
      });
      onBeforeUnmount(() => {
        if (!failed) {
          failed = true;
          throw failure;
        }
      });
      return () => h('div', { ref: element });
    },
  });
  const mounted = mountCase(() => h(Broken));
  const capture = captureWarnings();
  try {
    expect(() => mounted.destroy()).toThrow(failure);
    expect(mounted.host.isConnected).toBe(false);
    expect(released).toBe(true);
    expect(describeObserverLeaks(baseline)).toEqual([]);
    expect(() => mounted.destroy()).not.toThrow();
  } finally {
    capture.restore();
    mounted.host.remove();
  }
});

it('restoring an outer warning capture keeps the inner capture active and finally restores console', () => {
  const origin = { error: console.error, warn: console.warn };
  const outer = captureWarnings();
  const inner = captureWarnings();
  try {
    outer.restore();
    console.warn('inner remains active');
    expect(inner.texts()).toEqual(['inner remains active']);
    expect(outer.texts()).toEqual([]);
    inner.restore();
    expect(console.error).toBe(origin.error);
    expect(console.warn).toBe(origin.warn);
  } finally {
    inner.restore();
    outer.restore();
    console.error = origin.error;
    console.warn = origin.warn;
  }
});

it('detects a new resize target even when a baseline target disappears and the count stays equal', () => {
  const previous = document.createElement('div');
  const leaked = document.createElement('div');
  const releasePrevious = observeResize(previous, () => {});
  const baseline = snapshotObservers();
  if (!baseline) throw new Error('Expected the observable observer fixtures');
  releasePrevious();
  const releaseLeaked = observeResize(leaked, () => {});
  try {
    expect(describeObserverLeaks(baseline)).toEqual([expect.stringContaining('仍观察着 1 个元素')]);
  } finally {
    releaseLeaked();
  }
});

it('does not treat an advertised observer without targets as a passing leak check', () => {
  const observer = globalThis.ResizeObserver;
  if (!('instances' in observer) || !(observer.instances instanceof Set)) {
    throw new Error('Expected observable observer fixtures');
  }
  const malformed = {};
  observer.instances.add(malformed);
  try {
    expect(() => snapshotObservers()).toThrow(/targets Set/);
    expect(() => describeObserverLeaks()).toThrow(/targets Set/);
  } finally {
    observer.instances.delete(malformed);
  }
});

it('an empty warning match cannot exempt unrelated warnings', () => {
  expect(() =>
    assertNoUnexpectedWarnings(
      [{ method: 'warn', args: ['unexpected'], text: 'unexpected' }],
      [{ match: '', reason: 'This must identify a specific warning' }],
      'empty match',
    ),
  ).toThrow(/match.*非空/);
});
