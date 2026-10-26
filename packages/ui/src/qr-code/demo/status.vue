<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import type { QrcodeStatusType } from '../../index';
import { QrCode } from '../../index';

const status = ref<QrcodeStatusType>('loading');
const custom = ref(true),
  empty = ref(false);
const draft = ref('Current status draft');
let timer: ReturnType<typeof setTimeout> | undefined;
function select(next: QrcodeStatusType) {
  clearTimeout(timer);
  timer = undefined;
  status.value = next;
  if (next === 'loading')
    timer = setTimeout(() => {
      status.value = 'expired';
    }, 1000);
}
function refresh() {
  select('loading');
}
onMounted(refresh);
onUnmounted(() => clearTimeout(timer));
</script>

<template>
  <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px">
    <button type="button" @click="select('active')">Active</button>
    <button type="button" @click="select('loading')">Loading</button>
    <button type="button" @click="select('expired')">Expired</button>
    <button type="button" @click="select('scanned')">Scanned</button>
    <label><input v-model="custom" type="checkbox" /> Custom status</label>
    <label><input v-model="empty" type="checkbox" /> Empty status</label>
  </div>
  <div style="display: flex; flex-wrap: wrap; gap: 24px">
    <QrCode value="https://apollo.design" title="Default status access" :status="status" @refresh="refresh" />
    <QrCode value="https://apollo.design/status" title="Custom status access" :status="status" @refresh="refresh">
      <template v-if="custom" #status="{ status: current, locale, refresh: requestRefresh }">
        <template v-if="!empty">
          <span v-if="false">Conditional first node</span>
          <input v-model="draft" aria-label="QR status draft" style="width: 112px; max-width: 100%" />
          <output aria-label="QR current status">{{ current }}</output>
          <button v-if="requestRefresh" type="button" @click="requestRefresh">{{ locale.refresh }}</button>
        </template>
      </template>
    </QrCode>
  </div>
</template>
