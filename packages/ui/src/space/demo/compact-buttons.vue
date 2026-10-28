<script setup lang="ts">
import { Button, Space, SpaceCompact } from '@apollo-design/ui';

const actions = ['Like', 'Comment', 'Star', 'Heart', 'Share', 'Download', 'More'];
</script>
<template>
  <Space orientation="vertical" style="display: flex">
    <SpaceCompact block><Button v-for="action in actions" :key="action">{{ action }}</Button></SpaceCompact>
    <SpaceCompact block><Button v-for="i in 6" :key="i" type="primary" :disabled="i === 5">Button {{ i }}</Button></SpaceCompact>
    <SpaceCompact block><Button v-for="i in 5" :key="i" :disabled="i === 4">Button {{ i }}</Button><Button type="primary">More</Button></SpaceCompact>
  </Space>
</template>
