<script setup lang="ts">
/** ColorPicker uses owned Vue events/models, current provider styles and render-time scoped slots. */

import { useControlledValue, useDevWarning } from '@apollo-design/utils';
import {
  type Component,
  cloneVNode,
  Comment,
  type CSSProperties,
  computed,
  defineComponent,
  Fragment,
  h,
  isVNode,
  type PropType,
  normalizeStyle,
  ref,
  shallowRef,
  useAttrs,
  Text,
  type VNodeChild,
  watch,
} from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useSize } from '../config-provider/size-context';
import { useFormItemInputContext } from '../form/context';
import Popover from '../popover';
import type { PopoverSemanticType } from '../popover/interface';
import { useCompactItemContext } from '../space/Compact';
import { getStatusClassNames } from '../space/statusUtils';
import { useMergedArrow } from '../tooltip/use-merged-arrow';
import ColorPickerPanel from './ColorPickerPanel';
import { AggregationColor } from './color';
import ColorTrigger from './components/ColorTrigger.vue';
import useModeColor from './hooks/use-mode-color';
import type {
  ColorFormatType,
  ColorPickerPanelRenderExtra,
  ColorPickerProps,
  ColorPickerSemanticClassNames,
  ColorPickerSemanticStyles,
  ColorPickerSlots,
  ModeType,
} from './interface';
import { genAlphaColor, generateColor, getColorAlpha } from './util';
import { useColorPickerTheme } from './use-color-picker-theme';

/** `children` 走默认插槽、`onXxx` 走 emits ⇒ 运行时 props 面要摘掉它们。 */
type ColorPickerVueProps = Omit<
  ColorPickerProps,
  'onChange' | 'onChangeComplete' | 'onOpenChange' | 'onFormatChange' | 'onClear' |
  'onUpdate:value' | 'onUpdate:open' | 'onUpdate:format'
>;

defineOptions({ name: 'AColorPicker', inheritAttrs: false });

const props = withDefaults(defineProps<ColorPickerVueProps>(), {
  prefixCls: undefined,
  classNames: undefined,
  styles: undefined,
  mode: undefined,
  value: undefined,
  defaultValue: undefined,
  format: undefined,
  defaultFormat: undefined,
  disabledFormat: undefined,
  open: undefined,
  trigger: 'click',
  placement: 'bottomLeft',
  arrow: undefined,
  getPopupContainer: undefined,
  autoAdjustOverflow: true,
  destroyTooltipOnHide: undefined,
  destroyOnHidden: undefined,
  allowClear: false,
  disabledAlpha: false,
  presets: undefined,
  showText: undefined,
  size: undefined,
  disabled: undefined,
});

// ⚠️ 用**运行时对象形态**（仓内主流，与 slider / calendar 同判），不用
//    `defineEmits<ColorPickerEmits>()` —— 后者在本仓的 vue-tsc 下 `emit('x', v)` 会报
//    `TS2769 No overload matches this call`。类型面仍由 `ColorPickerEmits` 对外保证。
const emit = defineEmits({
  'update:value': (_value: AggregationColor) => true,
  change: (_value: AggregationColor, _css: string) => true,
  changeComplete: (_value: AggregationColor) => true,
  clear: () => true,
  'update:open': (_open: boolean) => true,
  openChange: (_open: boolean) => true,
  'update:format': (_format: ColorFormatType | undefined) => true,
  formatChange: (_format: ColorFormatType | undefined) => true,
});

const attrs = useAttrs();
const slots = defineSlots<ColorPickerSlots>();
const pickerTheme = useColorPickerTheme();

/** The slot receives one stable Vue component reference for the default panel. */
const mergedPanelRender = (
  originPanel: Component,
  extra: ColorPickerPanelRenderExtra,
): VNodeChild =>
  slots.panelRender ? slots.panelRender({ panel: originPanel, extra }) : h(originPanel);

// ============================== Context ==============================
const context = useComponentConfig<{
  className?: string;
  style?: CSSProperties;
  classNames?: ColorPickerProps['classNames'];
  styles?: ColorPickerProps['styles'];
  arrow?: ColorPickerProps['arrow'];
}>('color-picker');
const direction = useDirection();

const prefixCls = computed(() => context.getPrefixCls('color-picker', props.prefixCls));
const mergedArrow = useMergedArrow(
  () => props.arrow,
  () => context.arrow,
);

