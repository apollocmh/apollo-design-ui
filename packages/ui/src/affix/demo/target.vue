<script setup lang="ts">
import { ref } from 'vue';
import { Affix, Button } from '../../index';

const container = ref<HTMLElement | null>(null);
const getTarget = () => container.value;
</script>

<template>
  <div ref="container" style="height: 300px; overflow: auto; border: 1px solid var(--apollo-color-border); border-radius: var(--apollo-border-radius)" tabindex="0" aria-label="Affix scroll container">
    <div style="height: 640px; padding: 80px 12px 12px">
    <Affix :target="getTarget" :offset-top="10">
      <Button>固定在容器顶部</Button>
    </Affix>
    <p>Scroll this container to pin the button at its top edge.</p>
    </div>
  </div>
</template>
