<script setup lang="ts">
/**
 * Button —— 按钮。
 *
 * 契约来源：antd 6.6.4 的 `components/button/Button.tsx`。DOM 结构、类名、分支判据
 * **逐条对齐**，行号记录在 `docs/analysis/button.md`。
 *
 * ── 七条最容易写错、且都已在分析产物里钉住行号的判据 ──────────────────────────
 *
 *   1. `color` / `variant` 的解析有 6 层回退（`Button.tsx:181-211`），`ghost` 还要
 *      把 `solid` 退化成 `outlined`（`:213-218`）。
 *   2. `-dangerous` 用的是**原始 `danger` prop**，而 `-color-{x}` 里 danger 被改写成
 *      `dangerous`（`:220-221, :378, :380`）—— 两处不一致是上游真实行为。
 *   3. `mergedDisabled` / `mergedShape` 用 `??`（`:230, :179`）—— 与 config-provider 的
 *      `componentSize` 用 `||` 不对称，不能互相"统一"。
 *   4. 两个中文字的检测 effect **故意不写依赖数组**（`:283` 注释）⇒ 等价于每次渲染后
 *      都跑。Vue 侧必须在 `onUpdated` 也检测，只在 `onMounted` 跑一次会漏（D6）。
 *   5. `<a>` 分支与 `<button>` 分支的 disabled 表达**不对称**（`:449-465` vs `:467-481`）。
 *   6. 点击在 `innerLoading || mergedDisabled` 时被拦截且 `preventDefault`（`:293-308`）。
 *   7. `-icon-only` 的判据含 `children !== 0`（`:384`）—— `0` 算有内容。
 */

import { LoadingOutlined } from '@apollo-design/icons';
import { isNumber, useDevWarning } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  h,
  onMounted,
  onUnmounted,
  onUpdated,
  ref,
  shallowReactive,
  useAttrs,
  useSlots,
  type VNodeChild,
  watch,
  watchEffect,
} from 'vue';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
// ⚠️ 这个渲染器是**平台原语**（模板里没有「渲染一个 VNodeChild 变量」的语法），
//    不属于 Empty。等 `_internal/` 有归置位时应上移，不要在 Button 里复制一份。
import { NodeRenderer } from '../empty/components/NodeRenderer';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useSize } from '../config-provider/size-context';
import { useCompactItemContext } from '../space/Compact';
import type {
  ButtonColorType,
  ButtonConfig,
  ButtonProps,
  ButtonSemanticClassNames,
  ButtonSemanticStyles,
  ButtonType,
  ButtonVariantType,
} from './interface';

defineOptions({ name: 'AButton', inheritAttrs: false });

/**
 * ⚠️⚠️ `disabled` / `ghost` / `danger` / `block` 的 `undefined` 默认值**不是冗余的**。
 *
 * 只要 prop 的运行时类型含 `Boolean` 且没有 `default`，Vue 就会把「未传」赋成 `false`。
 * 而这四个的合并判据都是 `??`：
 *   - `mergedDisabled = props.disabled ?? DisabledContext`（`:230`）
 *   - 若 `disabled` 被转成 `false`，ConfigProvider 的 `componentDisabled` 就**永久失效**。
 * ⇒ 显式声明 `default: undefined` 让 Vue 走 `hasDefault` 分支跳过转换（PITFALLS 46）。
 */