// ================== Size / Disabled / Compact ==================
const { compactSize, compactItemClassnames } = useCompactItemContext(prefixCls, direction);
const mergedSize = useSize((ctx) => props.size ?? compactSize.value ?? ctx);
const contextDisabled = useDisabled();
const mergedDisabled = computed(() => props.disabled ?? contextDisabled.value);

// ================== Value & Mode ==================
const [mergedColor, setColor, modeState, setModeState, modeOptions] = useModeColor(
  props.defaultValue,
  computed(() => props.value),
  computed(() => props.mode),
);

const isAlphaColor = computed(() => getColorAlpha(mergedColor.value) < 100);

// =================== Gradient ====================
// ⚠️ `shallowRef`（`ref()` 的 `UnwrapRef` 会丢掉类的私有成员 ⇒ 不再可赋值给 AggregationColor）
const cachedGradientColor = shallowRef<AggregationColor | null>(null);
const activeIndex = ref(0);
const gradientDragging = ref(false);

const setActiveIndex = (index: number): void => {
  activeIndex.value = index;
};
const setGradientDragging = (dragging: boolean): void => {
  gradientDragging.value = dragging;
};

// =========== Merged Props for Semantic ===========
/** Derive semantic inputs directly from current props and providers. */
const mergedSemanticProps = computed<ColorPickerProps>(() => ({
  ...props,
  trigger: props.trigger ?? 'click',
  allowClear: props.allowClear ?? false,
  autoAdjustOverflow: props.autoAdjustOverflow ?? true,
  disabledAlpha: props.disabledAlpha ?? false,
  arrow: mergedArrow.value,
  placement: props.placement ?? 'bottomLeft',
  disabled: mergedDisabled.value,
  size: mergedSize.value,
}));

const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
  ColorPickerProps,
  ColorPickerSemanticClassNames,
  ColorPickerSemanticStyles
>(
  [() => context.classNames, () => props.classNames],
  [
    () => context.styles,
    () => context.style ? { root: context.style } : undefined,
    () => props.styles,
  ],
  mergedSemanticProps,
  // ⚠️ 与 antd 6.6.4 逐字（`ColorPicker.js:98-100`）。本文件头 §9 曾判「本仓不需要
  //    schema 档」—— 对「可选链读 popup.root」的**读取侧**确实空转，但**合并侧**在
  //    「字符串 + 对象混用」时会产垃圾键（KNOWN-ISSUES §1.7b）⇒ 2026-10-03 补上。
  { popup: { _default: 'root' } },
);

// ============================== 开合 / 格式 ==============================
// Shared accepted state keeps rejected controlled requests out of later uncontrolled state.
const [innerPopupOpen, setPopupOpen] = useControlledValue<boolean>({
  defaultValue: () => false,
  getValue: () => props.open,
});
const popupOpen = computed(() => !mergedDisabled.value && innerPopupOpen.value);

/** 判据 1（第二条）。 */
const triggerOpenChange = (open: boolean): void => {
  if (!open || !mergedDisabled.value) {
    setPopupOpen(open);
    emit('update:open', open);
    emit('openChange', open);
  }
};

const [formatValue, setFormat] = useControlledValue<ColorFormatType | undefined>({
  defaultValue: () => props.defaultFormat,
  getValue: () => props.format,
});

/** 判据 2：**先取快照**。 */
const triggerFormatChange = (newFormat?: ColorFormatType): void => {
  const prev = formatValue.value;
  setFormat(newFormat);

  if (prev !== newFormat) {
    emit('update:format', newFormat);
    emit('formatChange', newFormat);
  }
};

// ==================== Change =====================
/** 判据 3 的 ⑤：拖拽期间不发 `changeComplete`。 */
const onInternalChangeComplete = (color: AggregationColor): void => {
  let changeColor = generateColor(color);
  // 忽略 alpha 色
  if (props.disabledAlpha && !color.cleared) {
    changeColor = genAlphaColor(color);
  }
  emit('changeComplete', changeColor);
};

/** 判据 3。 */
const onInternalChange = (data: AggregationColor, changeFromPickerDrag?: boolean): void => {
  let color: AggregationColor = generateColor(data);

  // 忽略 alpha 色
  if (props.disabledAlpha && !color.cleared) {
    color = genAlphaColor(color);
  }

  setColor(color);
  cachedGradientColor.value = null;

  emit('update:value', color);
  emit('change', color, color.toCssString());

  // 仅拖拽取色时不发 complete
  if (!changeFromPickerDrag) {
    onInternalChangeComplete(color);
  }
};

