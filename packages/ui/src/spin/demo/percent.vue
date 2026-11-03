<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { onUnmounted, ref, watch } from 'vue';
import type { SpinPercent } from '../../index';
import { Checkbox, Spin } from '../../index';

/**
 * 进度。切到 `auto` 时组件自己按 200ms 一档**渐近**推进（越接近 100% 越慢），
 * 永远到不了 100% —— 这是 antd 的 `getPercent` 行为，用于「不知道还要多久」的场景。
 */
const auto = ref(false);
const percent = ref(-50);

let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * 用 `watch` 而不是 `onMounted` 里的一次性 `setTimeout`，是为了与上游
 * `useEffect(..., [percent])` 同构：每次 `percent` 变化都重新排下一次。
 */
watch(
  percent,
  () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const next = percent.value + 5;
      percent.value = next > 150 ? -50 : next;
    }, 100);
  },
  { immediate: true },
);

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
});

const mergedPercent = (): SpinPercent => (auto.value ? 'auto' : percent.value);

const toggleAuto = () => {
  auto.value = !auto.value;
  percent.value = -50;
};

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
};
</script>

<template>
  <div :style="rowStyle">
    <Checkbox :checked="auto" @change="toggleAuto">Auto</Checkbox>
    <Spin :percent="mergedPercent()" size="small" />
    <Spin :percent="mergedPercent()" />
    <Spin :percent="mergedPercent()" size="large" />
  </div>
</template>
