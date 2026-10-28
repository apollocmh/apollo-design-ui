<script setup lang="ts">
import { Divider, Space } from '@apollo-design/ui';
</script>
<template>
  <Space><template #separator><Divider orientation="vertical" /></template><a href="#first">First link</a><a href="#second">Second link</a><a href="#third">Third link</a></Space>
</template>
<style scoped>a { color: inherit; text-decoration: underline; }</style>
