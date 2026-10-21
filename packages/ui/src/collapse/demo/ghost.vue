<script setup lang="ts">
import type { CollapseItemType } from '@apollo-design/ui';
import { Collapse, Space, Switch, Tag } from '@apollo-design/ui';
import { ref } from 'vue';

const ghost = ref(true);

const items: CollapseItemType[] = [
  {
    key: '1',
    label: 'ghost 面板标题',
    children: 'ghost 模式会移除背景与边框，让折叠面板融入外层容器。',
  },
  {
    key: '2',
    label: '第二个面板',
    children: '切换开关即可对比默认边框与幽灵模式的差异。',
  },
];
</script>

<template>
  <div>
    <Space :size="12" style="margin-bottom: 16px">
      <span>ghost</span>
      <Switch
        v-model:checked="ghost"
        checked-children="开启"
        un-checked-children="关闭"
      />
      <Tag color="blue">{{ ghost ? '透明背景 + 无边框' : '默认背景 + 边框' }}</Tag>
    </Space>

    <div class="ghost-demo-stage">
      <Collapse :items="items" :ghost="ghost" />
    </div>
  </div>
</template>

<style scoped>
.ghost-demo-stage {
  padding: 16px;
  border-radius: var(--apollo-border-radius-lg);
  background: var(--apollo-color-fill-secondary);
}
</style>
