/**
 * rc-select `SelectInput/Input.js` 的 Vue 版 —— 选择器里那个**唯一**的 `<input>`。
 *
 * ── 它承载了整个组件的 ARIA ────────────────────────────────────────────────
 *
 * rc 在文件头写了原因：「为满足无障碍要求，组件里始终有一个 input；其它元素不设
 * tabIndex 以避免 onBlur 顺序问题」。所以 `role=combobox` / `aria-expanded` /
 * `aria-controls` / `aria-owns` / `aria-activedescendant` 全在这一个元素上。
 *
 * ── 三件容易被漏掉的事 ──────────────────────────────────────────────────────
 *
 * 1. **输入法**：`compositionstart` 期间不触发 token 切分（否则中文输入被打断），
 *    `compositionend` 补发一次 `onSearch`。
 * 2. **粘贴**：`onPaste` 记下剪贴板内容 —— `tokenWithEnter`（分隔符含 \n）时用它
 *    还原被浏览器把 CRLF 折叠成空格的文本。
 * 3. **`syncWidth`**（多选）：把 `scrollWidth` 量出来写成 CSS 变量
 *    `--select-input-width`，让输入框宽度跟着内容长（样式层用 `calc(var(...) * 1px)`）。
 */

import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  onMounted,
  type PropType,
  ref,
  watch,
} from 'vue';

export const SearchInput = defineComponent({
  name: 'ASelectSearchInput',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    id: { type: String, default: undefined },
    value: { type: String, default: '' },
    disabled: { type: Boolean, default: undefined },
    readOnly: { type: Boolean, default: false },
    open: { type: Boolean, default: false },
    activeDescendantId: { type: String, default: undefined },
    role: { type: String, default: 'combobox' },
    /**
     * ⚠️ 可访问名（2026-09-29 补）：antd 把调用方给的 `aria-label` / `aria-labelledby`
     * **放在 combobox 这个 input 上**（实测 antd 6.6.4 SSR：`<input role="combobox" aria-label="Rows per page">`）。
     * 本仓原先完全没有这条链 ⇒ 任何「没有 label/占位文字」的 Select 都会触发 axe 的
     * `label: Form elements must have labels`（pagination 的尺寸切换器就是这么发现的）。
     */
    ariaLabel: { type: String, default: undefined },
    ariaLabelledby: { type: String, default: undefined },
    tabIndex: { type: Number, default: undefined },
    maxLength: { type: Number, default: undefined },
    autoFocus: { type: Boolean, default: false },
    syncWidth: { type: Boolean, default: false },
    tokenWithEnter: { type: Boolean, default: false },
    mode: { type: String, default: undefined },
    inputClass: { type: String, default: undefined },
    inputStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    onSearch: {
      type: Function as PropType<
        (text: string, fromTyping: boolean, isCompositing: boolean) => void
      >,
      default: undefined,
    },
    onSearchSubmit: { type: Function as PropType<(text: string) => void>, default: undefined },
    onInputKeyDown: {
      type: Function as PropType<(event: KeyboardEvent) => void>,
      default: undefined,
    },
    onInputBlur: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props, { attrs }) {
    const inputRef = ref<HTMLInputElement | null>(null);
    const widthVar = ref<number | undefined>(undefined);
    const composing = ref(false);
    const pastedText = ref<string | null>(null);

    const inputCls = computed(() => [props.inputClass].filter(Boolean).join(' '));

    const syncWidth = (): void => {
      const el = inputRef.value;
      if (!props.syncWidth || !el) return;
      el.style.width = '0px';
      widthVar.value = el.scrollWidth;
      el.style.width = '';
    };

    watch(() => props.value, syncWidth, { flush: 'post' });
    watch(() => props.syncWidth, syncWidth, { flush: 'post' });

    /**
     * ⚠️ `autoFocus` 必须**自己调 `focus()`**。
     *
     * 原生 `autofocus` 只在 HTML **解析期**生效；Vue 的 `patchProp` 是元素创建**之后**
     * 才设 `el.autofocus = true` —— 浏览器与 jsdom 都不会因此聚焦（React 之所以
     * "能用"是它在 mount 时显式 `node.focus()`）。判据与 `Rate` /
     * `_internal/action-button` 一致。禁用态不聚焦（`disabled` 元素本身也不可聚焦）。
     */
    onMounted(() => {
      if (props.autoFocus && !props.disabled) {
        inputRef.value?.focus();
      }
    });

    const handleInput = (event: Event): void => {
      const target = event.target as HTMLInputElement;
      let next = target.value;
      if (props.tokenWithEnter && pastedText.value && /[\r\n]/.test(pastedText.value)) {
        const replacedText = pastedText.value
          .replace(/[\r\n]+$/, '')
          .replace(/\r\n/g, ' ')
          .replace(/[\r\n]/g, ' ');
        next = next.replace(replacedText, pastedText.value);
      }
      pastedText.value = null;
      props.onSearch?.(next, true, composing.value);
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (
        event.key === 'Enter' &&
        props.mode === 'tags' &&
        !props.open &&
        !composing.value &&
        props.onSearchSubmit
      ) {
        props.onSearchSubmit((event.currentTarget as HTMLInputElement).value);
      }
      props.onInputKeyDown?.(event);
    };

    const handleCompositionEnd = (event: Event): void => {
      composing.value = false;
      if (props.mode !== 'combobox') {
        props.onSearch?.((event.currentTarget as HTMLInputElement).value, true, false);
      }
    };

    return () => {
      const style: CSSProperties = {
        ...(props.inputStyle ?? {}),
        ...(props.syncWidth && widthVar.value !== undefined
          ? ({ '--select-input-width': widthVar.value } as CSSProperties)
          : {}),
      };

      return h('input', {
        // ⚠️ 透传属性（`aria-describedby` 等由 Selector 按 antd 落点分派下来的）
        //    必须落到这个 combobox input 上 —— 它 `inheritAttrs: false`，
        //    不铺就会**整条丢**（antd 6.6.4 SSR 实测：`aria-*` 在 input 上）。
        //    透传在前、受控在后：内部值压过同名透传。
        ...attrs,
        ref: inputRef,
        id: props.id,
        type: 'text',
        class: inputCls.value || undefined,
        style: Object.keys(style).length ? style : undefined,
        value: props.value || '',
        disabled: props.disabled,
        readOnly: props.readOnly,
        tabIndex: props.tabIndex,
        maxLength: props.maxLength,
        autoFocus: props.autoFocus || undefined,
        autoComplete: 'new-password',
        role: props.role,
        'aria-label': props.ariaLabel,
        'aria-labelledby': props.ariaLabelledby,
        'aria-expanded': props.open || false,
        'aria-haspopup': attrs['aria-haspopup'] ?? 'listbox',
        'aria-autocomplete': 'list',
        'aria-owns': props.open ? `${props.id}_list` : undefined,
        'aria-controls': props.open ? `${props.id}_list` : undefined,
        'aria-activedescendant': props.open ? props.activeDescendantId : undefined,
        onInput: handleInput,
        onKeydown: handleKeyDown,
        onBlur: () => props.onInputBlur?.(),
        onPaste: (event: ClipboardEvent) => {
          pastedText.value = event.clipboardData?.getData('text') || '';
        },
        onCompositionstart: () => {
          composing.value = true;
        },
        onCompositionend: handleCompositionEnd,
      });
    };
  },
});

export default SearchInput;
