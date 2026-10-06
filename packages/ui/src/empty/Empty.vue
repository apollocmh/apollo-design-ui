<script setup lang="ts">
/**
 * Empty —— 空状态占位。
 *
 * 契约来源：antd 6.6.4 的 `es/empty/index.js`。DOM 结构、类名、分支判据逐条对齐，
 * 有意差异登记在 `packages/ui/src/empty/README.md` 与 `COMPATIBILITY.md` §9。
 *
 * 三条最容易写错、且都已被 compat 用例钉住的判据：
 *
 *   1. **`des` 与 `alt` 的判据不同**。`des` 看 `description !== undefined`（所以传 `''`
 *      或 `0` 会用传入值），渲染与否看 `isRenderable(des)`（所以 `''` 不渲染）。
 *      而 `alt` 是 `typeof des === 'string' ? des : 'empty'` —— 用的是 **`des` 不是 `description`**，
 *      于是不传 description 时 `alt` 是 locale 文案（`'No data'`），不是 `'empty'`。
 *   2. **`-normal` 类名靠引用相等**。`mergedImage === simpleEmptyImg` 判的是
 *      「传进来的是不是我们那个简洁插画常量」，不是「长得像不像」。
 *   3. **`style` 覆盖 `styles.root`**。合并顺序是
 *      `[contextStyles, {root: contextStyle}, styles, {root: style}]`，`style` 在最后。
 */

import { useLocaleReactive } from '@apollo-design/locale';
import { isRenderable, useDevWarning } from '@apollo-design/utils';
import { computed, mergeProps, ref, useAttrs, useSlots, type VNodeChild } from 'vue';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { EmptyImage as DefaultEmptyImage, SimpleEmptyImage } from './components/Images';
import { ImageNode, NodeRenderer } from './components/NodeRenderer';
import type {
  EmptyConfig,
  EmptyImage,
  EmptyProps,
  EmptySemanticClassNames,
  EmptySemanticStyles,
} from './interface';

defineOptions({ name: 'AEmpty', inheritAttrs: false });

const props = withDefaults(defineProps<EmptyProps>(), {
  // ⚠️⚠️ 这两个 `undefined` **不是冗余的**，删掉会静默改变行为。
  //
  // Vue 的 Boolean prop 转换：只要一个 prop 的**运行时类型**里含 `Boolean`，
  // 且调用方**没传**它、也没有 `default`，Vue 就会把它赋成 `false`。
  //
  // `VNodeChild` 经 SFC 编译器解析后的运行时类型是
  // `[Object, String, Number, Boolean, null, Array]`（实测），**含 Boolean**。
  // 于是：
  //   - `props.description` 由 `undefined` 变成 `false`
  //     → `des = props.description !== undefined ? ... : locale.description` 走错分支
  //     → `isRenderable(false)` 为假 → 描述整块不渲染
  //   - `props.image` 由 `undefined` 变成 `false`
  //     → `image ?? contextImage ?? defaultEmptyImg` 被 `false` 短路
  //     → 插画渲染成一个注释节点 `<!---->`
  //
  // 声明 `default`（哪怕值是 `undefined`）会让 Vue 走 `hasDefault` 分支、跳过转换。
  //
  // 这是**平台级**的坑，不是本组件特有：本项目所有 `VNodeChild` 类型的 prop
  // （antd 的 `ReactNode` 一律映射到它）都适用。登记见 COMPATIBILITY.md 的 D9。
  image: undefined,
  description: undefined,
});
const slots = useSlots();
const attrs = useAttrs();
defineSlots<{ default?: () => VNodeChild }>();

const {
  getPrefixCls,
  direction,
  className: contextClassName,
  style: contextStyle,
  classNames: contextClassNames,
  styles: contextStyles,
  image: contextImage,
} = useComponentConfig<EmptyConfig>('empty');

const prefixCls = computed(() => getPrefixCls('empty', props.prefixCls));

// D24（2026-10-04 已修）：改用响应式变体 —— `LocaleProvider` 的 `locale` prop
// 变化后 `des` / `alt` 自动重算（此前是 setup 期快照，locale 切换不重渲染）。
const [locale] = useLocaleReactive('Empty');

// ---------------------------------------------------------------------------
// 废弃告警
//
// antd 的判据是 `!(deprecatedName in props)`。Vue 的 props 对象**恒**包含全部声明过的键
// （未传时值为 `undefined`），`'imageStyle' in props` 恒为 `true`，照搬会让告警永不触发。
// 所以判据改成 `!== undefined` —— 这是平台差异（PLATFORM），不是放宽。
// ---------------------------------------------------------------------------
const warning = useDevWarning('Empty');
warning.deprecated(props.imageStyle === undefined, 'imageStyle', 'styles.image');

// ---------------------------------------------------------------------------
// 内容
// ---------------------------------------------------------------------------

