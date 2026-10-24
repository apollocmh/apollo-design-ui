---
order: 20
title:
  zh-CN: 原生作用域插槽
  en-US: Native scoped slots
---

四个原生槽使用具名对象；内联模式通过原节点正常打开内容提示，不需要渲染函数。切换当前步或更新数据可观察作用域变化和输入状态保持；空槽覆盖回退。

```vue
<script setup lang="ts">
import { Button, Steps } from '@apollo-design/ui';
import { ref } from 'vue';

const custom = ref(true);
const empty = ref(false);
const current = ref(0);
const items = ref([
  { key: 'a', title: 'Alpha', content: 'Alpha details' },
  { key: 'b', title: 'Beta', content: 'Beta details' },
]);
const advance = () => { current.value = (current.value + 1) % items.value.length; };
const update = () => { items.value = items.value.map(item => ({ ...item, title: `${item.title}!` })); };
</script>

<template>
  <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap">
    <Button @click="advance">Advance native step</Button>
    <Button @click="update">Update native step data</Button>
    <Button @click="custom = !custom">Toggle native step slots</Button>
    <Button @click="empty = !empty">Toggle empty step slots</Button>
  </div>
  <Steps data-native-inline-steps type="inline" :items="items" :current="current" :responsive="false">
    <template v-if="custom" #iconRender="{ index, active }">
      <b :data-native-icon="index" :data-active="active">{{ index + 1 }}</b>
    </template>
    <template v-if="custom" #itemWrapperRender="{ itemNode }">
      <div data-native-wrapper><component :is="itemNode" /></div>
    </template>
    <template v-if="custom" #itemRender="{ itemNode, item, index, active }">
      <div v-if="!empty" :data-native-step="item.key" :data-index="index" :data-active="active">
        <component :is="itemNode" />
        <input :aria-label="`Step note ${item.key}`" style="width: 80px" />
      </div>
    </template>
  </Steps>
  <Steps data-native-dot-steps type="dot" :items="items" :current="current" :responsive="false">
    <template #progressDot="{ index, status }"><span :data-native-dot="index">{{ index }}:{{ status }}</span></template>
  </Steps>
</template>

```
