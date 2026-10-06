/**
 * Switch —— 开关。
 *
 * 契约来源：antd 6.6.4 的 `es/switch/index.js`（源码 `components/switch/index.tsx`，198 行）
 * + `@rc-component/switch@1.0.3`（DOM 的真正生产者）。判据逐条对齐 G1 分析
 * （`docs/analysis/switch.md`）。
 *
 * ── 八条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 * 1. **受控 / 非受控是「双别名」**：`useControlledState(defaultChecked ?? defaultValue ?? false,
 *    checked ?? value)` —— `value` / `defaultValue` 是 `checked` / `defaultChecked` 的别名
 *    （`@since 5.12.0`），**不是** Radio/Checkbox 那种「选项值」。
 * 2. **`loading` 强制 disabled**：`mergedDisabled = (props.disabled ?? DisabledContext) || loading`
 *    —— 是 `||` 不是 `??`，所以 `loading` 时 `disabled` 恒真（`-disabled` 类也会出现）。
 * 3. **`onChange` 是 `(checked, event)` 两个参数**（与 Radio/Checkbox 的事件对象形状不同）。
 * 4. **`onClick` 收到的是「结果值」不是原生事件**，且 **disabled 时仍会触发**
 *    —— rc-switch 的 legacy 行为，逐字对齐。
 * 5. **disabled 时不改状态、不发 onChange**（rc-switch 的 `triggerChange` 里 `if (!disabled)`）。
 * 6. **左右方向键**：`ArrowLeft` ⇒ false、`ArrowRight` ⇒ true；判据是 `e.which`
 *    （rc-util 的 `KeyCode`，**不是** `e.key`）。
 * 7. **DOM 三层恒存在**：`-handle` 的 div 与 `-inner-checked` / `-inner-unchecked` 两个 span
 *    **都无条件渲染**（前者只有图标是条件渲染，后者靠负 margin 轮换）—— 不是 `v-if` 二选一。
 * 8. **`size="default"` 发 deprecation 告警**（提示改用 `"medium"`）。
 */

import { LoadingOutlined } from '@apollo-design/icons';
import { KeyCode, useControlledValue, useDevWarning } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  type PropType,
  shallowRef,
  watchEffect,
} from 'vue';
import {
  mergeClassNames,
  mergeStyles,
  resolveSemantic,
  styleAttrs,
} from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useSize } from '../config-provider/size-context';
import type {
  SwitchChangeEventHandler,
  SwitchClickEventHandler,
  SwitchEvent,
  SwitchProps,
  SwitchRef,
  SwitchSemanticClassNames,
  SwitchSemanticStyles,
} from './interface';

