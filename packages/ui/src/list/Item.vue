<script setup lang="ts">
/**
 * `List.Item` —— 列表项。对应 antd 6.6.4 的 `es/list/Item.tsx`（180 行）。
 *
 * ── 七条必须复刻的判据 ───────────────────────────────────────────────────────
 *
 * 1. 🚨 **`-item-no-flex` 的判据是「两个条件同时成立」**：
 *    `toArray(children).some(isString) && childNodes.length > 1`
 *    （有**字符串**子节点 **且** 子节点数 > 1）。
 *    `isFlexMode()` = `itemLayout === 'vertical' ? !!extra : !isItemContainsTextNodeAndNotSingular()`。
 * 2. 🚨 **根标签随 `grid` 变**：`Element = grid ? 'div' : 'li'`；grid 时外面再包
 *    `<Col flex={1} style={colStyle}>`，`ref` 落在 **`Col`** 上；非 grid 时 `ref` 落在 `li` 上。
 * 3. 🚨 **内容分支**：`itemLayout === 'vertical' && extra` ⇒ **两个 div**
 *    （`-item-main` 包 children + actions，`-item-extra` 包 extra）；
 *    **否则** `[children, actions, extra]` **三者平级**（extra 不包 div）。
 * 4. **`actions`**：`actions && actions.length > 0` ⇒ `<ul class="-item-action">`，
 *    每项一个 `<li key="-item-action-{i}">`，**除最后一项外**追加 `<em class="-item-action-split">`。
 * 5. **语义化槽只在 `Item` 上**（`actions` / `extra`）：ConfigProvider 的
 *    `list.item.classNames` / `.styles` 是**底座**，用户 prop 覆盖
 *    （classNames 用 `clsx` 拼接、styles 用浅合并 —— 两者语义不同）。
 * 6. **`{...others}` 落在 `Element` 上**（`div` 或 `li`），与 `className` 分开合并。
 * 7. **`prefixCls` 取 `getPrefixCls('list', customizePrefixCls)`**。
 *
 * ── 🚨 三条平台差异（PLATFORM）────────────────────────────────────────────────
 *
 * - **插槽按渲染缓存**（`getChildNodes()` + `onBeforeUpdate` 重置）：children 同时供
 *   「`-item-no-flex` 判定」与「内容渲染」两处消费，而 Vue 的插槽函数**不允许**在
 *   render 之外调用。上游是 React 函数组件，天然按渲染求值（card 同一判据）。
 * - **内容一律经 `NodeRenderer`**：`.vue` 模板没有「渲染一个 VNodeChild 变量」的语法；
 *   且它做 `cloneVNode`，避免同一个 VNode 被渲染两次时踩 Vue 的 VNode 可变坑。
 * - **`ref` 归一化**：grid 模式下 `ref` 指向 `Col` 组件实例 ⇒ 取 `$el`；
 *    非 grid 时就是 `li` 本身。两者统一成 `{ nativeElement }`（可空）。
 */

import { isTextVNode, toArray } from '@apollo-design/utils';
import { computed, h, onBeforeUpdate, ref, useAttrs, useSlots, type VNode } from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { useComponentConfig } from '../config-provider/context';
import { Col } from '../grid';
import { useListContext } from './context';
import type {
  ListConfig,
  ListItemProps,
  ListItemSemanticClassNames,
  ListItemSemanticStyles,
} from './interface';

defineOptions({ name: 'AListItem', inheritAttrs: false });

const props = defineProps<ListItemProps>();
const attrs = useAttrs();
const slots = useSlots();

const listContext = useListContext();
const config = useComponentConfig<ListConfig>('list');

const prefixCls = computed(() => config.getPrefixCls('list', props.prefixCls));
const cls = computed(() => `${prefixCls.value}-item`);

/** 注入的 `grid` / `itemLayout`。⚠️ 读的是 `ComputedRef.value`（见 `context.ts` 的平台差异）。 */
const grid = computed(() => listContext.value.grid);
const itemLayout = computed(() => listContext.value.itemLayout);

/** `clsx` 的等价物：过滤假值后空格连接。 */
const clsx = (...values: unknown[]): string =>
  values.filter((value) => typeof value === 'string' && value !== '').join(' ');

/**
 * 语义化槽的类名：ConfigProvider 的 `list.item.classNames` 作为底座，用户 prop 覆盖。
 * ⚠️ 是**拼接**不是覆盖（上游 `clsx(base, own)`）。
 */
const moduleClass = (moduleName: keyof ListItemSemanticClassNames): string =>
  clsx(config.item?.classNames?.[moduleName], props.classNames?.[moduleName]);

/** 语义化槽的样式：**浅合并、后者胜**（与 classNames 的语义不同）。 */
const moduleStyle = (moduleName: keyof ListItemSemanticStyles) => ({
  ...config.item?.styles?.[moduleName],
  ...props.styles?.[moduleName],
});

// ---------------------------------------------------------------------------
// children 的按渲染缓存（⚠️ 见文件头「平台差异」）
// ---------------------------------------------------------------------------

/** 插槽结果「尚未求值」的哨兵（`undefined` 是合法结果，不能当哨兵）。 */
const UNSET = Symbol('unset');

let slotResult: unknown = UNSET;
let childNodesCache: VNode[] | null = null;

