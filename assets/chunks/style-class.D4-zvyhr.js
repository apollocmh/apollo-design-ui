const t=`<script setup lang="ts">
// 对齐 antd 的 style-class demo（语义槽位对象式；函数式由 L1 覆盖）。C8-R2：extra 走插槽。
import { Button, Result } from '@apollo-design/ui';

const classNamesObject = {
  root: 'demo-result-root',
  title: 'demo-result-title',
  subTitle: 'demo-result-subtitle',
  icon: 'demo-result-icon',
  extra: 'demo-result-extra',
  body: 'demo-result-body',
};

const stylesObject = {
  root: { borderWidth: '2px', borderStyle: 'dashed', padding: '16px' },
  icon: { opacity: 0.8 },
  extra: { backgroundColor: '#f0f0f0', padding: '8px' },
};
<\/script>

<template>
  <Result
    status="success"
    title="Successfully Purchased Cloud Server ECS!"
    sub-title="Order number: 2017182818828182881"
    :class-names="classNamesObject"
    :styles="stylesObject"
  >
    <template #extra>
      <Button type="primary">Go Console</Button>
    </template>
  </Result>
</template>
`;export{t as default};
