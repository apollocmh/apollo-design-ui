/**
 * Segmented —— 分段控制器。
 *
 * 契约来源：
 *   - 薄壳：antd 6.6.4 的 `es/segmented/index.js`（60 行）
 *   - 内核：`@rc-component/segmented@1.4.0` 的 `es/index.js`（替代目标，H5）
 *
 * 判据逐条对齐 rc 内核（判据编号对应 rc 源码注释）：
 *
 * 1. **value 的初始值**：`defaultValue ?? options[0]?.value` —— 没给
 *    defaultValue 时**自动选第一项**（rc 的 useControlledState 首参）。
 *    且受控值不在 options 里时**不自动切换**（rc 注释「should not auto switch」
 *    —— 单一事实来源不被破坏）。
 * 2. **onChange 只在值变化时发**：点击已选中项不发事件（rc handleChange 无
 *    去重？—— 有：`onOffset` 键盘路径有 `nextOption.value !== rawValue` 判据，
 *    点击路径经 input 的 checked 语义天然不重复；键盘与点击统一在
 *    `triggerChange` 里做 `val !== current` 去重，radio Group 同判）。
 * 3. **键盘导航**：ArrowLeft/ArrowUp = −1，ArrowRight/ArrowDown = +1；
 *    有效集合 = 非 disabled 项 + 当前项（即使当前项 disabled 也在集合里）；
 *    环绕（取模）。
 * 4. **焦点样式靠 Tab 键判别**：keyup Tab → isKeyboard=true；mousedown → false。
 *    `-item-focused` 只在 isFocused && isKeyboard && 选中项上出现。
 * 5. **根元素**：role="radiogroup"，aria-label="segmented control"（rc 硬编码），
 *    tabIndex（整组 disabled 时不给），aria-orientation（vertical ? vertical :
 *    horizontal）。
 * 6. **item 是 label 包 input[type=radio]**：原生键盘可达性的来源；input 0×0
 *    绝对定位隐藏（样式层）。整组 disabled 与单项 disabled 合流 →
 *    `-item-disabled` + input disabled。
 * 7. **thumb 与 `-item-selected` 的交接**：动画期间选中项只挂
 *    `-item-selected-text`（文字色），`-item-selected`（实底）让位给 thumb；
 *    动画结束恢复（rc 的 thumbShow 判据）。
 *
 * antd 薄壳判据：
 *   - icon 选项：label 渲染 `<span class="-item-icon">{icon}</span>` + 文本 span
 *     （isReactRenderable 判据 → Vue 侧 VNode / 字符串都渲染）。
 *   - tooltip 选项：itemRender 用 Tooltip 包住 label 元素。
 *   - 尺寸类：`-sm` / `-lg`（middle 不落类）；`-block` / `-vertical` /
 *     `-shape-round`（shape 默认 'default' 不落类）。
 *   - name 默认 `useId()`；semantic classNames/styles 按 root/icon/label/item 合并
 *     （contextStyleRoot / styleRoot 顺序遵守 _internal/use-merge-semantic 的契约）。
 */

import { isString, pickAttrs, useControlledValue, useId } from '@apollo-design/utils';
import type { CSSProperties } from 'vue';
import {
  computed,
  defineComponent,
  h,
  isVNode,
  type PropType,
  shallowRef,
  type VNode,
  type VNodeChild,
} from 'vue';
import {
  mergeClassNames,
  mergeStyles,
  resolveSemantic,
  semanticRootStyle,
  styleAttrs,
} from '../_internal/use-merge-semantic';
import { useOrientation } from '../_internal/use-orientation';
import { useComponentConfig } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import { Tooltip } from '../tooltip';
import { MotionThumb } from './components/MotionThumb';
import type {
  SegmentedLabeledOptionWithIcon,
  SegmentedOption,
  SegmentedProps,
  SegmentedSemanticClassNames,
  SegmentedSemanticStyles,
  SegmentedSemanticTypeInput,
  SegmentedValue,
} from './interface';

/** 归一化后的选项形状（icon / label 均可选，由渲染层按形态分支）。 */
type NormalizedSegmentedOption = Omit<SegmentedLabeledOptionWithIcon, 'icon'> & {
  label: unknown;
  icon?: unknown;
};

