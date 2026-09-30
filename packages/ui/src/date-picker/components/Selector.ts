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
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  type PropType,
  type VNodeChild,
} from 'vue';
import { useMaskInput } from './mask-input';
import {
  getInputSize,
  getRangeShowClear,
  getSingleShowClear,
  isRenderable,
  toDisabledPair,
} from './picker-shared';

export interface SelectorSemanticClassNames {
  prefix?: string;
  input?: string;
  suffix?: string;
}

export interface SelectorSemanticStyles {
  prefix?: CSSProperties;
  input?: CSSProperties;
  suffix?: CSSProperties;
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
    /**
     * 归一后的第一个格式**求值后的字符数**（算 `input[size]`）。
     *
     * ⚠️ 传的是**数值**而不是格式串本身：`format` 可能是**函数形态**
     * （`CustomFormat`），而 `Selector` 是个「哑组件」——它不持有日期库
     * ⇒ 求值（`firstFormat(getNow())`）由 `.vue` 侧用 `getFormatLength` 完成。
     */
    firstFormatLength: { type: Number as PropType<number | undefined>, default: undefined },

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

    // ---------------------------------------------------- 掩码模式（S3）
    /**
     * 掩码格式串（`format.type === 'mask'` 时由 `.vue` 传下来）。
     *
     * 非空 ⇒ 输入框切到掩码行为（见 `mask-input.ts`）；空 / 未传 ⇒ 普通输入框。
     */
    maskFormat: { type: String as PropType<string | undefined>, default: undefined },
    /** 键入非法时，失焦后是否**保留**文本（上游 `preserveInvalidOnBlur`）。 */
    preserveInvalidOnBlur: { type: Boolean, default: false },
    /** 文本是否可解析（掩码模式下 `Enter` 提交与 `paste` 都要用它）。 */
    validateFormat: {
      type: Function as PropType<((text: string) => boolean) | undefined>,
      default: undefined,
    },
    /** 掩码模式：文本 ≠ 模板且 ≠ 受控值 ⇒ 通知外层打开浮层（上游 `onHelp`）。 */
    onInputHelp: {
      type: Function as PropType<((index: number) => void) | undefined>,
      default: undefined,
    },
    /** 掩码模式：`Enter` + 文本合法 ⇒ 提交（上游 `Input.onSharedKeyDown`）。 */
    onInputSubmit: {
      type: Function as PropType<((index: number) => void) | undefined>,
      default: undefined,
    },
    /** 掩码模式：文本合法时把文本交给外层（上游 `useInputProps` 的 `onChange`）。 */
    onInputText: {
      type: Function as PropType<((index: number, text: string) => void) | undefined>,
      default: undefined,
    },
    /** 根节点额外类名（尺寸 / 变体 / 状态 / 语义槽由调用方拼好）。 */
    rootClass: { type: [String, Array] as PropType<string | string[]>, default: undefined },
    /**
     * 根节点 style。
     *
     * ⚠️ 类型是 Vue 的 `CSSProperties`（**不是** `Record<string, string | number>`）——
     * 调用方传的是 `props.style`（`CSSProperties`）。用 `Record<…>` 会因索引签名不匹配
     * 而报错（`CSSProperties` 是接口，没有索引签名）。
     */
    rootStyle: { type: Object as PropType<CSSProperties>, default: undefined },

    // ---------------------------------------------------------- 语义槽
    classNames: {
      type: Object as PropType<SelectorSemanticClassNames>,
      default: () => ({}),
    },
    styles: { type: Object as PropType<SelectorSemanticStyles>, default: () => ({}) },

