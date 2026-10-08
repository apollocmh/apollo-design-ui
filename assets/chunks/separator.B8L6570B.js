const a=`<script setup lang="ts">
// 对齐 antd demo：分隔符为富内容 —— C8-R2 后走 \`#separator\` 插槽
import { Divider, Space } from '../../index';
import { LINK } from './_standin';
<\/script>

<template>
  <Space>
    <template #separator>
      <Divider orientation="vertical" />
    </template>
    <a href="#separator" :style="LINK">Link</a>
    <a href="#separator" :style="LINK">Link</a>
    <a href="#separator" :style="LINK">Link</a>
  </Space>
</template>
`;export{a as default};
