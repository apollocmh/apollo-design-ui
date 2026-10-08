const t=`<script setup lang="ts">
// 对齐 antd demo/triggerType.tsx（hover / focus / click 三种触发）
import { Button, Popover, Space } from '@apollo-design/ui';

const content = ['Content', 'Content'];
<\/script>

<template>
  <Space wrap>
    <Popover v-for="t in ['hover', 'focus', 'click']" :key="t" title="Title" :trigger="t">
      <template #content>
        <div>
          <p v-for="(c, i) in content" :key="i">{{ c }}</p>
        </div>
      </template>
      <Button>{{ (t[0] ?? '').toUpperCase() + t.slice(1) }} me</Button>
    </Popover>
  </Space>
</template>
`;export{t as default};
