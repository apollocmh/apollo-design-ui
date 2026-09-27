<script setup lang="ts">
// 对齐 antd 的 customIcon demo

import { SmileOutlined } from '@apollo-design/icons';
import { Button, Result } from '@apollo-design/ui';
</script>

<template>
  <Result title="Great, we have done all the operations!">
    <template #icon>
      <SmileOutlined />
    </template>
    <template #extra>
      <Button type="primary">Next</Button>
    </template>
  </Result>
</template>