const props = withDefaults(defineProps<ButtonProps>(), {
  type: undefined,
  color: undefined,
  variant: undefined,
  icon: undefined,
  iconPosition: undefined,
  iconPlacement: undefined,
  shape: undefined,
  size: undefined,
  disabled: undefined,
  loading: false,
  prefixCls: undefined,
  className: undefined,
  rootClassName: undefined,
  ghost: undefined,
  danger: undefined,
  block: undefined,
  href: undefined,
  htmlType: 'button',
  autoInsertSpace: undefined,
  classNames: undefined,
  styles: undefined,
  style: undefined,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

defineSlots<{
  default?: () => unknown;
  icon?: () => unknown;
}>();

const slots = useSlots();
const attrs = useAttrs();

const {
  getPrefixCls,
  className: contextClassName,
  style: contextStyle,
  classNames: contextClassNames,
  styles: contextStyles,
  shape: contextShape,
  color: contextColor,
  variant: contextVariant,
  loadingIcon: contextLoadingIcon,
  autoInsertSpace: contextAutoInsertSpace,
} = useComponentConfig<ButtonConfig>('button');
const direction = useDirection();

const prefixCls = computed(() => getPrefixCls('btn', props.prefixCls));

// ---------------------------------------------------------------------------
// children / icon
// ---------------------------------------------------------------------------

/** 默认插槽的 VNode 列表。上游的 `toArray(children)`（`:160`）。 */
const childNodes = computed(() => (slots.default ? slots.default() : []));

/**
 * 是否有内容。判据含 `children !== 0`（`:384`）—— `0` 算有内容。
 *
 * ⚠️ 必须**经由 `childNodes`** 判定，不能直接 `!!slots.default`。
 *    Vue 的插槽是**函数**，在渲染函数之外调用它会触发
 *    `[Vue warn]: Slot "default" invoked outside of the render function`。
 *    而 `needInserted` 是在 `onMounted` / `onUpdated` 里读的（对应上游那个无依赖数组的
 *    effect）—— 那条路径上 `childNodes` 若是**首次**求值就会踩到这个警告。
 *    让 `hasChildren`（模板里的 `v-if`，渲染期必读）先把它读一遍，
 *    `computed` 的缓存就保证了后续读取不再调用插槽函数。
 */
const hasChildren = computed(() => childNodes.value.length > 0);

/** `icon` prop 与 `icon` 插槽都能传图标，**prop 优先**。 */
const mergedIcon = computed<VNodeChild>(() => props.icon ?? (slots.icon ? slots.icon() : undefined));

// ---------------------------------------------------------------------------
// color / variant 解析（`:181-221`）
// ---------------------------------------------------------------------------

type ColorVariantPair = [color?: ButtonColorType, variant?: ButtonVariantType];

const ButtonTypeMap: Partial<Record<ButtonType, ColorVariantPair>> = {
  default: ['default', 'outlined'],
  primary: ['primary', 'solid'],
  dashed: ['default', 'dashed'],
  // `link` 不是真颜色，antd 为了兼容才这样映射（`:122-123`）
  link: ['link' as ButtonColorType, 'link'],
  text: ['default', 'text'],
};

const mergedType = computed<ButtonType>(() => props.type || 'default');

/**
 * ⚠️ 用 `computed` 而不是 IIFE：上游是 `useMemo`，会对 `props` 变化重算。
 *    若写成 setup 期求值一次的 IIFE，`type` / `danger` 后续变化不会重新解析。
 *
 * ⚠️ `contextColor` / `contextVariant` 来自 **ConfigProvider**（`Button.tsx:175-176`），
 *    与 `props.color` / `props.variant` 是**两组不同的变量** —— 混用会让
 *    `if (variant === 'solid')` 那条的 TS 窄化把 `'solid'` 排除掉
 *    （因为前一条 `if` 已经 return），表现为 TS2367。
 */
const parsed = computed<ColorVariantPair>(() => {
  // 显式 color + variant 优先
  if (props.color && props.variant) return [props.color, props.variant];
  // 旧版 type / danger 糖
  if (props.type || props.danger) {
    const pair = ButtonTypeMap[mergedType.value] || [];
    if (props.danger) return ['danger', pair[1]];
    return pair;
  }
  if (props.variant === 'solid') return ['primary', props.variant];
  // >>> Context 回退
  if (contextColor && contextVariant) return [contextColor, contextVariant];
  if (contextVariant === 'solid') return ['primary', contextVariant];
  return ['default', 'outlined'];
});

const ghost = computed(() => !!props.ghost);

const mergedColor = computed(() =>
  ghost.value && parsed.value[1] === 'solid' ? parsed.value[0] : parsed.value[0],
);
const mergedVariant = computed<ButtonVariantType | undefined>(() =>
  ghost.value && parsed.value[1] === 'solid' ? 'outlined' : parsed.value[1],
);

const isDanger = computed(() => mergedColor.value === 'danger');
const mergedColorText = computed(() => (isDanger.value ? 'dangerous' : mergedColor.value));

/** 无边框变体（不插空格、不加 ghost 背景、不套 Wave）。 */
const isUnBordered = computed(
  () => mergedVariant.value === 'text' || mergedVariant.value === 'link',
);

// ---------------------------------------------------------------------------
// 回退链（全部 `??`）
// ---------------------------------------------------------------------------

const mergedShape = computed(() => props.shape ?? contextShape ?? 'default');
const mergedInsertSpace = computed(() => props.autoInsertSpace ?? contextAutoInsertSpace ?? true);

const mergedDisabled = useDisabled(props.disabled);

const { compactSize, compactItemClassnames } = useCompactItemContext(
  prefixCls.value,
  direction.value,
);

/**
 * ⚠️ 回调**必须**接住 `ctxSize`：antd 写的是
 * `useSize((ctxSize) => customizeSize ?? compactSize ?? groupSize ?? ctxSize)`，
 * 若在回调里丢掉 `ctxSize`（`useSize(() => props.size ?? compactSize)`），
 * ConfigProvider 的 `componentSize` 会**静默失效** —— DOM 全对，只是尺寸永远是默认。
 * （`groupSize` 来自已废弃的 `Button.Group`，按 D5 不实现。）
 */
const sizeFullName = useSize((ctxSize) => props.size ?? compactSize?.value ?? ctxSize);

// ---------------------------------------------------------------------------
// loading（`:100-114, 234-236, 261-267`）
// ---------------------------------------------------------------------------

interface LoadingConfig {
  loading: boolean;
  delay: number;
}

const loadingOrDelay = computed<LoadingConfig>(() => {
  const loading = props.loading;
  if (loading && typeof loading === 'object') {
    const delay = isNumber(loading.delay) ? loading.delay : 0;
    return { loading: delay <= 0, delay };
  }
  return { loading: !!loading, delay: 0 };
});

/**
 * inner loading。
 *
 * ⚠️ 语义对齐 `useDelayState`：`delay > 0` 时**延迟到点才置 true**；
 *    变 false 只靠 `loading` prop 变回（不会自动复位）。
 */
const innerLoading = ref(loadingOrDelay.value.loading);
let delayTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  loadingOrDelay,
  (cfg) => {
    if (delayTimer !== null) {
      clearTimeout(delayTimer);
      delayTimer = null;
    }
    if (cfg.delay > 0) {
      if (cfg.loading) {
        innerLoading.value = true;
        return;
      }
      delayTimer = setTimeout(() => {
        innerLoading.value = true;
        delayTimer = null;
      }, cfg.delay);
      return;
    }
    innerLoading.value = cfg.loading;
  },
  { immediate: true, flush: 'sync' },
);

onUnmounted(() => {
  if (delayTimer !== null) clearTimeout(delayTimer);
});

const mergedLoadingIcon = computed<VNodeChild>(() =>
  props.loading && typeof props.loading === 'object'
    ? props.loading.icon || contextLoadingIcon
    : contextLoadingIcon,
);

/**
 * 图标区里真正渲染的东西（`:243-256`）。
 *
 * ```
 * icon && !innerLoading   → icon
 * loading && loadingIcon  → loadingIcon
 * 其余                     → 内置 LoadingOutlined
 * ```
 *
 * ⚠️ 第三支的判据是「加载态」而不是「有没有图标」：antd 的 `DefaultLoadingIcon` 在
 *    `visible = !!loading` 且 `removeOnLeave` 下**不渲染**，所以「不加载且无图标」这一支
 *    由外层 `v-if="iconType"` 挡掉，这里不必再判一次。
 */
const iconNode = computed<VNodeChild>(() =>
  innerLoading.value ? (mergedLoadingIcon.value ?? h(LoadingOutlined)) : mergedIcon.value,
);

// ---------------------------------------------------------------------------
// 两个中文字（`:244-245, 270-283` + `buttonHelpers.tsx:11`）
// ---------------------------------------------------------------------------

const TWO_CN_CHAR = /^[一-龥]{2}$/;

const rootRef = ref<HTMLButtonElement | HTMLAnchorElement | null>(null);
const hasTwoCNChar = ref(false);

/** `needInserted`：单个子节点、无图标、且不是无边框变体。 */
const needInserted = computed(
  () => childNodes.value.length === 1 && !mergedIcon.value && !isUnBordered.value,
);

/**
 * ⚠️ 上游这个 effect **故意不写依赖数组** ⇒ 每次渲染后都跑。
 *    Vue 侧对应 `onMounted` + `onUpdated` **两处**，缺 `onUpdated` 会漏掉
 *    「挂载时合法、之后更新成两字」的情形（D6）。
 */
function detectTwoCNChar() {
  if (!rootRef.value || !mergedInsertSpace.value) return;
  const text = rootRef.value.textContent || '';
  const next = needInserted.value && TWO_CN_CHAR.test(text);
  if (next !== hasTwoCNChar.value) hasTwoCNChar.value = next;
}

onMounted(detectTwoCNChar);
onUpdated(detectTwoCNChar);

// ---------------------------------------------------------------------------
// 语义化合并
// ---------------------------------------------------------------------------

/**
 * ⚠️ 用 `shallowReactive` 而不是 `reactive`：
 *    `ButtonProps.icon` / `loading.icon` 的类型含 `VNodeChild`（递归类型），
 *    `reactive<T>()` 的 `UnwrapRef` 会做**深展开** ⇒ 触发 TS2589
 *    （"Type instantiation is excessively deep"）。这里只替换顶层键，
 *    不需要深层响应式 —— `shallowReactive` 正好避开深展开。
 *    （与 PITFALLS 86 同源，只是那次受害的是 `ref<T>`。）
 */
const semanticProps = shallowReactive({ ...props }) as ButtonProps;
watchEffect(() => {
  Object.assign(semanticProps, props, {
    type: mergedType.value,
    color: mergedColor.value,
    variant: mergedVariant.value,
    danger: isDanger.value,
    shape: mergedShape.value,
    size: sizeFullName.value,
    disabled: mergedDisabled.value,
    loading: innerLoading.value,
  });
});

const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
  ButtonProps,
  ButtonSemanticClassNames,
  ButtonSemanticStyles
>(
  [() => contextClassNames, () => props.classNames],
  [() => contextStyles, () => semanticRootStyle(contextStyle), () => props.styles],
  semanticProps,
);

// ---------------------------------------------------------------------------
// 类名（`:369-397`）
// ---------------------------------------------------------------------------

const iconType = computed(() => (innerLoading.value ? 'loading' : mergedIcon.value));
const mergedIconPlacement = computed(() => props.iconPlacement ?? props.iconPosition ?? 'start');

const rootClass = computed(() => [
  prefixCls.value,
  contextClassName,
  {
    [`${prefixCls.value}-${mergedShape.value}`]:
      mergedShape.value !== 'default' && mergedShape.value !== 'square' && mergedShape.value,
    [`${prefixCls.value}-${mergedType.value}`]: mergedType.value,
    // ⚠️ 用的是原始 `danger` prop，不是 `isDanger`
    [`${prefixCls.value}-dangerous`]: props.danger,
    [`${prefixCls.value}-color-${mergedColorText.value}`]: mergedColorText.value,
    [`${prefixCls.value}-variant-${mergedVariant.value}`]: mergedVariant.value,
    [`${prefixCls.value}-lg`]: sizeFullName.value === 'large',
    [`${prefixCls.value}-sm`]: sizeFullName.value === 'small',
    [`${prefixCls.value}-icon-only`]: !hasChildren.value && !!iconType.value,
    [`${prefixCls.value}-background-ghost`]: ghost.value && !isUnBordered.value,
    [`${prefixCls.value}-loading`]: innerLoading.value,
    [`${prefixCls.value}-two-chinese-chars`]:
      hasTwoCNChar.value && mergedInsertSpace.value && !innerLoading.value,
    [`${prefixCls.value}-block`]: props.block,
    [`${prefixCls.value}-rtl`]: direction.value === 'rtl',
    [`${prefixCls.value}-icon-end`]: mergedIconPlacement.value === 'end',
  },
  compactItemClassnames?.value,
  props.className,
  props.rootClassName,
  mergedClassNames.value.root,
]);

// ---------------------------------------------------------------------------
// 样式与属性
// ---------------------------------------------------------------------------

const rootStyle = computed<CSSProperties>(() => ({
  ...mergedStyles.value.root,
  ...props.style,
}));

const rootStyleAttrs = computed(() => styleAttrs(rootStyle.value));
const iconStyleAttrs = computed(() => styleAttrs(mergedStyles.value.icon));
const contentStyleAttrs = computed(() => styleAttrs(mergedStyles.value.content));

/**
 * ★ `-loading-icon` 的条件比「在加载」更窄：它只在**走内置加载图标**时出现。
 *
 * ```
 * loading && mergedLoadingIcon  → `<span class="-icon">{mergedLoadingIcon}</span>`   ← 没有
 * 其余（加载中且没有自定义加载图标）→ DefaultLoadingIcon → `-icon -loading-icon`     ← 有
 * ```
 *
 * （`Button.tsx:243-256`：只有第三支 `defaultLoadingIconElement` 才会经过
 * `InnerLoadingIcon`，`-loading-icon` 是它加的。自定义加载图标走的是
 * `iconWrapperElement`，不带这个类。）L4 的 `loading:custom-icon` 用例钉住这一条。
 */
const iconClass = computed(() => [
  `${prefixCls.value}-icon`,
  { [`${prefixCls.value}-loading-icon`]: innerLoading.value && !mergedLoadingIcon.value },
  mergedClassNames.value.icon,
]);
const contentClass = computed(() => [mergedClassNames.value.content]);

// ---------------------------------------------------------------------------
// 事件（`:293-308`）
// ---------------------------------------------------------------------------

const onClick = (e: MouseEvent) => {
  if (innerLoading.value || mergedDisabled.value) {
    e.preventDefault();
    return;
  }
  emit('click', e);
};

// ---------------------------------------------------------------------------
// 开发期告警（`:311-327`）
// ---------------------------------------------------------------------------

const warning = useDevWarning('Button');
watchEffect(() => {
  warning(
    !(typeof props.icon === 'string' && props.icon.length > 2),
    '`icon` is using VNode instead of string naming in v4.',
  );
  warning(
    !(ghost.value && isUnBordered.value),
    "`link` or `text` button can't be a `ghost` button.",
  );
  warning.deprecated(props.iconPosition === undefined, 'iconPosition', 'iconPlacement');
});

// ---------------------------------------------------------------------------
// 暴露
// ---------------------------------------------------------------------------

defineExpose({ nativeElement: rootRef });
</script>

<template>
  <a
    v-if="href !== undefined"
    ref="rootRef"
    :class="[rootClass, { [`${prefixCls}-disabled`]: mergedDisabled }]"
    :href="mergedDisabled ? undefined : href"
    :tabindex="mergedDisabled ? -1 : 0"
    :aria-disabled="mergedDisabled"
    v-bind="{ ...attrs, ...rootStyleAttrs }"
    @click="onClick"
  >
    <span v-if="iconType" :class="iconClass" v-bind="iconStyleAttrs">
      <NodeRenderer :node="iconNode" />
    </span>
    <span v-if="hasChildren" :class="contentClass" v-bind="contentStyleAttrs">
      <slot />
    </span>
  </a>

  <button
    v-else
    ref="rootRef"
    :type="htmlType"
    :class="rootClass"
    :disabled="mergedDisabled"
    v-bind="{ ...attrs, ...rootStyleAttrs }"
    @click="onClick"
  >
    <span v-if="iconType" :class="iconClass" v-bind="iconStyleAttrs">
      <NodeRenderer :node="iconNode" />
    </span>
    <span v-if="hasChildren" :class="contentClass" v-bind="contentStyleAttrs">
      <slot />
    </span>
  </button>
</template>
