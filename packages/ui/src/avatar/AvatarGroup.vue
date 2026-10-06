<script setup lang="ts">
/**
 * Avatar.Group —— 头像组合。对应 antd 6.6.4 的 `es/avatar/AvatarGroup.tsx`（137 行）。
 *
 * ── 七条必须复刻的判据 ───────────────────────────────────────────────────────
 *
 * 1. **`-rtl` 落在 group 根上**（`Avatar` 自己**不带** `-rtl`）。
 * 2. **children 逐个 `cloneElement(child, { key: 'avatar-key-<i>' })`** —— **只补 key**，
 *    不注入任何 prop（尺寸/形状走 **context**）。
 * 3. **`mergeCount = max?.count || maxCount`**（⚠️ `||` 不是 `??` ⇒ `count: 0` 会被 `maxCount` 顶掉）。
 * 4. **`mergeCount && mergeCount < numOfChildren`** 才截断 ⇒ `mergeCount === 0` **不截断**（全量渲染）。
 * 5. **溢出项是「前 mergeCount 个 + 一个 Popover 包着的 `+N` Avatar」**；被隐藏的那些
 *    进 Popover 的 `content`。
 * 6. **`popoverProps` 的展开顺序**：`{ content: childrenHidden, ...max?.popover, placement, trigger, rootClassName }`
 *    ⇒ `max.popover` 里的 `content` **覆盖** `childrenHidden`，而 `placement` / `trigger` /
 *    `rootClassName` 又**覆盖** `max.popover` 里的同名键。
 * 7. **context 的合并是 `props.size || size`**（⚠️ `||` 不是 `??` ⇒ `size={0}` 会被下级的顶掉），
 *    且要**接着外层 context 合并**（嵌套 Group 会累加）。
 *
 * ── 🚨 三条平台差异（PLATFORM）────────────────────────────────────────────────
 *
 * - **`AvatarContextProvider` 是「不产 DOM 的包装组件」** ⇒ 本仓直接 `provide`（不需要包装组件，
 *   因为 `provide` 不产节点）。
 * - **children 在渲染期取一次**（`getChildren()` 惰性缓存 + `onBeforeUpdate` 重置）：
 *    `Avatar.Group` 的 children 同时供「截断计数」与「渲染」两处消费，而 Vue 的插槽函数
 *    **不允许**在 render 之外调用（会打 `Slot "default" invoked outside of the render function`）。
 * - **`ref` 暴露 `{ nativeElement }`**（上游本来就是 `useImperativeHandle`）。
 */

import { toArray, useDevWarning } from '@apollo-design/utils';
import {
  cloneVNode,
  computed,
  h,
  inject,
  mergeProps,
  onBeforeUpdate,
  provide,
  reactive,
  ref,
  useAttrs,
  useSlots,
  watchEffect,
} from 'vue';
import { useComponentConfig, useDirection } from '../config-provider/context';
// ⚠️ 平台原语：`.vue` 模板没有「渲染一个 VNode 变量」的语法（见 empty/components/NodeRenderer.ts）
import { NodeRenderer } from '../empty/components/NodeRenderer';
import { Popover } from '../popover';
import Avatar from './Avatar.vue';
import { type AvatarContextValue, avatarContextKey } from './context';
import type { AvatarGroupProps } from './interface';

defineOptions({ name: 'AAvatarGroup', inheritAttrs: false });

const props = withDefaults(defineProps<AvatarGroupProps>(), {
  prefixCls: undefined,
  maxCount: undefined,
  maxStyle: undefined,
  maxPopoverPlacement: undefined,
  maxPopoverTrigger: undefined,
  max: undefined,
  size: undefined,
  shape: undefined,
});

/** 默认插槽 = 上游的 `children`（规则 C19）。 */
defineSlots<{ default?: () => unknown }>();

const attrs = useAttrs();
const slots = useSlots();

/** ⚠️ 上游 `React.useContext(ConfigContext)` 里还取了 `direction` —— 本仓必须用 `useDirection()`（D27）。 */
const { getPrefixCls } = useComponentConfig('avatar');
const direction = useDirection();

const prefixCls = computed(() => getPrefixCls('avatar', props.prefixCls));
const groupPrefixCls = computed(() => `${prefixCls.value}-group`);

// ---------------------------------------------------------------------------
// 告警（上游 `:84-94`）
// ---------------------------------------------------------------------------

const devWarning = useDevWarning('Avatar.Group');
/**
 * 四条 `deprecated` 告警。⚠️ 上游的判据是 `deprecatedName in props`，Vue 没有「键存在」
 * ⇒ 本仓用 `!== undefined`（与 card / breadcrumb 同一条 PLATFORM 差异）。
 */
