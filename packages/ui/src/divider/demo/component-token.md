---
order: 6
title:
  zh-CN: 组件 Token
  en-US: Component Token
---

三个组件 Token 都通过 `ConfigProvider.theme.components.Divider` 生效。使用有名称的原生滑块调整文本 padding、标题靠边比例和垂直分割线的 margin；关闭主题或重置后恢复默认值。数字长度按 px 处理，比例保持无单位。

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { ConfigProvider, Divider } from '@apollo-design/ui';

const enabled = ref(true);
const padding = ref(12);
const ratio = ref(0.2);
const margin = ref(16);
const theme = computed(() =>
  enabled.value
    ? {
        components: {
          Divider: {
            textPaddingInline: padding.value,
            orientationMargin: ratio.value,
            verticalMarginInline: margin.value,
          },
        },
      }
    : {},
);
function reset() {
  padding.value = 16;
  ratio.value = 0.05;
  margin.value = 8;
  enabled.value = false;
}
</script>

<template>
  <div class="divider-token-controls">
    <label><input v-model="enabled" type="checkbox" /> Enable component theme</label>
    <label>Text padding: {{ padding }}px<input v-model.number="padding" aria-label="Divider text padding" type="range" min="0" max="40" step="2" /></label>
    <label>Edge ratio: {{ ratio }}<input v-model.number="ratio" aria-label="Divider edge ratio" type="range" min="0" max="1" step="0.05" /></label>
    <label>Vertical margin: {{ margin }}px<input v-model.number="margin" aria-label="Divider vertical margin" type="range" min="0" max="32" step="2" /></label>
    <button type="button" @click="reset">Reset Divider theme</button>
  </div>
  <ConfigProvider :theme="theme">
    <Divider title-placement="start">Section heading</Divider>
    <div class="divider-token-inline"><span>First column</span><Divider orientation="vertical" /><span>Second column</span></div>
  </ConfigProvider>
</template>

<style scoped>
.divider-token-controls { display: grid; gap: 12px; }
.divider-token-controls label { display: grid; gap: 4px; }
.divider-token-controls label:first-child { display: flex; align-items: center; }
.divider-token-controls input[type='range'] { width: 100%; }
.divider-token-controls button { width: fit-content; }
.divider-token-inline { margin-block: 16px; }
</style>
```
