const t=`<script setup lang="ts">
// 对齐 antd demo/style-class.tsx
import { FloatButton } from '@apollo-design/ui';
<\/script>

<template>
  <FloatButton
    :class-names="{ root: 'demo-fb-root', icon: 'demo-fb-icon' }"
    :styles="{ icon: { color: 'blue' } }"
  />
</template>
`;export{t as default};
