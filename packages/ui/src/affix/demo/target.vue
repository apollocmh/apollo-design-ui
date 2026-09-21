<script setup lang="ts">
import { ref } from 'vue';
import { Affix } from '../../index';
import { Button } from '../../index';

const container = ref<HTMLElement | null>(null);
const getTarget = () => container.value ?? window;
</script>

<template>
  <div ref="container" style="height: 300px; overflow: auto">
    <Affix :target="getTarget" :offset-top="10">
      <Button>固定在容器顶部</Button>
    </Affix>
  </div>
</template>
