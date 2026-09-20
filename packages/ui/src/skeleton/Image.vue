<script setup lang="ts">
/**
 * Image —— `Skeleton.Image`，一个「图片占位」的骨架块。
 *
 * 契约来源：antd 6.6.4 的 `es/skeleton/Image.js`（全文 25 行）。
 *
 * ── 它**没有自己的 DOM 结构** ──────────────────────────────────────────────────
 *
 * 整个组件就是「把 `Skeleton.Node` 的内层类名换成 `${prefixCls}-image`，
 * 再塞一幅固定尺寸的 SVG 占位图」。所以：
 *
 * ```html
 * <div class="{prefixCls} {prefixCls}-element [-active] [className] [rootClassName]">
 *   <div class="{prefixCls}-image">          ← internalClassName 换掉默认的 -node
 *     <svg viewBox="0 0 1098 1024" …>
 *   </div>
 * </div>
 * ```
 *
 * ── 两条必须逐字保留的判据 ───────────────────────────────────────────────────
 *
 * 1. **`viewBox` / `d` 是交付物本身**，不是装饰。`d` 是上游 1098×1024 占位图的
 *    原始路径（一条 `M…q…` 复合路径），逐字复制 —— 手改一个数字就是画错图。
 * 2. **`aria-hidden="true"` + `focusable="false"`**：占位图对读屏器无意义，
 *    且 `focusable` 是 IE/Edge 时代的 Tab 焦点开关（SVG 默认可聚焦）。
 *    两者都在上游代码里，不是我们加的。
 *
 * ── 关于 `prefixCls` 的解析（容易误判的一处）─────────────────────────────────
 *
 * `Skeleton.Image` 自己算 `getPrefixCls('skeleton', props.prefixCls)`，
 * 然后把 `internalClassName` 交给 `Node`，**同时把 `prefixCls` 也透传下去**。
 * `Node` 会**再算一次** `getPrefixCls('skeleton', props.prefixCls)` —— 结果相同。
 *
 * ⚠️ 不传 `prefixCls` 时结果是 `apollo-skeleton`（不是 `apollo-skeleton-skeleton`）：
 *    `getPrefixCls(suffix, customize)` 在 `customize` 为真时**直接返回 customize**，
 *    只有 `customize` 为空时才拼 `${defaultPrefixCls}-${suffix}`。
 *    实测上游：不传 → `ant-skeleton ant-skeleton-element`。
 *
 * ── 与 antd 的平台差异 ────────────────────────────────────────────────────────
 *
 *   - `children` 在 antd 里是 `<svg>` 这个 ReactNode；Vue 侧走 `Node` 的默认插槽
 *     （规则 C19）—— 对用户不可见（`SkeletonImageProps` 把 `children` omit 掉了）。
 *   - 无 CSS-in-JS 的 hashId / cssVarCls（D5）。
 */

import { computed } from 'vue';
import { useConfigContext } from '../config-provider/context';
import type { SkeletonImageProps } from './interface';
import Node from './Node.vue';

defineOptions({ name: 'ASkeletonImage', inheritAttrs: false });

const props = withDefaults(defineProps<SkeletonImageProps>(), {
  prefixCls: undefined,
  className: undefined,
  rootClassName: undefined,
  style: undefined,
  active: undefined,
  classNames: undefined,
  styles: undefined,
});

const { getPrefixCls } = useConfigContext();

const prefixCls = computed(() => getPrefixCls('skeleton', props.prefixCls));
const imageCls = computed(() => `${prefixCls.value}-image`);
const svgCls = computed(() => `${prefixCls.value}-image-svg`);
const pathCls = computed(() => `${prefixCls.value}-image-path`);
</script>

<template>
  <Node
    :prefix-cls="props.prefixCls"
    :class-name="props.className"
    :root-class-name="props.rootClassName"
    :style="props.style"
    :active="props.active"
    :class-names="props.classNames"
    :styles="props.styles"
    :internal-class-name="imageCls"
  >
    <svg
      viewBox="0 0 1098 1024"
      xmlns="http://www.w3.org/2000/svg"
      :class="svgCls"
      aria-hidden="true"
      focusable="false"
    >
      <title>Image placeholder</title>
      <path
        d="M365.7 329.1q0 45.8-32 77.7t-77.7 32-77.7-32-32-77.7 32-77.6 77.7-32 77.7 32 32 77.6M951 548.6v256H146.3V694.9L329 512l91.5 91.4L713 311zm54.8-402.3H91.4q-7.4 0-12.8 5.4T73 164.6v694.8q0 7.5 5.5 12.9t12.8 5.4h914.3q7.5 0 12.9-5.4t5.4-12.9V164.6q0-7.5-5.4-12.9t-12.9-5.4m91.4 18.3v694.8q0 37.8-26.8 64.6t-64.6 26.9H91.4q-37.7 0-64.6-26.9T0 859.4V164.6q0-37.8 26.8-64.6T91.4 73h914.3q37.8 0 64.6 26.9t26.8 64.6"
        :class="pathCls"
      />
    </svg>
  </Node>
</template>
