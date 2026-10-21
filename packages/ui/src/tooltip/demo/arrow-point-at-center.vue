<script setup lang="ts">
// 对齐 antd 的 `arrow-point-at-center` demo：箭头始终指向触发元素中心。
import { Button, Space, Tooltip } from '@apollo-design/ui';

const placements = [
  'topLeft',
  'top',
  'topRight',
  'left',
  'right',
  'bottomLeft',
  'bottom',
  'bottomRight',
] as const;
</script>

<template>
  <div>
    <Space wrap :size="16">
      <Tooltip
        v-for="placement in placements"
        :key="placement"
        :title="`arrow points at center (${placement})`"
        :placement="placement"
        :arrow="{ pointAtCenter: true }"
      >
        <Button>{{ placement }}</Button>
      </Tooltip>
    </Space>
    <div style="margin-top: 16px">
      <Tooltip title="No arrow" :arrow="false">
        <Button>Compare: no arrow</Button>
      </Tooltip>
    </div>
  </div>
</template>
