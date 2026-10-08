const e=`<script setup lang="ts">
// 对齐 antd demo/dark.tsx（上游在弹窗里塞了整个 antd 的暗色示例；
// 本 demo 保留「暗色主题下的 Modal」这一意图，内容用一小组组件代替）

import { darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider, Modal, Switch } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(true);
const disabled = ref(false);
<\/script>

<template>
  <ConfigProvider :theme="{ algorithm: darkAlgorithm }">
    <Switch v-model:checked="disabled" checked-children="Disabled" un-checked-children="Enabled" />
    <Modal
      title="Dark Modal"
      :open="open"
      @ok="open = false"
      @cancel="open = false"
    >
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Slider / Timeline 尚未落地，这里用纯文本代替（意图不变：展示暗色主题下的内容区）。</p>
    </Modal>
  </ConfigProvider>
</template>
`;export{e as default};
