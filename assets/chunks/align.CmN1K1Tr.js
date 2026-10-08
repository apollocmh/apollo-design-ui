const n=`<script setup lang="ts">
import { Space } from '../../index';
import { ALIGN_BOX, BTN_PRIMARY, MOCK_BOX, ROW_WRAP } from './_standin';
<\/script>

<template>
  <div :style="ROW_WRAP">
    <div :style="ALIGN_BOX">
      <Space align="center">
        center
        <button type="button" :style="BTN_PRIMARY">Primary</button>
        <span :style="MOCK_BOX">Block</span>
      </Space>
    </div>
    <div :style="ALIGN_BOX">
      <Space align="start">
        start
        <button type="button" :style="BTN_PRIMARY">Primary</button>
        <span :style="MOCK_BOX">Block</span>
      </Space>
    </div>
    <div :style="ALIGN_BOX">
      <Space align="end">
        end
        <button type="button" :style="BTN_PRIMARY">Primary</button>
        <span :style="MOCK_BOX">Block</span>
      </Space>
    </div>
    <div :style="ALIGN_BOX">
      <Space align="baseline">
        baseline
        <button type="button" :style="BTN_PRIMARY">Primary</button>
        <span :style="MOCK_BOX">Block</span>
      </Space>
    </div>
  </div>
</template>
`;export{n as default};
