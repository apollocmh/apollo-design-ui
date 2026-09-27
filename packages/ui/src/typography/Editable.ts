/**
 * `Editable` —— `editable` 的编辑态。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/Editable.js`（**逐条对齐**）。
 *
 * ```jsx
 * <div class="{prefixCls} {prefixCls}-edit-content {prefixCls}-{component} [-rtl] [className] [classNames.root]"
 *      style={{...styles.root, ...style}}>
 *   <TextArea rows={1} autoSize value={current} ... />
 *   {enterIcon !== null ? cloneElement(enterIcon, {className: `${prefixCls}-edit-content-confirm`}) : null}
 * </div>
 * ```
 *
 * ── 三处必须保留的判据 ────────────────────────────────────────────────────────
 *
 *   1. **`\n` / `\r` 一律剥掉**（`onChange` 里 `replace(/[\n\r]/g, '')`）。这是
 *      单行编辑：按 Enter 是「保存」而不是「换行」，但按键本身已经先插入了换行，
 *      所以要主动抹掉。
 *   2. **`onKeyUp` 的三重门槛**：`lastKeyCode === keyCode`（必须与 keydown 是同一个键）、
 *      非 IME 组合中、无修饰键。少任何一条，输入法选词或 `Ctrl+Enter` 都会误触发保存。
 *   3. **`confirmChange` 会 `trim()`**，而 `onChange` 不会。所以「保存的值」与
 *      「输入框里的值」在有首尾空格时**不同**，这是上游的既定行为。
 *
 * ── 与 antd 的三处差异（登记在 README §7）──────────────────────────────────────
 *
 *   - **D-typography-2（PLATFORM）**：antd 用 `Input.TextArea`（带 `autoSize`
 *     自适应高度、`apollo-input` 前缀的类名）。Input 组件尚未落地，这里用**原生
 *     `<textarea>`**：`rows="1"` 保留，`autoSize` / `maxLength` 只作为属性透传，
 *     不做高度自适应。⇒ DOM 契约里 textarea 的类名与 antd 不同，这是**已知且已登记**
 *     的缺口，不是「忘了写」。
 *   - **D-typography-9（PLATFORM）**：Vue 里 `current` 未变时不会重渲染，被剥掉的
 *     换行会残留在 DOM 上。所以 `onInput` 里显式把剥离后的值写回元素。
 *   - **D-typography-10（PLATFORM）**：`enterIcon` 的默认值。antd 在解构默认值里写
 *     `<EnterOutlined />`（恒为元素），这里保持 `undefined` 表示「用默认」、
 *     `null` 表示「不渲染」—— 与 antd 的 `enterIcon !== null` 判据等价，
 *     但让「未传」与「显式传 null」可区分（PITFALLS 46）。
 *
 * ── 为什么是 `.ts` 渲染函数而不是 `.vue` ────────────────────────────────────────
 *
 * `enterIcon` 是 `VNodeChild`（可能是用户给的节点、`false`、或内置图标），
 * 模板里没有渲染「一个 VNodeChild 变量」的语法。理由与 `CopyBtn.ts` 相同
 * （COMPONENT-RULES.md §2 第 1 条）。
 */

import { EnterOutlined } from '@apollo-design/icons';
import { isVNode, KeyCode } from '@apollo-design/utils';
import {
  type CSSProperties,
  cloneVNode,
  defineComponent,
  h,
  onMounted,
  type PropType,
  ref,
  type VNodeChild,
  watch,
} from 'vue';

import { styleAttrs } from '../_internal/use-merge-semantic';
import type { DirectionType } from '../config-provider/context';
import type {
  AutoSizeType,
  TypographySemanticClassNames,
  TypographySemanticStyles,
} from './interface';

