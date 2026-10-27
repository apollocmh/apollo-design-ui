<script setup lang="ts">
import { toArray } from '@apollo-design/utils';
import {
  computed,
  h,
  inject,
  mergeProps,
  normalizeStyle,
  onBeforeUpdate,
  provide,
  reactive,
  ref,
  useAttrs,
  useSlots,
  watchEffect,
} from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { Popover, type PopoverProps } from '../popover';
import Avatar from './Avatar.vue';
import { type AvatarContextValue, avatarContextKey, avatarGroupPrefixKey } from './context';
import type { AvatarGroupProps, AvatarGroupSlot } from './interface';
import { useAvatarTheme } from './use-avatar-theme';

defineOptions({ name: 'AAvatarGroup', inheritAttrs: false });
const props = defineProps<AvatarGroupProps>();
defineSlots<{ default?: AvatarGroupSlot }>();
const attrs = useAttrs(),
  slots = useSlots();
const config = useComponentConfig('avatar'),
  direction = useDirection();
const parentPrefix = inject(avatarGroupPrefixKey, undefined);
const prefixCls = computed(
  () => props.prefixCls ?? parentPrefix?.value ?? config.getPrefixCls('avatar'),
);
provide(avatarGroupPrefixKey, prefixCls);
const groupPrefixCls = computed(() => `${prefixCls.value}-group`);
const themeStyle = useAvatarTheme(() => prefixCls.value);
const outerCtx = inject(avatarContextKey, undefined);
const contextValue = reactive<AvatarContextValue>({});
watchEffect(() =>
  Object.assign(contextValue, {
    size: props.size ?? outerCtx?.size,
    shape: props.shape ?? outerCtx?.shape,
  }),
);
provide(avatarContextKey, contextValue);
let childCache: ReturnType<typeof toArray> | null = null;
onBeforeUpdate(() => {
  childCache = null;
});
function groupVariables() {
  const style: Record<string, string | number> = { ...themeStyle.value };
  const native = normalizeStyle([attrs.style]);
  if (native && typeof native === 'object') {
    for (const [key, value] of Object.entries(native)) {
      if (
        key.startsWith(`--${prefixCls.value}-group-`) &&
        (typeof value === 'string' || typeof value === 'number')
      )
        style[key] = value;
    }
  }
  return style;
}
function groupChildren() {
  if (childCache === null) childCache = slots.default ? toArray(slots.default()) : [];
  const children = childCache;
  const rawCount = props.max?.count;
  const count =
    typeof rawCount === 'number' && Number.isFinite(rawCount)
      ? Math.max(0, Math.floor(rawCount))
      : 0;
  if (!count || count >= children.length) return children;
  const popover = props.max?.popover;
  const userClassNames = popover?.classNames;
  const userStyles = popover?.styles;
  const mergedRoot = (extra?: string) =>
    [`${groupPrefixCls.value}-popover`, popover?.rootClassName, extra].filter(Boolean).join(' ');
  const trigger = popover?.trigger ?? 'hover';
  const triggers = typeof trigger === 'string' ? [trigger] : trigger;
  // Hover-only content needs a native keyboard activation path too.
  const accessibleTrigger =
    triggers.includes('hover') && !triggers.includes('click') && !triggers.includes('focus')
      ? [...triggers, 'click']
      : trigger;
  const popoverProps: PopoverProps = {
    destroyOnHidden: true,
    content: children.slice(count),
    ...popover,
    trigger: accessibleTrigger,
    styles:
      typeof userStyles === 'function'
        ? (info) => {
            const resolved = userStyles(info);
            return { ...resolved, root: { ...groupVariables(), ...resolved?.root } };
          }
        : { ...userStyles, root: { ...groupVariables(), ...userStyles?.root } },
    classNames:
      typeof userClassNames === 'function'
        ? (info) => {
            const resolved = userClassNames(info);
            return { ...resolved, root: mergedRoot(resolved?.root) };
          }
        : { ...userClassNames, root: mergedRoot(userClassNames?.root) },
  };
  return [
    ...children.slice(0, count),
    h(
      Popover,
      { key: 'avatar-overflow', ...popoverProps },
      {
        default: () =>
          h('button', { type: 'button', class: `${groupPrefixCls.value}-overflow` }, [
            h(Avatar, { style: props.max?.style }, () => `+${children.length - count}`),
          ]),
      },
    ),
  ];
}
function rootAttrs() {
  return mergeProps(
    {
      dir: direction.value,
      class: [
        groupPrefixCls.value,
        { [`${groupPrefixCls.value}-rtl`]: direction.value === 'rtl' },
        `${prefixCls.value}-css-var`,
      ],
      style: themeStyle.value,
    },
    attrs,
  );
}
const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>
<template><div ref="rootRef" v-bind="rootAttrs()"><NodeRenderer :node="groupChildren()" /></div></template>
