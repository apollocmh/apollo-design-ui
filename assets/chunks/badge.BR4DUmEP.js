const t=`<script setup lang="ts">
// 对齐 antd demo/badge.tsx（badge 数据 prop）
import { QuestionCircleOutlined } from '@apollo-design/icons';
import { FloatButton, FloatButtonBackTop, FloatButtonGroup } from '@apollo-design/ui';
<\/script>

<template>
  <div>
    <FloatButton shape="circle" style="inset-inline-end: 164px" :badge="{ dot: true }" />
    <FloatButtonGroup shape="circle" style="inset-inline-end: 94px">
      <FloatButton :badge="{ count: 5, color: 'blue' }" />
      <FloatButton :badge="{ count: 5 }" />
    </FloatButtonGroup>
    <FloatButtonGroup shape="circle">
      <FloatButton :badge="{ count: 12 }" #icon>
        <QuestionCircleOutlined />
      </FloatButton>
      <FloatButton :badge="{ count: 123, overflowCount: 999 }" />
      <FloatButtonBackTop :visibility-height="0" />
    </FloatButtonGroup>
  </div>
</template>
`;export{t as default};
