<script setup lang="ts">
/**
 * Divider —— 区隔内容的分割线。
 *
 * 契约来源：antd 6.6.4 的 `es/divider/index.js`。DOM 结构、类名、分支判据逐条对齐，
 * 有意差异登记在 `packages/ui/src/divider/README.md` 与 `COMPATIBILITY.md` §9。
 *
 * ── 四条最容易写错、且都已被 compat 用例钉住的判据 ──────────────────────────────
 *
 *   1. **三个「方向」来源的优先级是 `orientation` > `vertical` > `type`**，且
 *      `vertical` 的判据是 `typeof vertical === 'boolean'` 而**不是**真值判断。
 *      ⇒ 未传 `vertical` 时它必须是 `undefined`，不能是 `false`（见 `withDefaults` 的注释）。
 *   2. **`orientation` 身兼两职**：取 `horizontal`/`vertical` 时是方向；取
 *      `left`/`right`/`center`/`start`/`end` 时是**旧版标题位置**（并告警）。
 *   3. **`titlePlacement` 的合并顺序**：`titlePlacement ?? (orientation 是合法位置 ? orientation : 'center')`，
 *      之后 `left`/`right` 再按 `direction` 折成 `start`/`end`。
 *   4. **`-rail` 类名与 `rail` 语义类名都只在没有 children 时才落到根元素上**；
 *      有 children 时 `rail` 语义类名落到两个 rail 子元素上。
 *
 * ── 与 antd 的两处平台/架构差异 ────────────────────────────────────────────────
 *
 *   - 无 CSS-in-JS 的 hash 类名（D5）。
 *   - `size` 目前只读 prop，不读 ConfigProvider 的 `componentSize` —— 落点与缺口
 *     见 `README.md` §7。
 */

import { isNumber, useDevWarning } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  mergeProps,
  reactive,
  ref,
  useAttrs,
  useSlots,
  watchEffect,
} from 'vue';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import type {
  DividerConfig,
  DividerProps,
  DividerSemanticClassNames,
  DividerSemanticStyles,
  DividerSize,
  DividerSlot,
  Orientation,
  TitlePlacement,
} from './interface';

defineOptions({ name: 'ADivider', inheritAttrs: false });

/**
 * ⚠️⚠️ `vertical` / `dashed` / `plain` 的 `undefined` 默认值**不是冗余的**。
 *
 * Vue 的 Boolean prop 转换：只要 prop 的**运行时类型**含 `Boolean`，且调用方没传、
 * 也没有 `default`，Vue 就会把它赋成 `false`。
 *
 * 对 `dashed` / `plain` 无影响（antd 用的是 `!!dashed`）。但 **`vertical` 有影响**：
 * `useOrientation()` 的判据是 `typeof vertical === 'boolean'`，它把「未传」与
 * 「显式传 false」当作两条不同的分支 ——
 *
 * ```
 * orientation 合法        → 用 orientation
 * 否则 vertical 是布尔     → vertical ? 'vertical' : 'horizontal'
 * 否则 type 合法           → 用 type（旧 API）
 * 否则                     → 'horizontal'
 * ```
 *
 * 若 `vertical` 被 Vue 转成 `false`，`<Divider type="vertical" />` 会走第二条分支
 * 得到 `horizontal` —— **旧 API 静默失效**，而组件照样能渲染。
 *
 * 声明 `default`（哪怕值是 `undefined`）会让 Vue 走 `hasDefault` 分支、跳过转换。
 * 这是 PITFALLS 第 46 条（D21）的同一根源，只是这次受害的是真布尔 prop。
 */
const props = withDefaults(defineProps<DividerProps>(), {
  prefixCls: undefined,
  type: undefined,
  orientation: undefined,
  vertical: undefined,
  titlePlacement: undefined,
  orientationMargin: undefined,
  dashed: undefined,
  variant: 'solid',
  size: undefined,
  plain: undefined,
  classNames: undefined,
  styles: undefined,
});

const slots = useSlots();
const attrs = useAttrs();
defineSlots<{ default?: DividerSlot }>();

const {
  getPrefixCls,
  direction,
  className: contextClassName,
  style: contextStyle,
  classNames: contextClassNames,
  styles: contextStyles,
} = useComponentConfig<DividerConfig>('divider');

