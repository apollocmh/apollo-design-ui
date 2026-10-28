---
order: 2
title:
  zh-CN: 间距尺寸
  en-US: Size
---

切换预设与数字间距；自定义 `0` 保持零间距。

Switch presets and numeric gaps; zero remains a zero gap.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Button, Space, type SpaceSize } from '@apollo-design/ui';
type Choice = 'small' | 'medium' | 'large' | 'customize';
const size = ref<Choice>('small');
const customSize = ref(0);
const spaceSize = (): SpaceSize => size.value === 'customize' ? customSize.value : size.value;
</script>
<template>
  <label>Spacing <select v-model="size" aria-label="Space size"><option value="small">small</option><option value="medium">medium</option><option value="large">large</option><option value="customize">customize</option></select></label>
  <label v-if="size === 'customize'">Custom gap <input v-model.number="customSize" type="range" min="0" max="100" aria-label="Custom size" /></label>
  <div style="margin-top: 16px"><Space :size="spaceSize()"><Button type="primary">Primary</Button><Button>Default</Button><Button type="dashed">Dashed</Button><Button type="text">Text</Button></Space></div>
</template>
```
