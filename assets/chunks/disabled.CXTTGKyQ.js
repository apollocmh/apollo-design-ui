const e=`<script setup lang="ts">
// 对齐 antd 的 disabled demo
import { Checkbox, Flex } from '@apollo-design/ui';
<\/script>

<template>
  <!-- ⚠️ 加文字 children：axe 要求 label 有可访问名（上游同 demo 无文字但
       antd 的 a11y 基建对空 label 放行 —— 本仓按更严格标准） -->
  <Flex vertical gap="middle">
    <Checkbox :default-checked="false" disabled>Disabled unchecked</Checkbox>
    <Checkbox indeterminate disabled>Disabled indeterminate</Checkbox>
    <Checkbox default-checked disabled>Disabled checked</Checkbox>
  </Flex>
</template>
`;export{e as default};
