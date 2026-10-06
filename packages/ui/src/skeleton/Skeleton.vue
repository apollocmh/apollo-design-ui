<script setup lang="ts">
/**
 * Skeleton —— 骨架屏。
 *
 * 契约来源：antd 6.6.4 的 `es/skeleton/Skeleton.js`。DOM 结构、类名、分支判据逐条对齐，
 * 有意差异登记在 `packages/ui/src/skeleton/README.md` §5 与 `COMPATIBILITY.md` §9。
 *
 * ── 七条最容易写错、且都已被 compat / L1 用例钉住的判据 ────────────────────────
 *
 * 1. **`loading` 的判据是「prop 是否存在」而不是它的值**：
 *    antd 写的是 `loading || !('loading' in props)`。三态表见 `interface.ts`；
 *    我们用 `props.loading !== false`（不传 / `true` ⇒ 骨架；`false` ⇒ 插槽）。
 *    ⚠️ `loading={undefined}` 上游渲染 children、我们渲染骨架 —— **唯一**的行为差异。
 * 2. **三个块的真值判据**：`hasAvatar = !!avatar`、`hasTitle = !!title`、
 *    `hasParagraph = !!paragraph`。`avatar={0}` / `title=""` 都判假；
 *    传对象恒真（对象是真值）。
 * 3. **`getTitleBasicProps` / `getParagraphBasicProps` 的三张表**（见下）——
 *    它们是「同一份 `title` 在不同组合下宽度不同」的唯一来源。
 * 4. **`avatar` / `title` / `paragraph` 传对象时的覆盖优先级**：
 *    对象字面量的展开顺序是 `{className, prefixCls, ...基础几何, ...对象, style}`。
 *    所以 `avatar={{className}}` **覆盖**语义类名、`avatar={{prefixCls}}` 覆盖前缀，
 *    而 `avatar={{style}}` **被 `styles.avatar` 覆盖掉**（`style` 排在最后）。
 *    实测上游：`avatar={{style:{color:'red'}}}` 的产物里没有 `style`。
 * 5. **`-with-avatar` / `-active` / `-rtl` / `-round` 四个类名都在根元素上**，
 *    且根元素**没有** `-element`（那是子组件才有的）。
 * 6. **根元素不吃任何多余属性**：antd 的渲染体里没有 `{...rest}` ——
 *    实测 `<Skeleton data-testid="x" />` 的产物里没有 `data-testid`。
 *    我们用 `inheritAttrs: false` + 不绑 `$attrs` 复刻（**不是**漏了）。
 * 7. **`loading === false` 时根元素不存在** ⇒ `nativeElement` 恒为 `null`
 *    （`SkeletonRef` 的注释里登记了这一条）。
 *
 * ── 语义化合并（合并顺序是契约）──────────────────────────────────────────────
 *
 * ```
 * classNames: [contextClassNames, classNames]                    —— 拼接
 * styles:     [contextStyles, {root: contextStyle}, styles, {root: style}]  —— 后者胜
 * ```
 *
 * 注意 `styles` 的来源列表与 Spin / Divider **不同**：antd 的 Skeleton 把
 * `contextStyle` 与 `style` 都包成 `{root: …}` 放进列表（`useSemanticRootStyle`），
 * 而不是在最后手工 `...props.style`。两种写法在「只影响 root」这一点上等价，
 * 这里逐字照抄上游的形态。
 *
 * ── 与 antd 的平台差异 ────────────────────────────────────────────────────────
 *
 *   - 无 CSS-in-JS 的 hashId / cssVarCls（D5）。
 *   - `children` 是默认插槽而不是 prop（规则 C19）⇒ 语义化函数式拿到的
 *     `info.props` 里**没有** `children`（上游有）。
 *   - `direction` 走 `useDirection()`（D27：`inject` 的返回值是快照，
 *     直接解构 `useComponentConfig()` 的 `direction` 不会跟着 Provider 变）。
 */

import { isPlainObject } from '@apollo-design/utils';
import { type CSSProperties, computed, ref, useAttrs, type VNodeChild, watchEffect } from 'vue';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import Element from './Element.vue';
import type {
  SkeletonConfig,
  SkeletonElementProps,
  SkeletonParagraphProps,
  SkeletonProps,
  SkeletonSemanticClassNames,
  SkeletonSemanticStyles,
  SkeletonTitleProps,
} from './interface';
import Paragraph from './Paragraph.vue';
import Title from './Title.vue';

defineOptions({ name: 'ASkeleton', inheritAttrs: false });

/**
 * ⚠️ `avatar` / `title` / `paragraph` 的默认值**必须**在这里给（PITFALLS 46 的同族问题）：
 * 它们的运行时类型是 `[Object, Boolean]`，Vue 对「Boolean 型 prop 未传且无 default」
 * 会赋成 `false`。`title` / `paragraph` 的默认值恰好就是 `true`，所以必须有 default，
 * 否则 `<Skeleton />` 会退化成「只有空根 div」。
 */
