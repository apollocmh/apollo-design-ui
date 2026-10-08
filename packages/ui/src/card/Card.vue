<script setup lang="ts">
/**
 * Card —— 通用卡片容器。对应 antd 6.6.4 的 `es/card/`（1018 行源码 / 676 行产物 / 10 文件）。
 *
 * 契约全文见 `docs/analysis/card.md`（G1 产物）；下面只留**实现期最容易写错的判据**。
 *
 * ── 渲染骨架（上游 `Card.tsx:305-312`）────────────────────────────────────────
 *
 * ```html
 * <div class="{p} …" style={mergedStyles.root} {...divProps}>
 *   {head}        <!-- 仅当 title | extra | tabs 三者任一可渲染 -->
 *   {coverDom}    <!-- 仅当 cover 可渲染 -->
 *   {body}        <!-- 仅当 loading 或 children.length -->
 *   {actionDom}   <!-- 仅当 actions.length -->
 * </div>
 * ```
 *
 * ── 十二条必须复刻的判据 ─────────────────────────────────────────────────────
 *
 * 1. **head 的判据是三者任一**：`isRenderable(title) || isRenderable(extra) || tabList`。
 *    ⚠️ `tabList` 用的是**真值**（`tabList ? <Tabs/> : null`）—— 空数组 `[]` 也是真值
 *    ⇒ 仍然渲染 head 与 Tabs（与 `-contain-tabs` 类名用的 `tabList?.length` **不同**）。
 * 2. **`tabs` 在 `head-wrapper` 之外、`head` 之内**（不是并列的兄弟）。
 * 3. **`-bordered` 的判据是「`variant !== 'borderless'`」**，不是「`variant === 'outlined'`」。
 * 4. **`-contain-grid` 靠 vnode 身份比较**（`child.type === CardGrid`），不是类名/属性探测。
 * 5. **`headStyle` / `bodyStyle`（deprecated）是「底座」**：`{...headStyle, ...mergedStyles.header}`
 *    ⇒ 语义化槽**覆盖**它们。
 * 6. **`actions` 每项的 `li` 宽度是内联百分比**（`100 / actions.length`）⇒ 必须转成字符串。
 * 7. **`loading` 的内容是 `<Skeleton loading active paragraph={{rows:4}} title={false}>`**。
 *    ⚠️ 上游把 `children` 也传给了这个 Skeleton，但 Skeleton 的 `loading` 被**写死为 `true`**
 *    ⇒ `children` **永远不会被渲染**（`Skeleton.tsx:177` 的 `loading || …` 分支）。
 *    本仓**不传**（DOM 完全相同，且省掉一次插槽调用）。登记在 README §2。
 * 8. **`tabSize = mergedSize !== 'small' ? 'large' : mergedSize`**（非 small 一律 `'large'`）。
 * 9. **`tabList` 的归一化是 `{ label: tab, ...item }`** ⇒ item 里若还有 `label`，**它赢**。
 * 10. **受控/非受控二选一**：`activeTabKey !== undefined` 时传 `activeKey`，否则传
 *     `defaultActiveTabKey`（**不会同时传**）。
 * 11. **`onTabChange` 是 prop**（上游没有 value/onChange 对 ⇒ 规则 C11 的双发不适用）。
 * 12. **根类名的定序**：`prefixCls` → `contextClassName` → 条件类 → `className` →
 *     `rootClassName` → `-css-var`（本仓无 `hashId`，D2）→ `mergedClassNames.root`。
 *
 * ── 🚨 三条平台差异（PLATFORM）──────────────────────────────────────────────
 *
 * - **插槽只在渲染期调用一次**：`childNodes` 同时供「`-contain-grid` 判定」与「body 内容」
 *   使用。Vue 的插槽函数不允许在 render 之外调用（会打 `Slot "default" invoked outside
 *   of the render function`，且会淹没真正的告警）⇒ 用 `getChildNodes()` 做**按渲染缓存**
 *   （`onBeforeUpdate` 重置）。上游是 React 函数组件，`useMemo` 天然按渲染求值。
 * - **`deprecated` 的「传了才告警」判据**：上游是 `deprecatedName in props`（传 `undefined`
 *   也算「传了」）。Vue 没有「键存在」这个概念 ⇒ 本仓用 `!== undefined`。
 *   唯一差异：`<Card :bordered="undefined">` 本仓不告警。登记在 README §2。
 * - **`NodeRenderer`**：`.vue` 模板没有「渲染一个 VNode 变量」的语法（见
 *   `empty/components/NodeRenderer.ts` 的实测结论）⇒ `title` / `extra` / `cover` /
 *   `actions` / children 都走它。
 */