export const Editable = defineComponent({
  name: 'ATypographyEditable',
  props: {
    prefixCls: { type: String, required: true },
    /** 初值。 */
    value: { type: String, default: '' },
    /** 落在 `<textarea>` 上。 */
    ariaLabel: { type: String, default: undefined },
    /** 保存（Enter / blur）。 */
    onSave: { type: Function as PropType<(value: string) => void>, required: true },
    /** Esc 取消。 */
    onCancel: { type: Function as PropType<() => void>, required: true },
    /** Enter 保存后。 */
    onEnd: { type: Function as PropType<() => void>, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
    direction: { type: String as PropType<DirectionType>, default: undefined },
    maxLength: { type: Number, default: undefined },
    /** antd 默认 `true`；本阶段只透传，不做高度自适应（D-typography-2）。 */
    autoSize: { type: [Boolean, Object] as PropType<boolean | AutoSizeType>, default: true },
    /** `undefined` = 用默认的 `EnterOutlined`；`null` = 不渲染。 */
    // 内部：由父组件程序化传递/无模板上下文，VNode prop 合法（源自 editable.enterIcon）
    enterIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    /** 用户传的标签名（`div` / `span` / `h1`…）。用来加 `-{component}` 类名。 */
    component: { type: String, default: undefined },
    classNames: { type: Object as PropType<TypographySemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<TypographySemanticStyles>, default: undefined },
  },
  setup(props) {
    const textareaRef = ref<HTMLTextAreaElement | null>(null);

    /** IME 组合中。**刻意不用 `ref`**：它不参与渲染，只是个开关。 */
    let inComposition = false;
    let lastKeyCode: number | null = null;

    const current = ref(props.value);

    watch(
      () => props.value,
      (value) => {
        current.value = value;
      },
    );

    onMounted(() => {
      const textArea = textareaRef.value;
      if (!textArea) return;
      textArea.focus();
      const { length } = textArea.value;
      textArea.setSelectionRange(length, length);
    });

    const onInput = (e: Event): void => {
      const el = e.target as HTMLTextAreaElement;
      const next = el.value.replace(/[\n\r]/g, '');
      current.value = next;
      // ⚠️ 见文件头 D-typography-9：剥掉换行后 `current` 可能没变，Vue 就不会重渲染，
      //    于是换行会残留在 DOM 里。显式写回，保持与 antd 的受控 textarea 一致。
      if (el.value !== next) {
        el.value = next;
      }
    };

    const onCompositionStart = (): void => {
      inComposition = true;
    };

    const onCompositionEnd = (): void => {
      inComposition = false;
    };

    const onKeyDown = (e: KeyboardEvent): void => {
      // IME 组合中不记录键码
      if (inComposition) return;
      lastKeyCode = e.keyCode;
    };

    const confirmChange = (): void => {
      props.onSave(current.value.trim());
    };

    const onKeyUp = (e: KeyboardEvent): void => {
      // 必须是同一个真实的键，且不在 IME 组合中、无修饰键
      if (
        lastKeyCode !== e.keyCode ||
        inComposition ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return;
      }
      if (e.keyCode === KeyCode.ENTER) {
        confirmChange();
        props.onEnd?.();
      } else if (e.keyCode === KeyCode.ESC) {
        props.onCancel();
      }
    };

    const onBlur = (): void => {
      confirmChange();
    };

    return () => {
      const confirmIcon =
        props.enterIcon === null
          ? null
          : props.enterIcon === undefined
            ? h(EnterOutlined)
            : props.enterIcon;
      const confirmIconNode = isVNode(confirmIcon)
        ? cloneVNode(confirmIcon, { class: `${props.prefixCls}-edit-content-confirm` })
        : confirmIcon;

      return h(
        'div',
        {
          class: [
            props.prefixCls,
            `${props.prefixCls}-edit-content`,
            {
              [`${props.prefixCls}-rtl`]: props.direction === 'rtl',
              [`${props.prefixCls}-${props.component}`]: !!props.component,
            },
            props.className,
            props.classNames?.root,
          ],
          ...styleAttrs({ ...props.styles?.root, ...props.style }),
        },
        [
          h('textarea', {
            ref: textareaRef,
            rows: 1,
            maxlength: props.maxLength,
            value: current.value,
            'aria-label': props.ariaLabel,
            class: props.classNames?.textarea,
            style: props.styles?.textarea,
            onInput,
            onKeydown: onKeyDown,
            onKeyup: onKeyUp,
            onCompositionstart: onCompositionStart,
            onCompositionend: onCompositionEnd,
            onBlur,
          }),
          confirmIconNode,
        ],
      );
    };
  },
});
