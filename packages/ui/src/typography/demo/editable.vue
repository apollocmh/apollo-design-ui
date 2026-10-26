<script setup lang="ts">
import { Text } from '@apollo-design/ui';
import { ref } from 'vue';

const editableText = ref('Click the icon to edit');
const showContent = ref(false);
const revision = ref(0);
const currentText = ref('Current template text 0');
const updateText = () => {
  revision.value++;
  currentText.value = `Current template text ${revision.value}`;
};
</script>

<template>
  <Text aria-label="Editable plain text" :editable="true">Click the icon to edit</Text>
  <br />
  <Text
    aria-label="Controlled editable text"
    :editable="{ text: editableText, onChange: (value: string) => (editableText = value) }"
  >
    {{ editableText }}
  </Text>
  <br />
  <Text aria-label="Edit by clicking text" :editable="{ triggerType: ['text'] }">Click the text to edit</Text>
  <br />
  <Text aria-label="Editable without tooltip" :editable="{ tooltip: false }">No tooltip on the edit icon</Text>
  <section data-conditional-typography>
    <p>
      <button type="button" @mousedown.prevent @click="showContent = !showContent">Toggle editable content</button>
      <button type="button" @mousedown.prevent @click="updateText">Update editable text</button>
    </p>
    <Text aria-label="Conditional editable text" copyable
      :editable="{ onChange: (value: string) => (currentText = value) }">
      <template v-if="showContent" #default>{{ currentText }}</template>
    </Text>
  </section>
</template>
