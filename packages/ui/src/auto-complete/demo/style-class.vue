<script setup lang="ts">
// 对齐 antd demo/style-class.tsx

import type { AutoCompleteProps } from '@apollo-design/ui';
import { AutoComplete, Flex } from '@apollo-design/ui';

const options: AutoCompleteProps['options'] = [
  { value: 'Burnaby' },
  { value: 'Seattle' },
  { value: 'Los Angeles' },
];

const stylesObject: AutoCompleteProps['styles'] = {
  popup: {
    root: { borderWidth: 1, borderColor: '#1890ff' },
    list: { backgroundColor: 'rgba(240,240,240, 0.85)' },
    listItem: { color: '#272727' },
  },
};

const stylesFn: AutoCompleteProps['styles'] = ({ props }: { props: AutoCompleteProps }) => {
  if (props.variant === 'filled') {
    return {
      popup: {
        root: { borderWidth: 1, borderColor: '#ccc' },
        list: { backgroundColor: 'rgba(240,240,240, 0.85)' },
        listItem: { color: '#272727' },
      },
    };
  }
  return {};
};
</script>

<template>
  <Flex vertical gap="medium">
    <AutoComplete :options="options" style="width: 200px" placeholder="object styles" :styles="stylesObject" />
    <AutoComplete
      :options="options"
      style="width: 200px"
      variant="filled"
      placeholder="function styles"
      :styles="stylesFn"
    />
  </Flex>
</template>
