import { useControlledValue } from '@apollo-design/utils';
import { computed, nextTick, type Ref, ref } from 'vue';

type Editor = HTMLInputElement | HTMLTextAreaElement;

interface InputValueOptions {
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onChange?: (event: Event) => void;
  onValueChange?: (value: string) => void;
  onClear?: (event: MouseEvent) => void;
}

/** Shared Vue value/IME boundary. Public DOM events retain their native receivers. */
export function useInputValue(
  props: InputValueOptions,
  editor: Ref<Editor | null>,
  normalize: (value: string, composing: boolean) => string,
) {
  const [value, setValue] = useControlledValue<string | undefined>({
    defaultValue: () => props.defaultValue,
    getValue: () => props.value,
  });
  const composing = ref(false);
  const draft = ref<string>();
  const formatValue = computed(() => draft.value ?? value.value ?? '');
  let compositionValue: { raw: string; settled: string } | undefined;
  let clearing = false;

  function reconcile(): void {
    void nextTick(() => {
      const el = editor.value;
      if (el && !composing.value && props.value !== undefined && el.value !== props.value)
        el.value = props.value;
    });
  }

  function commit(event: Event, raw: string): void {
    const settled = normalize(raw, false);
    const el = editor.value;
    if (el && el.value !== settled) el.value = settled;
    draft.value = undefined;
    setValue(settled);
    props.onValueChange?.(settled);
    props.onChange?.(event);
    reconcile();
  }

  function onInput(event: Event): void {
    const raw = editor.value?.value ?? '';
    if (clearing) {
      props.onChange?.(event);
      return;
    }
    if (composing.value || (event instanceof InputEvent && event.isComposing)) {
      draft.value = raw;
      return;
    }
    const previous = compositionValue;
    compositionValue = undefined;
    if (previous && (raw === previous.raw || raw === previous.settled)) {
      if (editor.value) editor.value.value = previous.settled;
      reconcile();
      return;
    }
    commit(event, raw);
  }

  function onCompositionstart(): void {
    composing.value = true;
    compositionValue = undefined;
    draft.value = editor.value?.value ?? '';
  }

  function onCompositionend(event: CompositionEvent): void {
    if (!composing.value) return;
    composing.value = false;
    const raw = editor.value?.value ?? '';
    commit(event, raw);
    compositionValue = { raw, settled: editor.value?.value ?? '' };
  }

  function clear(event: MouseEvent): void {
    const el = editor.value;
    if (!el || props.disabled || props.readOnly) return;
    composing.value = false;
    compositionValue = undefined;
    draft.value = undefined;
    el.value = '';
    setValue('');
    props.onValueChange?.('');
    el.focus();
    props.onClear?.(event);
    clearing = true;
    try {
      const NativeInputEvent = el.ownerDocument.defaultView?.InputEvent;
      el.dispatchEvent(
        NativeInputEvent
          ? new NativeInputEvent('input', {
              bubbles: true,
              inputType: 'deleteContentBackward',
              data: null,
            })
          : new Event('input', { bubbles: true }),
      );
    } finally {
      clearing = false;
      reconcile();
    }
  }

  return { formatValue, composing, onInput, onCompositionstart, onCompositionend, clear };
}
