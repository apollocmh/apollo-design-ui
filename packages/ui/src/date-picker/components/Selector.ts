/**
 * `Selector` —— 输入框选择器（G4 · S1）。
 *
 * 对应上游 rc 的 `PickerInput/Selector/{SingleSelector,RangeSelector}` 的
 * **展示面**（键入 / 掩码 / 键盘分段在 S2–S4，见 `PLAN.md`）。
 * 单值与范围**同一个组件**，用 `range` 切换形态 —— 上游是两份实现，但它们的
 * 根/子节点结构只差「范围多两端与分隔条」，合并后更少重复（H3 的 Vue 心智模型）。
 *
 * ── 上游结构（读源码确认，不是推测）─────────────────────────────────────────
 *
 * 单值（`SingleSelector/index.js:166-191`）：
 * ```jsx
 * <div className={clsx(prefixCls, { '-multiple', '-focused', '-disabled', '-invalid', '-rtl' }, className)}>
 *   {isReactRenderable(prefix) && <div className={`${prefixCls}-prefix`}>{prefix}</div>}
 *   <div className={`${prefixCls}-input`}>       {/* selectorNode，见 :141-163
 *     <Input />                                  {/* 内部再加 `-input`、`-active`、`-placeholder`
 *     <Icon icon={suffixIcon} />                 {/* `-suffix`，仅当 icon 可渲染
 *     {showClear && <ClearIcon />}               {/* `-clear`
 *   </div>
 * </div>
 * ```
 *
 * 范围（`RangeSelector.js:166-213`）：
 * ```jsx
 * <div className={clsx(prefixCls, `${prefixCls}-range`, { '-focused', '-disabled', '-invalid', '-rtl' }, className)}>
 *   {prefix && <div className={`${prefixCls}-prefix`}>{prefix}</div>}
 *   <Input className={`${prefixCls}-input-start`} date-range="start" />
 *   <div className={`${prefixCls}-range-separator`}>{separator}</div>
 *   <Input className={`${prefixCls}-input-end`}   date-range="end" />
 *   <div className={`${prefixCls}-active-bar`} style={activeBarStyle} />
 *   <Icon icon={suffixIcon} />
 *   {showClear && <ClearIcon />}
 * </div>
 * ```
 *
 * ── 🚨 六条「只读源码 / dump 才能发现」的判据（初稿写错了四处）───────────────
 *
 * 1. 🚨 **清除按钮的 `aria-label` 是 `locale.clear`，不是字面量 `"Clear"`**
 *    （`ClearIcon.js`：`"aria-label": locale.clear`）。SSR dump 里看到 `"Clear"`
 *    只是因为用的是 **en_US** 默认语言包；zh_CN 下是 `"清除"`。
 *    ⚠️ 这是 locale 相关属性 ⇒ **L4 基线必须显式钉语言包**，否则随默认语言漂移。
 * 2. 🚨 **`-clear` 的类名里带的是 `classNames.suffix`**（不是独立的 `clear` 槽！）
 *    （`ClearIcon.js`：`clsx(`${prefixCls}-clear`, classNames.suffix)`），
 *    `style` 也用 `styles.suffix`。语义槽只有 4 个（root/prefix/input/suffix）——
 *    清除按钮**借用了 suffix 槽**。
 * 3. 🚨 **`showClear` 有三条并列条件**（不是「有值就显示」）：
 *    - 单值（`SingleSelector:127`）：`isReactRenderable(clearIcon) && Boolean(value.length) && !disabled`
 *    - 范围（`RangeSelector:156`）：`isReactRenderable(clearIcon) && ((value[0] && !disabled[0]) || (value[1] && !disabled[1]))`
 *    ⇒ **`disabled` 时不渲染清除按钮**（初稿漏了这条）。
 * 4. 🚨 **`-suffix` 仅当图标可渲染时才有**（`Icon.js`：`isReactRenderable(icon) ? <span> : null`）
 *    ⇒ `suffixIcon === null` 时**整块不渲染**，不是渲染空 span。
 * 5. ⚠️ **`-input-active` 是 `${prefixCls}-input` + `-active` 拼出来的**
 *    （`Input.js:344-347`：`inputPrefixCls = \`${prefixCls}-input\``，再拼 `-active`）
 *    ⇒ 类名恰好是 `-input-active`；同族还有 `-input-placeholder`（`helped` 时）。
 * 6. ⚠️ **`-active-bar` 的初始 style 是 `{ position: 'absolute', width: 0 }`**
 *    （`RangeSelector.js:133` 的 `useState` 初值）—— `width: 0` 是**数字**，
 *    进 DOM 时浏览器不管，但 `cssinjs` 会序列化成 `width:0`。
 *    本仓**必须写字符串 `'0'`**：Vue 的 `patchStyle` 不给数字补单位（PITFALLS 8 / D94），
 *    写数字会被**静默丢弃**、只留 `position:absolute`。
 *
 * ── 一个刻意的差异（登记在 README §2）────────────────────────────────────────
 *
 * 上游范围的两个 `Input` 的 `className` 是 **`-input-start` / `-input-end`**
 * （**不含** `-input` 前缀），`-input` 由 `Input` 内部拼。
 * 本仓没有独立的 `Input` 组件（S2 才需要它处理键入），所以这里**直接拼全**：
 * `-input -input-active? -input-start|-end`。结果与实测一致
 * （dump 到的是 `ant-picker-input ant-picker-input-start` / `… -input-active`）。
 */

