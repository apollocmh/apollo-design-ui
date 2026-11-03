<script setup lang="ts">
import { Flex, Skeleton } from '@apollo-design/ui';
</script>

<template>
  <Flex vertical gap="large">
    <Skeleton active />
    <Skeleton active round />
  </Flex>
</template>
