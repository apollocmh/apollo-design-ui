import { type Ref, shallowRef, type WatchSource, watch } from 'vue';

/** Keep a short leave delay; the watcher owns and releases its pending timeout. */
export function useDebounce<T>(source: WatchSource<T[]>): Ref<T[]> {
  const state = shallowRef<T[]>([]);
  watch(
    source,
    (value, _previous, onCleanup) => {
      const timer = setTimeout(
        () => {
          state.value = value;
        },
        value.length ? 0 : 10,
      );
      onCleanup(() => clearTimeout(timer));
    },
    { immediate: true },
  );
  return state;
}
