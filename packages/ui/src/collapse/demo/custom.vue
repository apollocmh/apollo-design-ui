<script setup lang="ts">
import { Button, Collapse, CollapsePanel, Input, Tag } from '@apollo-design/ui';
import { ref } from 'vue';

const notifyCount = ref(0);
const draft = ref('');
</script>

<template>
  <div>
    <p aria-live="polite">通知次数：{{ notifyCount }}</p>
    <Collapse default-active-key="production" :heading-level="3">
      <template #expandIcon="{ isActive }">
        <span aria-hidden="true">{{ isActive ? '−' : '+' }}</span>
      </template>
      <CollapsePanel key="production">
        <template #header>
          <span style="font-weight: 600">生产环境部署</span>
          <Tag color="blue" style="margin-inline-start: 8px">推荐</Tag>
        </template>
        <template #extra>
          <Button size="small" @click="notifyCount += 1">发送通知</Button>
        </template>
        <label style="display: grid; gap: 8px">部署备注 <Input v-model:value="draft" placeholder="折叠后保留草稿" /></label>
        <p>草稿：{{ draft || '尚未填写' }}</p>
      </CollapsePanel>
      <CollapsePanel key="staging" header="预发环境部署">
        <template #extra><Tag color="orange">待审批</Tag></template>
        标题、图标和独立 extra 操作都由真实 Vue 插槽渲染。
      </CollapsePanel>
    </Collapse>
  </div>
</template>
