<script setup lang="ts">
import { Button, Tabs } from '@apollo-design/ui';
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
  <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px">
    <Button @click="custom = !custom">Toggle popup slot</Button>
    <Button @click="empty = !empty">Toggle empty popup</Button>
    <Button @click="label = label === 'Hidden tabs' ? 'More tabs' : 'Hidden tabs'">Update popup label</Button>
  </div>
  <Tabs v-model:activeKey="activeKey" :items="items" style="width: 280px; max-width: 100%">
    <template v-if="custom" #popupRender="{ originNode, restTabs, onClose }">
      <section v-if="!empty" data-tabs-popup style="padding: 8px; background: var(--apollo-color-bg-elevated); color: var(--apollo-color-text)">
        <p data-tabs-popup-summary>{{ label }}: {{ restTabs.length }}</p>
        <component :is="originNode" />
        <Button @click="onClose">Close tabs popup</Button>
      </section>
    </template>
  </Tabs>
  <output data-tabs-active>{{ activeKey }}</output>
</template>
