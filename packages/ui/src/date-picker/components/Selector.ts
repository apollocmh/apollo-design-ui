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

import { isNonNullable, isRenderable, observeResize } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  onScopeDispose,
  type PropType,
  ref,
  type VNodeChild,
  watch,
} from 'vue';
import Overflow from '../../_internal/overflow';
import type { CustomTagProps } from '../interface';
import { useMaskInput } from './mask-input';
import {
  getInputSize,
  getRangeShowClear,
  getSingleShowClear,
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
    /**
     * 有没有「悬停预览」（上游 `SinglePicker.js:436` 的 `activeHelp: !!internalHoverValue`）。
     *
     * ⚠️ 单值下它**单独不起作用** —— 上游 `useInputProps.js` 的判据是
     * `helped = allHelp || (activeHelp && activeIndex === index)`，而单值的
     * `activeIndex` 是 `undefined` ⇒ `undefined === 0` 恒假。真正让输入框进入
     * 「placeholder 态」的是 `allHelp`（悬停的是**预设**）。
     */
    activeHelp: { type: Boolean, default: false },
    /**
     * 悬停来自**预设列表**（上游 `allHelp: !!internalHoverValue && hoverSource === 'preset'`）。
     *
     * 为真 ⇒ 输入框整块加 `-input-placeholder`（文字变成 placeholder 的灰色），
     * 表示「现在输入框里显示的是预览值，不是你选中的值」。
     */
    allHelp: { type: Boolean, default: false },

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
    onSelectorClick: {
      type: Function as PropType<((event: MouseEvent) => void) | undefined>,
      default: undefined,
    },
    /**
     * 根节点 `mousedown`（上游 `RangeSelector.js:168-176` 的 `onMouseDown`）。
     *
     * 🚨 **它默认会 `preventDefault()`** —— 除非目标是两个输入框本身。
     * 这是「点面板 / 点前缀图标时**不丢输入框焦点**」的机制：不阻止的话浏览器会把焦点
     * 移到 `body`，随后 `useFocusEvents` 的 blur 分支会把浮层关掉。
     * 上游把这个 `preventDefault` 写死在组件里、只把**回调**透出去
     * （`onMouseDown?.(e)`），本仓照此 —— 不做成「可覆盖的默认行为」。
     */
    onSelectorMouseDown: {
      type: Function as PropType<((event: MouseEvent) => void) | undefined>,
      default: undefined,
    },
    /**
     * 活动端的几何信息（上游 `RangeSelector.js:139` 的 `onActiveInfo`）。
     *
     * 载荷 `[inputRect.left, inputRect.right, parentRect.width]` —— 浮层用它算
     * `-range-arrow` 的 `left` 与容器偏移（`Popup/index.js:60,78-88`）。
     */
    onActiveInfo: {
      type: Function as PropType<((info: [number, number, number]) => void) | undefined>,
      default: undefined,
    },

    // ---------------------------------------------------- 多选模式（S5）
    /**
     * 多选（上游 `SingleSelector` 的 `multiple`）⇒ 触发元素从「输入框」换成
     * **标签列表 + 一个 readonly 输入**（`MultipleDates.js`）。
     *
     * ⚠️ 多选时**不渲染 `-input` 包裹层** —— 结构变成
     * `-selector` + `-multiple-input` + `-suffix` + `-clear` 直接挂在根下。
     */
    multiple: { type: Boolean, default: false },
    /** 原始值（标签要拿它去删；`valueTexts` 只有文本）。仅多选用。 */
    values: { type: Array as PropType<unknown[]>, default: undefined },
    /** 自定义标签渲染（上游 `tagRender`）。 */
    tagRender: {
      type: Function as PropType<((props: CustomTagProps) => VNodeChild) | undefined>,
      default: undefined,
    },
    /** 最多显示几个标签（`'responsive'` = 按宽度自适应）。 */
    maxTagCount: {
      type: [Number, String] as PropType<number | 'responsive' | undefined>,
      default: undefined,
    },
    /** 标签的删除图标（默认 `×`，由调用方给已算好的节点）。 */
    removeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    /** 删除一个标签（上游 `onMultipleRemove`；**是否走 `remove` 来源由调用方决定**）。 */
    onMultipleRemove: {
      type: Function as PropType<((value: unknown) => void) | undefined>,
      default: undefined,
    },
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

    /** 根元素（上游 `SingleSelector` 的 `rootRef`）。`isInternalElement` 要它。 */
    let rootEl: HTMLElement | null = null;
    const rootElRef = (el: Element | { $el?: Element } | null | undefined): void => {
      rootEl = ((el as HTMLElement | null) ?? null) as HTMLElement | null;
    };

    /**
     * 取某个 field 的原生输入框。
     *
     * ⚠️ 上游这一层是 `Input` **组件实例**（`.focus()` / `.nativeElement` / `.inputElement`），
     * 本仓没有那个组件（`Selector` 直接渲染 `<input>`）⇒ 命令面直接落在
     * `HTMLInputElement` 上。`inputElement` / `nativeElement` 在上游是两个名字指同一个
     * DOM 节点，这里也一样。
     */
    const getInput = (index: number | null | undefined): HTMLInputElement | null =>
      inputEls[index ?? 0] ?? null;

    /**
     * 上游 `SingleSelector` / `RangeSelector` 的命令面（`useImperativeHandle`）。
     *
     * - `focus()` —— 点根节点 / 点清除后把焦点还给输入框（两个 Picker 都有这个调用点）；
     * - `focus(options)` —— **范围独有**：`{index}` 指定把焦点给哪一端
     *   （`RangePicker.onSelectorClick` 会挑「第一个未禁用的端」）；
     * - `nativeElement` —— `useFocusEvents` 的 `isInternalElement` 要用它判断
     *   「新焦点是不是还在 Picker 里」；
     * - `blur()` —— 上游暴露但内部没人调，给消费者用；
     * - `startInput` / `endInput` —— 上游 `RangeSelectorRef` 独有（暴露两个原生 input）。
     *
     * ⚠️ 一律做成**函数**而不是取值：`rootEl` / `inputEls` 是 `let` 变量，
     * 在 `expose` 那一刻还是 `null`（`expose` 在 `setup()` 同步阶段跑）。
     */
    expose({
      focus: (options?: number | { index?: number; preventScroll?: boolean }) => {
        if (typeof options === 'object' && options !== null) {
          const { index = 0, ...rest } = options;
          getInput(index)?.focus(rest);
          return;
        }
        getInput(options ?? 0)?.focus();
      },
      blur: () => {
        getInput(0)?.blur();
        getInput(1)?.blur();
      },
      nativeElement: () => rootEl,
      startInput: () => getInput(0),
      endInput: () => getInput(1),
    });

    /**
     * `-active-bar` 的几何（上游 `RangeSelector.js:124-144`）。
     *
     * 上游是 `useState({ position: 'absolute', width: 0 })`，随 `activeIndex`
     * 与根尺寸变化重算：把**活动输入框**的 `left` / `width` 抄到这条 bar 上
     * （那条 bar 就是「当前在编辑哪一端」的下划线）。
     *
     * 🚨 **`width` / `left` 必须写成字符串**：Vue 的 `patchStyle` 不给数字补单位
     * （PITFALLS 8 / D94），写数字会被**静默丢弃** ⇒ bar 恒为 0 宽。
     * 上游是 React（有单位补全 + cssinjs 序列化），所以它写数字没事。
     *
     * ⚠️ 初值 `width: '0'` 与上游的 `width: 0` 等价（`'0'` 不需要单位），
     * 且**未聚焦时（`activeIndex == null`）不同步** ⇒ 停在 0 宽，与上游一致。
     */
    const activeBarStyle = ref<Record<string, string>>({ position: 'absolute', width: '0' });

    /**
     * 把活动端的几何同步到 `-active-bar` 与 `onActiveInfo`。
     *
     * ⚠️ 上游用 `useEvent`（恒定的引用）包着，因为它同时被
     * `useEffect(…, [activeIndex])` 与 `<ResizeObserver onResize>` 使用 ——
     * 引用不稳会让 ResizeObserver 反复解绑重绑。本仓用普通函数 + `watch`，
     * 注册点在下面的 `observeResize`（只在根元素变化时重注册）。
     */
    const syncActiveOffset = (): void => {
      const index = props.activeIndex;
      // 未聚焦（`null`）/ 未传 ⇒ 不动（上游 `getInput(activeIndex)` 取到 undefined 就返回）
      if (index === null || index === undefined) {
        return;
      }
      const input = inputEls[index];
      if (!input || !rootEl) {
        return;
      }
      const inputRect = input.getBoundingClientRect();
      const parentRect = rootEl.getBoundingClientRect();
      activeBarStyle.value = {
        ...activeBarStyle.value,
        width: `${inputRect.width}px`,
        left: `${inputRect.left - parentRect.left}px`,
      };
      props.onActiveInfo?.([inputRect.left, inputRect.right, parentRect.width]);
    };

    watch(() => props.activeIndex, syncActiveOffset, { flush: 'post' });

    /**
     * 根元素尺寸变化 ⇒ 重算 active-bar（上游把整棵树包在 `<ResizeObserver onResize>` 里）。
     *
     * ⚠️ `observeResize` 是 `@apollo-design/utils` 的**单例**观察器（不是每次 new 一个），
     * 返回注销函数 —— 必须在 `onScopeDispose` 里调，否则会持续持有元素。
     * ⚠️ 无 `ResizeObserver` 的环境（SSR / 老浏览器）静默降级，不抛。
     */
    let disposeResize: (() => void) | null = null;
    const rootElRefWithResize = (el: Element | { $el?: Element } | null | undefined): void => {
      rootElRef(el);
      disposeResize?.();
      disposeResize = null;
      if (rootEl) {
        disposeResize = observeResize(rootEl, () => syncActiveOffset());
      }
    };
    onScopeDispose(() => {
      disposeResize?.();
      disposeResize = null;
    });

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

    /**
     * 多选：标签列表 + readonly 输入（上游 `SingleSelector/MultipleDates.js` 77 行）。
     *
     * 结构（逐字）：
     * ```
     * <div class="${p}-selector">
     *   <Overflow prefixCls="${p}-selection-overflow" data maxCount itemKey renderItem renderRest />
     *   {!values.length && <span class="${p}-selection-placeholder">{placeholder}</span>}
     * </div>
     * <input class="${p}-multiple-input" value={texts.join(',')} readonly />
     * ```
     *
     * ⚠️ 三处容易漏：
     *   1. **标签的删除图标要 `onMouseDown: e => e.preventDefault()`** —— 否则点删除会让
     *      输入框失焦（`MultipleDates.js:26-30`）；
     *   2. **`title` 只在内容是字符串时给**（`typeof content === 'string' ? content : null`）；
     *   3. `renderRest` 的文案是 **`+ N ...`**（带空格与省略号，rc 的 `defaultRenderRest`）。
     */
    const renderMultiple = (): VNodeChild => {
      const selectionCls = `${props.prefixCls}-selection`;
      const values = props.values ?? [];
      const disabled = disabledPair.value[0];

      const renderSelectionItem = (content: VNodeChild, onClose?: () => void): VNodeChild =>
        h(
          'span',
          {
            class: `${selectionCls}-item`,
            // ⚠️ 上游只在内容是字符串时给 `title`（不是所有情况都给）
            title: typeof content === 'string' ? content : null,
          },
          [
            h('span', { class: `${selectionCls}-item-content` }, [content]),
            !disabled && onClose
              ? h(
                  'span',
                  {
                    class: `${selectionCls}-item-remove`,
                    onMousedown: (event: MouseEvent) => event.preventDefault(),
                    onClick: onClose,
                  },
                  [props.removeIcon ?? '×'],
                )
              : null,
          ],
        );

      const renderItem = (value: unknown, index: number): VNodeChild => {
        const label = props.valueTexts[index] ?? '';
        const closable = !disabled;
        const onClose = (): void => {
          if (!disabled) {
            props.onMultipleRemove?.(value);
          }
        };
        if (props.tagRender) {
          return props.tagRender({
            label,
            value: value as never,
            disabled: disabled === true,
            closable,
            onClose,
          } as never);
        }
        return renderSelectionItem(label, onClose);
      };

      return h('div', { class: `${props.prefixCls}-selector` }, [
        h(Overflow, {
          prefixCls: `${selectionCls}-overflow`,
          data: values,
          itemKey: (_item: unknown, index: number) => index,
          maxCount: props.maxTagCount,
          renderItem: (item: unknown, info: { index: number }) => renderItem(item, info.index),
          renderRest: (omitted: unknown[]) => `+ ${omitted.length} ...`,
        }),
        values.length === 0
          ? h('span', { class: `${selectionCls}-placeholder` }, [props.placeholder as VNodeChild])
          : null,
      ]);
    };

    /** 多选：只读输入（只为表单 / 无障碍保留，视觉上由标签承担）。 */
    const renderMultipleInput = (): VNodeChild =>
      h('input', {
        class: `${props.prefixCls}-multiple-input`,
        value: props.valueTexts.join(','),
        readOnly: true,
      });

    const renderInput = (index: number): VNodeChild => {
      const isRange = props.range;
      const ph = Array.isArray(props.placeholder) ? props.placeholder[index] : props.placeholder;
      const disabled = disabledPair.value[index];
      const active = isRange && props.activeIndex === index;
      /**
       * 🚨 上游 `useInputProps.js`：`helped = allHelp || (activeHelp && activeIndex === index)`。
       * 为真 ⇒ `-input` 上多一个 `-placeholder` 类（`Input.js:344-347`），
       * 且掩码的选择区被强制成 `[0, 0]`（`Input.js` 的 `selectionStart/End`）。
       *
       * ⚠️ 单值下 `activeIndex` 是 `undefined` ⇒ 第二个分句恒假，只有 `allHelp` 生效。
       */
      const helped = props.allHelp || (props.activeHelp && props.activeIndex === index);

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
            class: [
              `${props.prefixCls}-input`,
              // ⚠️ `-input-placeholder` = `-input` + `-placeholder`（上游 `Input.js:344-347`）
              ...(helped ? [`${props.prefixCls}-input-placeholder`] : []),
              props.classNames.input,
            ],
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
            ...(helped ? [`${props.prefixCls}-input-placeholder`] : []),
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
            ref: rootElRef,
            class: rootClass,
            style: props.rootStyle,
            onClick: (event: MouseEvent) => props.onSelectorClick?.(event),
          },
          // 🚨 多选**不渲染 `-input` 包裹层**（上游 `SingleSelector` 的 `selectorNode` 分支）
          props.multiple
            ? [
                renderPrefix(),
                renderMultiple(),
                renderMultipleInput(),
                renderSuffix(),
                renderClear(),
              ]
            : [renderPrefix(), renderInput(0)],
        );
      }

      return h(
        'div',
        {
          ref: rootElRefWithResize,
          class: rootClass,
          style: props.rootStyle,
          onClick: (event: MouseEvent) => props.onSelectorClick?.(event),
          /**
           * 🚨 保焦点（上游 `RangeSelector.js:168-176`）：目标是**两个输入框之外**的
           * 任何地方（面板容器、前缀、后缀、active-bar、分隔条…）时 `preventDefault`。
           *
           * 不做的后果：点一下输入框旁边的空白，浏览器把焦点移到 `body`
           * ⇒ 输入框 blur ⇒ `useFocusEvents` 判定「确认离开」⇒ **浮层被关掉**。
           *
           * ⚠️ 只在**范围**下绑（上游 `SingleSelector` 没有这一层 —— 单值的根节点
           * 只有输入框自己，没有「旁边的空白」）。
           */
          onMousedown: (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (target !== inputEls[0] && target !== inputEls[1]) {
              event.preventDefault();
            }
            props.onSelectorMouseDown?.(event);
          },
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
            // ⚠️ 全部是**字符串**（Vue 的 patchStyle 不给数字补单位 —— PITFALLS 8 / D94）
            style: activeBarStyle.value,
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