import { isRenderable, toArray, useDevWarning } from '@apollo-design/utils';
import {
  computed,
  mergeProps,
  onBeforeUpdate,
  ref,
  useAttrs,
  useSlots,
  type VNode,
  type VNodeChild,
  watchEffect,
} from 'vue';
// ⚠️ `NodeRenderer` 是**平台原语**（`.vue` 模板没有「渲染一个 VNode 变量」的语法），
// 目前住在 `empty/components/`。`button` / `result` 也这样 import —— 详见 README §5 的
// 「应上移到 `_internal/`」债务登记。
import { NodeRenderer } from '../_internal/node-renderer';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import { useVariant } from '../form/hooks/useVariants';
import Skeleton from '../skeleton/Skeleton.vue';
import type { TabsItem, TabsProps } from '../tabs/interface';
// biome-ignore lint/style/useImportType: `Tabs` 在**模板**里以 `<Tabs>` 使用，而 biome 看不到模板 —— 本组件里它只出现在类型位置（`typeof Tabs`），会被误判为 type-only 并改写成 `import type`，那会让模板解析不到组件（静默渲染成原生 `<tabs>` 标签，且只有 dev 一条 warn）。
import Tabs from '../tabs/Tabs.vue';
import CardGrid from './CardGrid.vue';
import type {
  CardConfig,
  CardProps,
  CardSemanticClassNames,
  CardSemanticStyles,
} from './interface';

defineOptions({ name: 'ACard', inheritAttrs: false });

/**
 * ⚠️ 布尔 prop 全部显式给 `undefined` 默认值（PITFALLS 46 / D21）：Vue 会把未传的
 * Boolean prop 赋成 `false`，而 `loading` / `hoverable` / `bordered` 的「未传」与
 * 「显式 false」在上游是**同义**的（都是 falsy）—— 这里显式声明只是为了让
 * `deprecated` 的「传了才告警」判据（`!== undefined`）成立。
 */
const props = withDefaults(defineProps<CardProps>(), {
  prefixCls: undefined,
  title: undefined,
  extra: undefined,
  bordered: undefined,
  headStyle: undefined,
  bodyStyle: undefined,
  loading: undefined,
  hoverable: undefined,
  id: undefined,
  size: undefined,
  type: undefined,
  cover: undefined,
  actions: undefined,
  tabList: undefined,
  tabBarExtraContent: undefined,
  onTabChange: undefined,
  activeTabKey: undefined,
  defaultActiveTabKey: undefined,
  tabProps: undefined,
  classNames: undefined,
  styles: undefined,
  variant: undefined,
});

const attrs = useAttrs();
const slots = useSlots();

/** 默认插槽 = 上游的 `children`（规则 C19）。 */
defineSlots<{
  default?: () => VNodeChild;
  title?: () => VNodeChild;
  extra?: () => VNodeChild;
  cover?: () => VNodeChild;
}>();

const {
  getPrefixCls,
  className: contextClassName,
  style: contextStyle,
  classNames: contextClassNames,
  styles: contextStyles,
} = useComponentConfig<CardConfig>('card');

/**
 * ⚠️ **必须** `useDirection()`（D27）：`useComponentConfig()` 的 `direction` 是
 * `inject` 的快照，直接解构不会跟着 Provider 变。
 */
const direction = useDirection();

const prefixCls = computed(() => getPrefixCls('card', props.prefixCls));

// ---------------------------------------------------------------------------
// variant / size
// ---------------------------------------------------------------------------

/**
 * 形态解析链（上游 `useVariant('card', customVariant, bordered)`）。
 *
 * ⚠️ 本仓的 `useVariant` 是**对象形态**（签名改写，见分析 §0）：
 * `useVariant({ component, variant, legacyBordered })`。
 */
const { variant } = useVariant({
  component: 'card',
  variant: () => props.variant,
  legacyBordered: () => props.bordered,
});

