<script setup lang="ts">
/**
 * Result —— 结果页。
 *
 * 契约来源：antd 6.6.4 的 `es/result/index.js`。DOM 结构、类名、分支判据逐条对齐，
 * 有意差异登记在 `packages/ui/src/result/README.md` 与 `COMPATIBILITY.md` §9。
 *
 * 四条最容易写错的判据（G1 分析 §2）：
 *
 *   1. **双分支图标**。`403/404/500`（数字也收）→ 渲染静态插画组件（hex 字面量、
 *      不随主题），且**忽略 `icon` prop**；其余状态走 `icon ?? IconMap[status]`，
 *      其中 `icon === null || icon === false` 显式禁用（连容器 div 都不渲染）。
 *   2. **`-image` 类只跟着异常状态走**（与 `-icon` 同一个 div）。
 *   3. **用户 `style` 折进 `styles.root`**（antd 的 useSemanticRootStyle）——
 *      root 样式只来自语义合并（`style` 在 `styles.root` 之后、覆盖之），
 *      不再单独拼 `props.style`。
 *   4. **渲染守卫是 `isRenderable`**：`''` / `false` 的 title/subTitle/extra/children
 *      连容器 div 都不渲染（不是渲染空 div）。
 */

import { isRenderable, pickAttrs } from '@apollo-design/utils';
import { computed, ref, useAttrs, useSlots, watchEffect } from 'vue';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { NodeRenderer } from '../empty/components/NodeRenderer';
import type {
  ResultConfig,
  ResultProps,
  ResultRef,
  ResultSemanticClassNames,
  ResultSemanticStyles,
} from './interface';
import { ExceptionMap as MapsExceptionMap, IconMap as MapsIconMap } from './maps';

defineOptions({ name: 'AResult', inheritAttrs: false });

const props = withDefaults(defineProps<ResultProps>(), {
  // VNodeChild 类 prop 的 Boolean 转换坑（Empty.vue 文件头详述）：声明 default 跳过
  icon: undefined,
  title: undefined,
  subTitle: undefined,
  extra: undefined,
});

const slots = useSlots();
const attrs = useAttrs();

const {
  getPrefixCls,
  direction,
  className: contextClassName,
  style: contextStyle,
  classNames: contextClassNames,
  styles: contextStyles,
} = useComponentConfig<ResultConfig>('result');

const prefixCls = computed(() => getPrefixCls('result', props.prefixCls));

// ---------------------------------------------------------------------------
// IconMap / ExceptionMap（antd 具名导出的契约，从 index.ts 再导出；
// ExceptionStatus 由 keys 派生 —— 与 antd 逐字）
// ---------------------------------------------------------------------------

const IconMap = MapsIconMap;
const ExceptionMap = MapsExceptionMap;

const isException = computed(() => Object.keys(ExceptionMap).includes(`${props.status}`));

// ---------------------------------------------------------------------------
// 语义合并（合并顺序是契约：styles 侧 [contextStyles, contextStyleRoot, styles,
// styleRoot] —— 用户 style 折进 root 后最后覆盖，与 antd 逐字同构）
// ---------------------------------------------------------------------------

// ⚠️ 身份稳定的普通对象（Spin 范式，不用 reactive —— VNodeChild 深度代理会触发
//    TS2589）；mergedProps 里的 `status` 与 antd 的 `mergedProps = {...props, status}` 同构。
const semanticProps: ResultProps = { ...props };
watchEffect(() => {
  Object.assign(semanticProps, props, { status: props.status ?? 'info' });
});

const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
  ResultProps,
  ResultSemanticClassNames,
  ResultSemanticStyles
>(
  [() => contextClassNames, () => props.classNames],
  [
    () => contextStyles,
    () => semanticRootStyle(contextStyle),
    () => props.styles,
    () => semanticRootStyle(props.style),
  ],
  semanticProps,
);

const rootClass = computed(() => [
  prefixCls.value,
  `${prefixCls.value}-${props.status ?? 'info'}`,
  contextClassName,
  props.className,
  { [`${prefixCls.value}-rtl`]: direction === 'rtl' },
  mergedClassNames.value.root,
]);

const iconClass = computed(() => [
  `${prefixCls.value}-icon`,
  { [`${prefixCls.value}-image`]: isException.value },
  mergedClassNames.value.icon,
]);

const titleClass = computed(() => [`${prefixCls.value}-title`, mergedClassNames.value.title]);
const subTitleClass = computed(() => [
  `${prefixCls.value}-subtitle`,
  mergedClassNames.value.subTitle,
]);
const extraClass = computed(() => [`${prefixCls.value}-extra`, mergedClassNames.value.extra]);
const bodyClass = computed(() => [`${prefixCls.value}-body`, mergedClassNames.value.body]);

// ---------------------------------------------------------------------------
// 渲染守卫（antd 的 isReactRenderable → 我们的 isRenderable）
// ---------------------------------------------------------------------------

const showTitle = computed(() => isRenderable(props.title));
const showSubTitle = computed(() => isRenderable(props.subTitle));
const showExtra = computed(() => isRenderable(props.extra));
const showBody = computed(() => isRenderable(slots.default?.()));

/**
 * 默认图标节点：`icon || IconMap[status]` 逐字 ——
 * `null`/`false` 显式禁用（undefined 走 IconMap），其余用户节点覆盖默认图标。
 */
const iconNode = computed(() => {
  if (isException.value) return undefined;
  if (props.icon === null || props.icon === false) return undefined;
  return props.icon ?? IconMap[(props.status ?? 'info') as keyof typeof IconMap];
});

/** restProps：antd `pickAttrs(rest, { aria: true, data: true })` 的 Vue 等价。 */
const rootAttrs = computed(() => pickAttrs(attrs, { aria: true, data: true }));

// ---------------------------------------------------------------------------
// 暴露（antd 的 useImperativeHandle → { nativeElement }）
// ---------------------------------------------------------------------------

const rootRef = ref<HTMLElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>

<template>
  <div ref="rootRef" :class="rootClass" v-bind="{ ...rootAttrs, ...styleAttrs(mergedStyles.root) }">
    <!-- 异常分支：-icon -image > 静态插画（忽略 icon prop，antd 逐字） -->
    <div v-if="isException" :class="iconClass" v-bind="styleAttrs(mergedStyles.icon)">
      <component :is="ExceptionMap[status as unknown as keyof typeof ExceptionMap]" />
    </div>
    <!-- 普通分支：icon 覆盖或 IconMap 默认图标；null/false 连容器都不渲染 -->
    <div v-else-if="iconNode !== undefined" :class="iconClass" v-bind="styleAttrs(mergedStyles.icon)">
      <component :is="iconNode" />
    </div>

    <div v-if="showTitle" :class="titleClass" v-bind="styleAttrs(mergedStyles.title)">
      <NodeRenderer :node="title" />
    </div>

    <div v-if="showSubTitle" :class="subTitleClass" v-bind="styleAttrs(mergedStyles.subTitle)">
      <NodeRenderer :node="subTitle" />
    </div>

    <div v-if="showExtra" :class="extraClass" v-bind="styleAttrs(mergedStyles.extra)">
      <NodeRenderer :node="extra" />
    </div>

    <div v-if="showBody" :class="bodyClass" v-bind="styleAttrs(mergedStyles.body)">
      <slot />
    </div>
  </div>
</template>
