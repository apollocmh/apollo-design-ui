<script setup lang="ts">
import { ref } from 'vue';

import { Text } from '../../index';

const editableText = ref('Click the icon to edit');
</script>

<template>
  <Text :editable="true">Click the icon to edit</Text>
  <br />
  <Text
    :editable="{ text: editableText, onChange: (value: string) => (editableText = value) }"
  >
    {{ editableText }}
  </Text>
  <br />
  <Text :editable="{ triggerType: ['text'] }">Click the text to edit</Text>
  <br />
  <Text :editable="{ tooltip: false }">No tooltip on the edit icon</Text>
</template>