/** 判据 4：`cachedGradientColor` 的写入在 `onInternalChange` **之后**。 */
const onInternalModeChange = (newMode: ModeType): void => {
  setModeState(newMode);

  if (newMode === 'single' && mergedColor.value.isGradient()) {
    activeIndex.value = 0;
    const first = mergedColor.value.getColors()[0];
    onInternalChange(new AggregationColor(first ? first.color : mergedColor.value));

    // 必须在 `onInternalChange` 之后（它会清掉缓存）
    cachedGradientColor.value = mergedColor.value;
  } else if (newMode === 'gradient' && !mergedColor.value.isGradient()) {
    const baseColor = isAlphaColor.value ? genAlphaColor(mergedColor.value) : mergedColor.value;

    onInternalChange(
      new AggregationColor(
        cachedGradientColor.value || [
          { percent: 0, color: baseColor },
          { percent: 100, color: baseColor },
        ],
      ),
    );
  }
};

// ================== Form Status ==================
const formItemContext = useFormItemInputContext();
const contextStatus = computed(() => formItemContext.value.status);

// ===================== Style =====================
/** 判据 6 + 7。 */
/** 轻量拼接（`tooltip/util` 的 `clsx` 只收 `string | falsy`，不收对象）。 */
const joinCls = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

const mergedRootCls = computed<string[]>(() => {
  // Internal scoping classes; native class belongs to the actual trigger.
  const list = [
    'css-var-root',
    `${prefixCls.value}-css-var`,
  ];
  if (direction.value === 'rtl') {
    list.push(`${prefixCls.value}-rtl`);
  }
  return list;
});
const mergedCls = computed(() =>
  joinCls(
    getStatusClassNames(prefixCls.value, contextStatus.value),
    mergedSize.value === 'small' ? `${prefixCls.value}-sm` : '',
    mergedSize.value === 'large' ? `${prefixCls.value}-lg` : '',
    compactItemClassnames.value,
    context.className,
    ...mergedRootCls.value,
  ),
);
const mergedPopupCls = computed(() => joinCls(prefixCls.value, ...mergedRootCls.value, mergedClassNames.value.popup?.root));

/** 空样式对象要转成 `undefined`，否则 SSR 会渲染出 `style=""`。 */
function nonEmpty(style: CSSProperties | undefined): CSSProperties | undefined {
  return style && Object.keys(style).length > 0 ? style : undefined;
}

/** `styles.popupOverlayInner` → Popover 的 `styles.container`（上游逐字）。 */
const popoverStyles = computed(
  () =>
    ({
      root: { ...pickerTheme.style.value, ...mergedStyles.value.popup?.root },
      container: nonEmpty(mergedStyles.value.popupOverlayInner),
    }) satisfies NonNullable<PopoverSemanticType['styles']>,
);

/**
 * 透传给触发器的属性。
 *
 * ⚠️ **`class` / `style` 必须摘掉**：Vue 里它们是 `attrs`（`StyleValue` 含 `null`），
 * 而 `ColorTrigger` 的 `style` prop 是 `CSSProperties` ⇒ 整体 `v-bind="attrs"` 会类型不匹配。
 * 两者单独处理（`class` 并进 `mergedCls`，`style` 单独绑定）。
 */
const triggerAttrs = () => {
  const { class: _class, style: _style, ...rest } = attrs;
  return { ...rest, ...(mergedDisabled.value ? { disabled: true } : {}) };
};
const customTriggerAttrs = () => ({ ...triggerAttrs(), ...(mergedDisabled.value ? { 'aria-disabled': true } : {}) });

/** 判据 8。 */
const mergedDestroyOnHidden = computed(() => props.destroyOnHidden ?? !!props.destroyTooltipOnHide);

// ===================== Warning ======================
const devWarning = useDevWarning('ColorPicker');
watch(
  () => [props.disabledAlpha, isAlphaColor.value],
  () => {
    devWarning(
      !(props.disabledAlpha && !mergedColor.value.cleared && isAlphaColor.value),
      '`disabledAlpha` will make the alpha to be 100% when use alpha color.',
    );
  },
  { immediate: true },
);

