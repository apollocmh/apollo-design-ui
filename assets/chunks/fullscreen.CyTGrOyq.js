const n=`<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import { Spin } from '../../index';

/**
 * 全屏。\`fullscreen\` 会加一层半透明遮罩并把转圈居中。
 *
 * ⚠️ 两条容易忽略的语义：
 *   1. \`fullscreen\` 会让 \`isNested\` 恒为真 —— 即使**没有** children，
 *      \`-section\` 也会下移到内层 div（根元素只留下遮罩）；
 *   2. \`styles.section\` 在嵌套时落在内层 div 上，**不**进根元素。
 */
const spinning = ref(false);
const percent = ref(0);

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
<\/script>

<template>
  <button type="button" @click="showLoader">Show fullscreen</button>
  <Spin :spinning="spinning" :percent="percent" fullscreen />
</template>
`;export{n as default};
