<script setup lang="ts">
import { Button, Skeleton } from '@apollo-design/ui';
import { ref } from 'vue';

const loading = ref(true);
</script>

<template>
  <div>
    <Button style="margin-bottom: 16px" @click="loading = !loading">切换（当前 {{ loading ? '骨架' : '内容' }}）</Button>
    <Skeleton :loading="loading">
      <div>这是真实内容。</div>
    </Skeleton>
  </div>
</template>
