---
order: 3
title:
  zh-CN: 固钉状态改变回调
  en-US: Change callback
---

`@change` 只在状态**翻转**时触发（连续固钉不会重复发）。
Vue 侧是 `emit('change', affixed)`，模板上写 `@change` —— antd 的 `onChange` prop 不移植成 prop（规则 C19）。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Affix, Button } from '@apollo-design/ui';

const affixed = ref(false);
</script>

<template>
  <Affix :offset-top="120" @change="(v) => (affixed = v)">
    <Button>{{ affixed ? '已固钉' : '未固钉' }}</Button>
  </Affix>
</template>
```
