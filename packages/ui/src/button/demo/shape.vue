<script setup lang="ts">
import { SearchOutlined } from '@apollo-design/icons';
import { Button } from '../../index';
</script>

<template>
  <Button type="primary" shape="circle" :icon="SearchOutlined" />
  <Button type="primary" shape="round">Round</Button>
  <Button type="primary" shape="square">Square</Button>
  <Button shape="circle" :icon="SearchOutlined" />
  <Button shape="round">Round</Button>
</template>
