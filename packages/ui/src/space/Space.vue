<script setup lang="ts">
/**
 * Space —— 设置组件之间的间距。
 *
 * 契约来源：antd 6.6.4 的 `es/space/index.js`（233 行）。DOM 结构、类名、
 * 分支判据逐条对齐，有意差异登记在 `packages/ui/src/space/README.md` 与
 * `docs/analysis/space.md` §9。
 *
 * ── 六条最容易写错、且都已被 compat 用例钉住的判据 ──────────────────────────────
 *
 *   1. **`vertical` 未传 ≠ `false`**（PITFALLS 46 / D21）。`useOrientation` 的判据是
 *      `typeof vertical === 'boolean'`，它把两者当作不同分支 ⇒ 删掉 `withDefaults`
 *      里的 `vertical: undefined` 会让 `<Space direction="vertical" />` **静默**变成
 *      `horizontal`（组件照样渲染，只是方向错）。
 *   2. **`size` 的取值用 `??` 而不是 `||`**：`size: 0` 是**有效值**（不回落到
 *      `'small'`），只是它两条 gap 判据都为假 ⇒ 不产生任何 gap。
 *   3. **数字 gap 必须自己补 `px`**（PITFALLS 32）：React 的 `dangerousStyleValue`
 *      把 `rowGap: 10` 输出成 `10px`，Vue 的 `setStyle` 不补 ⇒ 裸 `10` 会被静默丢弃。
 *   4. **`align` 的判据是 `=== undefined`**：水平时不传折成 `'center'`，
 *      垂直时不传**保持 `undefined`** ⇒ 不产生 `-align-*` 类名。
 *   5. **`separator ?? split`**（`??` 而不是 `||`），而 Item 里的渲染判据是
 *      **真值** ⇒ `separator=""` 不回落、也不渲染。
 *   6. **`latestIndex` 的 reduce 初值是 `0`**，且只统计「有内容」的子节点。
 *      Item 的渲染判据也是「有内容」—— 所以不可渲染的子节点连 `-item` 包裹都没有。
 *
 * ── 与 antd 的平台/架构差异 ────────────────────────────────────────────────────
 *
 *   - 无 CSS-in-JS 的 hash 类名（D1）。
 *   - `SpaceContext` 注入的是 `ComputedRef`（D5 / D27）。
 *   - `className` / `style` 是**显式 prop**（antd 也是），但 Vue 里 `class` 恒走
 *     `$attrs` —— 两者都会被应用，位置见 `rootClass` / `rootAttrs` 的注释。
 */

import { isEmptyVNode, toArray, useDevWarning } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  provide,
  ref,
  shallowReactive,
  useAttrs,
  useSlots,
  type VNode,
  watchEffect,
} from 'vue';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { spaceContextKey } from './context';
import { isPresetSize, isValidGapNumber } from './gapSize';
import { Item } from './Item';
import type {
  SpaceAlign,
  SpaceConfig,
  SpaceProps,
  SpaceSemanticClassNames,
  SpaceSemanticStyles,
  SpaceSize,
  SpaceSlot,
} from './interface';
import { useOrientation } from './useOrientation';

defineOptions({ name: 'ASpace', inheritAttrs: false });

/**
 * ⚠️⚠️ `vertical` / `wrap` / `split` / `separator` 的 `undefined` 默认值
 * **不是冗余的**。
 *
 * Vue 的 Boolean prop 转换：只要 prop 的**运行时类型**含 `Boolean`，且调用方没传、
 * 也没有 `default`，Vue 就会把它赋成 `false`。
 *
 *   - `vertical`：`useOrientation` 的判据是 `typeof vertical === 'boolean'` ⇒
 *     被转成 `false` 后 `<Space direction="vertical" />` 会走错分支（见文件头 1）。
 *   - `split` / `separator`：`VNodeChild` 经 SFC 编译器解析出的运行时类型是
 *     `[Object, String, Number, Boolean, null, Array]`（**含 Boolean**，实测见
 *     `empty/Empty.vue` 的注释）⇒ 被转成 `false` 后
 *     `separator ?? split` 里的 `??` 只对 `null`/`undefined` 生效，`false` 会
 *     短路掉 `split` —— 旧 API 静默失效。
 *
 * 声明 `default`（哪怕值是 `undefined`）会让 Vue 走 `hasDefault` 分支、跳过转换。
 * 这是 PITFALLS 第 46 条（D21）。
 */
