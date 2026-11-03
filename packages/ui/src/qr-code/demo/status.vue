<script setup lang="ts">
import type { QrcodeStatusType } from '@apollo-design/ui';
import { Button, Checkbox, Input, QrCode } from '@apollo-design/ui';
import { onMounted, onUnmounted, ref } from 'vue';

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
    <Button @click="select('active')">Active</Button>
    <Button @click="select('loading')">Loading</Button>
    <Button @click="select('expired')">Expired</Button>
    <Button @click="select('scanned')">Scanned</Button>
    <Checkbox v-model:checked="custom">Custom status</Checkbox>
    <Checkbox v-model:checked="empty">Empty status</Checkbox>
  </div>
  <div style="display: flex; flex-wrap: wrap; gap: 24px">
    <QrCode value="https://apollo.design" title="Default status access" :status="status" @refresh="refresh" />
    <QrCode value="https://apollo.design/status" title="Custom status access" :status="status" @refresh="refresh">
      <template v-if="custom" #status="{ status: current, locale, refresh: requestRefresh }">
        <template v-if="!empty">
          <span v-if="false">Conditional first node</span>
          <Input v-model:value="draft" aria-label="QR status draft" style="width: 112px; max-width: 100%" />
          <output aria-label="QR current status">{{ current }}</output>
          <Button v-if="requestRefresh" size="small" @click="requestRefresh">{{ locale.refresh }}</Button>
        </template>
      </template>
    </QrCode>
  </div>
</template>
