<script setup lang="ts">
/**
 * ColorPicker 主实现 —— antd 6.6.4 `es/color-picker/ColorPicker.js`（354 行）。
 *
 * 契约全文见 `docs/analysis/color-picker.md`；这里只留**实现期最容易写错的判据**。
 *
 * ── 渲染骨架（上游 `:280-331`）────────────────────────────────────────────────
 *
 * ```html
 * <Popover classNames={{root: mergedPopupCls}} styles={{root, container}} …>
 *   content: <ColorPickerPanel/>              ← 面板（-inner 在浮层里）
 *   default: children || <ColorTrigger/>      ← 传了 children 就**完全不要**内置触发器
 * </Popover>
 * ```
 *
 * ── 十条必须复刻的判据 ────────────────────────────────────────────────────────
 *
 * 1. 🚨 **`popupOpen = !mergedDisabled && internalPopupOpen`** —— 禁用态**恒关**；
 *    而 `triggerOpenChange` 的守卫是 `!open || !disabled` ⇒ **禁用时「开」被吞掉、
 *    「关」仍然放行**（两条判据不是一回事）。
 * 2. **`triggerFormatChange` 先取快照、再写状态**（PITFALLS 13/207）——
 *    `formatValue` 是 computed，写完立刻变 ⇒ 不取快照就恒「同值不发」。
 * 3. **`onInternalChange` 的顺序**：① `disabledAlpha && isAlphaColor` 时用
 *    `genAlphaColor` 改写 → ② `setColor` → ③ **清 `cachedGradientColor`** →
 *    ④ 发 `change` → ⑤ **非拖拽才发 `changeComplete`**。
 * 4. **`onInternalModeChange` 里 `setCachedGradientColor(mergedColor)` 必须在
 *    `onInternalChange` 之后** —— 因为 ③ 会把它清掉（上游注释原文）。
 * 5. **`mergedRootCls` 同时进「触发器类名」与「浮层根类名」**（两处都要带）。
 * 6. **类名顺序**：`-trigger` → `mergedCls`（状态/尺寸/紧凑/上下文/`mergedRootCls`/`className`）
 *    → `classNames.root` → `{active, disabled}`。上游快照实测：
 *    `ant-color-picker-trigger css-var-root ant-color-picker-css-var ant-color-picker-trigger-disabled`。
 * 7. **`css-var-root` + `-css-var` 两个类都要挂**（与 `genColorPickerStyle` 的声明块选择器对应）。
 * 8. **`destroyOnHidden = destroyOnHidden ?? !!destroyTooltipOnHide`**。
 * 9. 🚨 **`popup._default: 'root'` 不是「回退到顶层 `root`」** —— 读上游
 *    `useMergeSemantic/utils.ts` 的 `fillObjectBySchema`：`_default` 只做
 *    「把嵌套键初始化为 `{}`」，以及「某来源把 `popup` 传成**字符串**时落到
 *    `popup.root`」。两者对本组件都是空转（我们用可选链读 `popup.root`）
 *    ⇒ **本仓不需要给 `useMergeSemantic` 加 schema 档**（分析文档 §2.7 的
 *    「待验证」到此关闭）。
 * 10. ⚠️ **`disabledAlpha` 的告警**：`devWarning(!(disabledAlpha && isAlphaColor), …)`。
 *
 * ── 平台差异 ──────────────────────────────────────────────────────────────────
 *
 * - **没有 `ContextIsolator`**（上游用它屏蔽 Form 的 `status`）—— 本仓无此物，
 *   而面板侧**没有**任何子件读 `useFormItemInputContext` ⇒ 行为等价（PLATFORM）。
 * - **`children` 走默认插槽**（C8）而不是 `children` prop。
 * - **`onChangeComplete` 的存在性守卫被去掉**：上游 `if (onChangeComplete)` 只跳过
 *   `generateColor` / `genAlphaColor` 的**纯计算**（无副作用）⇒ 恒发事件与上游可观测行为相同。
 * - **无 `hashId`**（D2）。
 */

import { useDevWarning } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  ref,
  shallowReactive,
  shallowRef,
  useAttrs,
  useSlots,
  watch,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
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
  ColorPickerEmits,
  ColorPickerProps,
  ColorPickerSemanticClassNames,
  ColorPickerSemanticStyles,
  ModeType,
} from './interface';
import { genAlphaColor, generateColor, getColorAlpha } from './util';

/** `children` 走默认插槽、`onXxx` 走 emits ⇒ 运行时 props 面要摘掉它们。 */
type ColorPickerVueProps = Omit<
  ColorPickerProps,
  'children' | 'onChange' | 'onChangeComplete' | 'onOpenChange' | 'onFormatChange' | 'onClear'
>;

defineOptions({ name: 'AColorPicker', inheritAttrs: false });

