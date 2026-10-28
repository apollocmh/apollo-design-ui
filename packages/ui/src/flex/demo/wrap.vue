<script setup lang="ts">
import { Flex } from '@apollo-design/ui';
</script>

<template>
  <Flex wrap gap="small">
    <button v-for="i in 24" :key="i" type="button">Button</button>
  </Flex>
</template>
