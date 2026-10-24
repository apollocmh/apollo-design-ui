<script setup lang="ts">
import { Drawer } from '@apollo-design/ui';
import { ref } from 'vue';

const show = ref(false);
const empty = ref(false);
const label = ref('first');
const value = ref('body');
const external = ref(false);
</script>

<template>
  <h2 id="external-heading">External heading</h2>
  <button @click="show = !show">Toggle Drawer slots</button>
  <button @click="empty = !empty">Toggle Drawer empty</button>
  <button @click="label = label === 'first' ? 'second' : 'first'">Update Drawer label</button>
  <button @click="external = !external">Toggle external label</button>
  <div style="position: relative; height: 500px; margin-top: 16px">
    <Drawer open :get-container="false" :auto-focus="false" :mask="false" title="fallback" :aria-labelledby="external ? 'external-heading' : undefined">
      <input v-model="value" aria-label="Drawer body" />
      <template v-if="show" #title><b v-if="!empty">{{ label }}</b></template>
      <template v-if="show" #footer><small v-if="!empty">{{ label }}</small></template>
      <template v-if="show" #extra><aside v-if="!empty">{{ label }}</aside></template>
      <template v-if="show" #closeIcon><span v-if="!empty">×</span></template>
    </Drawer>
  </div>
</template>
