<script setup lang="ts">
/**
 * Space.Compact —— 让表单组件之间紧凑连接并合并边框。
 *
 * 契约来源：antd 6.6.4 的 `es/space/Compact.js`（165 行）。
 *
 * ── 它自己几乎不做样式 ─────────────────────────────────────────────────────────
 *
 * Compact 只做两件事：
 *   1. 渲染一个 `<div class="{prefix}-space-compact …">` 容器；
 *   2. 把 `compactSize` / `compactDirection` / `isFirstItem` / `isLastItem`
 *      通过 `CompactItem` 广播给每个子节点。
 *
 * 真正的「合并边框」类名（`-compact-item` / `-compact-first-item` /
 * `-compact-last-item`）由**下游组件自己**拼 —— 用它们自己的前缀
 * （`apollo-btn-compact-item`）。协议见 `./Compact.ts` 的文件头。
 *
 * ── 四条最容易写错的判据 ───────────────────────────────────────────────────────
 *
 *   1. **`prefixCls` 的后缀是 `'space-compact'`**，不是 `'compact'` ——
 *      所以不传时兜底是 `apollo-space-compact`（上游 `Compact.tsx:107`）。
 *   2. **`vertical` 未传 ≠ `false`**（PITFALLS 46 / D21，见 `withDefaults` 注释）。
 *   3. **`isFirstItem` / `isLastItem` 的合取**：
 *      `i === 0 && (!outerContext || outerContext.isFirstItem)` ——
 *      嵌套 Compact 时，内层的首项只有在**外层也是首项**时才算首项
 *      （上游 `Compact.tsx:140-143`，由 `compact-nested` demo 覆盖）。
 *   4. **`toArray(children)` 不带 `keepEmpty`**（与 `Space` 相反）——
 *      Compact 不需要「空占位占下标」，`false` 子节点直接丢弃。
 *
 * ── 与 antd 的平台差异 ─────────────────────────────────────────────────────────
 *
 *   - `size` 走 `useSize((ctx) => size ?? ctx)`，与 antd 逐字同形；`ConfigProvider`
 *     的 `componentSize` 优先于 Compact 的 `size` 之外的来源，而 `size` prop
 *     优先于 context（上游用例：`Space.Compact should inherit the size from
 *     ConfigProvider if the componentSize is set`）。
 *   - `direction` 走 `useDirection()`（`ComputedRef`）而不是 `ConfigContext` 的解构
 *     快照（D27）。
 */

import { toArray, useDevWarning } from '@apollo-design/utils';
import { computed, inject, ref, useAttrs, useSlots, type VNode, watchEffect } from 'vue';
import { styleAttrs } from '../_internal/use-merge-semantic';
import { useConfigContext, useDirection } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import { CompactItem, spaceCompactItemContextKey } from './Compact';
import type { SpaceCompactProps, SpaceSlot } from './interface';
import { useOrientation } from './useOrientation';

defineOptions({ name: 'ASpaceCompact', inheritAttrs: false });

/**
 * ⚠️⚠️ `vertical` 的 `undefined` 默认值**不是冗余的**。
 *
 * Vue 的 Boolean prop 转换：只要 prop 的运行时类型含 `Boolean`，且调用方没传、
 * 也没有 `default`，Vue 就会把它赋成 `false`。而 `useOrientation` 的判据是
 * `typeof vertical === 'boolean'` —— 它把「未传」与「显式传 false」当作两条不同
 * 分支，所以 `<Space.Compact direction="vertical" />` 会**静默**变成水平排列。
 * 声明 `default`（哪怕值是 `undefined`）会让 Vue 走 `hasDefault` 分支、跳过转换。
 * 这是 PITFALLS 第 46 条（D21），与 `Space` / `Divider` 同一根源。
 */
const props = withDefaults(defineProps<SpaceCompactProps>(), {
  prefixCls: undefined,
  size: undefined,
  direction: undefined,
  orientation: undefined,
  vertical: undefined,
  block: undefined,
  rootClassName: undefined,
  className: undefined,
  style: undefined,
});

const slots = useSlots();
const attrs = useAttrs();
defineSlots<{ default?: SpaceSlot }>();

/** antd 用 `React.useContext(ConfigContext)` 而不是 `useComponentConfig` —— 逐字对齐。 */
const { getPrefixCls } = useConfigContext();
const direction = useDirection();

/**
 * **外层**的紧凑上下文。
 *
 * 它决定「本 Compact 的首项/末项在外层是否也是首项/末项」—— 嵌套 Compact 时
 * 内层的首项若在外层不是首项，就不能合并圆角（否则中间那个会被削成直角）。
 */
const outerContext = inject(spaceCompactItemContextKey, undefined);

const prefixCls = computed(() => getPrefixCls('space-compact', props.prefixCls));

const orientationPair = useOrientation(
  () => props.orientation,
  () => props.vertical,
  () => props.direction,
);
const mergedOrientation = computed(() => orientationPair.value[0]);
const mergedVertical = computed(() => orientationPair.value[1]);

