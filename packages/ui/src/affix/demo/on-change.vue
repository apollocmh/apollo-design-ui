<script setup lang="ts">
import { ref } from 'vue';
import { Affix, Button } from '../../index';

const affixed = ref(false);
</script>

<template>
  <Affix :offset-top="120" @change="(v) => (affixed = v)">
    <Button>{{ affixed ? '已固钉' : '未固钉' }}</Button>
  </Affix>
</template>