const props = withDefaults(defineProps<ColorPickerVueProps>(), {
  prefixCls: undefined,
  className: undefined,
  rootClassName: undefined,
  style: undefined,
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
  panelRender: undefined,
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
const slots = useSlots();

// ============================== Context ==============================
const context = useComponentConfig('color-picker') as unknown as {
  getPrefixCls: (suffix?: string, custom?: string) => string;
  className?: string;
  style?: CSSProperties;
  classNames?: ColorPickerSemanticClassNames;
  styles?: ColorPickerSemanticStyles;
  arrow?: ColorPickerProps['arrow'];
};
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
/**
 * 传给函数式 `classNames` / `styles` 的 `info.props`。
 *
 * ⚠️ 上游每次渲染新建一个对象；本仓用 `shallowReactive` + watch 同步 ——
 * 这样 `useMergeSemantic` 的 `info.props` **引用稳定**、读到的值**最新**。
 * （`shallow` 是必需的：深响应式会把 `AggregationColor` 实例包成 Proxy，
 * 破坏 `instanceof` 与身份比较。）
 */
const semanticProps = shallowReactive<ColorPickerProps>({ ...props });
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
watch(
  mergedSemanticProps,
  (next) => {
    Object.assign(semanticProps, next);
  },
  { immediate: true },
);

const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
  ColorPickerProps,
  ColorPickerSemanticClassNames,
  ColorPickerSemanticStyles
>(
  [() => context.classNames, () => props.classNames],
  [
    () => context.styles,
    () => semanticRootStyle(context.style),
    () => props.styles,
    () => semanticRootStyle(props.style),
  ],
  semanticProps,
);

// ============================== 开合 / 格式 ==============================
// 与 rc 的 `useControlledState(false, open)` / `useControlledState(defaultFormat, format)` 同判：
// 内部值恒被写，读的时候**受控值优先**。
const innerPopupOpen = ref(false);
const popupOpen = computed(() => !mergedDisabled.value && (props.open ?? innerPopupOpen.value));

/** 判据 1（第二条）。 */
const triggerOpenChange = (open: boolean): void => {
  if (!open || !mergedDisabled.value) {
    innerPopupOpen.value = open;
    emit('update:open', open);
    emit('openChange', open);
  }
};

const innerFormat = ref<ColorFormatType | undefined>(props.defaultFormat);
const formatValue = computed(() => props.format ?? innerFormat.value);

/** 判据 2：**先取快照**。 */
const triggerFormatChange = (newFormat?: ColorFormatType): void => {
  const prev = formatValue.value;
  innerFormat.value = newFormat;

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
  if (props.disabledAlpha && isAlphaColor.value) {
    changeColor = genAlphaColor(color);
  }
  emit('changeComplete', changeColor);
};

/** 判据 3。 */
const onInternalChange = (data: AggregationColor, changeFromPickerDrag?: boolean): void => {
  let color: AggregationColor = generateColor(data);

  // 忽略 alpha 色
  if (props.disabledAlpha && isAlphaColor.value) {
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
  const list = [props.rootClassName ?? '', 'css-var-root', `${prefixCls.value}-css-var`];
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
    props.className,
  ),
);
const mergedPopupCls = computed(() =>
  joinCls(prefixCls.value, ...mergedRootCls.value, mergedClassNames.value.popup?.root),
);

/** 空样式对象要转成 `undefined`，否则 SSR 会渲染出 `style=""`。 */
function nonEmpty(style: CSSProperties | undefined): CSSProperties | undefined {
  return style && Object.keys(style).length > 0 ? style : undefined;
}

/** `styles.popupOverlayInner` → Popover 的 `styles.container`（上游逐字）。 */
const popoverStyles = computed(
  () =>
    // ⚠️ 一次 `as unknown as`：本仓 `PopoverSemanticType['styles']` 的槽位类型是
    //    `Record<string, string | number>`，而 `CSSProperties` 没有索引签名 ⇒
    //    结构上不可直接赋值。运行时逐键原样透传，无任何转换。
    ({
      root: nonEmpty(mergedStyles.value.popup?.root),
      container: nonEmpty(
        (props.styles as ColorPickerSemanticStyles | undefined)?.popupOverlayInner,
      ),
    }) as unknown as NonNullable<PopoverSemanticType['styles']>,
);

/**
 * 透传给触发器的属性。
 *
 * ⚠️ **`class` / `style` 必须摘掉**：Vue 里它们是 `attrs`（`StyleValue` 含 `null`），
 * 而 `ColorTrigger` 的 `style` prop 是 `CSSProperties` ⇒ 整体 `v-bind="attrs"` 会类型不匹配。
 * 两者单独处理（`class` 并进 `mergedCls`，`style` 单独绑定）。
 */
const triggerAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});

/** 判据 8。 */
const mergedDestroyOnHidden = computed(() => props.destroyOnHidden ?? !!props.destroyTooltipOnHide);

// ===================== Warning ======================
const devWarning = useDevWarning('ColorPicker');
watch(
  () => [props.disabledAlpha, isAlphaColor.value],
  () => {
    devWarning(
      !(props.disabledAlpha && isAlphaColor.value),
      '`disabledAlpha` will make the alpha to be 100% when use alpha color.',
    );
  },
  { immediate: true },
);

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
    :trigger="trigger"
    :placement="placement"
    :arrow="mergedArrow"
    :root-class-name="rootClassName"
    :get-popup-container="getPopupContainer"
    :auto-adjust-overflow="autoAdjustOverflow"
    :destroy-on-hidden="mergedDestroyOnHidden"
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
        :disabled="mergedDisabled"
        :disabled-alpha="disabledAlpha"
        :presets="presets"
        :panel-render="panelRender"
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
      <slot v-if="slots.default" />
      <ColorTrigger
        v-else
        v-bind="triggerAttrs"
        :style="attrs.style as CSSProperties | undefined"
        :active-index="popupOpen ? activeIndex : -1"
        :open="popupOpen"
        :class-name="mergedCls"
        :class-names="mergedClassNames"
        :styles="mergedStyles"
        :prefix-cls="prefixCls"
        :disabled="mergedDisabled"
        :show-text="showText"
        :format="formatValue"
        :color="mergedColor"
      />
    </template>
  </Popover>
</template>
