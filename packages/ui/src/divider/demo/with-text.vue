<script setup lang="ts">
import { ref } from 'vue';
import { Divider } from '../../index';

const showTitle = ref(true);
const plain = ref(false);
const draft = ref('Draft title');
</script>

<template>
  <div class="divider-title-controls">
    <label><input v-model="showTitle" type="checkbox" /> Show title</label>
    <label><input v-model="plain" type="checkbox" /> Plain title</label>
  </div>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
    probare, quae sunt a te dicta? Refert tamen, quo modo.
  </p>
  <Divider :plain="plain">
    <template v-if="showTitle" #default>
      <strong>Text</strong><input v-model="draft" class="divider-title-draft" aria-label="Divider title draft" />
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
.divider-title-controls label { display: inline-flex; align-items: center; gap: 4px; }
.divider-title-draft { width: min(10rem, 40vw); margin-inline-start: 8px; }
</style>