/**
 * 尺寸（上游 `useSize(customizeSize)`）。
 *
 * ⚠️ 必须用**函数形态**：`useSize(props.size)` 只在 setup 期读一次 `props.size`，
 * 受控切换 size 会静默失效（PITFALLS 163，radio / switch 各踩一次）。
 */
const mergedSize = useSize((ctxSize) => props.size ?? ctxSize);

// ---------------------------------------------------------------------------
// 告警（上游 :149-152、:175-184）
// ---------------------------------------------------------------------------

const devWarning = useDevWarning('Card');

/**
 * ⚠️ 用 `watchEffect` 而不是「setup 里直接调一次」：上游是函数组件，告警在**每次渲染**
 * 都跑（props 变化时也会再跑一遍）。`devWarning` 自身的去重表让重复输出不会发生。
 */
watchEffect(() => {
  devWarning.deprecated(props.size !== 'default', 'size="default"', 'size="medium"');
  devWarning.deprecated(props.headStyle === undefined, 'headStyle', 'styles.header');
  devWarning.deprecated(props.bodyStyle === undefined, 'bodyStyle', 'styles.body');
  devWarning.deprecated(props.bordered === undefined, 'bordered', 'variant');
});

// ---------------------------------------------------------------------------
// 语义化
// ---------------------------------------------------------------------------

/**
 * 传给函数式 `classNames` / `styles` 的 `info.props`。
 *
 * 上游是 `{...props, size: mergedSize, variant}` —— 后两者是**解析后**的值，
 * 所以这里用 `watchEffect` 同步（与 `Skeleton` / `Breadcrumb` 同法：身份稳定、
 * 内容随 props 同步的普通对象；`reactive()` 的深度代理会触发 TS2589）。
 */
const semanticProps = { ...props } as CardProps;
watchEffect(() => {
  Object.assign(semanticProps, props, {
    size: mergedSize.value as CardProps['size'],
    variant: variant.value as CardProps['variant'],
  });
});

const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
  CardProps,
  CardSemanticClassNames,
  CardSemanticStyles
>(
  [() => contextClassNames, () => props.classNames],
  [() => contextStyles, () => semanticRootStyle(contextStyle), () => props.styles],
  semanticProps,
);

// ---------------------------------------------------------------------------
// 子节点（按渲染缓存）
// ---------------------------------------------------------------------------

/**
 * 一次渲染只调一次插槽函数。
 *
 * ⚠️ `onBeforeUpdate` 是**必需**的：`childNodes` 同时供「`-contain-grid` 判定」与
 * 「body 内容」两处消费，若缓存跨渲染保留，父组件换掉 children 后本组件会渲染**旧**节点。
 * 上游的 `useMemo([children])` 天然按 `children` 身份失效。
 */
let childNodesCache: VNode[] | null = null;
onBeforeUpdate(() => {
  childNodesCache = null;
});

function getChildNodes(): VNode[] {
  if (childNodesCache === null) {
    childNodesCache = slots.default ? toArray(slots.default()) : [];
  }
  return childNodesCache;
}

/**
 * `-contain-grid`：上游 `childNodes.some(child => child.type === CardGrid)`。
 * Vue 的对应物是 **vnode.type 与组件对象同一性比较**（与 `Breadcrumb` 的
 * children 校验同一手法）。
 */
function containsGrid(): boolean {
  return getChildNodes().some((child) => child.type === CardGrid);
}

/** body 的存在判据：`loading || childNodes.length`。 */
function hasBody(): boolean {
  return !!props.loading || getChildNodes().length > 0;
}

// ---------------------------------------------------------------------------
// head / tabs
// ---------------------------------------------------------------------------

/** ⚠️ 真值判据（空数组也是真值）—— 与 `-contain-tabs` 的 `?.length` **不同**。 */
const hasTabs = computed(() => props.tabList != null);

/**
 * `tabSize = mergedSize !== 'small' ? 'large' : mergedSize`。
 *
 * ⚠️ 上游的类型面是 `SizeType`；本仓 `TabsProps['size']` 收窄为
 * `'small' | 'default' | 'large'`（tabs 的实现只认 `-large` / `-small` 两个类名）
 * ⇒ 需要一次断言放 `'medium' | 'middle'` 过去。运行时行为与上游一致
 * （`'medium'` 不落任何尺寸类名）。登记在 README §5。
 */
