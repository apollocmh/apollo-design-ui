<script setup lang="ts">
import { Button, Space, SpaceCompact } from '@apollo-design/ui';
</script>
<template>
  <Space align="start" wrap>
    <SpaceCompact orientation="vertical"><Button v-for="i in 3" :key="i">Button {{ i }}</Button></SpaceCompact>
    <SpaceCompact orientation="vertical"><Button v-for="i in 3" :key="i" type="dashed">Button {{ i }}</Button></SpaceCompact>
    <SpaceCompact orientation="vertical"><Button v-for="i in 3" :key="i" type="primary">Button {{ i }}</Button></SpaceCompact>
    <SpaceCompact orientation="vertical"><Button v-for="i in 3" :key="i" variant="outlined">Button {{ i }}</Button></SpaceCompact>
  </Space>
</template>