export const SwitchComponent = defineComponent({
  name: 'ASwitch',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    size: { type: String as PropType<SwitchProps['size']>, default: undefined },
    checked: { type: Boolean, default: undefined },
    defaultChecked: { type: Boolean, default: undefined },
    value: { type: Boolean, default: undefined },
    defaultValue: { type: Boolean, default: undefined },
    // 文本主导 prop（规则 #1）：收窄 string + 同名 slot 优先（#checkedChildren / #unCheckedChildren）
    checkedChildren: { type: String, default: undefined },
    unCheckedChildren: { type: String, default: undefined },
    disabled: { type: Boolean, default: undefined },
    loading: { type: Boolean, default: false },
    autoFocus: { type: Boolean, default: undefined },
    title: { type: String, default: undefined },
    tabIndex: { type: Number, default: undefined },
    id: { type: String, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<SwitchProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<SwitchProps['styles']>, default: undefined },
  },
  /**
   * ⚠️ 只声明 `update:*`（供 `v-model:checked` / `v-model:value`），**不**声明 `change` /
   * `click` —— antd 的 `onChange` / `onClick` 是 props 形态回调，声明成 emits 会被 Vue
   * 从 attrs 摘掉（PITFALLS 35）。它们与语义事件**同时**发出（规则 C11）。
   */
  emits: ['update:checked', 'update:value'],
  setup(props, { attrs, emit, expose, slots }) {
    // ⚠️ `onKeyDown` **不在** `SwitchProps` 里（antd 的 `SwitchProps` 也没有它 ——
    //    它是 rc-switch 的 props，antd 靠 `{...restProps}` 透传）。所以这里不能写
    //    `Pick<SwitchProps, 'onKeyDown'>`（会 TS2344），必须显式列一遍。
    const callbacks = attrs as unknown as {
      onChange?: SwitchChangeEventHandler;
      onClick?: SwitchClickEventHandler;
      onKeyDown?: (event: KeyboardEvent) => void;
    };

    const context = useComponentConfig('switch');
    const { getPrefixCls, direction } = context;
    const contextDisabled = useDisabled();
    const devWarning = useDevWarning('Switch');

    // ============================= Warning ==============================
    watchEffect(() => {
      devWarning.deprecated(props.size !== 'default', 'size="default"', 'size="medium"');
    });

    // ============================ Controlled ============================
    const [innerChecked, setInnerChecked] = useControlledValue<boolean>({
      defaultValue: () => props.defaultChecked ?? props.defaultValue ?? false,
      getValue: () => props.checked ?? props.value,
    });

    // ============================= Disabled =============================
    /** ⚠️ `||` 判据：`loading` 强制 disabled（判据 2）。 */
    const mergedDisabled = computed<boolean>(
      () => (props.disabled ?? contextDisabled.value) || props.loading,
    );

    const prefixCls = computed(() => getPrefixCls('switch', props.prefixCls));
    // ⚠️ 必须用**函数形态**：`useSize(props.size)` 只在 setup 期读一次 `props.size`，
    //    之后 props 变化不会重算（skeleton 的 Avatar/Button/Input 同判）。
    const mergedSize = useSize((ctxSize) => props.size ?? ctxSize);

    // ============================ Semantic ==============================
    const mergedProps = computed<SwitchProps>(
      () =>
        ({
          ...props,
          size: mergedSize.value,
          disabled: mergedDisabled.value,
        }) as SwitchProps,
    );
    const info = computed(() => ({ props: mergedProps.value }));
    const mergedClassNames = computed(() =>
      mergeClassNames<SwitchSemanticClassNames>(
        resolveSemantic<SwitchSemanticClassNames, SwitchProps>(
          props.classNames as never,
          info.value,
        ),
      ),
    );
    const mergedStyles = computed(() =>
      mergeStyles<SwitchSemanticStyles>(
        resolveSemantic<SwitchSemanticStyles, SwitchProps>(props.styles as never, info.value),
      ),
    );

    // ============================== Events ==============================
    /** rc-switch 的 `triggerChange`：disabled 时不改状态、不发 onChange。 */
    const triggerChange = (newChecked: boolean, event: SwitchEvent): boolean => {
      let merged = innerChecked.value;
      if (!mergedDisabled.value) {
        merged = newChecked;
        setInnerChecked(merged);
        emit('update:checked', merged);
        emit('update:value', merged);
        callbacks.onChange?.(merged, event);
      }
      return merged;
    };

    const onInternalKeyDown = (event: KeyboardEvent) => {
      // ⚠️ 判据是 `which`（rc-util 的 KeyCode），不是 `key`（key-code.ts 文件头）
      if (event.which === KeyCode.LEFT) {
        triggerChange(false, event);
      } else if (event.which === KeyCode.RIGHT) {
        triggerChange(true, event);
      }
      callbacks.onKeyDown?.(event);
    };

    const onInternalClick = (event: MouseEvent) => {
      const ret = triggerChange(!innerChecked.value, event);
      // ⚠️ legacy：传的是**结果值**，且 disabled 时也照常调用（判据 4）
      callbacks.onClick?.(ret, event);
    };

    // ============================== Refs ===============================
    const buttonRef = shallowRef<HTMLButtonElement | null>(null);

    expose({
      get nativeElement() {
        return buttonRef.value;
      },
      focus: (options?: FocusOptions) => buttonRef.value?.focus(options),
      blur: () => buttonRef.value?.blur(),
    } satisfies SwitchRef);

    return () => {
      const cls = prefixCls.value;

      // ⚠️ 顺序逐字对齐 antd：`clsx(prefixCls, contextClassName, {small,loading,rtl},
      //    className, rootClassName, 语义 root, {checked,disabled})`
      const classString = [
        cls,
        context.className,
        {
          [`${cls}-small`]: mergedSize.value === 'small',
          [`${cls}-loading`]: props.loading,
          [`${cls}-rtl`]: direction === 'rtl',
        },
        // 调用方原生 `class`（位置与原先的 props.className/rootClassName 一致）
        attrs.class,
        mergedClassNames.value.root,
        {
          [`${cls}-checked`]: innerChecked.value,
          [`${cls}-disabled`]: mergedDisabled.value,
        },
      ];

      // 除被 rc-switch 消费的三个事件与 class/style 外的 attrs 全部落 button
      const {
        class: _attrClass,
        style: _attrStyle,
        onKeyDown: _onKeyDown,
        onClick: _onClick,
        ...restAttrs
      } = attrs as Record<string, unknown>;

      return h(
        'button',
        {
          ...restAttrs,
          type: 'button',
          role: 'switch',
          'aria-checked': String(innerChecked.value),
          disabled: mergedDisabled.value,
          class: classString,
          // 根 `style` 是 Vue 原生 attrs（`_attrStyle` 已从 restAttrs 里摘出）
          ...styleAttrs({
            ...mergedStyles.value.root,
            ...((_attrStyle as CSSProperties | undefined) ?? {}),
          }),
          ref: buttonRef,
          // ⚠️ 这四个是**声明过的 prop**（不在 attrs 里），antd 的 `{...restProps}` 会把它们
          //    透传到 button —— 我们必须显式落一遍，否则静默丢失。
          title: props.title,
          id: props.id,
          tabindex: props.tabIndex,
          autofocus: props.autoFocus || undefined,
          onKeydown: onInternalKeyDown,
          onClick: onInternalClick,
        },
        [
          // ⚠️ 判据 7：`-handle` 恒存在，只有图标是条件渲染
          h(
            'div',
            {
              class: [`${cls}-handle`, mergedClassNames.value.indicator],
              ...styleAttrs(mergedStyles.value.indicator),
            },
            props.loading ? [h(LoadingOutlined, { class: `${cls}-loading-icon` })] : [],
          ),
          h('span', { class: `${cls}-inner` }, [
            h(
              'span',
              {
                class: [`${cls}-inner-checked`, mergedClassNames.value.content],
                ...styleAttrs(mergedStyles.value.content),
              },
              [slots.checkedChildren?.() ?? props.checkedChildren],
            ),
            h(
              'span',
              {
                class: [`${cls}-inner-unchecked`, mergedClassNames.value.content],
                ...styleAttrs(mergedStyles.value.content),
              },
              [slots.unCheckedChildren?.() ?? props.unCheckedChildren],
            ),
          ]),
        ],
      );
    };
  },
});

export const Switch = SwitchComponent;
export default Switch;