const tabSize = computed<TabsProps['size']>(
  () => (mergedSize.value !== 'small' ? 'large' : mergedSize.value) as TabsProps['size'],
);

/** `{ label: tab, ...item }` —— item 里若还有 `label`，它赢（上游逐字如此）。 */
const tabsItems = computed<TabsItem[]>(() =>
  (props.tabList ?? []).map(({ tab, ...item }) => ({ label: tab, ...item })),
);

/**
 * `Tabs` 的**运行时** props 类型（= 模板里 `v-bind` 的校验目标，与 `$props` 同源）。
 *
 * ✅ **2026-10-03：已统一（本 cast 已删除）**。
 *
 * 此前它与公开类型 `TabsProps` 在**回调 prop 的参数类型**上系统性地不一致 ——
 * `Tabs.vue` 一律声明成 `(_key: string, _event: unknown) => any`、
 * `renderTabBar` 的参数是 `Record<string, unknown>`、`locale` 是 `Record<string, unknown>`；
 * 而 `TabsProps` 那边是 `(key: string, event: TabsEditEvent) => void` /
 * `(props: TabsRenderTabBarProps) => VNodeChild` / `TabsLocale`。
 * 函数参数**逆变** ⇒ 两组函数类型**双向都不可赋值**（不是「谁更宽」的问题）
 * ⇒ 整体透传 `tabProps` 必须过一次 `unknown`。
 *
 * 现在 `Tabs.vue` 的运行时声明一律改用**公开类型**（`TabsProps['renderTabBar']` /
 * `['locale']` / `['more']` / `['classNames'|'styles']`，三个事件的载荷也用
 * `TabsEditEvent` / `TabsEditAction` / 方向联合）⇒ 这里可以直接 `satisfies`，
 * **不再需要 cast**（`lint:types` 0 错就是证据）。
 */
type TabsRuntimeProps = InstanceType<typeof Tabs>['$props'];

/**
 * 传给内部 `Tabs` 的 props。
 *
 * 展开顺序即契约（上游 `extraProps = {...tabProps, [受控键], tabBarExtraContent}`）：
 * `tabProps` 在前 ⇒ 受控键与 `tabBarExtraContent` **覆盖** `tabProps` 里的同名键。
 */
const tabsBind = computed(
  () =>
    ({
      ...props.tabProps,
      ...(props.activeTabKey !== undefined
        ? { activeKey: props.activeTabKey }
        : { defaultActiveKey: props.defaultActiveTabKey }),
      tabBarExtraContent: props.tabBarExtraContent,
    }) satisfies TabsRuntimeProps,
);

/** 上游 `onTabChange` 只做一件事：把 key 交给 `props.onTabChange`。 */
function handleTabChange(key: string): void {
  props.onTabChange?.(key);
}

/** head 判据：`isRenderable(title) || isRenderable(extra) || tabs`。 */
const hasHead = computed(
  () =>
    isRenderable(props.title) ||
    isRenderable(props.extra) ||
    !!slots.title ||
    !!slots.extra ||
    hasTabs.value,
);

// ---------------------------------------------------------------------------
// 类名 / 样式
// ---------------------------------------------------------------------------

const headClass = computed(() => [`${prefixCls.value}-head`, mergedClassNames.value.header]);
const titleClass = computed(() => [`${prefixCls.value}-head-title`, mergedClassNames.value.title]);
const extraClass = computed(() => [`${prefixCls.value}-extra`, mergedClassNames.value.extra]);
const coverClass = computed(() => [`${prefixCls.value}-cover`, mergedClassNames.value.cover]);
const bodyClass = computed(() => [`${prefixCls.value}-body`, mergedClassNames.value.body]);
const actionsClass = computed(() => [`${prefixCls.value}-actions`, mergedClassNames.value.actions]);

/** `{...headStyle, ...mergedStyles.header}` —— 语义化槽覆盖 deprecated 的 `headStyle`。 */
const mergedHeadStyle = computed(() => ({
  ...props.headStyle,
  ...mergedStyles.value.header,
}));

/** `{...bodyStyle, ...mergedStyles.body}` —— 同上。 */
const mergedBodyStyle = computed(() => ({
  ...props.bodyStyle,
  ...mergedStyles.value.body,
}));