const prefixCls = computed(() => getPrefixCls('divider', props.prefixCls));
const railCls = computed(() => `${prefixCls.value}-rail`);
const innerTextCls = computed(() => `${prefixCls.value}-inner-text`);

// ---------------------------------------------------------------------------
// children（默认插槽）
//
// antd 的判据是 `!!children`（真值判断，不是「有没有传」）。Vue 侧的对应物是
// 「默认插槽是否存在」：没有插槽 → `undefined` → false。
// `0` / `''` 这类边界在两侧的差异由 compat 用例覆盖（见 semantic.test.ts 的 allow）。
// ---------------------------------------------------------------------------
const hasChildren = computed(() => !!slots.default);

// ---------------------------------------------------------------------------
// 方向：orientation > vertical > type
// ---------------------------------------------------------------------------

const isValidOrientation = (value: unknown): value is Orientation =>
  value === 'horizontal' || value === 'vertical';

/**
 * 合并后的方向。
 *
 * ⚠️ 这里的 `typeof props.vertical === 'boolean'` **依赖 `withDefaults` 里的
 *    `vertical: undefined`** —— 删掉那行会让这条分支恒成立，`type` 永久失效。
 */
const mergedOrientation = computed<Orientation>(() => {
  if (isValidOrientation(props.orientation)) return props.orientation;
  if (typeof props.vertical === 'boolean') return props.vertical ? 'vertical' : 'horizontal';
  if (isValidOrientation(props.type)) return props.type;
  return 'horizontal';
});

const mergedVertical = computed(() => mergedOrientation.value === 'vertical');

// ---------------------------------------------------------------------------
// 标题位置
// ---------------------------------------------------------------------------

/** antd 的 `titlePlacementList`：既用于校验 `orientation` 是否被当成位置用。 */
const titlePlacementList: readonly string[] = ['left', 'right', 'center', 'start', 'end'];

/** `orientation` 是否取了「标题位置」的值（此时 antd 认为它在用旧 API 并告警）。 */
const validTitlePlacement = computed(() => titlePlacementList.includes(props.orientation ?? ''));

/**
 * 合并后的标题位置。
 *
 * 判据逐字来自 antd：`titlePlacement ?? (orientation 是合法位置 ? orientation : 'center')`，
 * 再把 `left` / `right` 按文字方向折成 `start` / `end`（RTL 时互换）。
 */
const mergedTitlePlacement = computed<'start' | 'end' | 'center'>(() => {
  const placement: TitlePlacement | Orientation =
    props.titlePlacement ??
    (validTitlePlacement.value ? (props.orientation as TitlePlacement) : 'center');
  if (placement === 'left') return direction === 'rtl' ? 'end' : 'start';
  if (placement === 'right') return direction === 'rtl' ? 'start' : 'end';
  return placement;
});

const hasMarginStart = computed(
  () => mergedTitlePlacement.value === 'start' && props.orientationMargin != null,
);
const hasMarginEnd = computed(
  () => mergedTitlePlacement.value === 'end' && props.orientationMargin != null,
);

/**
 * `orientationMargin` 的归一化：数字原样、纯数字字符串转数字、其余原样。
 *
 * 与 antd 的 `memoizedPlacementMargin` 逐条对应 —— 包括 `undefined` 时
 * `/^\d+$/.test(undefined)` 会被转成字符串 `"undefined"` 而返回 `false` 这一点。
 */
const memoizedPlacementMargin = computed<string | number | undefined>(() => {
  const margin = props.orientationMargin;
  if (isNumber(margin)) return margin;
  if (/^\d+$/.test(margin ?? '')) return Number(margin);
  return margin;
});

/**
 * 把 `orientationMargin` 的归一化结果落成 CSS 长度。
 *
 * ⚠️ **必须自己补 `px`**：Vue 运行时的 `setStyle` 只做 `style[prop] = value`，
 *    不做单位补全（React 的 `dangerousStyleValue` 会）。传裸数字 `10` 会被浏览器与
 *    jsdom 的 cssstyle **静默丢弃** —— DOM 结构全对，只有 margin 是空的。
 *    （PITFALLS 第 32 条；由本组件的 L4 用例 `orientation-margin:*` 抓到。）
 *
 * `0` 例外：React 对数值 0 **不补**单位（输出 `0`），我们照做，
 * 否则 L4 会看到 `0` vs `0px` 的差异。
 */
