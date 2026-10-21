<script setup lang="ts">
// controls：关闭增减按钮，或传入自定义上下箭头图标
import { DownOutlined, UpOutlined } from '@apollo-design/icons';
import { InputNumber } from '@apollo-design/ui';
import { h, ref } from 'vue';

const noControls = ref<number | null>(3);
const customControlsValue = ref<number | null>(5);
const customControls = {
  upIcon: h(UpOutlined),
  downIcon: h(DownOutlined),
};
</script>

<template>
  <div
    style="display: flex; flex-direction: column; gap: 12px; width: 260px; font-family: sans-serif"
  >
    <InputNumber v-model:value="noControls" :controls="false" placeholder="controls=false" />
    <InputNumber
      v-model:value="customControlsValue"
      :controls="customControls"
      placeholder="自定义箭头"
    />
    <div style="font-size: 12px; color: #999">
      controls=false：{{ noControls ?? '空' }}；自定义箭头：{{ customControlsValue ?? '空' }}
    </div>
  </div>
</template>
