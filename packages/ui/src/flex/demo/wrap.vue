<script setup lang="ts">
import { Button, Flex } from '@apollo-design/ui';
</script>

<template>
  <Flex wrap gap="small">
    <Button v-for="i in 24" :key="i">Button</Button>
  </Flex>
</template>