const props = withDefaults(defineProps<SpaceProps>(), {
  prefixCls: undefined,
  className: undefined,
  rootClassName: undefined,
  style: undefined,
  size: undefined,
  direction: undefined,
  vertical: undefined,
  orientation: undefined,
  align: undefined,
  split: undefined,
  separator: undefined,
  wrap: undefined,
  classNames: undefined,
  styles: undefined,
});

const slots = useSlots();
const attrs = useAttrs();
defineSlots<{ default?: SpaceSlot }>();

const {
  getPrefixCls,
  size: contextSize,
  className: contextClassName,
  style: contextStyle,
  classNames: contextClassNames,
  styles: contextStyles,
} = useComponentConfig<SpaceConfig>('space');

/**
 * `direction` 走 `useDirection()` 而**不是** `useComponentConfig` 的解构值。
 *
 * antd 那边 `useContext` 会在 Provider 更新时重跑函数体，所以解构出的
 * `direction` 是活的；Vue 的 `inject` 只在 setup 期解析一次，解构出来的是**快照**
 * （D27）。`useDirection()` 返回 `ComputedRef`，语义与 antd 一致。
 */
const direction = useDirection();

const prefixCls = computed(() => getPrefixCls('space', props.prefixCls));

// ---------------------------------------------------------------------------
// 子节点
//
// ⚠️ `slots.default` 不存在时**必须**返回 `[]`，不能把 `undefined` 交给 `toArray`：
//    `toArray(undefined, {keepEmpty: true})` 会补一个空占位（长度 1），而 React 的
//    `React.Children.forEach(undefined, …)` 是**提前返回**、`toArray` 得到 `[]`
//    （`<Space />` 必须渲染出零个根节点）。
//
//    `keepEmpty: true` 只在「children 列表**内部**」生效：`[false]` → `[null]`
//    （React 的 `traverseAllChildren` 把 boolean 归一成 `null` 后仍然回调一次），
//    所以下标与 antd 逐一对齐。
// ---------------------------------------------------------------------------
const childNodes = computed<VNode[]>(() => {
  const slot = slots.default;
  if (!slot) return [];
  return toArray(() => slot(), { keepEmpty: true });
});

const hasChildren = computed(() => childNodes.value.length > 0);

// ---------------------------------------------------------------------------
// 方向：orientation > vertical > direction
// ---------------------------------------------------------------------------
const orientationPair = useOrientation(
  () => props.orientation,
  () => props.vertical,
  () => props.direction,
);
const mergedOrientation = computed(() => orientationPair.value[0]);
const mergedVertical = computed(() => orientationPair.value[1]);

/**
 * 对齐方式。
 *
 * ⚠️ 判据是 `align === undefined`（**不是**真值判断），且 `!mergedVertical` 才折成
 *    `'center'` —— 所以垂直时不传 `align` 会保持 `undefined`、**不产生**
 *    `-align-*` 类名（上游：`index.tsx:103`）。
 */
const mergedAlign = computed<SpaceAlign | undefined>(() =>
  props.align === undefined && !mergedVertical.value ? 'center' : props.align,
);

/** `separator ?? split` —— `??` 而不是 `||`，传 `''` 时不回落（上游：`index.tsx:105`）。 */
const mergedSeparator = computed(() => props.separator ?? props.split);

// ---------------------------------------------------------------------------
// 间距大小
// ---------------------------------------------------------------------------
const sizeFullName = computed<SpaceSize | [SpaceSize, SpaceSize]>(
  () => props.size ?? contextSize ?? 'small',
);