/** `des` 的判据是 `!== undefined`，与「是否渲染」的判据**不同**（见文件头注释第 1 条）。 */
const des = computed<VNodeChild>(() =>
  props.description !== undefined ? props.description : locale.value.description,
);

/** `alt` 用 `des` 而不是 `description`。 */
const alt = computed(() => (typeof des.value === 'string' ? des.value : 'empty'));

const mergedImage = computed<EmptyImage>(() => props.image ?? contextImage ?? DefaultEmptyImage);

const showDescription = computed(() => isRenderable(des.value));

/**
 * footer 的判据与 antd 一致：看**渲染出来的 children**是不是「有内容」。
 *
 * `<Empty />` 没有默认插槽 → `slots.default` 为 `undefined` → 不渲染 footer；
 * `<Empty></Empty>` 有空插槽 → `[]` → `isRenderable([])` 为真 → 渲染空的 footer。
 * 这与 React 侧 `children` 分别为 `undefined` / `[]` 的结果逐条对应。
 */
const showFooter = computed(() => isRenderable(slots.default?.()));

// ---------------------------------------------------------------------------
// 语义化合并（顺序即契约，见 use-merge-semantic.ts）
// ---------------------------------------------------------------------------

const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
  EmptyProps,
  EmptySemanticClassNames,
  EmptySemanticStyles
>(
  [() => contextClassNames, () => props.classNames],
  [() => contextStyles, () => semanticRootStyle(contextStyle), () => props.styles],
  props,
);

// ---------------------------------------------------------------------------
// 类名与样式
// ---------------------------------------------------------------------------

const rootClass = computed(() => [
  prefixCls.value,
  contextClassName,
  {
    [`${prefixCls.value}-normal`]: mergedImage.value === SimpleEmptyImage,
    [`${prefixCls.value}-rtl`]: direction === 'rtl',
  },
  // ⚠️ 调用方原生 `class` **不在这里**：模板的 `v-bind="rootAttrs"` 已带 `attrs.class`，
  //    由 Vue 的 mergeProps 与 `:class` 合并 —— 这里再加一次会渲染出两份类名。
  mergedClassNames.value.root,
]);

const imageClass = computed(() => [`${prefixCls.value}-image`, mergedClassNames.value.image]);

const descriptionClass = computed(() => [
  `${prefixCls.value}-description`,
  mergedClassNames.value.description,
]);

const footerClass = computed(() => [`${prefixCls.value}-footer`, mergedClassNames.value.footer]);

// ---------------------------------------------------------------------------
// 样式
//
// ⚠️ 四处都必须过 `nonEmptyStyle`。`mergeStyles()` 的返回值恒是对象（可能是 `{}`），
//    直接绑 `:style` 会让 Vue 渲染出 `style=""` —— 而 React（antd）在样式为空时
//    **不输出该属性**。这个差异 L4 **测不出来**（投影把「没有 style 属性」与
//    `style=""` 都归一化成空串），是被渲染预览页时肉眼发现的。
//    详见 `_internal/use-merge-semantic.ts` 的 `nonEmptyStyle`。
// ---------------------------------------------------------------------------

const rootStyleAttrs = computed(() => styleAttrs(mergedStyles.value.root));

/** `imageStyle` 与 `styles.image` 合并，后者覆盖前者（与 antd 一致）。 */
const imageStyleAttrs = computed(() =>
  styleAttrs({ ...props.imageStyle, ...mergedStyles.value.image }),
);

const descriptionStyleAttrs = computed(() => styleAttrs(mergedStyles.value.description));

const footerStyleAttrs = computed(() => styleAttrs(mergedStyles.value.footer));

/**
 * 根元素的属性对象。
 *
 * ⚠️ 不能写成两个裸 `v-bind`（`v-bind="x" v-bind="$attrs"`）—— Vue 会报
 *    「Duplicate attribute」。所以这里把 `$attrs` 一起并进来。
 * ⚠️ 样式的处理见 `styleAttrs` 的注释：SSR 对 `style` 键是无条件输出的，
 *    必须让空样式时**连键都不出现**。
 */
// 语义根样式在前、调用方原生 attrs 在后 ⇒ 调用方 `style` 最后胜出。
const rootAttrs = computed(() => mergeProps(rootStyleAttrs.value, attrs));

// ---------------------------------------------------------------------------
// 暴露
// ---------------------------------------------------------------------------

const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>

<template>
  <div ref="rootRef" :class="rootClass" v-bind="rootAttrs">
    <div :class="imageClass" v-bind="imageStyleAttrs">
      <ImageNode :node="mergedImage" :alt="alt" />
    </div>
    <div v-if="showDescription" :class="descriptionClass" v-bind="descriptionStyleAttrs">
      <NodeRenderer :node="des" />
    </div>
    <div v-if="showFooter" :class="footerClass" v-bind="footerStyleAttrs">
      <slot />
    </div>
  </div>
</template>
