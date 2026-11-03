<script setup lang="ts">
import { ref } from 'vue';
import { Checkbox, Divider, Input } from '../../index';

const showTitle = ref(true);
const plain = ref(false);
const draft = ref('Draft title');
</script>

<template>
  <div class="divider-title-controls">
    <Checkbox v-model:checked="showTitle">Show title</Checkbox>
    <Checkbox v-model:checked="plain">Plain title</Checkbox>
  </div>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
    probare, quae sunt a te dicta? Refert tamen, quo modo.
  </p>
  <Divider :plain="plain">
    <template v-if="showTitle" #default>
      <strong>Text</strong><Input v-model:value="draft" class="divider-title-draft" aria-label="Divider title draft" size="small" />
    </template>
  </Divider>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
    probare, quae sunt a te dicta? Refert tamen, quo modo.
  </p>
  <Divider title-placement="start">Left Text</Divider>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
    probare, quae sunt a te dicta? Refert tamen, quo modo.
  </p>
  <Divider title-placement="end">Right Text</Divider>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
    probare, quae sunt a te dicta? Refert tamen, quo modo.
  </p>
  <Divider title-placement="start" :styles="{ content: { margin: 0 } }">
    Left Text margin with 0
  </Divider>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
    probare, quae sunt a te dicta? Refert tamen, quo modo.
  </p>
  <Divider title-placement="end" :styles="{ content: { margin: '0 50px' } }">
    Right Text margin with 50px
  </Divider>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
    probare, quae sunt a te dicta? Refert tamen, quo modo.
  </p>
</template>

<style scoped>
.divider-title-controls { display: flex; flex-wrap: wrap; gap: 16px; }
.divider-title-draft { width: min(10rem, 32vw); margin-inline-start: 8px; }
</style>
