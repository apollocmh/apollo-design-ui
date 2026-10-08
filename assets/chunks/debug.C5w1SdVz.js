const t=`<script setup lang="ts">
// 对齐 antd 的 demo/debug.tsx

import { Button, Flex, Tooltip } from '@apollo-design/ui';
<\/script>

<template>
  <div style="font-family: sans-serif">
    <Flex vertical :gap="72" align="flex-start">
      <span />
      <Tooltip
        open
        title="Thanks for using antd. Have a nice day !"
        :arrow="{ pointAtCenter: true }"
        placement="topLeft"
      >
        <Button>Point at center</Button>
      </Tooltip>
      <Tooltip open placement="topLeft">
        <template #title><div /></template>
        <Button>Min Width</Button>
      </Tooltip>
      <Tooltip open placement="top">
        <template #title><div /></template>
        <Button>Min Width</Button>
      </Tooltip>
    </Flex>
  </div>
</template>
`;export{t as default};