const props = withDefaults(defineProps<SkeletonProps>(), {
  active: undefined,
  loading: undefined,
  prefixCls: undefined,
  avatar: false,
  title: true,
  paragraph: true,
  round: undefined,
  classNames: undefined,
  styles: undefined,
});

defineSlots<{ default?: () => VNodeChild }>();

const {
  getPrefixCls,
  className: contextClassName,
  style: contextStyle,
  classNames: contextClassNames,
  styles: contextStyles,
} = useComponentConfig<SkeletonConfig>('skeleton');

const attrs = useAttrs();
const direction = useDirection();

const prefixCls = computed(() => getPrefixCls('skeleton', props.prefixCls));

// ---------------------------------------------------------------------------
// 三个真值判据
// ---------------------------------------------------------------------------

const hasAvatar = computed(() => !!props.avatar);
const hasTitle = computed(() => !!props.title);
const hasParagraph = computed(() => !!props.paragraph);

/**
 * 是否渲染骨架。判据见文件头第 1 条。
 *
 * ⚠️ 用 `!== false` 而不是 `?? true`：后者会把 `loading=""`（空串）也当成骨架，
 *    而空串在 React 侧是 falsy ⇒ 渲染 children。`!== false` 与 `loading || …` 同义。
 */
const isSkeleton = computed(() => props.loading !== false);

// ---------------------------------------------------------------------------
// 默认几何（三张表，逐字来自 antd 的 getXxxBasicProps）
// ---------------------------------------------------------------------------

/**
 * 头像的默认几何。
 *
 * | `hasTitle` | `hasParagraph` | size | shape |
 * |---|---|---|---|
 * | 真 | 假 | `'large'` | `'square'` |
 * | 其余 | | `'large'` | `'circle'` |
 *
 * ⚠️ 是「`hasTitle && !hasParagraph`」而不是「没有 paragraph」——
 *    `avatar + paragraph:false + title:false` 得到的是 **circle**。
 */
function getAvatarBasicProps(
  title: boolean,
  paragraph: boolean,
): { size: 'large'; shape: 'square' | 'circle' } {
  if (title && !paragraph) return { size: 'large', shape: 'square' };
  return { size: 'large', shape: 'circle' };
}

/**
 * 标题的默认宽度。
 *
 * | `hasAvatar` | `hasParagraph` | width |
 * |---|---|---|
 * | 假 | 真 | `'38%'` |
 * | 真 | 真 | `'50%'` |
 * | 其余（含「无 paragraph」） | | 不设 |
 */
function getTitleBasicProps(avatar: boolean, paragraph: boolean): { width?: string } {
  if (!avatar && paragraph) return { width: '38%' };
  if (avatar && paragraph) return { width: '50%' };
  return {};
}

/**
 * 段落的默认几何。
 *
 * | 条件 | 结果 |
 * |---|---|
 * | `!hasAvatar \|\| !hasTitle` | `width = '61%'` |
 * | `!hasAvatar && hasTitle` | `rows = 3` |
 * | 其余 | `rows = 2` |
 *
 * ⚠️ `rows` **恒**被赋值（两条 `if/else` 覆盖了全部输入），
 *    所以「不传 `rows`」在 `Skeleton` 内部不会发生 —— 与 `Paragraph.vue`
 *    里那个「两个不同默认值」的陷阱无关。
 */
function getParagraphBasicProps(avatar: boolean, title: boolean): { width?: string; rows: number } {
  const basicProps: { width?: string; rows: number } = { rows: 2 };
  if (!avatar || !title) basicProps.width = '61%';
  if (!avatar && title) basicProps.rows = 3;
  return basicProps;
}

/**
 * 取「对象形态的自定义 props」。与 antd 的 `getComponentProps` 逐字对应：
 * **非对象（含 `true` / `false` / 数字 / 字符串）一律当空对象**。
 *
 * ⚠️ 返回类型声明成 `object`（而不是 `Record<string, unknown>`）是**故意的**：
 *    调用处要把它 spread 进一个对象字面量，而带字符串索引签名的类型会让
 *    那个字面量无法赋给 `SkeletonElementProps` 这类具体 props 类型
 *    （`unknown` 不兼容 `string | undefined`）。声明成 `object` 后 TS 不给
 *    它加任何已知键，字面量的类型就只剩显式写出的那几个 —— 与运行时一致
 *    （多出来的键在 `v-bind` 时进 `$attrs`，被子组件的 `inheritAttrs: false` 丢掉）。
 */
function getComponentProps(prop: unknown): object {
  return isPlainObject(prop) ? prop : {};
}

// ---------------------------------------------------------------------------
// 语义化
// ---------------------------------------------------------------------------

