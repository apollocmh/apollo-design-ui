<script setup lang="ts">
import { Collapse, CollapsePanel } from '@apollo-design/ui';
import { ref } from 'vue';

const saved = ref(0);
</script>

<template>
  <div>
    <p aria-live="polite">已保存 {{ saved }} 次</p>
    <Collapse>
      <CollapsePanel key="1" header="带独立操作的面板">
        <template #extra><button type="button" @click="saved += 1">保存</button></template>
        extra 的按钮独立响应点击、Enter 和 Space，不改变展开状态。
      </CollapsePanel>
      <CollapsePanel key="2" header="仅标题按钮可展开" collapsible="header">Content</CollapsePanel>
      <CollapsePanel key="3" header="禁止折叠" collapsible="disabled">Content</CollapsePanel>
    </Collapse>
  </div>
</template>
