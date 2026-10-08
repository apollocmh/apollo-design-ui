const e=`<script setup lang="ts">
// 对齐 antd 的 addon demo。
//
// ⚠️ 上游用的是 **已废弃** 的 \`addon\` prop；本仓照它的**替代品** \`renderExtraFooter\` 写，
//    并额外演示受控开合（面板底部那个按钮负责关闭）。
import { Button, TimePicker } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
<\/script>

<template>
  <TimePicker v-model:open="open">
    <template #extraFooter>
      <Button size="small" type="primary" @click="open = false">OK</Button>
    </template>
  </TimePicker>
</template>
`;export{e as default};