const toCssLength = (value: string | number | undefined): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== 'number') return value;
  return value === 0 ? '0' : `${value}px`;
};

const innerStyle = computed<CSSProperties>(() => ({
  marginInlineStart: hasMarginStart.value ? toCssLength(memoizedPlacementMargin.value) : undefined,
  marginInlineEnd: hasMarginEnd.value ? toCssLength(memoizedPlacementMargin.value) : undefined,
}));

// ---------------------------------------------------------------------------
// 间距大小
//
// antd 走 `useSize(customSize)`：先读 `SizeContext`（ConfigProvider 的 `componentSize`），
// 再由 `size` prop 覆盖（`customSize ?? ctxSize`）。
// ✅ 2026-10-07 接上（registry `VNA-DIVIDER-01`）：此前注释写「ConfigProvider 组件尚未落地、
//    SizeContext 不存在」，但**两者都已存在** ⇒ `sizeFullName` 一直是死的 `props.size`，
//    全局 `componentSize` 对它无效。
// ---------------------------------------------------------------------------
const sizeFullName = useSize((ctxSize) => props.size ?? ctxSize);

// ---------------------------------------------------------------------------
// 语义化合并
//
// 合并顺序即契约（见 `_internal/use-merge-semantic.ts`）：
//   classNames: [contextClassNames, classNames]        —— 拼接
//   styles:     [contextStyles, {root: contextStyle}, styles] —— 后者胜
// `style` prop **不在**这个列表里 —— 它由下面的根样式对象在**最后**合并（覆盖 styles.root）。
// ---------------------------------------------------------------------------

/**
 * 传给函数式 `classNames` / `styles` 的 `info.props`。
 *
 * antd 传的是 `{...props, orientation: mergedOrientation, titlePlacement: mergedTitlePlacement, size: sizeFullName}`。
 * `useMergeSemantic` 在 setup 期就把 `info` 捕获成 `{ props }`，所以必须传一个
 * **保持响应式**的对象 —— 直接传 `{...props}` 的快照会让函数式看到过期的值
 * （antd 每次渲染都重建 mergedProps，语义上是实时的）。
 */
const semanticProps = reactive({ ...props }) as DividerProps;
watchEffect(() => {
  Object.assign(semanticProps, props, {
    orientation: mergedOrientation.value,
    titlePlacement: mergedTitlePlacement.value,
    size: sizeFullName.value,
  });
});

const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
  DividerProps,
  DividerSemanticClassNames,
  DividerSemanticStyles
>(
  [() => contextClassNames, () => props.classNames],
  [() => contextStyles, () => semanticRootStyle(contextStyle), () => props.styles],
  semanticProps,
);

// ---------------------------------------------------------------------------
// 类名
// ---------------------------------------------------------------------------

const rootClass = computed(() => {
  const railSemantic = mergedClassNames.value.rail;
  const rail = railCls.value;
  const hasContent = hasChildren.value;
  return [
    prefixCls.value,
    contextClassName,
    `${prefixCls.value}-${mergedOrientation.value}`,
    {
      [`${prefixCls.value}-with-text`]: hasContent,
      [`${prefixCls.value}-with-text-${mergedTitlePlacement.value}`]: hasContent,
      [`${prefixCls.value}-dashed`]: !!props.dashed,
      [`${prefixCls.value}-${props.variant}`]: props.variant !== 'solid',
      [`${prefixCls.value}-plain`]: !!props.plain,
      [`${prefixCls.value}-rtl`]: direction === 'rtl',
      [`${prefixCls.value}-no-default-orientation-margin-start`]: hasMarginStart.value,
      [`${prefixCls.value}-no-default-orientation-margin-end`]: hasMarginEnd.value,
      [`${prefixCls.value}-md`]: sizeFullName.value === 'medium' || sizeFullName.value === 'middle',
      [`${prefixCls.value}-sm`]: sizeFullName.value === 'small',
      [rail]: !hasContent,
      // 语义化的 `rail` 槽位同样只在无 children 时上根元素。
      ...(railSemantic && !hasContent ? { [railSemantic]: true } : {}),
    },
    mergedClassNames.value.root,
  ];
});