/**
 * 传给函数式 `classNames` / `styles` 的 `info.props`。
 *
 * antd 传的是 `{...props, avatar, title, paragraph}` —— 后三者是**解构带默认值**的
 * 结果，所以 `avatar` 恒为布尔（不是 `undefined`）。Vue 的 `props` 本身已经应用了
 * `withDefaults` 的默认值，所以 `{...props}` 与上游逐字等价。
 *
 * ⚠️ 与 antd 的一处**有意**差异：没有 `children`（规则 C19）。
 *
 * ⚠️ 这里是**普通对象**而不是 `reactive(...)`：`SkeletonProps` 里有 `classNames` /
 *    `styles` 的函数形态，`reactive()` 的深度代理类型推导实测触发 TS2589
 *    （与 Spin 同一条，见 `spin/Spin.vue` 的注释）。这里只需要「身份稳定、
 *    内容随 props 同步」的对象，响应式由 `useMergeSemantic` 内部的 `computed`
 *    通过 getter 提供。
 */
const semanticProps: SkeletonProps = { ...props };
watchEffect(() => {
  Object.assign(semanticProps, props);
});

const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
  SkeletonProps,
  SkeletonSemanticClassNames,
  SkeletonSemanticStyles
>(
  [() => contextClassNames, () => props.classNames],
  [() => contextStyles, () => semanticRootStyle(contextStyle), () => props.styles],
  semanticProps,
);

// ---------------------------------------------------------------------------
// 三个块的 props
//
// 每个都是「字面量按 antd 的展开顺序拼出来的对象」—— **顺序就是契约**：
//   className → prefixCls → 基础几何 → 用户对象 → style（恒为语义化样式，覆盖用户对象里的）
// ---------------------------------------------------------------------------

/** 头像的内层 `<span>`。注意这里是 `Element`，不是 `Skeleton.Avatar`（上游的注释如此）。 */
const avatarProps = computed<SkeletonElementProps>(() => ({
  className: mergedClassNames.value.avatar,
  prefixCls: `${prefixCls.value}-avatar`,
  ...getAvatarBasicProps(hasTitle.value, hasParagraph.value),
  ...getComponentProps(props.avatar),
  style: mergedStyles.value.avatar,
}));

const titleProps = computed<SkeletonTitleProps>(() => ({
  className: mergedClassNames.value.title,
  prefixCls: `${prefixCls.value}-title`,
  ...getTitleBasicProps(hasAvatar.value, hasParagraph.value),
  ...getComponentProps(props.title),
  style: mergedStyles.value.title,
}));

const paragraphProps = computed<SkeletonParagraphProps>(() => ({
  className: mergedClassNames.value.paragraph,
  prefixCls: `${prefixCls.value}-paragraph`,
  ...getParagraphBasicProps(hasAvatar.value, hasTitle.value),
  ...getComponentProps(props.paragraph),
  style: mergedStyles.value.paragraph,
}));

// ---------------------------------------------------------------------------
// 类名
// ---------------------------------------------------------------------------

const rootClass = computed(() => [
  prefixCls.value,
  {
    [`${prefixCls.value}-with-avatar`]: hasAvatar.value,
    [`${prefixCls.value}-active`]: props.active,
    [`${prefixCls.value}-rtl`]: direction.value === 'rtl',
    [`${prefixCls.value}-round`]: props.round,
  },
  mergedClassNames.value.root,
  contextClassName,
  // 调用方原生 `class`（位置与原先的 props.className/rootClassName 一致）
  attrs.class,
]);

/** 头像容器：`clsx(mergedClassNames.header, `${prefixCls}-header`)`。 */
const headerClass = computed(() => [mergedClassNames.value.header, `${prefixCls.value}-header`]);

/** 内容容器：`clsx(mergedClassNames.section, `${prefixCls}-section`)`。 */
const sectionClass = computed(() => [mergedClassNames.value.section, `${prefixCls.value}-section`]);

// ---------------------------------------------------------------------------
// 暴露
// ---------------------------------------------------------------------------

const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>

<template>
  <!--
    ⚠️ 两段根节点的 `v-if` / `v-else` 是**刻意的**：`loading === false` 时上游渲染
    `children ?? null`，根元素**根本不存在**（不加包裹 div 才与上游同构）。
    `inheritAttrs: false` 让「多余的属性被丢掉」这件事与 antd 一致。
  -->
  <div
    v-if="isSkeleton"
    ref="rootRef"
    :class="rootClass"
    v-bind="styleAttrs({ ...mergedStyles.root, ...((attrs.style as CSSProperties) ?? {}) })"
  >
    <div v-if="hasAvatar" :class="headerClass" v-bind="styleAttrs(mergedStyles.header)">
      <Element v-bind="avatarProps" />
    </div>
    <div
      v-if="hasTitle || hasParagraph"
      :class="sectionClass"
      v-bind="styleAttrs(mergedStyles.section)"
    >
      <Title v-if="hasTitle" v-bind="titleProps" />
      <Paragraph v-if="hasParagraph" v-bind="paragraphProps" />
    </div>
  </div>
  <slot v-else />
</template>
