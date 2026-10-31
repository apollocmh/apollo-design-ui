import { observeResize } from '@apollo-design/utils';
import { onBeforeUnmount, onMounted, onUpdated, shallowRef, type VNodeRef, watch } from 'vue';
import { stickyPush } from './engine';
import type { ListyKey } from './interface';

interface Entry {
  element: HTMLElement;
  stop: () => void;
}
interface HeaderMetric {
  key: ListyKey;
  top: number;
  height: number;
}

/** Measure natural flow anchors; keep the actual, interactive sticky header unique. */
export function useRawSticky(options: {
  holder: () => HTMLElement | null;
  keys: () => ListyKey[];
  active: () => boolean;
}) {
  const entries = new Map<string, Entry>();
  const refs = new Map<string, VNodeRef>();
  const offsets = shallowRef(new Map<ListyKey, number>());
  let frame: number | undefined;
  let disposed = false;
  let stopWatching: (() => void) | undefined;

  function measure() {
    frame = undefined;
    const holder = options.holder();
    if (!holder || !options.active()) {
      if (offsets.value.size) offsets.value = new Map();
      return;
    }
    const holderRect = holder.getBoundingClientRect();
    const origin = holderRect.top + holder.clientTop - holder.scrollTop;
    let viewportTop = 0;
    for (let ancestor: HTMLElement | null = holder; ancestor; ancestor = ancestor.parentElement) {
      if (/(auto|scroll|hidden|overlay)/.test(getComputedStyle(ancestor).overflowY)) {
        viewportTop = ancestor.getBoundingClientRect().top + ancestor.clientTop;
        break;
      }
    }
    const scrollTop = viewportTop - origin;
    const metrics: HeaderMetric[] = [];
    for (const key of options.keys()) {
      const id = `${typeof key}:${key}`;
      const anchor = entries.get(`anchor:${id}`)?.element;
      const header = entries.get(`header:${id}`)?.element;
      if (anchor && header)
        metrics.push({
          key,
          top: anchor.getBoundingClientRect().top - origin,
          height: header.getBoundingClientRect().height,
        });
    }
    let active = 0;
    metrics.forEach((metric, index) => {
      if (metric.top <= scrollTop + 1) active = index;
    });
    const next = new Map<ListyKey, number>();
    metrics.forEach((metric, index) => {
      const nextTop = metrics[index + 1]?.top;
      next.set(
        metric.key,
        index < active
          ? -metric.height
          : index === active && nextTop !== undefined
            ? stickyPush(nextTop, metric.height, scrollTop)
            : 0,
      );
    });
    if (
      next.size !== offsets.value.size ||
      [...next].some(([key, value]) => offsets.value.get(key) !== value)
    ) {
      offsets.value = next;
    }
  }
  function schedule() {
    if (disposed || !options.active()) return;
    if (frame === undefined && typeof requestAnimationFrame === 'function')
      frame = requestAnimationFrame(measure);
  }
  function nodeRef(id: string): VNodeRef {
    const existing = refs.get(id);
    if (existing) return existing;
    const callback: VNodeRef = (element) => {
      const previous = entries.get(id);
      if (previous?.element === element) return;
      previous?.stop();
      entries.delete(id);
      if (element instanceof HTMLElement) {
        entries.set(id, { element, stop: observeResize(element, schedule) });
      } else {
        refs.delete(id);
      }
      schedule();
    };
    refs.set(id, callback);
    return callback;
  }
  onMounted(() => {
    stopWatching = watch(
      options.active,
      (active) => {
        document.removeEventListener('scroll', schedule, true);
        window.removeEventListener('resize', schedule);
        if (frame !== undefined) cancelAnimationFrame(frame);
        frame = undefined;
        if (active) {
          document.addEventListener('scroll', schedule, true);
          window.addEventListener('resize', schedule);
          schedule();
        }
      },
      { immediate: true, flush: 'post' },
    );
  });
  onUpdated(schedule);
  onBeforeUnmount(() => {
    disposed = true;
    stopWatching?.();
    document.removeEventListener('scroll', schedule, true);
    window.removeEventListener('resize', schedule);
    if (frame !== undefined) cancelAnimationFrame(frame);
    for (const entry of entries.values()) entry.stop();
    entries.clear();
    refs.clear();
  });
  return { offsets, nodeRef };
}
