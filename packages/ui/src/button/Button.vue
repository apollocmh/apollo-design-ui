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
import { isNumber, isVNode, useDevWarning } from '@apollo-design/utils';
import {
  Comment,
  type Component,
  type CSSProperties,
  cloneVNode,
  computed,
  Fragment,
  h,
  onMounted,
  onUnmounted,
  onUpdated,
  ref,
  shallowReactive,
  Text as TextVNode,
  useAttrs,
  useSlots,
  type VNode,
  type VNodeChild,
  watch,
  watchEffect,
} from 'vue';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useSize } from '../config-provider/size-context';
// ⚠️ 这个渲染器是**平台原语**（模板里没有「渲染一个 VNodeChild 变量」的语法），
//    不属于 Empty。等 `_internal/` 有归置位时应上移，不要在 Button 里复制一份。
import { NodeRenderer } from '../empty/components/NodeRenderer';
import { useCompactItemContext } from '../space/Compact';
import type {
  ButtonColorType,
  ButtonConfig,
  ButtonIcon,
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

/**
 * 把 `icon` / `loading.icon` 归一化成「Vue 能渲染的东西」。
 *
 * ── 为什么需要这一层 ────────────────────────────────────────────────────────
 *
 * antd 的 `icon` 是 `React.ReactNode`，文档与示例都写 `<SearchOutlined />` ——
 * 在 React 里那是个**已求值的元素**。Vue 没有「元素」这个形态，对应物是
 * **组件本身**（`SearchOutlined` 这个对象）。所以 `ButtonIcon` 额外接受 `Component`
 * （与 `EmptyImage` 同一裁决，见 `interface.ts`）。
 *
 * 但组件对象**不是** VNodeChild —— 直接交给 `<NodeRenderer>` 会被
 * `normalizeNode()` 原样返回，模板再把它 `toDisplayString` 成
 * 字面量文本 **`[object Object]`**（实测，见 `__tests__/index.test.ts`
 * 的「icon 传组件」用例）。所以必须在**进 NodeRenderer 之前** `h()` 包一层。
 *
 * ── 判据（与 `ImageNode` 的三分支同源）──────────────────────────────────────
 *
 * `VNodeChildAtom = VNode | string | number | boolean | null | undefined | void`
 * （`@vue/runtime-core` 的 `runtime-core.d.ts:1226`），**不含函数形态** ——
 * 所以「非原始值且非 VNode」就只可能是组件，判定没有歧义：
 *
 *   - `null` / `undefined` / 字符串 / 数字 / 布尔 → 原样（交给 NodeRenderer）
 *   - VNode / 数组（含插槽返回的 `VNode[]`）      → 原样
 *   - 其余（组件对象 / 函数式组件）               → `h(v)`
 *
 * ⚠️ 不要在这里 `cloneVNode` —— `NodeRenderer` 已经做了（PITFALLS：VNode 可变，
 *    同一常量 VNode 被两个 Button 渲染时第二次会看到上次留下的 `el`）。
 */
function asIconNode(value: ButtonIcon | undefined): VNodeChild {
  if (value == null) return value as VNodeChild;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (isVNode(value) || Array.isArray(value)) return value as VNodeChild;
  return h(value as Component);
}

/** `icon` prop 与 `icon` 插槽都能传图标，**prop 优先**。 */
const mergedIcon = computed<VNodeChild>(() =>
  asIconNode(props.icon ?? (slots.icon ? slots.icon() : undefined)),
);

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
    // ⚠️ 这里**不能**再判 `cfg.loading`。上游（`Button.js:148-156`）是：
    //
    //     if (loadingOrDelay.delay > 0) setInnerLoading(true, { ms: delay });
    //     else                          setInnerLoading(loadingOrDelay.loading, true);
    //
    // 第一支**无条件**把待定值置 `true`，没有「若已 loading 就直接置 true」这一层。
    // 而且那一层在本仓可证明**不可达**：`loadingOrDelay` 的构造决定了
    // `loading === true ⇒ delay <= 0`（`:281`），与 `delay > 0` 矛盾。
    // 曾经多写的那一支是死代码，还让 `Button.vue` 的覆盖率停在 98.13%
    // （未覆盖行正是它）—— 死代码 + 覆盖率噪音，两样都不要。
    if (cfg.delay > 0) {
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
  asIconNode(
    props.loading && typeof props.loading === 'object'
      ? props.loading.icon || contextLoadingIcon
      : contextLoadingIcon,
  ),
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
/**
 * antd 6 的 spaceChildren（buttonHelpers.js / button.js:271）：只要
 * `needInserted && mergedInsertSpace` 就把两字中文用**真实空格** join ——
 * **不依赖 hasTwoCNChar**（检测 effect 读的是变换后的 textContent，对纯文本
 * 恒为 false，6.6.4 的 `-two-chinese-chars` 类因此在字符串场景实际不出现 ——
 * React 实测探针：'确 定' 且无类。类与 first-letter CSS 仍保留（对齐上游），
 * 服务于「子节点是组件」等 transform 覆盖不到的场景）。
 */
const twoCNCharText = computed<string | undefined>(() => {
  if (!(needInserted.value && mergedInsertSpace.value)) return undefined;
  const first = childNodes.value[0];
  // 插槽返回裸字符串，或 Vue 编译出的 Text vnode（`<slot />` 的常见形态）都要处理
  const text =
    typeof first === 'string'
      ? first
      : isVNode(first) && first.type === TextVNode && typeof first.children === 'string'
        ? (first.children as string)
        : undefined;
  // spaceChildren 内部对每个子节点做 isTwoCNChar 检查 —— 非两字不插
  return text !== undefined && TWO_CN_CHAR.test(text) ? text.split('').join(' ') : undefined;
});

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
    [`${prefixCls.value}-two-chinese-chars`]:
      hasTwoCNChar.value && mergedInsertSpace.value && !innerLoading.value,
    [`${prefixCls.value}-icon-only`]: !hasChildren.value && !!iconType.value,
    [`${prefixCls.value}-background-ghost`]: ghost.value && !isUnBordered.value,
    [`${prefixCls.value}-loading`]: innerLoading.value,
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

/**
 * antd `buttonHelpers.js` 的 `spaceChildren` / `splitCNCharsBySpace` 元素分支：
 * `classNames.content` / `styles.content` 落到**元素子级**时是 `cloneElement`
 * **直接合并**（只有字符串 / Fragment 才包一层 `<span class={classNames.content}>`）。
 *
 * 本仓此前一律包 wrapper —— 对字符串子级与 antd 等价，但对元素子级会多出一个
 * **在流 flex item**：FloatButton 的 badge 是唯一消费方，float-btn 根上的
 * `gap: calc(var(--apollo-padding-xxs) / 2)` 会为这个 0 高 wrapper 多排一份间隙
 * ⇒ 图标整体上移 1px（badge-tooltip 三视口 block-diff，KNOWN-ISSUES §1.10）。
 *
 * ⚠️ 只有「子级全部是元素 vnode」**且**语义通道确实传了 content 类名/样式时才走
 * 合并分支；纯文本（含两个中文字）等其余情形保持模板的 wrapper 路径 ——
 * 那与 antd 的字符串分支等价，且不惊动任何既有 L4 夹具。
 */
const elementContentNodes = computed<VNode[] | null>(() => {
  const cls = mergedClassNames.value.content;
  const style = mergedStyles.value.content;
  if (cls === undefined && style === undefined) return null;
  const kids = childNodes.value;
  if (kids.length === 0) return null;
  const allElements = kids.every(
    (k) => isVNode(k) && k.type !== TextVNode && k.type !== Fragment && k.type !== Comment,
  );
  if (!allElements) return null;
  // cloneVNode 会把 class / style 与子元素已有的合并（antd cloneElement 同语义）
  return kids.map((k) => cloneVNode(k as VNode, { class: cls as never, style: style as never }));
});

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
    <span
      v-if="hasChildren && elementContentNodes === null"
      :class="contentClass"
      v-bind="contentStyleAttrs"
    >
      <template v-if="twoCNCharText !== undefined">{{ twoCNCharText }}</template>
      <slot v-else />
    </span>
    <template v-else-if="elementContentNodes !== null">
      <NodeRenderer v-for="(node, i) in elementContentNodes" :key="i" :node="node" />
    </template>
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
    <span
      v-if="hasChildren && elementContentNodes === null"
      :class="contentClass"
      v-bind="contentStyleAttrs"
    >
      <template v-if="twoCNCharText !== undefined">{{ twoCNCharText }}</template>
      <slot v-else />
    </span>
    <template v-else-if="elementContentNodes !== null">
      <NodeRenderer v-for="(node, i) in elementContentNodes" :key="i" :node="node" />
    </template>
  </button>
</template>