/**
 * 子组件尺寸。
 *
 * `useSize` 的三条分支逐字来自 antd 的 `hooks/useSize`：
 * `!customSize` ⇒ context；字符串 ⇒ 自身；函数 ⇒ `fn(context)`。
 * 这里传函数 ⇒ `size ?? contextSize`，即 **`size` prop 优先于
 * ConfigProvider 的 `componentSize`**（上游有专门用例）。
 */
const mergedSize = useSize((ctxSize) => props.size ?? ctxSize);

/**
 * 子节点。
 *
 * ⚠️ 与 `Space` 不同，这里**不带 `keepEmpty`** —— antd 的
 * `toArray(children)` 把 `false` / `null` / `undefined` 全部丢弃，
 * 下标与 DOM 都只看「真实存在」的子节点。
 * `slots.default` 不存在时 `toArray` 得到 `[]`（`undefined` 在非 keepEmpty 下不补位）。
 */
const childNodes = computed<VNode[]>(() => toArray(() => slots.default?.()));

const hasChildren = computed(() => childNodes.value.length > 0);

/**
 * 根类名。顺序逐字对齐 antd 的 `clsx(...)`（`Compact.tsx:109-119`）：
 * `prefixCls` → `-rtl`? → `-block`? → `-vertical`? → `className` → `rootClassName`。
 * （没有 CSS-in-JS 的 hashId —— D1。）
 */
const rootClass = computed(() => [
  prefixCls.value,
  {
    [`${prefixCls.value}-rtl`]: direction.value === 'rtl',
    [`${prefixCls.value}-block`]: props.block,
    [`${prefixCls.value}-vertical`]: mergedVertical.value,
  },
  props.className,
  props.rootClassName,
]);

/**
 * 根元素属性。
 *
 * ⚠️ `style` 在 antd 里没被解构出来 ⇒ 它随 `{...restProps}` 落在最后。
 *    这里等价：`$attrs` 先、`style` 后。空样式必须返回 `{}`（连 `style` 键都
 *    不出现），否则 SSR 会渲染出 `style=""`（见 `styleAttrs` 的注释）。
 */
const rootAttrs = computed(() => ({ ...attrs, ...styleAttrs(props.style) }));

/** `v-for` 的 key。antd：`child?.key || \`${prefixCls}-item-${i}\``（`Compact.tsx:134`）。 */
const compactItemKey = (child: VNode, index: number): string | number => {
  const key = child.key;
  if (typeof key === 'string' || typeof key === 'number') return key;
  return `${prefixCls.value}-item-${index}`;
};

/**
 * 首项判据：下标为 0 **且**外层（若存在）也是首项。
 *
 * ⚠️ `!outerContext || …` 这一支不能省：没有外层时 `outerContext` 是
 *    `undefined`，此时「下标 0 就是首项」成立。
 */
const isFirstItem = (index: number): boolean =>
  index === 0 && (!outerContext || !!outerContext.value?.isFirstItem);

/** 末项判据：下标为最后一个 **且**外层（若存在）也是末项。 */
const isLastItem = (index: number): boolean =>
  index === childNodes.value.length - 1 && (!outerContext || !!outerContext.value?.isLastItem);

// ---------------------------------------------------------------------------
// 开发期告警
//
// ⚠️ 组件名是 `'Space.Compact'`（不是 `'Space'`）—— 上游用例
//    `space-compact.test.tsx:213-215` 断言的正是这个前缀。
// ⚠️ 判据从 `!direction` 改成 `direction === undefined`：Vue 的 props 恒含全部
//    声明键（PITFALLS 46 / D21）。antd 用的是真值判断 `!direction` ——
//    两者在「传 `''`」这类边界上不同，但 `direction` 的类型是
//    `'horizontal' | 'vertical'`，`''` 不在其中，所以没有可观测差异。
// ---------------------------------------------------------------------------
const warning = useDevWarning('Space.Compact');
watchEffect(() => {
  warning.deprecated(props.direction === undefined, 'direction', 'orientation');
});

// ---------------------------------------------------------------------------
// 暴露
// ---------------------------------------------------------------------------
const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>

<template>
  <div v-if="hasChildren" ref="rootRef" :class="rootClass" v-bind="rootAttrs">
    <!--
      `CompactItem` 不产生任何元素（纯 provider）—— 与 antd 的 `<CompactItem>` 一致。
      所以这个 v-for 在 DOM 上完全不可见，只影响下游组件拼出来的类名。
    -->
    <CompactItem
      v-for="(child, index) in childNodes"
      :key="compactItemKey(child, index)"
      :compact-size="mergedSize"
      :compact-direction="mergedOrientation"
      :is-first-item="isFirstItem(index)"
      :is-last-item="isLastItem(index)"
      :node="child"
    />
  </div>
</template>
