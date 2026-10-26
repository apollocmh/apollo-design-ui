<script setup lang="ts">
import { darkAlgorithm } from '@apollo-design/theme';
import type { QrcodeStatusType } from '@apollo-design/ui';
import { ConfigProvider, QrCode } from '@apollo-design/ui';
import { computed, ref, type StyleValue } from 'vue';

const custom = ref(false),
  empty = ref(false),
  listening = ref(false),
  translated = ref(false),
  themed = ref(true);
const dark = ref(false);
const type = ref<'canvas' | 'svg'>('canvas');
const status = ref<QrcodeStatusType>('expired');
const refreshes = ref(0),
  stylePhase = ref(0),
  iconPhase = ref(0);
const delayedIcon = ref(false);
const draft = ref('Original status draft');
const foreground = ref(false),
  background = ref(false),
  nativeVariable = ref(false),
  valueChanged = ref(false);
const logo = (color: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="${color}"/></svg>`)}`;
const icon = computed(() =>
  delayedIcon.value
    ? './controlled-icon.svg'
    : [undefined, logo('#e000e0'), logo('#0044ee'), 'data:image/png;base64,AA=='][iconPhase.value],
);
const value = computed(() => (valueChanged.value ? ['Current ', 'segments'] : 'Apollo current QR'));
const color = computed(() => (foreground.value ? '#c62828' : undefined));
const bgColor = computed(() => (background.value ? '#f0f5ff' : undefined));
const nativeStyles = computed<StyleValue>(() =>
  stylePhase.value === 0
    ? [{ width: '220px' }, { height: '210px' }]
    : stylePhase.value === 1
      ? 'width:220px;height:210px'
      : { width: 220, height: 210 },
);
function cycleStatus() {
  status.value =
    status.value === 'expired' ? 'loading' : status.value === 'loading' ? 'scanned' : 'expired';
}
</script>

<template>
  <main>
    <h1>QRCode current contracts</h1>
    <nav aria-label="Fixture controls">
      <button @click="custom = !custom">Toggle status slot</button>
      <button @click="empty = !empty">Toggle empty slot</button>
      <button @click="listening = !listening">Toggle refresh listener</button>
      <button @click="translated = !translated">Toggle locale</button>
      <button @click="themed = !themed">Toggle QR theme</button>
      <button @click="dark = !dark">Toggle dark algorithm</button>
      <button @click="nativeVariable = !nativeVariable">Toggle native variable</button>
      <button @click="cycleStatus">Cycle status</button>
      <button @click="type = type === 'canvas' ? 'svg' : 'canvas'">Toggle rendering mode</button>
      <button @click="stylePhase = (stylePhase + 1) % 3">Cycle native style</button>
      <button @click="foreground = !foreground">Toggle foreground</button>
      <button @click="background = !background">Toggle background</button>
      <button @click="valueChanged = !valueChanged">Toggle QR value</button>
      <button @click="iconPhase = (iconPhase + 1) % 4">Cycle QR icon</button>
      <button @click="delayedIcon = true">Use delayed icon</button>
    </nav>
    <output aria-label="Refresh count">{{ refreshes }}</output>
    <ConfigProvider :locale="translated ? { locale: 'custom', QRCode: { expired: 'Current expired', refresh: 'Current refresh', scanned: 'Current scanned' } } : { locale: 'en', QRCode: {} }"
      :theme="themed ? { algorithm: dark ? darkAlgorithm : undefined, components: { QRCode: { QRCodeCoverBackgroundColor: '#e8f4ec' } } } : dark ? { algorithm: darkAlgorithm } : undefined">
      <div data-qr-stage style="display: flex; flex-wrap: wrap; gap: 24px; margin-top: 24px; background: var(--apollo-color-bg-container)">
        <QrCode id="qr-main" :value="value" :type="type" title="Workspace access" :margin-size="4" :style="nativeStyles" :color="color" :bg-color="bgColor" :icon="icon" />
        <QrCode id="qr-oracle" :value="value" type="svg" title="Oracle access" :margin-size="4" :color="color" :bg-color="bgColor" />
        <QrCode id="qr-status" value="Current status" :type="type" :status="status" title="Status access" v-on="listening ? { refresh: () => refreshes++ } : {}"
          :style="nativeVariable ? { '--apollo-qrcode-cover-background-color': '#ffeecc' } : undefined">
          <template v-if="custom" #status="scope">
            <template v-if="!empty">
              <span v-if="false">Conditional first node</span>
              <input v-model="draft" aria-label="Current status draft" style="width: 110px; max-width: 100%" />
              <output aria-label="Current status scope">{{ scope?.status }}</output>
              <button v-if="scope?.refresh" type="button" @click="scope.refresh">{{ scope.locale.refresh }}</button>
            </template>
          </template>
        </QrCode>
        <QrCode id="qr-default" value="Default named graphic" type="svg" />
      </div>
    </ConfigProvider>
  </main>
</template>
