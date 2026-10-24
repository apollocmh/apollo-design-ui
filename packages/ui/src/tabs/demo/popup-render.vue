<script setup lang="ts">
import { Tabs } from '@apollo-design/ui';
import { ref } from 'vue';

const custom = ref(false);
const empty = ref(false);
const label = ref('Hidden tabs');
const activeKey = ref('1');
const items = Array.from({ length: 12 }, (_, index) => ({
  key: String(index + 1),
  label: `Tab ${index + 1}`,
  children: `Panel ${index + 1}`,
}));
</script>

<template>
  <div style="display: flex; gap: 8px; margin-bottom: 12px">
    <button @click="custom = !custom">Toggle popup slot</button>
    <button @click="empty = !empty">Toggle empty popup</button>
    <button @click="label = label === 'Hidden tabs' ? 'More tabs' : 'Hidden tabs'">Update popup label</button>
  </div>
  <Tabs v-model:activeKey="activeKey" :items="items" style="width: 280px">
    <template v-if="custom" #popupRender="{ originNode, restTabs, onClose }">
      <section v-if="!empty" data-tabs-popup style="padding: 8px; background: white">
        <p data-tabs-popup-summary>{{ label }}: {{ restTabs.length }}</p>
        <component :is="originNode" />
        <button @click="onClose">Close tabs popup</button>
      </section>
    </template>
  </Tabs>
  <output data-tabs-active>{{ activeKey }}</output>
</template>
