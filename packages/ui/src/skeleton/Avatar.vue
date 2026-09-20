<script setup lang="ts">
/**
 * Avatar —— `Skeleton.Avatar`，圆形 / 方形头像占位。
 *
 * 契约来源：antd 6.6.4 的 `es/skeleton/Avatar.js`。
 *
 * ── 结构 ──────────────────────────────────────────────────────────────────────
 *
 * ```html
 * <div class="{prefixCls} {prefixCls}-element [-active] [classNames.root] [className] [rootClassName]"
 *      style="[styles.root]">
 *   <span class="{prefixCls}-avatar [-lg|-sm] [-circle|-square|-round] [classNames.content]"
 *         style="[styles.content 与 style 的合并]"></span>
 * </div>
 * ```
 *
 * 内层那个 `<span>` 就是 `Element`（antd 的注释：`We direct use SkeletonElement as
 * avatar in skeleton internal.`）。所以 `Skeleton.Avatar` 自身**不含几何逻辑** ——
 * 尺寸类名与 `size` 数字样式都由 `Element` 负责。
 *
 * ── 三条必须逐字保留的判据 ───────────────────────────────────────────────────
 *
 * 1. **`shape` 默认 `'circle'`**（`Element` 的 `shape` 默认是 `undefined`，
 *    是 Avatar 这一层给的默认值）。所以 `<Skeleton.Avatar />` 渲染
 *    `{prefixCls}-avatar {prefixCls}-avatar-circle`。
 * 2. **`size` 走 `useSize(ctx => size ?? ctx)`**：先读 ConfigProvider 的
 *    `componentSize`，再由自己的 `size` prop 覆盖。
 *    ⚠️ 回调形态是**必须**的：`useSize` 对「裸数字」的判据是「既不是字符串也不是
 *    函数 ⇒ 回落 context」，直接传 `props.size` 会让 `size={40}` 被丢掉。
 *    包成回调后走的是 `customSize(ctxSize)` 分支，`40 ?? ctx` = `40`。实测上游：
 *    `avatar={{size:40}}` → `style="width:40px;height:40px;line-height:40px"`。
 * 3. **`style` 落在内层 `<span>` 上**（覆盖 `styles.content`），
 *    外层只吃 `styles.root`。
 *
 * ── 与 antd 的平台差异 ────────────────────────────────────────────────────────
 *
 *   - 无 CSS-in-JS 的 hashId / cssVarCls（D5）。
 *   - 多余属性**不透传**：antd 把未解构的 props（`...rest`）spread 给了 `Element`，
 *     而 `Element` 只解构 5 个字段 ⇒ 实际效果是**丢掉**。实测上游
 *     `<Skeleton.Avatar data-testid="x" />` 的产物里没有 `data-testid`。
 *     我们用 `inheritAttrs: false` + 不绑 `$attrs` 复刻。
 */

import { computed } from 'vue';
import { styleAttrs } from '../_internal/use-merge-semantic';
import { useConfigContext } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import Element from './Element.vue';
import type { SkeletonAvatarOwnProps } from './interface';

defineOptions({ name: 'ASkeletonAvatar', inheritAttrs: false });

const props = withDefaults(defineProps<SkeletonAvatarOwnProps>(), {
  prefixCls: undefined,
  className: undefined,
  rootClassName: undefined,
  style: undefined,
  size: undefined,
  // antd 的默认值是字面量 `'circle'`（`Avatar.js:20`）—— 逐字对齐。
  shape: 'circle',
  active: undefined,
  classNames: undefined,
  styles: undefined,
});

const { getPrefixCls } = useConfigContext();

const prefixCls = computed(() => getPrefixCls('skeleton', props.prefixCls));

const mergedSize = useSize((ctxSize) => props.size ?? ctxSize);

const rootClass = computed(() => [
  prefixCls.value,
  `${prefixCls.value}-element`,
  { [`${prefixCls.value}-active`]: props.active },
  props.classNames?.root,
  props.className,
  props.rootClassName,
]);

const elementCls = computed(() => `${prefixCls.value}-avatar`);

/** 内层样式：`styles.content` 在前、`style` 在后（`style` 覆盖）。 */
const contentStyle = computed(() => ({ ...props.styles?.content, ...props.style }));
</script>

<template>
  <div :class="rootClass" v-bind="styleAttrs(props.styles?.root)">
    <Element
      :prefix-cls="elementCls"
      :class-name="props.classNames?.content"
      :style="contentStyle"
      :shape="props.shape"
      :size="mergedSize"
    />
  </div>
</template>
