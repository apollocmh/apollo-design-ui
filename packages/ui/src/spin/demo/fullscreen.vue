<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import { Spin } from '../../index';

/**
 * 全屏。`fullscreen` 会加一层半透明遮罩并把转圈居中。
 *
 * ⚠️ 两条容易忽略的语义：
 *   1. 全屏覆盖层与正文分别布局，原生输入不会移位或重新挂载；
 *   2. `styles.mask` 配置覆盖层，root 仍是正文的原生外壳。
 */
const spinning = ref(false);
const percent = ref(0);
const draft = ref('Edit before loading');

let interval: ReturnType<typeof setInterval> | null = null;

const stop = () => {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
};

const showLoader = () => {
  stop();
  spinning.value = true;
  let ptg = -10;

  interval = setInterval(() => {
    ptg += 5;
    percent.value = ptg;

    if (ptg > 120) {
      stop();
      spinning.value = false;
      percent.value = 0;
    }
  }, 100);
};

onUnmounted(stop);
</script>

<template>
  <button type="button" @click="showLoader">Show fullscreen</button>
  <Spin :spinning="spinning" :percent="percent" fullscreen description="Updating">
    <input v-model="draft" aria-label="Fullscreen loading draft" />
  </Spin>
</template>
