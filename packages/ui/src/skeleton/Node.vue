<script setup lang="ts">
/**
 * Node —— 骨架屏的「自定义内容」容器（`Skeleton.Node` / `Skeleton.Image` 的载体）。
 *
 * 契约来源：antd 6.6.4 的 `es/skeleton/Node.js`。
 *
 * ── 结构（两层，缺一不可）─────────────────────────────────────────────────────
 *
 * ```html
 * <div class="{prefixCls} {prefixCls}-element [-active] [classNames.root] [className] [rootClassName]"
 *      style="[styles.root]">
 *   <div class="[classNames.content] {internalClassName || '{prefixCls}-node'}"
 *        style="[styles.content 与 style 的合并]">
 *     默认插槽
 *   </div>
 * </div>
 * ```
 *
 * ── 三处最容易写错的地方 ───────────────────────────────────────────────────────
 *
 * 1. **`style` 落在内层**（不是外层），且 `style` **覆盖** `styles.content`；
 *    外层只吃 `styles.root`。写成「两层都吃 style」会让 `Skeleton.Image` 的
 *    `style="width:200px"` 跑到错误的一层上。
 * 2. **`classNames.root` / `className` / `rootClassName` 都在外层**，
 *    `classNames.content` 在内层。
 * 3. **`internalClassName || `${prefixCls}-node``** —— 是 `||` 不是 `??`：
 *    空串也回落。`Skeleton.Image` 靠它把内层类名换成 `${prefixCls}-image`。
 *
 * ── 与 antd 的平台差异 ────────────────────────────────────────────────────────
 *
 *   - 无 CSS-in-JS 的 hashId / cssVarCls（D5）。
 *   - `children` 是**默认插槽**而不是 prop（规则 C19）。
 *   - `prefixCls` 的解析走 `useConfigContext()`（antd 读的是 `ConfigContext`）——
 *     两者同源，且**不**消费 `components.skeleton` 上的 className / style
 *     （上游也没有：Node 只从 ConfigContext 取 `getPrefixCls`）。
 *   - 多余属性**不透传**：antd 的 Node 渲染体里没有 `{...rest}`，
 *     所以 `data-testid` 之类会被丢掉。我们用 `inheritAttrs: false` + 不绑 `$attrs`
 *     复刻这个行为（实测上游产物里确实没有 `data-testid`）。
 */

import { type CSSProperties, computed, type VNodeChild } from 'vue';
import { styleAttrs } from '../_internal/use-merge-semantic';
import { useConfigContext } from '../config-provider/context';
import type { SkeletonNodeProps } from './interface';

defineOptions({ name: 'ASkeletonNode', inheritAttrs: false });

const props = withDefaults(defineProps<SkeletonNodeProps>(), {
  prefixCls: undefined,
  className: undefined,
  rootClassName: undefined,
  style: undefined,
  active: undefined,
  classNames: undefined,
  styles: undefined,
  internalClassName: undefined,
});

defineSlots<{ default?: () => VNodeChild }>();

const { getPrefixCls } = useConfigContext();

const prefixCls = computed(() => getPrefixCls('skeleton', props.prefixCls));

const rootClass = computed(() => [
  prefixCls.value,
  `${prefixCls.value}-element`,
  { [`${prefixCls.value}-active`]: props.active },
  props.classNames?.root,
  props.className,
  props.rootClassName,
]);

/** 内层类名。`||` 而不是 `??` —— 空串同样回落到 `${prefixCls}-node`。 */
const contentClass = computed(() => [
  props.classNames?.content,
  props.internalClassName || `${prefixCls.value}-node`,
]);

/** 内层样式：`styles.content` 在前、`style` 在后（`style` 覆盖）。 */
const contentStyle = computed<CSSProperties>(() => ({ ...props.styles?.content, ...props.style }));
</script>

<template>
  <div :class="rootClass" v-bind="styleAttrs(props.styles?.root)">
    <div :class="contentClass" v-bind="styleAttrs(contentStyle)">
      <slot />
    </div>
  </div>
</template>
