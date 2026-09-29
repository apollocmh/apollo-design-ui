<script setup lang="ts">
// 对齐 antd `basic.tsx`：单把手 + range，外加一个禁用开关（用本仓 Switch）。

import { Slider, Switch } from '@apollo-design/ui';
import { ref } from 'vue';

const disabled = ref(false);
const single = ref(30);
const rangeValue = ref<number[]>([20, 50]);
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <Slider v-model:value="single" :disabled="disabled" />
    <Slider v-model:value="rangeValue" range :disabled="disabled" />
    <div>
      Disabled:
      <!-- ⚠️ 可切换控件必须自带可访问名（axe 的 button-name），旁边的文字不算 -->
      <Switch v-model:checked="disabled" size="small" aria-label="Disabled" />
    </div>
  </div>
</template>