/**
 * `[horizontal, vertical]`。
 *
 * ⚠️ `Array.isArray` 判据与 antd 一致：传 `[a, b]` 时横向取 `a`、纵向取 `b`；
 *    否则两个方向取同一个值。
 */
const sizePair = computed<[SpaceSize, SpaceSize]>(() => {
  const size = sizeFullName.value;
  return Array.isArray(size) ? [size[0], size[1]] : [size, size];
});

const horizontalSize = computed(() => sizePair.value[0]);
const verticalSize = computed(() => sizePair.value[1]);

const isPresetHorizontalSize = computed(() => isPresetSize(horizontalSize.value));
const isPresetVerticalSize = computed(() => isPresetSize(verticalSize.value));

/**
 * 把数字 gap 落成 CSS 长度。
 *
 * ⚠️ **必须自己补 `px`**（PITFALLS 32）：Vue 运行时的 `setStyle` 只做
 *    `style[prop] = value`，不像 React 的 `dangerousStyleValue` 会补单位 ——
 *    裸数字 `10` 会被浏览器与 jsdom 的 cssstyle **静默丢弃**，DOM 结构全对、
 *    只有 gap 是空的。上游用例：`gap.test.tsx` 的 `should size work`（断言 `10px`）。
 *
 * 这里不需要处理 `0`：`isValidGapNumber(0)` 为假，走不到这条路径
 * （与 Divider 的 `toCssLength` 不同 —— 那里 `0` 是有效输入）。
 */
const toGapLength = (value: number): string => `${value}px`;

/**
 * 两个方向各自的「内联 gap 值」。
 *
 * ⚠️ 为什么不在 `gapStyle` 里直接调 `isValidGapNumber(horizontalSize.value)`：
 *    `isValidGapNumber` 是类型谓词，但它作用于一个 `computed` 的 `.value`
 *    表达式时，TS **不会**把收窄结果带到下一行（收窄只对可赋值的引用生效）。
 *    把值先取到局部常量再判定，收窄才能成立 —— 这也是「同一份判据只写一遍」
 *    的地方：预设串走类名、数字走内联，两条互斥分支在这里各自算出结果。
 */
const horizontalGap = computed<number | undefined>(() => {
  const size = horizontalSize.value;
  return !isPresetSize(size) && isValidGapNumber(size) ? size : undefined;
});

const verticalGap = computed<number | undefined>(() => {
  const size = verticalSize.value;
  return !isPresetSize(size) && isValidGapNumber(size) ? size : undefined;
});

/**
 * 内联 gap。
 *
 * 顺序逐字对齐 antd：`flexWrap` → `columnGap` → `rowGap`。
 * 预设串**不**产生内联值（交给 CSS 类名 + 变量）；`0` / `NaN` / 字符串数字
 * 两条判据都为假 ⇒ 什么都不加。
 */
const gapStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {};
  if (props.wrap) {
    style.flexWrap = 'wrap';
  }
  if (horizontalGap.value !== undefined) {
    style.columnGap = toGapLength(horizontalGap.value);
  }
  if (verticalGap.value !== undefined) {
    style.rowGap = toGapLength(verticalGap.value);
  }
  return style;
});

// ---------------------------------------------------------------------------
// 语义化合并
//
// 合并顺序即契约（见 `_internal/use-merge-semantic.ts`）：
//   classNames: [contextClassNames, classNames]                        —— 拼接
//   styles:     [contextStyles, {root: contextStyle}, styles, {root: style}]
//                                                                      —— 后者胜
// ⚠️ `style` prop 排在 `styles` **之后** ⇒ `style` 覆盖 `styles.root`。
//    这是最容易被「顺手改成更合理顺序」的一条，上游 `index.tsx:122-128` 就是这样。
// ---------------------------------------------------------------------------

