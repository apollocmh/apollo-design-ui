---
order: 8
title:
  zh-CN: 带页签的卡片
  en-US: With tabs
---

使用 `v-model:active-tab-key` 接收页签更新；`@tab-change="handler"` 监听同一次切换通知。`defaultActiveTabKey` 只设置非受控初值，定义了 `activeTabKey` 时以当前值为准；撤控后保留最后接收值。`tabList` 的数据 VNode 与 `tab` / `label` 通道继续支持。

```vue
<script setup lang="ts">
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

const tabListNoTitle = [
  { key: 'article', label: 'article' },
  { key: 'app', label: 'app' },
  { key: 'project', label: 'project' },
];

const contentListNoTitle: Record<string, string> = {
  article: 'article content',
  app: 'app content',
  project: 'project content',
};

const activeTabKey1 = ref('tab1');
const activeTabKey2 = ref('app');

const more = () => h('a', { href: '#' }, 'More');
</script>

<template>
  <Card
    :style="{ width: '100%' }"
    title="Card title"
    :extra="more()"
    :tab-list="tabList"
    v-model:active-tab-key="activeTabKey1"
  >
    <p>{{ contentList[activeTabKey1] }}</p>
  </Card>
  <br />
  <br />
  <Card
    :style="{ width: '100%' }"
    :tab-list="tabListNoTitle"
    v-model:active-tab-key="activeTabKey2"
    :tab-bar-extra-content="more()"
    :tab-props="{ size: 'medium' }"
  >
    <p>{{ contentListNoTitle[activeTabKey2] }}</p>
  </Card>
</template>
```
