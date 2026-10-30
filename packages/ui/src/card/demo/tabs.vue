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
