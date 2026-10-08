const e=`<script setup lang="ts">
// 对齐 antd 的 span / styles 定制（含 deprecated 的 children 形态）
import { Descriptions, DescriptionsItem } from '@apollo-design/ui';
<\/script>

<template>
  <Descriptions title="Styles & span">
    <DescriptionsItem label="Styles" :styles="{ content: { color: 'rgb(22, 119, 255)' } }">
      Blue content
    </DescriptionsItem>
    <DescriptionsItem label="Span" :span="2">占两列</DescriptionsItem>
    <DescriptionsItem label="Filled" span="filled">填满整行</DescriptionsItem>
  </Descriptions>
</template>
`;export{e as default};
