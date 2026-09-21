<script setup lang="ts">
import { ref } from 'vue';
import { Skeleton } from '../../index';

const loading = ref(true);
</script>

<template>
  <div>
    <button type="button" @click="loading = !loading">切换（当前 {{ loading ? '骨架' : '内容' }}）</button>
    <Skeleton :loading="loading">
      <div>这是真实内容。</div>
    </Skeleton>
  </div>
</template>
