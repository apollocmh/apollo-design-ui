<script setup lang="ts">
import { Divider, Mentions, type MentionsOptionProps } from '@apollo-design/ui';
import { ref } from 'vue';

const show = ref(true);
const empty = ref(false);
const revision = ref(0);
const value = ref('');
const options = ref<MentionsOptionProps[]>([
  { value: 'afc163', label: 'afc163' },
  { value: 'zombieJ', label: 'zombieJ' },
  { value: 'yesmeck', label: 'yesmeck' },
]);
const updateOptions = () => {
  options.value = options.value.map((option) => ({ ...option, label: `${option.value} updated` }));
};
</script>

<template>
  <div>
    <p>
      <button @mousedown.prevent @click="show = !show">Toggle mention popup slot</button>
      <button @mousedown.prevent @click="empty = !empty">Empty mention popup slot</button>
      <button @mousedown.prevent @click="revision++">Update mention header</button>
      <button @mousedown.prevent @click="updateOptions">Update mention options</button>
    </p>
    <Mentions v-model:value="value" aria-label="Custom mention editor" style="width: 100%" :options="options" allow-clear>
      <template v-if="show" #popupRender="{ originNode }">
        <section v-if="!empty" data-native-mentions-popup>
          <header class="native-mentions-header">Custom Header {{ revision }}</header>
          <Divider style="margin: var(--apollo-margin-xxs) 0" />
          <component :is="originNode" />
        </section>
      </template>
    </Mentions>
    <output data-mention-value>{{ value }}</output>
  </div>
</template>

<style scoped>
.native-mentions-header {
  padding: var(--apollo-padding-xs) var(--apollo-padding-sm);
  font-weight: var(--apollo-font-weight-strong);
  color: var(--apollo-color-text-description);
}
</style>