/**
 * 传给函数式 `classNames` / `styles` 的 `info.props`。
 *
 * antd 传的是 `{...props, size, orientation: mergedOrientation, align: mergedAlign}`。
 * `useMergeSemantic` 在 setup 期把 `info` 捕获成 `{ props }`，所以必须传一个
 * **保持响应式**的对象 —— 直接传 `{...props}` 的快照会让函数式看到过期的值
 * （antd 每次渲染都重建 mergedProps，语义上是实时的）。
 *
 * ⚠️ 这里用 `shallowReactive` 而不是 `reactive`（Divider / Empty 用的是后者）。
 *    原因是**类型**而不是运行时：`reactive()` 的返回类型是
 *    `UnwrapNestedRefs<T>`，一个对 `T` 做**深递归**的条件类型；`SpaceProps` 里
 *    的 `size?: SpaceSize | [SpaceSize, SpaceSize]`（标量与**元组**的联合）叠加
 *    `classNames` / `styles` 的递归函数签名后，`vue-tsc` 报
 *    `TS2589: Type instantiation is excessively deep and possibly infinite`。
 *    Divider / Empty 的 `size` 是扁平字符串联合，所以同一个写法在那里是绿的。
 *
 *    语义上**严格够用**：我们只按**顶层键**读（`props.size` 等），而
 *    `Object.assign` 也是整键替换 —— 浅层响应式恰好覆盖这两件事。
 *    嵌套对象（`classNames.root`）的深度追踪不依赖这层代理：`props` 本身是
 *    Vue 的浅只读对象，父组件要能让它变，传进来的那个对象自己就是响应式的。
 */
const semanticProps = shallowReactive<SpaceProps>({ ...props });
watchEffect(() => {
  Object.assign(semanticProps, props, {
    size: sizeFullName.value,
    orientation: mergedOrientation.value,
    align: mergedAlign.value,
  });
});

const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
  SpaceProps,
  SpaceSemanticClassNames,
  SpaceSemanticStyles
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

// ---------------------------------------------------------------------------
// 类名
//
// 顺序逐字对齐 antd 的 `clsx(...)`（`index.tsx:130-145`）。
// ⚠️ `props.className` 排在 `-gap-*` **之后**、`props.rootClassName` **之前** ——
//    顺序不影响 CSS（用户类名的特异性由 CSS 决定），但它是 SSR 字节级的契约，
//    而且 L4 的投影会排序、测不到它，所以只能靠逐字对照源码来保证。
// ---------------------------------------------------------------------------

const rootClass = computed(() => [
  prefixCls.value,
  contextClassName,
  `${prefixCls.value}-${mergedOrientation.value}`,
  {
    [`${prefixCls.value}-rtl`]: direction.value === 'rtl',
    [`${prefixCls.value}-align-${mergedAlign.value}`]: mergedAlign.value,
    [`${prefixCls.value}-gap-row-${verticalSize.value}`]: isPresetVerticalSize.value,
    [`${prefixCls.value}-gap-col-${horizontalSize.value}`]: isPresetHorizontalSize.value,
  },
  props.className,
  props.rootClassName,
  mergedClassNames.value.root,
]);

const itemClassName = computed(() => [`${prefixCls.value}-item`, mergedClassNames.value.item]);

// ---------------------------------------------------------------------------
// latestIndex
//
// 契约来源：`index.tsx:179-185`。三条判据：
//   - reduce 的**初值是 `0`**（不是 `-1`）—— 全空时结果是 `0`，而 `0 < 0` 为假，
//     所以不会有分隔符。
//   - 只统计「有内容」的子节点（Vue 侧对应物是 `isEmptyVNode`）。
//   - 空列表不会走到这里（`hasChildren` 为假时整块不渲染）。
// ---------------------------------------------------------------------------
const latestIndex = computed(() =>
  childNodes.value.reduce((latest, child, index) => (isEmptyVNode(child) ? latest : index), 0),
);

/**
 * 把 `latestIndex` 广播给每个 `Item`。
 *
 * 值是 `ComputedRef`（D37 / D27）—— 裸对象在 Vue 里是 setup 期快照，
 * `childNodes` 变化后 Item 会读到过期下标。`ComputedRef` 让「子节点增删」
 * 传导到每个 Item 的分隔符判据上。
 */
