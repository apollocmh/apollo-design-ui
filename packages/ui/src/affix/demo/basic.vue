<script setup lang="ts">
import { Affix } from '../../index';
import { Button } from '../../index';
</script>

<template>
  <Affix :offset-top="80">
    <Button type="primary">固定在顶部 80px</Button>
  </Affix>
</template>
