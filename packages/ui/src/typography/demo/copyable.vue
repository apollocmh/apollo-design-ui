<script setup lang="ts">
import { Paragraph, Text } from '../../index';
</script>

<template>
  <Paragraph :copyable="true">Copy me to the clipboard</Paragraph>
  <Paragraph :copyable="{ text: 'Custom copy text' }">Shown text is different from copied text</Paragraph>
  <Paragraph :copyable="{ tooltips: ['Click to copy', 'Copied!'] }">Custom tooltips</Paragraph>
  <Text :copyable="true" />
</template>