onBeforeUpdate(() => {
  slotResult = UNSET;
  childNodesCache = null;
});

/** 一次渲染内**只调用一次**插槽函数（结果供两处消费）。 */
function getSlotResult(): unknown {
  if (slotResult === UNSET) {
    slotResult = slots.default ? slots.default() : undefined;
  }
  return slotResult;
}

/** ⚠️ 只能在渲染期调用（模板里的 `contentNodes()` 满足）。 */
function getChildNodes(): VNode[] {
  if (childNodesCache === null) {
    childNodesCache = getSlotResult() === undefined ? [] : toArray(getSlotResult() as never);
  }
  return childNodesCache;
}

/**
 * 判据 1 的前半：有**文本**子节点 **且** 子节点数 > 1。
 *
 * 🚨 **平台差异（PLATFORM）**：上游判的是 `isString(childNodes[i])` —— React 的
 * children 里字符串保持**原始值**。Vue 侧**做不到**这一点：
 *   - 模板 `<ListItem>a b</ListItem>` 编译成 `createTextVNode('a')`；
 *   - 手写 render function 传原始值，`h()` / `toArray` 也会**归一成 Text vnode**
 *     （`String(child)`，见 `packages/utils/src/children/to-array.ts` 文件头）。
 * ⇒ 本仓用 **`isTextVNode`** 判「是不是文本节点」——这正是上游 `isString` 的**意图**。
 * ⚠️ 唯一可观测的分歧：**数字**子节点。`{{ 0 }}` 在模板里被 `toDisplayString` 变成
 *    `'0'`（上游 `isString(0)` 判假），手写 render function 传 `0` 也被归一成 Text vnode
 *    ⇒ 本仓判**真**。已登记在 `README.md` §2。
 */
function isItemContainsTextNodeAndNotSingular(): boolean {
  const childNodes = getChildNodes();
  const hasTextNode = childNodes.some(isTextVNode);
  return hasTextNode && childNodes.length > 1;
}

/** 判据 1：`vertical` 时看 `extra` 的真值，否则看上面那条。 */
function isFlexMode(): boolean {
  if (itemLayout.value === 'vertical') {
    return !!props.extra;
  }
  return !isItemContainsTextNodeAndNotSingular();
}

// ---------------------------------------------------------------------------
// 渲染
// ---------------------------------------------------------------------------

/** `actions` 的 `<ul>`（判据 4）。⚠️ 空数组**不渲染**。 */
function actionsContent(): VNode | null {
  const actions = props.actions;
  if (!actions || actions.length === 0) {
    return null;
  }
  const actionCls = `${prefixCls.value}-item-action`;
  return h(
    'ul',
    {
      class: [actionCls, moduleClass('actions')],
      key: 'actions',
      style: moduleStyle('actions'),
    },
    actions.map((action, index) =>
      h('li', { key: `${actionCls}-${index}` }, [
        // ⚠️ 经 NodeRenderer 克隆 —— 同一个 action vnode 可能在多帧里被复用
        h(NodeRenderer, { node: action }),
        index !== actions.length - 1 ? h('em', { class: `${actionCls}-split` }) : null,
      ]),
    ),
  );
}

/** 内容节点（判据 3）。 */
function contentNodes() {
  const children = getChildNodes();
  const actions = actionsContent();
  const extraCls = `${cls.value}-extra`;

  if (itemLayout.value === 'vertical' && props.extra) {
    return [
      h('div', { class: `${cls.value}-main`, key: 'content' }, [...children, actions]),
      h(
        'div',
        { class: [extraCls, moduleClass('extra')], key: 'extra', style: moduleStyle('extra') },
        [h(NodeRenderer, { node: props.extra })],
      ),
    ];
  }

  return [...children, actions, h(NodeRenderer, { node: props.extra, key: 'extra' })];
}

/** 根类名（判据 1 / 6）。 */
const itemClass = computed(() => [
  cls.value,
  { [`${cls.value}-no-flex`]: !isFlexMode() },
  // 调用方原生 class（位置与原先的 props.className 一致）
  attrs.class,
]);

const itemAttrs = computed(() => {
  // ⚠️ `class` 已被 itemClass 显式消费；留在 itemAttrs 里会被 `v-bind` 二次合并（重复）。
  const { class: _attrsClass, ...restAttrs } = attrs;
  void _attrsClass;
  return { ...restAttrs };
});

// ---------------------------------------------------------------------------
// ref（判据 2：grid 落 Col、非 grid 落 li）
// ---------------------------------------------------------------------------

const rootEl = ref<HTMLElement | null>(null);

/** 归一化：`Col` 是组件实例（取 `$el`），`li` 本身就是元素。 */
const setRootEl = (el: unknown) => {
  const maybeComponent = el as { $el?: unknown } | null;
  rootEl.value = ((maybeComponent?.$el ?? el) as HTMLElement | null) ?? null;
};

defineExpose({ nativeElement: rootEl });
</script>

<template>
  <Col v-if="grid" :flex="1" :style="props.colStyle" :ref="setRootEl">
    <div :class="itemClass" v-bind="itemAttrs">
      <NodeRenderer :node="contentNodes()" />
    </div>
  </Col>
  <li v-else :ref="setRootEl" :class="itemClass" v-bind="itemAttrs">
    <NodeRenderer :node="contentNodes()" />
  </li>
</template>
