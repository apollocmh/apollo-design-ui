<script setup lang="ts">
import type { CollapseItemType } from '@apollo-design/ui';
import { Button, Collapse, Space, Tag } from '@apollo-design/ui';
import { computed, h, ref } from 'vue';

const notifyCount = ref(0);
const lastAction = ref('尚未点击通知');

function onNotify(): void {
  notifyCount.value += 1;
  lastAction.value = `第 ${notifyCount.value} 次发送通知`;
}

const items = computed<CollapseItemType[]>(() => [
  {
    key: '1',
    label: h(Space, { size: 8 }, () => [
      h('span', { style: { fontWeight: 600 } }, '生产环境部署'),
      h(Tag, { color: 'blue' }, () => '推荐'),
    ]),
    extra: h(Tag, { color: 'blue' }, () => '可发送通知'),
    children: h('div', null, [
      h('p', { style: { margin: '0 0 8px' } }, '使用自定义 VNode 作为 label 与 extra。'),
      h(Tag, { color: 'green' }, () => '最近一次部署成功'),
    ]),
  },
  {
    key: '2',
    label: '预发环境部署',
    extra: h(Tag, { color: 'orange' }, () => '待审批'),
    children: 'extra 可以是任意 VNode；点击按钮不会触发面板展开或收起。',
  },
]);
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <Button size="small" @click="onNotify">发送通知</Button>
      <Tag color="blue">通知次数：{{ notifyCount }}</Tag>
      <Tag>{{ lastAction }}</Tag>
    </Space>

    <Collapse :items="items" />
  </div>
</template>
