<script setup lang="ts">
import { Paragraph, Text } from '../../index';

const longText =
  'Ant Design, a design language for background applications, is refined by Ant UED Team. ' +
  'This sentence is intentionally long enough to overflow a narrow box, so the component has ' +
  'to decide where to cut it.';
</script>

<template>
  <Paragraph :ellipsis="{ rows: 1 }" :style="{ width: '220px' }">
    {{ longText }}
  </Paragraph>
  <Paragraph :ellipsis="{ rows: 2 }" :style="{ width: '220px' }">
    {{ longText }}
  </Paragraph>
  <Paragraph :ellipsis="{ rows: 2, expandable: true, suffix: '...more' }" :style="{ width: '220px' }">
    {{ longText }}
  </Paragraph>
  <Text :ellipsis="{ tooltip: 'I am a tooltip' }" :style="{ width: '220px' }">
    {{ longText }}
  </Text>
</template>
