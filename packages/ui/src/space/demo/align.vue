<script setup lang="ts">
import { Button, Flex, Space, type SpaceAlign } from '@apollo-design/ui';

const alignments: SpaceAlign[] = ['center', 'start', 'end', 'baseline'];
</script>
<template>
  <Flex wrap="wrap" align="start">
    <Space v-for="align in alignments" :key="align" :align="align" class="alignment-box">
      {{ align }}<Button type="primary">Primary</Button><span class="tall-block">Block</span>
    </Space>
  </Flex>
</template>
<style scoped>
.alignment-box { margin: 4px; padding: 4px; border: 1px solid var(--apollo-color-primary); }
.tall-block { display: inline-block; padding: 24px 16px; color: var(--apollo-color-text); background: var(--apollo-color-fill-secondary); }
</style>