const actionsList = computed(() => props.actions ?? []);

/** `100 / n`（上游写的就是百分比字符串，不能留成裸数字 —— Vue 不补单位）。 */
const actionWidth = computed(() => `${100 / actionsList.value.length}%`);

/**
 * 根类名。顺序逐字来自上游 `clsx(...)`：
 * `prefixCls` → `contextClassName` → 条件类 → `className` → `rootClassName` →
 * `-css-var`（本仓无 `hashId`，D2）→ `mergedClassNames.root`。
 *
 * ⚠️ 是**普通函数**而不是 `computed`：`-contain-grid` 依赖 `getChildNodes()`，
 * 而插槽结果不是可追踪的响应式依赖 ⇒ `computed` 会永久缓存住首次结果。
 */
function rootClass(): unknown[] {
  const cls = prefixCls.value;
  return [
    cls,
    contextClassName,
    {
      [`${cls}-loading`]: props.loading,
      [`${cls}-bordered`]: variant.value !== 'borderless',
      [`${cls}-hoverable`]: props.hoverable,
      [`${cls}-contain-grid`]: containsGrid(),
      [`${cls}-contain-tabs`]: !!props.tabList?.length,
      [`${cls}-small`]: mergedSize.value === 'small',
      [`${cls}-type-${props.type}`]: !!props.type,
      [`${cls}-rtl`]: direction.value === 'rtl',
    },
    `${cls}-css-var`,
    mergedClassNames.value.root,
  ];
}

/**
 * 根属性：语义化 `styles.root` + `{...divProps}`。
 *
 * ⚠️ 根 `class` / `style` 是 Vue 原生 attrs：`attrs` 排在语义根样式**之后**
 *    ⇒ 调用方同名样式优先（与原先 `props.style` 参与合并的优先级一致）。
 */
const rootAttrs = computed(() => mergeProps(styleAttrs(mergedStyles.value.root), attrs));

const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>

<template>
  <div ref="rootRef" :id="props.id" :class="rootClass()" v-bind="rootAttrs">
    <!-- head：title / extra 在 head-wrapper 里，tabs 在它外面、head 里面 -->
    <div v-if="hasHead" :class="headClass" v-bind="styleAttrs(mergedHeadStyle)">
      <div :class="`${prefixCls}-head-wrapper`">
        <div
          v-if="isRenderable(props.title) || slots.title"
          :class="titleClass"
          v-bind="styleAttrs(mergedStyles.title)"
        >
          <slot name="title"><NodeRenderer :node="props.title" /></slot>
        </div>
        <div
          v-if="isRenderable(props.extra) || slots.extra"
          :class="extraClass"
          v-bind="styleAttrs(mergedStyles.extra)"
        >
          <slot name="extra"><NodeRenderer :node="props.extra" /></slot>
        </div>
      </div>
      <Tabs
        v-if="hasTabs"
        :size="tabSize"
        v-bind="tabsBind"
        :class="`${prefixCls}-head-tabs`"
        :items="tabsItems"
        @change="handleTabChange"
      />
    </div>

    <!-- cover -->
    <div
      v-if="isRenderable(props.cover) || slots.cover"
      :class="coverClass"
      v-bind="styleAttrs(mergedStyles.cover)"
    >
      <slot name="cover"><NodeRenderer :node="props.cover" /></slot>
    </div>

    <!-- body：loading 走 Skeleton（`children` 不传 —— 上游那个 Skeleton 的 loading 写死为 true） -->
    <div v-if="hasBody()" :class="bodyClass" v-bind="styleAttrs(mergedBodyStyle)">
      <Skeleton v-if="props.loading" loading active :paragraph="{ rows: 4 }" :title="false" />
      <NodeRenderer v-else :node="getChildNodes()" />
    </div>

    <!-- actions：每项宽度是内联百分比 -->
    <ul v-if="actionsList.length" :class="actionsClass" v-bind="styleAttrs(mergedStyles.actions)">
      <li
        v-for="(action, index) in actionsList"
        :key="`action-${index}`"
        :style="{ width: actionWidth }"
      >
        <span><NodeRenderer :node="action" /></span>
      </li>
    </ul>
  </div>
</template>
