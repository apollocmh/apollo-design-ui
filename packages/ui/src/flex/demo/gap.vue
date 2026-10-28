<script setup lang="ts">
import type { FlexProps } from '@apollo-design/ui';
import { Flex } from '@apollo-design/ui';
import { ref, useId } from 'vue';

const gapSize = ref<FlexProps['gap']>('small');
const customGapSize = ref(0);
const gapName = useId();
const rangeId = useId();
</script>

<template>
  <Flex gap="middle" vertical>
    <fieldset style="margin: 0; padding: 0; border: 0; min-width: 0">
      <legend>Gap preset</legend>
      <div style="display: flex; flex-wrap: wrap; gap: 12px">
        <label v-for="size in ['small', 'medium', 'large', 'customize']" :key="size">
          <input v-model="gapSize" type="radio" :name="gapName" :value="size" /> {{ size }}
        </label>
      </div>
    </fieldset>
    <template v-if="gapSize === 'customize'">
      <label :for="rangeId">Custom gap</label>
      <input :id="rangeId" v-model.number="customGapSize" type="range" min="0" max="64" style="max-width: 100%" />
      <output>{{ customGapSize }}px</output>
    </template>
    <Flex :gap="gapSize !== 'customize' ? gapSize : customGapSize" wrap>
      <button type="button">First</button>
      <button type="button">Second</button>
      <button type="button">Third</button>
      <button type="button">Fourth</button>
    </Flex>
  </Flex>
</template>
