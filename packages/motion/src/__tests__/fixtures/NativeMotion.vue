<script setup lang="ts">
import { ref } from 'vue';
import { CSSMotion } from '../../css-motion';
import { MotionList } from '../../motion-list';

const visible = ref(true);
const renderContent = ref(true);
const node = ref<HTMLElement | null>(null);
const changed = ref<boolean[]>([]);
const keys = ref([{ key: 'a', title: 'Alpha' }]);
const removals = ref(0);
defineExpose({ visible, renderContent, node, changed, keys, removals });
</script>

<template>
  <CSSMotion :visible="visible" :support-motion="false" id="compiled-motion" class="external-root" @visible-changed="value => changed.push(value)">
    <template #default="{ className, style }">
      <!-- conditional root retains its own DOM ref -->
      <button v-if="renderContent" ref="node" :class="['slot-root', className]" :style="style">Full <b>content</b> 0</button>
    </template>
  </CSSMotion>
  <MotionList :keys="keys" :support-motion="false" :component="null" @all-removed="removals++">
    <template #default="{ itemKey, index, className, style, title }"><article :data-key="itemKey" :data-index="index" :class="className" :style="style">{{ title }}</article></template>
  </MotionList>
</template>
