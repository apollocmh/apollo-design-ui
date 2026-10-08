const e=`<script setup lang="ts">
// 对齐 antd 的 style-class demo（语义化三槽：root / icon / label）
import { Checkbox } from '@apollo-design/ui';

const classNames = { root: 'demo-checkbox-root', label: 'demo-checkbox-label' };
const styles = {
  icon: { borderRadius: '50%' },
  label: { fontWeight: 600 },
};
<\/script>

<template>
  <Checkbox :class-names="classNames" :styles="styles">Semantic styles</Checkbox>
</template>

<style>
.demo-checkbox-root {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 8px;
}
.demo-checkbox-label {
  color: #1677ff;
}
</style>
`;export{e as default};
