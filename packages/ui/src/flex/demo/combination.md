---
order: 4
title:
  zh-CN: 组合使用
  en-US: Combination
---

嵌套 Flex 构建响应式项目摘要；本地内容无需外部图片，详情按钮展开业务说明。

```vue
<script setup lang="ts">
import { Flex } from '@apollo-design/ui';
import { ref } from 'vue';

const expanded = ref(false);
</script>

<template>
  <Flex wrap gap="middle" align="stretch" style="max-width: 620px; width: 100%; border: 1px solid var(--apollo-color-border); border-radius: var(--apollo-border-radius); overflow: hidden; box-sizing: border-box">
    <Flex vertical justify="center" flex="1 1 180px" style="min-width: 0; padding: 24px; box-sizing: border-box; background: var(--apollo-color-fill-alter)">
      <strong>Project Apollo</strong>
      <span>Shared workspace</span>
    </Flex>
    <Flex vertical align="flex-start" justify="space-between" gap="small" flex="1 1 240px" style="min-width: 0; padding: 24px; box-sizing: border-box">
      <h3 style="margin: 0">Keep the team in sync</h3>
      <p style="margin: 0">Use nested Flex layouts for a responsive project summary.</p>
      <button type="button" :aria-expanded="expanded" @click="expanded = !expanded">{{ expanded ? 'Hide details' : 'Show details' }}</button>
      <p v-if="expanded" style="margin: 0">Three milestones are ready for review.</p>
    </Flex>
  </Flex>
</template>
```
