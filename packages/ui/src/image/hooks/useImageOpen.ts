import { computed, ref, watch } from 'vue';

interface OpenProps {
  readonly open?: boolean;
  readonly defaultOpen: boolean;
}
interface OpenEmitter {
  (event: 'openChange', next: boolean, previous: boolean): void;
  (event: 'update:open', next: boolean): void;
}

/** Both public entries share the same controlled-removal and request ordering. */
export function useImageOpen(props: OpenProps, emit: OpenEmitter) {
  const inner = ref(props.defaultOpen);
  const open = computed(() => props.open ?? inner.value);
  watch(
    () => props.open,
    (value) => {
      if (value !== undefined) inner.value = value;
    },
    { immediate: true },
  );
  const setOpen = (next: boolean) => {
    const previous = open.value;
    if (props.open === undefined) inner.value = next;
    emit('openChange', next, previous);
    emit('update:open', next);
  };
  return { open, setOpen };
}
