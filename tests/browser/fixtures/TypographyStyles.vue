<script setup lang="ts">
import { Link, Paragraph, Text, Title, Typography } from '@apollo-design/ui';
import { computed, ref, type StyleValue } from 'vue';
import SemanticDemo from '../../../packages/ui/src/typography/demo/semantic.vue';

const phase = ref(0);
const nativeClass = computed(() => phase.value < 3 ? ['native-typography-root', { first: phase.value === 0, next: phase.value === 1, object: phase.value === 2 }] : undefined);
const nativeStyle = computed<StyleValue>(() => {
  if (phase.value === 0) return 'color:rgb(10,20,30);padding-top:8px;padding-bottom:8px;--native-phase:string';
  if (phase.value === 1) return ['color:rgb(30,40,50);padding-bottom:10px;--native-phase:array', { paddingLeft: '6px', '--array-only': 'yes' }];
  if (phase.value === 2) return { color: 'rgb(50,60,70)', paddingBottom: '12px', paddingRight: '9px', '--native-phase': 'object' };
  return undefined;
});
const classNames = { root: 'semantic-typography-root', textarea: 'semantic-typography-textarea' };
const styles = { root: { color: 'rgb(40,50,60)', paddingTop: '2px', paddingBottom: '4px', '--semantic-root': 'kept' }, textarea: { fontSize: '15px' } };
</script>

<template>
  <button type="button" @mousedown.prevent @click="phase = (phase + 1) % 4">Cycle typography styles</button>
  <output data-typography-style-phase>{{ phase }}</output>
  <section data-typography-style-entry="Typography"><Typography :class="nativeClass" :style="nativeStyle" :class-names="classNames" :styles="styles">Typography styles</Typography></section>
  <section data-typography-style-entry="Text"><Text :class="nativeClass" :style="nativeStyle" :class-names="classNames" :styles="styles">Text styles</Text></section>
  <section data-typography-style-entry="Title"><Title :level="2" :class="nativeClass" :style="nativeStyle" :class-names="classNames" :styles="styles">Title styles</Title></section>
  <section data-typography-style-entry="Paragraph"><Paragraph :class="nativeClass" :style="nativeStyle" :class-names="classNames" :styles="styles">Paragraph styles</Paragraph></section>
  <section data-typography-style-entry="Link"><Link href="#typography-styles" :class="nativeClass" :style="nativeStyle" :class-names="classNames" :styles="styles">Link styles</Link></section>
  <section data-typography-style-entry="Text-edit"><Text aria-label="Text style editor" :editable="{ editing: true }" :class="nativeClass" :style="nativeStyle" :class-names="classNames" :styles="styles">Initial Text draft</Text></section>
  <section data-typography-style-entry="Paragraph-edit"><Paragraph aria-label="Paragraph style editor" :editable="{ editing: true }" :class="nativeClass" :style="nativeStyle" :class-names="classNames" :styles="styles">Initial Paragraph draft</Paragraph></section>
  <section data-typography-style-entry="Rich"><Paragraph :class="nativeClass" :style="nativeStyle" :class-names="classNames" :styles="styles">Rich root<input aria-label="Typography style draft" /></Paragraph></section>
  <section data-typography-semantic-demo><SemanticDemo /></section>
</template>
