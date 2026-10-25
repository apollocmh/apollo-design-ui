<script setup lang="ts">
import { ConfigProvider, Link, Paragraph, Text, Title, Typography, type ConfigProviderProps, type TypographyConfig } from '@apollo-design/ui';
import { ref } from 'vue';
import SemanticDemo from '../../../packages/ui/src/typography/demo/semantic.vue';

const phase = ref(0);
const makeConfig = (current: number): TypographyConfig => {
  const marker = current === 0 ? 'first' : current === 1 ? 'second' : 'function';
  const classes = { root: `provider-root-${marker}`, actions: `provider-actions-${marker}`, action: `provider-action-${marker}`, textarea: `provider-textarea-${marker}` };
  const semanticStyles = {
    root: { paddingTop: '3px', borderTopWidth: `${current + 1}px`, '--provider-semantic': marker },
    actions: { paddingInlineEnd: `${current + 1}px` },
    action: { marginInlineEnd: `${current * 2 + 4}px` },
    textarea: { fontSize: `${current + 13}px`, '--provider-textarea': marker },
  };
  return {
    className: `provider-class-${marker}`,
    style: { color: 'rgb(10,20,30)', paddingTop: `${current * 2 + 6}px`, paddingBottom: '5px', '--provider-style': marker },
    classNames: current === 2 ? ({ props }) => ({ ...classes, root: `${classes.root} ${props.prefixCls === 'apollo-typography' ? 'provider-prefix-resolved' : 'provider-prefix-missing'}` }) : classes,
    styles: current === 2 ? ({ props }) => ({ ...semanticStyles, root: { ...semanticStyles.root, '--provider-prefix': props.prefixCls ?? 'missing' } }) : semanticStyles,
  };
};
const components = ref<NonNullable<ConfigProviderProps['components']>>({ typography: { ...makeConfig(0) } });
const replace = () => {
  phase.value = (phase.value + 1) % 4;
  components.value = phase.value === 3 ? {} : { typography: { ...makeConfig(phase.value) } };
};
const mutate = () => {
  const config = components.value.typography;
  if (config?.style) config.style.paddingTop = '18px';
};
const classNames = { root: 'local-provider-root', actions: 'local-provider-actions', action: 'local-provider-action', textarea: 'local-provider-textarea' };
const styles = { root: { color: 'rgb(70,80,90)', paddingBottom: '14px', '--local-root': 'kept' }, actions: { marginInlineStart: '18px' }, action: { paddingInlineStart: '2px' }, textarea: { lineHeight: '24px' } };
const nativeStyle = { color: 'rgb(90,100,110)', paddingBottom: '16px', '--native-root': 'kept' };
</script>

<template>
  <button type="button" @mousedown.prevent @click="replace">Replace provider configuration</button>
  <button type="button" @mousedown.prevent @click="mutate">Mutate provider padding</button>
  <output data-typography-provider-phase>{{ phase }}</output>
  <ConfigProvider :components="components">
    <section data-provider-entry="Typography"><Typography class="native-provider-root" :style="nativeStyle" :class-names="classNames" :styles="styles">Provider Typography</Typography></section>
    <section data-provider-entry="Text"><Text class="native-provider-root" :style="nativeStyle" :class-names="classNames" :styles="styles" copyable>Provider Text</Text></section>
    <section data-provider-entry="Title"><Title :level="2" class="native-provider-root" :style="nativeStyle" :class-names="classNames" :styles="styles" copyable>Provider Title</Title></section>
    <section data-provider-entry="Paragraph"><Paragraph class="native-provider-root" :style="nativeStyle" :class-names="classNames" :styles="styles" copyable>Provider Paragraph</Paragraph></section>
    <section data-provider-entry="Link"><Link href="#typography-provider" class="native-provider-root" :style="nativeStyle" :class-names="classNames" :styles="styles" copyable>Provider Link</Link></section>
    <section data-provider-entry="Text-edit"><Text aria-label="Provider Text editor" :editable="{ editing: true }" class="native-provider-root" :style="nativeStyle" :class-names="classNames" :styles="styles">Initial provider edit draft</Text></section>
    <section data-provider-entry="Rich"><Paragraph class="native-provider-root" :style="nativeStyle" :class-names="classNames" :styles="styles" copyable>Provider rich content<input aria-label="Typography provider draft" /></Paragraph></section>
    <section data-provider-entry="Local-only"><Paragraph class="native-provider-root" :class-names="classNames" :styles="styles" copyable>Local root priority</Paragraph></section>
  </ConfigProvider>
  <section data-typography-provider-semantic-demo><SemanticDemo /></section>
</template>