    /**
     * **键入的值非法**（rc 的 `invalid` 通道，**不是** antd 的 `status`）。
     *
     * 🚨 两者容易混，判据完全不同：
     *
     * | 来源 | 含义 | 影响 |
     * |---|---|---|
     * | `props.status`（antd） | 表单校验状态 | 只加根类名 `-status-*`；**不动** `aria-invalid` |
     * | `props.invalid`（rc） | **用户键入的内容解析不出日期** | `aria-invalid` 变 `'true'` + 根类名 `-invalid` |
     *
     * ⚠️ 上游是 `"aria-invalid": invalid`（**直接传布尔**，React 渲染成 `"true"`/`"false"`）。
     * 本仓传的是**显式字符串** —— Vue 对 `false` 的属性处理与 React 不同，
     * 显式化可以保证输出恒为 `"true"` / `"false"`（S1 已实测空态是 `"false"`）。
     */
    invalid: { type: Boolean as PropType<boolean | undefined>, default: undefined },

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
  setup(props, { expose }) {
    const disabledPair = computed(() => toDisabledPair(props.disabled));

    /**
     * 掩码模式（S3）—— 全部逻辑在 `mask-input.ts`，这里只做**转接**。
     *
     * ⚠️ 之所以把逻辑放在本组件而不是另开一个组件：上游的掩码**不改 DOM**
     * （还是一个 `<input>`，「分段」只体现在 `setSelectionRange` 上）——
     * 另开组件会让 `<div class="-input">` 的结构出现两份定义，容易漂移。
     */
    const maskInput = useMaskInput({
      maskFormat: () => props.maskFormat,
      valueTexts: () => props.valueTexts,
      active: (index) => props.activeIndex === index,
      preserveInvalidOnBlur: () => props.preserveInvalidOnBlur,
      validateFormat: (text) => props.validateFormat?.(text) ?? false,
      onChange: (index, text) => props.onInputText?.(index, text),
      onHelp: (index) => props.onInputHelp?.(index),
      onSubmit: (index) => props.onInputSubmit?.(index),
      onKeyDown: (index, event) => props.onInputKeydown?.(index, event),
      onFocus: (index, event) => props.onInputFocus?.(index, event),
      onBlur: (index, event) => props.onInputBlur?.(index, event),
    });

    /** 两个 field 的输入框元素（`expose.focus` 与掩码的选择同步都要它）。 */
    const inputEls: (HTMLInputElement | null)[] = [null, null];
    /**
     * 稳定的 `ref` 回调。
     *
     * ⚠️ 每次渲染新建闭包会让 Vue 反复「解绑 → 重绑」（旧 ref 收 `null`、新 ref 收元素）
     * ⇒ 掩码的 `elements[index]` 会在一帧里被写成 `null` 再写回来。
     */
    const inputElRefs = [0, 1].map(
      (index) => (el: Element | { $el?: Element } | null | undefined) => {
        const next = ((el as HTMLInputElement | null) ?? null) as HTMLInputElement | null;
        inputEls[index] = next;
        maskInput.setElement(index, next);
      },
    );

    /**
     * 上游 `SinglePicker` 的 `selectorRef.current.focus()`。
     *
     * 两个调用点：点根节点时（`onSelectorClick`）与点清除后（`onSelectorClear`）。
     * 后者是**真的有用**的：点击落在清除按钮上，不还原焦点的话焦点会留在按钮上。
     */
    expose({ focus: () => inputEls[0]?.focus() });

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

    const inputSize = computed(() => getInputSize(props.picker, props.firstFormatLength ?? 0));

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

      /** 掩码模式专属绑定（值 + 六个事件）；非掩码时为 `undefined`。 */
      const maskBind = maskInput.enabled.value ? maskInput.bind(index) : undefined;

      const inputNode = h('input', {
        // `ref`：两个 field 各一个（`expose.focus` 用 `[0]`，掩码的选择同步用各自的）
        ref: inputElRefs[index],
        // 🚨 两个通道别混（见 `invalid` prop 的说明）：
        //   - `props.status`（antd）**不改**这里 —— 实测 `status="error"` 时它仍是 `"false"`；
        //   - `props.invalid`（rc，**键入解析不出日期**）才把它变 `"true"`。
        'aria-invalid': props.invalid ? 'true' : 'false',
        autoComplete: 'off',
        size: inputSize.value,
        ...(isRange ? { 'date-range': index === 0 ? 'start' : 'end' } : {}),
        placeholder: ph,
        disabled: disabled || undefined,
        readonly: props.readOnly || undefined,
        // 🚨 掩码模式与普通模式**互斥**（上游 `Input.js` 里 `inputProps` 覆盖 `restProps`）：
        //    掩码下原生 `input` 事件是**空实现**，值与四个事件都来自本地状态。
        ...(maskBind ?? {
          value: props.valueTexts[index] ?? '',
          onInput: (e: Event) => props.onInput?.(index, e),
          onFocus: (e: FocusEvent) => props.onInputFocus?.(index, e),
          onBlur: (e: FocusEvent) => props.onInputBlur?.(index, e),
          onKeydown: (e: KeyboardEvent) => props.onInputKeydown?.(index, e),
        }),
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
      /**
       * 根类名。
       *
       * 🚨 **优先用调用方组装好的 `rootClass`**（`getRootClassNames` 的产物，
       * 它的**第一项就是 `prefixCls`**）—— 若这里再拼一次 `props.prefixCls`，
       * 类名里会出现**两个** `apollo-picker`（L4 实测抓到：
       * `[apollo-picker apollo-picker-outlined]` vs `[apollo-picker apollo-picker apollo-picker-outlined]`）。
       *
       * ⇒ 只有**单独使用** `Selector`（没传 `rootClass`）时才回退到最小集。
       * 范围的 `-range` 由 `getRootClassNames` 的 `range` 选项负责（与其余类名同一处组装），
       * 不在两处各拼一半。
       */
      const rootClass = props.rootClass
        ? props.rootClass
        : [props.prefixCls, ...(props.range ? [`${props.prefixCls}-range`] : [])];

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
