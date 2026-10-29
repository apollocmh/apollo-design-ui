<script setup>
import { ref } from 'vue';
import ScopedInput from './ScopedInput.vue';

defineProps({ family: String, affix: Boolean });
const field = ref(null);
defineExpose({
  get owner() {
    return field.value?.owner;
  },
});
</script>
<template>
  <ScopedInput ref="field" :family="family" :affix="affix" nested />
</template>
<style scoped>
.owned-scoped-input { --scope-leak: leaked; }
</style>
