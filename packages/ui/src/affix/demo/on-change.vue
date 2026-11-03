<script setup lang="ts">
import { ref } from 'vue';
import { Affix, Button } from '../../index';

const affixed = ref(false);
</script>

<template>
  <div style="min-height: 760px; padding-top: 120px">
  <Affix :offset-top="120" @change="(v) => (affixed = v)">
    <Button>{{ affixed ? '已固钉' : '未固钉' }}</Button>
  </Affix>
    <p style="margin-top: 24px">Scroll this preview to observe the fixed position.</p>
  </div>
</template>
