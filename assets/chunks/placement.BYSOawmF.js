const t=`<script setup lang="ts">
// 对齐 antd 的 placement demo（ConfigProvider 的 button 样式改为内联 style）
import { Button, Popconfirm } from '@apollo-design/ui';

const text = 'Are you sure to delete this task?';
const description = 'Delete the task';
const placements = ['topLeft', 'top', 'topRight'] as const;
<\/script>

<template>
  <div style="display: flex; gap: 4px; justify-content: center">
    <Popconfirm
      v-for="placement in placements"
      :key="placement"
      :placement="placement"
      :title="text"
      :description="description"
      ok-text="Yes"
      cancel-text="No"
    >
      <Button style="width: 80px; margin: 4px">{{ placement }}</Button>
    </Popconfirm>
  </div>
</template>
`;export{t as default};