// ================== 触发器宿主（`children` 通道）==================
/**
 * 🚨 **为什么需要一个宿主组件**（2026-10-02 实测，PITFALLS 330）：
 *
 * `Trigger` 的归一化是 `children[0]`（只认**元素** vnode）；而**模板**里的 `<slot/>`
 * 编译成 `[renderSlot(...)]` ⇒ 最终是**嵌套数组** `[[vnode]]` ⇒ `children[0]` 拿到数组
 * ⇒ 走「包一层 `<span>`」分支（D79）⇒ DOM 比上游多一个 `<span>`。
 *
 * 宿主组件把插槽结果**摊平后取单元素**再渲染 ⇒ `Trigger` 看到的是**一个组件 vnode**
 * （D79 明确「组件 vnode 视为有效触发元素」）⇒ 不再包 span，`attrs` 继续透传到用户
 * 那个根元素上（`ref` 由 Trigger 按 D78 归一 `$el`）。
 *
 * ⚠️ 传的是**函数**而不是 vnode：vnode 只在渲染期创建，跨渲染复用同一个 vnode 会让
 *    Vue 的 patch 出错。
 */
const TriggerHost = defineComponent({
  name: 'AColorPickerTriggerHost',
  inheritAttrs: false,
  props: {
    render: { type: Function as PropType<() => VNodeChild>, required: true },
  },
  setup(props, { attrs }) {
    return () => {
      const node = props.render();
      if (isVNode(node) && node.type !== Fragment && node.type !== Text && node.type !== Comment) {
        return cloneVNode(node, attrs, true);
      }
      return h('span', attrs, Array.isArray(node) ? node : [node]);
    };
  },
});

/**
 * 摊平插槽结果：恰好一个元素时返回它本身，否则原样返回数组
 * （多子节点仍会被包 span —— 上游的 `children` 是单个 ReactNode，无对应物）。
 */
const renderChildren = (): VNodeChild => {
  const content = slots.default?.();
  const children: VNodeChild[] = Array.isArray(content) ? content : [content];
  const nodes = children.filter(
    (node) => node !== null && node !== undefined && typeof node !== 'boolean',
  );
  return nodes.length === 1 ? nodes[0] : nodes;
};

// ===================== Emits 桥接 =====================
const onClearInternal = (): void => {
  emit('clear');
};
</script>

<template>
  <Popover
    :class-names="{ root: mergedPopupCls }"
    :styles="popoverStyles"
    :open="popupOpen"
    :disabled="mergedDisabled"
    :trigger="trigger"
    :placement="placement"
    :arrow="mergedArrow"
    :get-popup-container="getPopupContainer"
    :auto-adjust-overflow="autoAdjustOverflow"
    :destroy-on-hidden="mergedDestroyOnHidden"
    fresh
    @open-change="triggerOpenChange"
  >
    <template #content>
      <ColorPickerPanel
        :prefix-cls="prefixCls"
        :value="mergedColor"
        :mode="modeState"
        :on-mode-change="onInternalModeChange"
        :mode-options="modeOptions"
        :allow-clear="allowClear"
        :disabled="mergedDisabled || !popupOpen"
        :disabled-alpha="disabledAlpha"
        :presets="presets"
        :panel-render="mergedPanelRender"
        :format="formatValue"
        :on-format-change="triggerFormatChange"
        :on-change="onInternalChange"
        :on-change-complete="onInternalChangeComplete"
        :on-clear="onClearInternal"
        :active-index="activeIndex"
        :on-active="setActiveIndex"
        :gradient-dragging="gradientDragging"
        :on-gradient-dragging="setGradientDragging"
        :disabled-format="disabledFormat"
      />
    </template>
    <template #default>
    <TriggerHost v-if="slots.default" v-bind="customTriggerAttrs()" :class="[context.className, mergedClassNames.root, attrs.class]" :style="[pickerTheme.style.value, mergedStyles.root, normalizeStyle(attrs.style)]" :render="renderChildren" />
      <ColorTrigger
        v-else
        v-bind="triggerAttrs()"
        :style="[pickerTheme.style.value, normalizeStyle(attrs.style)]"
        :class="attrs.class"
        :active-index="popupOpen ? activeIndex : -1"
        :open="popupOpen"
        :class-name="mergedCls"
        :class-names="mergedClassNames"
        :styles="mergedStyles"
        :prefix-cls="prefixCls"
        :disabled="mergedDisabled"
        :show-text="showText || !!slots.showText"
        :format="formatValue"
        :color="mergedColor"
      >
        <template v-if="slots.showText" #showText="scope">
          <slot name="showText" v-bind="scope" />
        </template>
      </ColorTrigger>
    </template>
  </Popover>
</template>
