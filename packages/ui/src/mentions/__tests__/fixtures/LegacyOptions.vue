<script setup lang="ts">
import { ref } from 'vue';
import { Mentions, MentionsOption } from '../../../index';

const renamed = ref(false);
defineExpose({
  rename: () => {
    renamed.value = true;
  },
});
</script>
<template>
  <Mentions default-value="@" aria-label="Legacy candidate template">
    <MentionsOption v-for="value in ['alpha', 'beta']" :key="value" :value="value" :class="['candidate-native', { renamed }]" style="color: red">
      {{ renamed ? 'Current ' : '' }}{{ value }}
    </MentionsOption>
  </Mentions>
</template>