/** 对象选项判据（rc 的 normalizeOptions + antd 的 isSegmentedLabeledOptionWithIcon）。 */
function toSegmentedOption(option: SegmentedOption): NormalizedSegmentedOption {
  if (typeof option === 'object' && option !== null) {
    const o = option as SegmentedLabeledOptionWithIcon & { label?: unknown };
    // title 判据（rc getValidTitle）：title 显式给了用它；否则 label 非对象时 toString
    const title =
      typeof o.title !== 'undefined'
        ? o.title
        : typeof o.label !== 'object' && o.label !== undefined
          ? String(o.label)
          : undefined;
    return {
      ...o,
      title,
      value: o.value,
      label: o.label,
    };
  }
  // 原始值形态：label / title / value 全取自身
  return {
    value: option as SegmentedValue,
    label: String(option),
    title: String(option),
  };
}

/** icon 选项判据（antd 的 isSegmentedLabeledOptionWithIcon）。 */
function isOptionWithIcon(option: unknown): option is SegmentedLabeledOptionWithIcon {
  return typeof option === 'object' && option !== null && !!(option as { icon?: unknown }).icon;
}

/** 渲染 label 内容：VNode / 字符串 / 数字都渲染（rc 的 isReactRenderable 等价）。 */
function renderLabelContent(label: unknown): VNodeChild {
  if (isVNode(label)) return label as VNode;
  if (isString(label) || typeof label === 'number') return String(label);
  return null;
}

