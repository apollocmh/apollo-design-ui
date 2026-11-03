<script setup lang="ts">
import type { FlexProps } from '@apollo-design/ui';
import { Button, Flex, Radio, Slider } from '@apollo-design/ui';
import { ref } from 'vue';

const gapSize = ref<FlexProps['gap']>('small');
const customGapSize = ref(0);
</script>

<template>
  <Flex gap="middle" vertical>
    <fieldset style="margin: 0; padding: 0; border: 0; min-width: 0">
      <legend>Gap preset</legend>
      <Radio.Group v-model:value="gapSize" :options="['small', 'medium', 'large', 'customize']" />
    </fieldset>
    <template v-if="gapSize === 'customize'">
      <span>Custom gap</span>
      <Slider v-model:value="customGapSize" aria-label="Custom gap" :min="0" :max="64" style="width: 100%" />
      <output>{{ customGapSize }}px</output>
    </template>
    <Flex :gap="gapSize !== 'customize' ? gapSize : customGapSize" wrap>
      <Button>First</Button>
      <Button>Second</Button>
      <Button>Third</Button>
      <Button>Fourth</Button>
    </Flex>
  </Flex>
</template>
