const e=`<script setup lang="ts">
// 对齐 antd 的 group demo（antd 在 onChange 里 console.log ⇒ 移除）
import { Checkbox } from '@apollo-design/ui';

const plainOptions = ['Apple', 'Pear', 'Orange'];

const options = [
  { label: 'Apple', value: 'Apple', className: 'label-1' },
  { label: 'Pear', value: 'Pear', className: 'label-2' },
  { label: 'Orange', value: 'Orange', className: 'label-3' },
];

const optionsWithDisabled = [
  { label: 'Apple', value: 'Apple', className: 'label-1' },
  { label: 'Pear', value: 'Pear', className: 'label-2' },
  { label: 'Orange', value: 'Orange', className: 'label-3', disabled: false },
];
<\/script>

<template>
  <div>
    <Checkbox.Group :options="plainOptions" :default-value="['Apple']" />
    <br />
    <br />
    <Checkbox.Group :options="options" :default-value="['Pear']" />
    <br />
    <br />
    <Checkbox.Group :options="optionsWithDisabled" disabled :default-value="['Apple']" />
  </div>
</template>
`;export{e as default};