export const SegmentedComponent = defineComponent({
  name: 'ASegmented',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    options: { type: Array as PropType<SegmentedProps['options']>, default: () => [] },
    disabled: { type: Boolean, default: undefined },
    defaultValue: { type: [String, Number] as PropType<SegmentedValue>, default: undefined },
    value: { type: [String, Number] as PropType<SegmentedValue>, default: undefined },
    name: { type: String, default: undefined },
    block: { type: Boolean, default: false },
    size: { type: String as PropType<SegmentedProps['size']>, default: undefined },
    // ⚠️ undefined 保住「未传」与「显式 false」的分支差异（PITFALLS 46）
    vertical: { type: Boolean, default: undefined },
    orientation: {
      type: String as PropType<SegmentedProps['orientation']>,
      default: undefined,
    },
    shape: { type: String as PropType<SegmentedProps['shape']>, default: 'default' },
    // 支持函数式语义（antd 的 classNamesAndFn / stylesAndFn，裁决 empty-semantic-fn = B）
    classNames: {
      type: [Object, Function] as unknown as PropType<SegmentedSemanticTypeInput['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as unknown as PropType<SegmentedSemanticTypeInput['styles']>,
      default: undefined,
    },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
  },
  /**
   * ⚠️ 只声明 `update:value`（供 `v-model:value`），不声明 `change` ——
   * onChange 走 attrs（PITFALLS 35），两者同时发出（规则 C11）。
   */
  emits: ['update:value'],
  setup(props, { attrs, emit, expose }) {
    const callbacks = attrs as unknown as { onChange?: (value: SegmentedValue) => void };

    const context = useComponentConfig('segmented');
    const { getPrefixCls } = context;
    const rootRef = shallowRef<HTMLDivElement | null>(null);

    // ============================ Name ============================
    const defaultName = useId();
    const mergedName = computed(() => props.name ?? defaultName);

    // ============================ Value ===========================
    const [innerValue, setInnerValue] = useControlledValue<SegmentedValue | undefined>({
      defaultValue: () => props.defaultValue,
      getValue: () => props.value,
    });
    /**
     * rc 判据：defaultValue 未给时取第一个选项的 value。innerValue 初始为
     * undefined 时落到该值（在渲染层读，保证 options 变化时也生效）。
     */
    const currentValue = computed<SegmentedValue | undefined>(() => {
      if (innerValue.value !== undefined) return innerValue.value;
      const first = props.options?.[0];
      return first !== undefined ? toSegmentedOption(first).value : undefined;
    });

    const triggerChange = (val: SegmentedValue) => {
      if (val === currentValue.value) return;
      setInnerValue(val);
      emit('update:value', val);
      callbacks.onChange?.(val);
    };

    // ============================ Options =========================
    const normalizedOptions = computed(() =>
      (props.options ?? []).map((option) => toSegmentedOption(option)),
    );

    // ========================== Orientation =======================
    const orientationPair = useOrientation(
      () => props.orientation,
      () => props.vertical,
      () => undefined,
    );
    const mergedVertical = computed(() => orientationPair.value[1]);

    // ============================= Size ===========================
    // 函数形态：props.size 变化要可追踪（checklist：受控切换静默失效同判）
    const mergedSize = useSize((ctxSize) => props.size ?? ctxSize);

    // ============================ Focus ===========================
    const isFocused = shallowRef(false);
    const isKeyboard = shallowRef(false);
    const handleFocus = () => {
      isFocused.value = true;
    };
    const handleBlur = () => {
      isFocused.value = false;
    };
    const handleMouseDown = () => {
      isKeyboard.value = false;
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Tab') isKeyboard.value = true;
    };

    // =========================== Keyboard =========================
    const onOffset = (offset: number) => {
      const current = currentValue.value;
      // rc 判据：有效集合 = 非 disabled 项 + 当前项（disabled 的当前项也要保留）
      const validOptions = normalizedOptions.value.filter(
        (option) => option.value === current || !option.disabled,
      );
      const currentIndex = validOptions.findIndex((option) => option.value === current);
      const total = validOptions.length;
      if (total === 0) return;
      const nextIndex = (currentIndex + offset + total) % total;
      const nextOption = validOptions[nextIndex];
      if (nextOption && nextOption.value !== current) {
        triggerChange(nextOption.value);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          onOffset(-1);
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          onOffset(1);
          break;
      }
    };

    // ========================= Thumb 动画 =========================
    const thumbShow = shallowRef(false);
    const getValueIndex = (val: string | number | undefined) =>
      normalizedOptions.value.findIndex((option) => option.value === val);

    expose({
      get nativeElement() {
        return rootRef.value;
      },
    });

    return () => {
      const prefixCls = getPrefixCls('segmented', props.prefixCls);
      const disabled = !!props.disabled;

      // ---- semantic classNames / styles（合并顺序 = antd 薄壳）----
      // 函数式输入在此 resolve（与 antd 的 resolveStyleOrClass 同构）
      // ⚠️ `props` 收敛成 `Record<string, unknown>`：函数式输入的类型是
      //    `(info: { props: Record<string, unknown> }) => …`（参数逆变）——
      //    与 `ModalSemanticTypeInput` 同判，传 `SegmentedProps` 会不可赋值。
      const info = { props: props as unknown as Record<string, unknown> };
      const contextClassNames = resolveSemantic(
        (context as { classNames?: SegmentedSemanticClassNames }).classNames,
        info,
      );
      const contextStyles = resolveSemantic(
        (context as { styles?: SegmentedSemanticStyles }).styles,
        info,
      );
      const contextStyleRoot = semanticRootStyle(
        (context as { style?: Record<string, unknown> }).style as never,
      );
      const styleRoot = semanticRootStyle(props.style as CSSProperties);
      const mergedClassNames = mergeClassNames<SegmentedSemanticClassNames>(
        contextClassNames,
        resolveSemantic(props.classNames, info),
      );
      // 顺序是契约：style prop 排在 styles.root 之后 → style 覆盖 styles.root
      const mergedStyles = mergeStyles<SegmentedSemanticStyles>(
        contextStyles,
        contextStyleRoot,
        resolveSemantic(props.styles, info),
        styleRoot,
      ) as Record<string, Record<string, unknown> | undefined>;

      const itemValue = currentValue.value;

      // ---- item 渲染 ----
      const items = normalizedOptions.value.map((option) => {
        const optionDisabled = disabled || !!option.disabled;
        const checked = option.value === itemValue;
        const itemCls = [
          option.className,
          `${prefixCls}-item`,
          mergedClassNames.item,
          {
            [`${prefixCls}-item-selected`]: checked && !thumbShow.value,
            [`${prefixCls}-item-selected-text`]: checked,
            [`${prefixCls}-item-focused`]: isFocused.value && isKeyboard.value && checked,
            [`${prefixCls}-item-disabled`]: optionDisabled,
          },
        ];

        const labelEl = h(
          'div',
          {
            class: [`${prefixCls}-item-label`, mergedClassNames.label],
            title: option.title,
            style: mergedStyles.label,
          },
          // icon 语法糖（antd 薄壳）：icon span + 文本 span
          isOptionWithIcon(option)
            ? [
                h(
                  'span',
                  {
                    key: 'icon',
                    class: [`${prefixCls}-item-icon`, mergedClassNames.icon],
                    style: mergedStyles.icon,
                  },
                  renderLabelContent(option.icon) as VNode,
                ),
                renderLabelContent(option.label)
                  ? h('span', { key: 'label' }, renderLabelContent(option.label) as VNode)
                  : null,
              ]
            : [renderLabelContent(option.label) as VNode],
        );

        // ⚠️ 闭包变量陷阱：不能写 `node = h(Tooltip, …, { default: () => node })`
        //    —— 箭头函数捕获的是**变量**而不是求值时的值，Tooltip 渲染 slot 时
        //    拿到的是重新赋值后的 Tooltip vnode 本身 → 无限递归挂载（栈溢出）。
        //    必须用不变的局部变量承载 label 元素。
        const labelNode: VNodeChild = h(
          'label',
          {
            key: option.value,
            class: itemCls,
            style: mergedStyles.item,
            // 🚨 必须是 **`onMousedown`**（小写 d）：Vue 的 `parseName` 会对 `on` 之后的部分做
            //    `hyphenate` ⇒ 写成 `onMouseDown` 会得到事件名 `mouse-down`（**永不触发**）。
            //    2026-10-03 修（此前「mousedown 清除键盘态」从未生效，见 PITFALLS 323）。
            onMousedown: handleMouseDown,
          },
          [
            h('input', {
              type: 'radio',
              name: mergedName.value,
              class: `${prefixCls}-item-input`,
              disabled: optionDisabled,
              checked,
              onChange: () => {
                if (optionDisabled) return;
                triggerChange(option.value);
              },
              onFocus: handleFocus,
              onBlur: handleBlur,
              onKeydown: handleKeyDown,
              onKeyup: handleKeyUp,
            }),
            labelEl,
          ],
        );

        // tooltip 选项 → itemRender 包 Tooltip（antd 薄壳）
        if (option.tooltip) {
          const tooltipProps =
            typeof option.tooltip === 'object' ? { ...option.tooltip } : { title: option.tooltip };
          return h(Tooltip as never, tooltipProps as never, {
            default: () => labelNode,
          });
        }
        return labelNode as VNode;
      });

      const classString = [
        prefixCls,
        mergedClassNames.root,
        props.className,
        props.rootClassName,
        (context as { className?: string }).className,
        {
          [`${prefixCls}-block`]: props.block,
          [`${prefixCls}-sm`]: mergedSize.value === 'small',
          [`${prefixCls}-lg`]: mergedSize.value === 'large',
          [`${prefixCls}-vertical`]: mergedVertical.value,
          [`${prefixCls}-rtl`]: (context as { direction?: string }).direction === 'rtl',
          [`${prefixCls}-disabled`]: disabled,
          [`${prefixCls}-shape-${props.shape ?? 'default'}`]: props.shape === 'round',
        },
        // ⚠️ rc 内核还会再加一次 `-vertical`（antd 薄壳传 vertical 给 rc，rc 的 class
        //    逻辑自己又判一次）—— 上游渲染产物里该类**重复出现两次**，逐字保留。
        {
          [`${prefixCls}-vertical`]: mergedVertical.value,
        },
      ];

      return h(
        'div',
        {
          role: 'radiogroup',
          'aria-label': 'segmented control',
          tabIndex: disabled ? undefined : 0,
          'aria-orientation': mergedVertical.value ? 'vertical' : 'horizontal',
          ...pickAttrs(attrs as Record<string, unknown>, { aria: true, data: true }),
          class: classString,
          // antd：style={mergedStyles.root} —— style prop 已并入 root 键
          ...styleAttrs(mergedStyles.root as never),
          ref: rootRef,
        },
        [
          h('div', { class: `${prefixCls}-group` }, [
            h(MotionThumb, {
              prefixCls,
              containerRef: rootRef,
              value: itemValue,
              getValueIndex,
              motionName: `${prefixCls}-thumb-motion`,
              vertical: mergedVertical.value,
              direction: (context as { direction?: 'ltr' | 'rtl' }).direction,
              onMotionStart: () => {
                thumbShow.value = true;
              },
              onMotionEnd: () => {
                thumbShow.value = false;
              },
            }),
            items as unknown as VNode[],
          ]),
        ],
      );
    };
  },
});

export const Segmented = SegmentedComponent;
export default SegmentedComponent;
