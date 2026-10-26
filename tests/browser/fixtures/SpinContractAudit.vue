<script setup lang="ts">
import { ConfigProvider, Spin, setDefaultIndicator } from '@apollo-design/ui';
import { h, onUnmounted, ref } from 'vue';

const children = ref(false);
const named = ref(false);
const emptyDescription = ref(false);
const themed = ref(true);
const fullscreen = ref(false);
const busy = ref(false);
const percent = ref(0);
const draft = ref('Original body');
const indicatorDraft = ref('Original indicator');
const globalMounted = ref(false);
const globalRender = ref(0);
const provider = h('span', { 'data-provider-indicator': '' }, 'Provider indicator');
function mountGlobal() {
  setDefaultIndicator(0);
  globalMounted.value = true;
}
function replaceGlobal() {
  setDefaultIndicator(h('em', { 'data-global-indicator': '' }, 'Current global'));
}
onUnmounted(() => setDefaultIndicator(undefined));
</script>

<template>
  <main>
    <h1>Spin current contracts</h1>
    <button @click="children = !children">Toggle body slot</button>
    <button @click="named = !named">Toggle named slots</button>
    <button @click="emptyDescription = !emptyDescription">Toggle empty description</button>
    <button @click="percent += 17">Update progress</button>
    <button @click="themed = !themed">Toggle theme</button>
    <button @click="fullscreen = !fullscreen">Toggle fullscreen</button>
    <button @click="busy = !busy">Toggle busy</button>
    <Spin id="conditional-body" :spinning="busy" :fullscreen="fullscreen">
      <template v-if="children" #default>
        <input v-model="draft" aria-label="Conditional body draft" />
      </template>
    </Spin>
    <ConfigProvider :components="{ spin: { indicator: provider } }">
      <Spin id="current-indicator" :percent="percent">
        <template v-if="named" #indicator="scope">
          <span v-if="false">Conditional first node</span>
          <input v-model="indicatorDraft" aria-label="Current indicator draft" />
          <output aria-label="Indicator progress">{{ scope?.percent }}</output>
          <button type="button">Custom action</button>
        </template>
      </Spin>
      <Spin id="empty-indicator"><template #indicator /></Spin>
    </ConfigProvider>
    <Spin id="current-description" description="Prop description">
      <template v-if="emptyDescription" #description><span v-if="false" /></template>
    </Spin>
    <ConfigProvider :theme="themed ? { components: { Spin: { contentHeight: 96, dotSize: 31, dotSizeSM: 13, dotSizeLG: 47 } } } : undefined">
      <Spin id="token-normal" />
      <Spin id="token-small" size="small" />
      <Spin id="token-large" size="large" />
      <Spin id="token-height"><div style="height: 300px">Tall native content</div></Spin>
      <Spin id="native-variable" style="--apollo-spin-dot-size: 35px" />
    </ConfigProvider>
    <Spin size="small" :spinning="false"><Spin id="nested-normal" size="medium" /></Spin>
    <ConfigProvider :theme="{ token: { motion: false } }"><Spin id="motion-disabled" /></ConfigProvider>
    <Spin id="media-motion" />
    <Spin id="zero-progress" :percent="0" />
    <Spin id="empty-body" description="Waiting for content"><template #default /></Spin>
    <button @click="mountGlobal">Mount global zero</button>
    <button @click="replaceGlobal">Replace global default</button>
    <button @click="globalRender++">Render global again</button>
    <Spin v-if="globalMounted" id="global-content" :description="String(globalRender)" />
  </main>
</template>
