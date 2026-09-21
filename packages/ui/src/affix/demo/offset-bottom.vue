<script setup lang="ts">
import { Affix } from '../../index';
import { Button } from '../../index';
</script>

<template>
  <Affix :offset-bottom="80">
    <Button>固定在底部 80px</Button>
  </Affix>
</template>
