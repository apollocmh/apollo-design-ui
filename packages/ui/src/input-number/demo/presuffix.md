---
order: 9
title:
  zh-CN: 前缀 / 后缀
  en-US: Prefix & suffix
---

用 `#prefix` / `#suffix` 编写富内容模板；slot 存在时优先于内容 prop，空 slot 也不回退。按钮演示条件插槽移除后恢复 prop 内容。

Use `#prefix` / `#suffix` for rich template content. A present slot, including an empty one, overrides its prop. Toggle the slots to restore prop content.


```vue
<script setup lang="ts">
import { Button, InputNumber } from '@apollo-design/ui';
import { ref } from 'vue';

const custom = ref(true);
</script>

<template>
  <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px">
    <Button @click="custom = !custom">切换模板前后缀 / Toggle slots</Button>
    <InputNumber prefix="$" suffix="USD" aria-label="金额 / Amount" style="width: 200px">
      <template v-if="custom" #prefix><strong>¥</strong></template>
      <template v-if="custom" #suffix><span>元 / CNY</span></template>
    </InputNumber>
    <InputNumber suffix="%" aria-label="百分比 / Percentage" style="width: 200px" />
  </div>
</template>
```