provide(
  spaceContextKey,
  computed(() => ({ latestIndex: latestIndex.value })),
);

// ---------------------------------------------------------------------------
// 样式
//
// ⚠️ 根样式必须过 `styleAttrs`：`mergeStyles()` 的返回值恒是对象（可能是 `{}`），
//    直接绑 `:style` 会让 Vue 的 SSR 渲染出 `style=""` —— 而 React 在样式为空时
//    **不输出该属性**（见 `_internal/use-merge-semantic.ts` 的 `styleAttrs`）。
//
// 合并顺序逐字来自 antd 的 `index.tsx:210`：`{...gapStyle, ...mergedStyles.root}`
// —— gapStyle 在前，所以 `styles.root` 可以覆盖它。
// ---------------------------------------------------------------------------

const rootStyleAttrs = computed(() =>
  styleAttrs({ ...gapStyle.value, ...mergedStyles.value.root }),
);

/**
 * 根元素的属性对象。
 *
 * ⚠️ 不能写成两个裸 `v-bind`（`v-bind="x" v-bind="$attrs"`）—— Vue 会报
 *    「Duplicate attribute」。所以把 `$attrs` 并进同一个对象。
 *
 * `$attrs` 里会包含用户的 `class`（Vue 里 `class` 恒走 attrs，不可能是 prop）——
 * 它与 `:class` 由 Vue 的 `mergeProps` 拼接，落在根类名串的**最后**。
 * 这与 antd 的位置（`className` 在中间）不同，但两者都是「用户的类名」，
 * 且 L4 的投影会把类名排序 ⇒ 不可观测。差异登记见 `docs/analysis/space.md` §9。
 */
const rootAttrs = computed(() => ({ ...attrs, ...rootStyleAttrs.value }));

/**
 * `v-for` 的 key。
 *
 * antd：`child?.key || \`${itemClassName}-${i}\``（`index.tsx:151`）。
 * Vue 的 `VNode.key` 类型是 `PropertyKey | null`，可能含 symbol —— 而 `v-for` 的
 * key 要参与 DOM 属性/内部映射，这里只接受 string / number，其余走兜底。
 * 兜底键保证「没有 key 的兄弟节点」也不会重复（上游用例：
 * `index.test.tsx` 的 `should not throw duplicated key warning`）。
 */
const itemKey = (child: VNode, index: number): string | number => {
  const key = child.key;
  if (typeof key === 'string' || typeof key === 'number') return key;
  return `${itemClassName.value.join(' ')}-${index}`;
};

// ---------------------------------------------------------------------------
// 开发期告警
//
// antd 把告警写在**渲染体**里（每次渲染都求值一次），所以「挂载时合法、之后
// 更新成非法」也会告警（`warning()` 自己按消息去重）。这里用 `watchEffect`
// 而不是 setup 期求值一次 —— 后者会让「更新后才非法的用法」永远静默。
//
// ⚠️ antd 的判据是 `!(deprecatedName in props)`；Vue 的 props 对象**恒**包含
//    全部声明键（未传时值为 `undefined`），`in` 恒为真 ⇒ 必须改成 `!== undefined`
//    （PITFALLS 46 / D21，与 empty 的 `imageStyle` 同形）。
// ---------------------------------------------------------------------------
const warning = useDevWarning('Space');
watchEffect(() => {
  warning.deprecated(props.direction === undefined, 'direction', 'orientation');
  warning.deprecated(props.split === undefined, 'split', 'separator');
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
      `SpaceContext` 由本组件 provide（Item 用它拿 `latestIndex`）。
      与 antd 的 `<SpaceContextProvider>` 同构 —— 它也不产生任何元素。
    -->
    <Item
      v-for="(child, index) in childNodes"
      :key="itemKey(child, index)"
      :prefix="prefixCls"
      :class-name="itemClassName.join(' ')"
      :index="index"
      :node="child"
      :separator="mergedSeparator"
      :style="mergedStyles.item"
      :class-names="mergedClassNames"
      :styles="mergedStyles"
    />
  </div>
</template>
