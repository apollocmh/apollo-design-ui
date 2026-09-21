---
order: 2
title:
  zh-CN: 设置间隙
  en-US: Gap
---

预设 `small` / `medium` / `large` 三档（走 token），或自定义数字间隙。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Flex } from '@apollo-design/ui';
import type { FlexProps } from '@apollo-design/ui';

const gapSize = ref<FlexProps['gap']>('small');
const customGapSize = ref(0);
</script>

<template>
  <Flex gap="medium" vertical>
    <Flex :gap="gapSize !== 'customize' ? gapSize : customGapSize">
      <button type="button">Primary</button>
      <button type="button">Default</button>
    </Flex>
  </Flex>
</template>
```