import { isNonNullable } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, type VNodeChild } from 'vue';

/** `isReactRenderable` —— 上游用 `@rc-component/util` 的同名函数。 */
export function isRenderable(node: VNodeChild): boolean {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return false;
  }
  if (Array.isArray(node)) {
    return node.some((n) => isRenderable(n));
  }
  // 空字符串在 Vue 里会渲染成空节点；上游的 `isReactRenderable('')` 是 **true**
  // （只排除 null/undefined/bool/空数组）⇒ 这里保持 true。
  return true;
}

/** 算 `input[size]`（上游 `useInputProps` 的 `size` 分支，逐字）。 */
export function getInputSize(picker: string | undefined, firstFormat: string | undefined): number {
  const defaultSize = picker === 'time' ? 8 : 10;
  const length = firstFormat ? firstFormat.length : 0;
  return Math.max(defaultSize, length) + 2;
}

/** 归一 `disabled` 成两端形态（`boolean | [boolean, boolean]`）。 */
export function toDisabledPair(
  disabled: boolean | [boolean, boolean] | undefined,
): [boolean, boolean] {
  if (Array.isArray(disabled)) {
    return [Boolean(disabled[0]), Boolean(disabled[1])];
  }
  const d = disabled === true;
  return [d, d];
}

/** 单值的 `showClear`（上游 `SingleSelector.js:127`）。 */
export function getSingleShowClear(
  clearIcon: VNodeChild,
  valueLength: number,
  disabled: boolean,
): boolean {
  return isRenderable(clearIcon) && valueLength > 0 && !disabled;
}

/** 范围的 `showClear`（上游 `RangeSelector.js:156`）。 */
export function getRangeShowClear(
  clearIcon: VNodeChild,
  valueLengths: readonly [number, number],
  disabled: readonly [boolean, boolean],
): boolean {
  return (
    isRenderable(clearIcon) &&
    ((valueLengths[0] > 0 && !disabled[0]) || (valueLengths[1] > 0 && !disabled[1]))
  );
}

export interface SelectorSemanticClassNames {
  prefix?: string;
  input?: string;
  suffix?: string;
}

export interface SelectorSemanticStyles {
  prefix?: Record<string, string | number>;
  input?: Record<string, string | number>;
  suffix?: Record<string, string | number>;
}

