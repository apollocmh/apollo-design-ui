const e=`<script setup lang="ts">
// 对齐 antd demo/variant.tsx
import { Flex, Mentions } from '@apollo-design/ui';
<\/script>

<template>
  <Flex vertical :gap="12">
    <Mentions placeholder="Outlined" />
    <Mentions placeholder="Filled" variant="filled" />
    <Mentions placeholder="Borderless" variant="borderless" />
    <Mentions placeholder="Underlined" variant="underlined" />
  </Flex>
</template>
`;export{e as default};