watchEffect(() => {
  devWarning.deprecated(props.maxCount === undefined, 'maxCount', 'max={{ count: number }}');
  devWarning.deprecated(props.maxStyle === undefined, 'maxStyle', 'max={{ style: CSSProperties }}');
  devWarning.deprecated(
    props.maxPopoverPlacement === undefined,
    'maxPopoverPlacement',
    'max={{ popover: PopoverProps }}',
  );
  devWarning.deprecated(
    props.maxPopoverTrigger === undefined,
    'maxPopoverTrigger',
    'max={{ popover: PopoverProps }}',
  );
});

// ---------------------------------------------------------------------------
// context（上游 `AvatarContextProvider`）
// ---------------------------------------------------------------------------

const outerCtx = inject(avatarContextKey, undefined);

/**
 * ⚠️ 必须提供**身份稳定**的 `reactive` 对象（`inject` 是快照，见 `context.ts`）。
 * ⚠️ 合并用的是 **`||`**（不是 `??`）—— 与上游逐字一致。
 */
const contextValue = reactive<AvatarContextValue>({});
watchEffect(() => {
  Object.assign(contextValue, {
    size: props.size || outerCtx?.size,
    shape: props.shape || outerCtx?.shape,
  });
});
provide(avatarContextKey, contextValue);

// ---------------------------------------------------------------------------
// children（按渲染缓存）
// ---------------------------------------------------------------------------

let childCache: ReturnType<typeof toArray> | null = null;
onBeforeUpdate(() => {
  childCache = null;
});

/** 一次渲染只调一次插槽函数（理由见文件头）。 */
function getChildren(): ReturnType<typeof toArray> {
  if (childCache === null) {
    childCache = slots.default ? toArray(slots.default()) : [];
  }
  return childCache;
}

// ---------------------------------------------------------------------------
// 渲染（截断 + 溢出 Popover）
// ---------------------------------------------------------------------------

/**
 * group 的内容：全量 children，或「前 N 个 + `+N`」。
 *
 * ⚠️ 返回的是 **vnode / vnode 数组**（由 `NodeRenderer` 直接渲染，不产包裹元素）——
 *    因为上游的 `childrenShow` 是「一组元素 + 一个 Popover」的**异构**列表。
 */
function groupChildren() {
  const childrenWithProps = getChildren().map((child, index) =>
    cloneVNode(child, { key: `avatar-key-${index}` }),
  );

  const mergeCount = props.max?.count || props.maxCount;
  const numOfChildren = childrenWithProps.length;

  if (mergeCount && mergeCount < numOfChildren) {
    const childrenShow = childrenWithProps.slice(0, mergeCount);
    const childrenHidden = childrenWithProps.slice(mergeCount);

    const mergeStyle = props.max?.style || props.maxStyle;
    const mergePopoverTrigger = props.max?.popover?.trigger || props.maxPopoverTrigger || 'hover';
    const mergePopoverPlacement =
      props.max?.popover?.placement || props.maxPopoverPlacement || 'top';

    // ⚠️ 展开顺序即契约（见文件头第 6 条）
    const popoverProps = {
      content: childrenHidden,
      ...props.max?.popover,
      placement: mergePopoverPlacement,
      trigger: mergePopoverTrigger,
      // ⚠️ 上游是 clsx(...) ⇒ 产出**字符串**（不是数组）。
      // 🚨 这个类名要落在 **Popover 的浮层根**（不是组件根）—— 所以走语义槽
      //    `classNames.root`。若改用原生 `class`，它会经 Tooltip 的 `...attrs`
      //    同时落到**触发器子元素**上（L4 的 avatar:group-max 抓到多出类名）。
      classNames: {
        root: [`${groupPrefixCls.value}-popover`, props.max?.popover?.rootClassName]
          .filter(Boolean)
          .join(' '),
      },
    };

    childrenShow.push(
      h(Popover, { key: 'avatar-popover-key', destroyOnHidden: true, ...popoverProps } as never, {
        default: () =>
          h(Avatar, { style: mergeStyle }, { default: () => `+${numOfChildren - mergeCount}` }),
      }),
    );

    return childrenShow;
  }

  return childrenWithProps;
}

/** 根类名。顺序逐字来自上游 `clsx(...)`。 */
const groupClass = computed(() => [
  groupPrefixCls.value,
  { [`${groupPrefixCls.value}-rtl`]: direction.value === 'rtl' },
  `${prefixCls.value}-css-var`,
]);

// 根 `class` / `style` 是 Vue 原生 attrs，用 mergeProps 合并（调用方值优先）。
const rootAttrs = computed(() => mergeProps({ class: groupClass.value }, attrs));

const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>

<template>
  <div ref="rootRef" v-bind="rootAttrs">
    <NodeRenderer :node="groupChildren()" />
  </div>
</template>
