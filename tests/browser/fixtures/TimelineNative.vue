<script setup lang="ts">
import { ConfigProvider, Steps, Timeline, type StepsProps, type TimelineItemType } from '@apollo-design/ui';
import { h, ref, shallowRef } from 'vue';

const rows = shallowRef<TimelineItemType[]>([
  { key: 'a', title: 'Alpha', content: h('input', { 'aria-label': 'Timeline native input' }),
    classNames: { root: 'timeline-data-root', content: 'timeline-data-content' },
    styles: { root: { minHeight: '80px' }, content: { opacity: 0.45 }, rail: { borderStyle: 'dashed' } } },
  { key: 'b', title: 'Beta', content: 'Second' },
]);
const reverse = ref(false);
const horizontal = ref(false);
const alternate = ref(false);
const attrsUpdated = ref(false);
const rtl = ref(false);
const titleSpan = ref<string | number>(6);
const current = ref(0);
const changes = ref(0);
const maxCount = ref<number | undefined>(3);
const stepItems = ref(Array.from({ length: 8 }, (_, index) => ({ key: index, title: `Step ${index}` })));
const classNames: StepsProps['classNames'] = ({ props }) => ({ root: `step-current-${props.current}` });
const styles: StepsProps['styles'] = ({ props }) => ({ root: { opacity: props.current === 0 ? 1 : 0.5 } });
const updateSemantics = () => { rows.value = rows.value.map(row => row.key === 'a' ? {
  ...row, classNames: { root: 'timeline-data-new', content: 'timeline-content-new' },
  styles: { root: { minHeight: '120px' }, content: { opacity: 0.7 }, rail: { borderStyle: 'dotted' } },
} : row); };
const replaceRows = () => { rows.value = [...rows.value].reverse().map(row => ({ ...row, title: row.key === 'a' ? 'Alpha updated' : 'Beta updated' })); };
const layout = () => { reverse.value = true; horizontal.value = true; titleSpan.value = '35%'; };
const onChange = (value: number) => { changes.value++; current.value = value; };
</script>

<template>
  <button @click="updateSemantics">Update item semantics</button>
  <button @click="replaceRows">Update timeline data</button>
  <button @click="layout">Change timeline layout</button>
  <button @click="alternate = !alternate">Toggle timeline alternate</button>
  <button @click="attrsUpdated = !attrsUpdated">Update timeline attrs</button>
  <button @click="rtl = !rtl">Change timeline defaults</button>
  <button @click="current = 4">Advance current step</button>
  <button @click="maxCount = undefined">Expand native steps</button>
  <ConfigProvider :direction="rtl ? 'rtl' : 'ltr'" :components="{ timeline: { className: rtl ? 'configured-new' : 'configured-old' } }">
    <Timeline data-native-timeline :items="rows" :reverse="reverse"
      :orientation="horizontal ? 'horizontal' : 'vertical'" :mode="alternate ? 'alternate' : 'end'"
      :title-span="titleSpan" :class="attrsUpdated ? ['native-new', { active: true }] : 'native-old'"
      :style="attrsUpdated ? 'color:blue;--timeline-accent:green' : 'color:red'" />
    <Steps data-native-steps :items="stepItems" :current="current" :max-count="maxCount"
      :class-names="classNames" :styles="styles" :responsive="false"
      :class="attrsUpdated ? 'steps-new' : 'steps-old'"
      :style="attrsUpdated ? 'color:blue;--steps-accent:green' : 'color:red'" @change="onChange" />
  </ConfigProvider>
  <output id="timeline-native-state">{{ JSON.stringify({ current, changes }) }}</output>
</template>
