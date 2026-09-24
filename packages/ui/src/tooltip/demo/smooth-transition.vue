<script setup lang="ts">
// 对齐 antd 的 demo/smooth-transition.tsx（unique v1 不做 ⇒ 直接并排两个 Tooltip）

import { Button, Flex, Tooltip } from '@apollo-design/ui';
</script>

<template>
  <div style="font-family: sans-serif">
    <Flex vertical gap="small">
      <Flex gap="small" justify="center">
        <Tooltip title="Hello, Ant Design!">
          <Button type="primary">Button</Button>
        </Tooltip>
        <Tooltip title="Hello, Ant Design!">
          <Button type="primary">Button</Button>
        </Tooltip>
      </Flex>
      <Flex gap="small" justify="center">
        <Tooltip title="Hello, Ant Design!" placement="bottom">
          <Button type="primary">Button</Button>
        </Tooltip>
        <Tooltip title="Hello, Ant Design!" placement="bottom">
          <Button type="primary">Button</Button>
        </Tooltip>
      </Flex>
    </Flex>
  </div>
</template>
