<script setup lang="ts">
// 对齐 antd 的 tabs demo。
// ⚠️ `onTabChange` 是**上游的 prop**（不是 emits，没有 value/onChange 对 ⇒ C11 的双发不适用）
//    ⇒ 用 `:on-tab-change="..."`（与 `anchor` / `cascader` 的 demo 同形）。
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
  <!-- ⚠️ `'medium'` 是**上游 demo 的原值**（antd 的 `SizeType` 里没有 `'default'`）——
       本仓 `TabsProps['size']` 曾错写成 `'small' | 'default' | 'large'`，
       2026-10-02 修正为 `SizeType` 后这里才能用真值（见 `tabs/interface.ts`）。 -->
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
  <br />
  <br />
  <Card
    :style="{ width: '100%' }"
    :tab-list="tabListNoTitle"
    :active-tab-key="activeTabKey2"
    :tab-bar-extra-content="more()"
    :on-tab-change="(key: string) => (activeTabKey2 = key)"
    :tab-props="{ size: 'medium' }"
  >
    <p>{{ contentListNoTitle[activeTabKey2] }}</p>
  </Card>
</template>