/** 输入框选择器（单值 / 范围共用）。 */
export const Selector = defineComponent({
  name: 'ApolloDatePickerSelector',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    /** `true` ⇒ 范围形态。 */
    range: { type: Boolean, default: false },
    /** 面板粒度（决定默认 `input[size]`）。 */
    picker: { type: String as PropType<string | undefined>, default: undefined },
    /** 归一后的第一个格式（算 `input[size]`）。 */
    firstFormat: { type: String as PropType<string | undefined>, default: undefined },

    // ---------------------------------------------------------- 值 / 文本
    /** 已格式化的值文本（单值 1 项；范围 2 项）。 */
    valueTexts: { type: Array as PropType<string[]>, required: true },
    /** 单值给 `string`，范围给 `[string, string]`。 */
    placeholder: {
      type: [String, Array] as PropType<string | [string, string] | undefined>,
      default: undefined,
    },

    // ---------------------------------------------------------- 装饰
    prefix: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    suffixIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    clearIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    /** 清除按钮的可访问名（**上游取 `locale.clear`**，不是字面量）。 */
    clearAriaLabel: { type: String as PropType<string | undefined>, default: undefined },
    /** 已归一：`false` ⇒ 永不渲染。 */
    allowClear: {
      type: [Boolean, Object] as PropType<boolean | { clearIcon?: VNodeChild } | undefined>,
      default: undefined,
    },
    /** 范围分隔符的**默认**内容（自定义时 `customSeparator` 为 true）。 */
    separator: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    /** `true` ⇒ 分隔符**不**带 `aria-hidden`。 */
    customSeparator: { type: Boolean, default: false },

    // ---------------------------------------------------------- 状态
    disabled: {
      type: [Boolean, Array] as PropType<boolean | [boolean, boolean] | undefined>,
      default: undefined,
    },
    /** 只读（S2 的键入要用；S1 只透传 `readonly` 属性）。 */
    readOnly: { type: Boolean, default: false },
    /** 范围：当前活动端（`0` / `1` / `null`）。 */
    activeIndex: { type: Number as PropType<number | null | undefined>, default: undefined },
    /** 根节点额外类名（尺寸 / 变体 / 状态 / 语义槽由调用方拼好）。 */
    rootClass: { type: [String, Array] as PropType<string | string[]>, default: undefined },
    rootStyle: {
      type: Object as PropType<Record<string, string | number>>,
      default: undefined,
    },

    // ---------------------------------------------------------- 语义槽
    classNames: {
      type: Object as PropType<SelectorSemanticClassNames>,
      default: () => ({}),
    },
    styles: { type: Object as PropType<SelectorSemanticStyles>, default: () => ({}) },

    // ---------------------------------------------------------- 事件
    onInput: {
      type: Function as PropType<(index: number, event: Event) => void>,
      default: undefined,
    },
    onInputFocus: {
      type: Function as PropType<(index: number, event: FocusEvent) => void>,
      default: undefined,
    },
    onInputBlur: {
      type: Function as PropType<(index: number, event: FocusEvent) => void>,
      default: undefined,
    },
    onInputKeydown: {
      type: Function as PropType<(index: number, event: KeyboardEvent) => void>,
      default: undefined,
    },
    onClear: { type: Function as PropType<() => void>, default: undefined },
    onSelectorClick: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props) {
    const disabledPair = computed(() => toDisabledPair(props.disabled));

    /** 两端的值长度（范围判 `showClear` 用）。 */
    const valueLengths = computed<[number, number]>(() => [
      (props.valueTexts[0] ?? '').length,
      (props.valueTexts[1] ?? '').length,
    ]);

    const showClear = computed(() => {
      if (props.allowClear === false) {
        return false;
      }
      if (props.range) {
        return getRangeShowClear(props.clearIcon, valueLengths.value, disabledPair.value);
      }
      return getSingleShowClear(props.clearIcon, valueLengths.value[0], disabledPair.value[0]);
    });

    const inputSize = computed(() => getInputSize(props.picker, props.firstFormat));

    /** `-suffix`：仅当图标可渲染（上游 `Icon.js`）。 */
    const renderSuffix = (): VNodeChild => {
      if (!isRenderable(props.suffixIcon)) {
        return null;
      }
      return h(
        'span',
        {
          class: [`${props.prefixCls}-suffix`, props.classNames.suffix],
          style: props.styles.suffix,
        },
        [props.suffixIcon],
      );
    };

    /**
     * `-clear`。
     *
     * 🚨 两处与直觉不同（读 `ClearIcon.js` 确认）：
     *   1. `aria-label` 取 **`locale.clear`**（由调用方传 `clearAriaLabel`），
     *      不是字面量 `"Clear"`；
     *   2. 类名里带的是 **`classNames.suffix`**（清除按钮**借 suffix 槽**），style 同。
     */
    const renderClear = (): VNodeChild => {
      if (!showClear.value) {
        return null;
      }
      return h(
        'button',
        {
          type: 'button',
          'aria-label': props.clearAriaLabel ?? undefined,
          class: [`${props.prefixCls}-clear`, props.classNames.suffix],
          style: props.styles.suffix,
          onMousedown: (e: MouseEvent) => {
            // 上游：`onMouseDown: e => e.preventDefault()`（不要抢焦点）
            e.preventDefault();
          },
          onClick: (e: MouseEvent) => {
            // 上游：`onClick: e => { e.stopPropagation(); onClear(); }`
            e.stopPropagation();
            props.onClear?.();
          },
        },
        [props.clearIcon],
      );
    };

    const renderPrefix = (): VNodeChild => {
      if (!isRenderable(props.prefix)) {
        return null;
      }
      return h(
        'div',
        {
          class: [`${props.prefixCls}-prefix`, props.classNames.prefix],
          style: props.styles.prefix,
        },
        [props.prefix],
      );
    };

    const renderInput = (index: number): VNodeChild => {
      const isRange = props.range;
      const ph = Array.isArray(props.placeholder) ? props.placeholder[index] : props.placeholder;
      const disabled = disabledPair.value[index];
      const active = isRange && props.activeIndex === index;

      const inputNode = h('input', {
        // ⚠️ 实测：`status="error"` 也**不改**这里（恒 "false"）
        'aria-invalid': 'false',
        autoComplete: 'off',
        size: inputSize.value,
        ...(isRange ? { 'date-range': index === 0 ? 'start' : 'end' } : {}),
        placeholder: ph,
        disabled: disabled || undefined,
        readonly: props.readOnly || undefined,
        value: props.valueTexts[index] ?? '',
        onInput: (e: Event) => props.onInput?.(index, e),
        onFocus: (e: FocusEvent) => props.onInputFocus?.(index, e),
        onBlur: (e: FocusEvent) => props.onInputBlur?.(index, e),
        onKeydown: (e: KeyboardEvent) => props.onInputKeydown?.(index, e),
      });

      if (!isRange) {
        // 单值：`-input` 是根的直接子节点，`input` 是它的子节点
        return h(
          'div',
          {
            class: [`${props.prefixCls}-input`, props.classNames.input],
            style: props.styles.input,
          },
          [inputNode, renderSuffix(), renderClear()],
        );
      }

      // 范围：`-input` 与 `-input-start|-end` 是两个类（见文件头的刻意差异）
      return h(
        'div',
        {
          class: [
            `${props.prefixCls}-input`,
            // ⚠️ `-input-active` = `-input` + `-active`（上游 `Input.js:344`）
            ...(active ? [`${props.prefixCls}-input-active`] : []),
            `${props.prefixCls}-input-${index === 0 ? 'start' : 'end'}`,
            props.classNames.input,
          ],
          style: props.styles.input,
        },
        [inputNode],
      );
    };

    return () => {
      const rootClass = [
        props.prefixCls,
        ...(props.range ? [`${props.prefixCls}-range`] : []),
        props.rootClass,
      ];

      if (!props.range) {
        return h(
          'div',
          {
            class: rootClass,
            style: props.rootStyle,
            onClick: () => props.onSelectorClick?.(),
          },
          [renderPrefix(), renderInput(0)],
        );
      }

      return h(
        'div',
        {
          class: rootClass,
          style: props.rootStyle,
          onClick: () => props.onSelectorClick?.(),
        },
        [
          renderPrefix(),
          renderInput(0),
          h('div', { class: `${props.prefixCls}-range-separator` }, [
            h(
              'span',
              {
                // ⚠️ 自定义 separator ⇒ **去掉** `aria-hidden`（上游两条 a11y 测试）
                ...(props.customSeparator ? {} : { 'aria-hidden': 'true' }),
                class: `${props.prefixCls}-separator`,
              },
              [props.separator],
            ),
          ]),
          renderInput(1),
          h('div', {
            class: `${props.prefixCls}-active-bar`,
            // ⚠️ `width` 必须是**字符串** `'0'`（Vue 的 patchStyle 不给数字补单位，
            //    写数字会被静默丢弃 —— PITFALLS 8 / D94）
            style: { position: 'absolute', width: '0' },
          }),
          renderSuffix(),
          renderClear(),
        ],
      );
    };
  },
});

export default Selector;

/** 供样式层判断「`allowClear` 是否给了自定义 clearIcon」（告警用）。 */
export function hasCustomClearIcon(allowClear: unknown): boolean {
  return isNonNullable(allowClear) && typeof allowClear === 'object';
}
