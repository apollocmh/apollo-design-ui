const n=`<script setup lang="ts">
// 对齐 antd \`components.tsx\`：把尺寸切换器换成 InputNumber。
import { InputNumber, Pagination } from '@apollo-design/ui';
import { h } from 'vue';

const renderSizeChanger = (info: {
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
  className: string;
}) =>
  h(InputNumber, {
    'aria-label': 'Page Size',
    class: info.className,
    disabled: info.disabled,
    min: 1,
    style: { width: '100px' },
    value: info.value,
    onChange: (next: number | null) => {
      if (next !== null) info.onChange(next);
    },
  });
<\/script>

<template>
  <Pagination
    show-size-changer
    :default-current="3"
    :total="500"
    :size-changer-render="renderSizeChanger"
  />
</template>
`;export{n as default};
