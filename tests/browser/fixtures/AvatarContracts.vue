<script setup lang="ts">
import { compactAlgorithm, darkAlgorithm, type ThemeConfig } from '@apollo-design/theme';
import { Avatar, AvatarGroup, ConfigProvider } from '@apollo-design/ui';
import { nextTick, reactive } from 'vue';
import type { AvatarSize } from '../../../packages/ui/src/avatar/interface';

const state = reactive<{
  mode: string;
  size?: AvatarSize;
  groupSize?: AvatarSize;
  gap: number;
  width?: string;
  theme?: ThemeConfig;
  open?: boolean;
  groupPrefix?: string;
  direction?: 'rtl' | 'ltr';
  groupStyle?: Record<string, string>;
}>({ mode: 'default', gap: 4 });
const algorithm = () =>
  state.mode === 'both'
    ? [darkAlgorithm, compactAlgorithm]
    : state.mode === 'dark'
      ? darkAlgorithm
      : state.mode === 'compact'
        ? compactAlgorithm
        : undefined;
Object.assign(window, {
  avatarAudit: {
    async set(patch: Partial<typeof state>) {
      Object.assign(state, patch);
      await nextTick();
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    },
  },
});
</script>
<template>
  <ConfigProvider :direction="state.direction" :theme="{algorithm: algorithm(), ...state.theme}">
    <main style="padding: 24px; background: var(--apollo-color-bg-container); color: var(--apollo-color-text); font-size: var(--apollo-font-size)">
      <Avatar data-default>Olivia</Avatar>
      <Avatar data-measured :size="state.size" :gap="state.gap" :style="state.width ? {width: state.width, height: state.width} : undefined">Very long avatar text</Avatar>
      <AvatarGroup data-group :prefix-cls="state.groupPrefix" :style="state.groupStyle" :size="state.groupSize"><Avatar>A</Avatar><Avatar>B</Avatar></AvatarGroup>
      <Avatar data-large size="large">L</Avatar><Avatar data-small size="small">S</Avatar>
      <Avatar data-icon :icon="'I'"/><Avatar data-large-icon size="large" :icon="'I'"/><Avatar data-small-icon size="small" :icon="'I'"/>
      <AvatarGroup data-overflow :max="{count: 1, popover: {open: state.open, mouseEnterDelay: 0, mouseLeaveDelay: 0}}"><Avatar>A</Avatar><Avatar>B</Avatar><Avatar>C</Avatar></AvatarGroup>
    </main>
  </ConfigProvider>
  <section aria-label="Unscoped group"><AvatarGroup data-plain :max="{count:1}"><Avatar>A</Avatar><Avatar>B</Avatar></AvatarGroup></section>
</template>