const railClass = computed(() => [railCls.value, mergedClassNames.value.rail]);

const contentClass = computed(() => [innerTextCls.value, mergedClassNames.value.content]);

// ---------------------------------------------------------------------------
// 样式
//
// ⚠️ 必须过 `styleAttrs`：`mergeStyles()` 的返回值恒是对象（可能是 `{}`），
//    直接绑 `:style` 会让 Vue 的 SSR 渲染出 `style=""` —— 而 React 在样式为空时
//    **不输出该属性**。这个差异 L4 测不出来（投影把两者都归一化成空串）。
//    见 `_internal/use-merge-semantic.ts` 的 `styleAttrs`。
//
// 合并顺序逐字来自 antd：`{...mergedStyles.root, ...(children ? {} : mergedStyles.rail), ...style}`。
// ---------------------------------------------------------------------------

const rootStyle = computed<CSSProperties>(() => ({
  ...mergedStyles.value.root,
  ...(hasChildren.value ? {} : mergedStyles.value.rail),
}));

const railStyleAttrs = computed(() => styleAttrs(mergedStyles.value.rail));

const contentStyleAttrs = computed(() =>
  styleAttrs({ ...innerStyle.value, ...mergedStyles.value.content }),
);

const rootStyleAttrs = computed(() => styleAttrs(rootStyle.value));

/**
 * 根元素的属性对象。
 *
 * ⚠️ 不能写成两个裸 `v-bind`（`v-bind="x" v-bind="$attrs"`）—— Vue 会报
 *    「Duplicate attribute」。所以把 `$attrs` 并进同一个对象（`mergeProps` 会正确处理
 *    `class` / `style` 的合并，后者胜出）。
 * ⚠️ 根 `class` / `style` 是 **Vue 原生 attrs**：调用方的 `class` / `style` 经 `$attrs`
 *    进来，与「内部状态类 + 语义/Provider 根样式」合并，调用方同名样式优先。
 * ⚠️ `role` 放在最后：antd 的 `{...restProps}` 在 `role="separator"` **之前**，
 *    所以用户传的 `role` 会被覆盖。放在对象末尾可保证同一语义，且不依赖
 *    Vue 对「v-bind + 静态属性」的合并顺序。
 */
const rootAttrs = computed(() =>
  mergeProps({ class: rootClass.value, ...rootStyleAttrs.value }, attrs, {
    role: 'separator',
  }),
);

// ---------------------------------------------------------------------------
// 开发期告警
//
// antd 把告警写在**渲染体**里 —— 每次渲染都求值一次，所以「挂载时合法、之后更新成
// 非法」也会告警（`warning()` 自己按消息去重，重复调用只打印一次）。
// 所以这里用 `watchEffect` 而不是在 setup 期求值一次：后者会让「更新后才非法的用法」
// 永远静默，是一处真实的可观测差异。
//
// ⚠️ Vue 的 props 对象**恒**包含全部声明键（未传时值为 `undefined`），
//    所以 antd 的 `!(name in props)` 判据必须改成 `!== undefined`（PITFALLS 46 / D21）。
// ---------------------------------------------------------------------------
const warning = useDevWarning('Divider');
watchEffect(() => {
  warning(
    !hasChildren.value || !mergedVertical.value,
    '`children` not working in `vertical` mode.',
  );
  warning(
    !validTitlePlacement.value,
    '`orientation` is used for direction, please use `titlePlacement` replace this',
  );
  warning.deprecated(props.type === undefined, 'type', 'orientation');
  warning.deprecated(
    props.orientationMargin === undefined,
    'orientationMargin',
    'styles.content.margin',
  );
});

// ---------------------------------------------------------------------------
// 暴露
// ---------------------------------------------------------------------------

const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>

<template>
  <div ref="rootRef" v-bind="rootAttrs">
    <template v-if="hasChildren && !mergedVertical">
      <div :class="[railClass, `${railCls}-start`]" v-bind="railStyleAttrs" />
      <span :class="contentClass" v-bind="contentStyleAttrs">
        <slot />
      </span>
      <div :class="[railClass, `${railCls}-end`]" v-bind="railStyleAttrs" />
    </template>
  </div>
</template>
