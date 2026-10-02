---
order: 8
title:
  zh-CN: 带页签的卡片
  en-US: With tabs
---

可承载更多内容。

`tabList` 的 `tab` 通道已废弃（用 `label`）；`activeTabKey` 与 `defaultActiveTabKey`
**二选一**（传了前者就用 `activeKey`，否则用 `defaultActiveKey`）。

⚠️ `onTabChange` 是**上游的 prop**（不是 emits），所以用 `:on-tab-change="..."`。

```vue
<script setup lang="ts">
// 对齐 antd 的 tabs demo。
import { Card } from '@apollo-design/ui';
import { h, ref } from 'vue';

const tabList = [
  { key: 'tab1', tab: 'tab1' },
  { key: 'tab2', tab: 'tab2' },
];

const contentList: Record<string, string> = {
  tab1: 'content1',
  tab2: 'content2',
};

const activeTabKey1 = ref('tab1');

const more = () => h('a', { href: '#' }, 'More');
</script>

<template>
  <Card
    :style="{ width: '100%' }"
    title="Card title"
    :extra="more()"
    :tab-list="tabList"
    :active-tab-key="activeTabKey1"
    :on-tab-change="(key: string) => (activeTabKey1 = key)"
  >
    <p>{{ contentList[activeTabKey1] }}</p>
  </Card>
</template>
```
