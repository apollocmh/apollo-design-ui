const e=`<script setup lang="ts">
// 对齐 antd 的 style-class demo。
//
// ⚠️ 上游的 \`classNames\` 来自 \`antd-style\` 的 \`createStyles\`；本仓零运行时样式方案，
//    直接给等价的静态类名（\`demo-tp-root\` 由本文件底部的作用域样式提供）。

import type { TimePickerProps } from '@apollo-design/ui';
import { Flex, TimePicker } from '@apollo-design/ui';

const classNames = { root: 'demo-tp-root' };

/** 对象形态。 */
const stylesObject: TimePickerProps['styles'] = {
  root: { borderColor: '#d9d9d9' },
};

/** 函数形态：按 \`info.props.size\` 分支。 */
const stylesFn: TimePickerProps['styles'] = (info) => {
  if (info.props.size === 'large') {
    return {
      root: { borderColor: '#722ed1' },
      suffix: { color: '#722ed1' },
      popup: { container: { border: '1px solid #722ed1', borderRadius: 8 } },
    };
  }
  return {};
};
<\/script>

<template>
  <Flex vertical gap="medium">
    <TimePicker :class-names="classNames" :styles="stylesObject" placeholder="Object" />
    <TimePicker
      :class-names="classNames"
      :styles="stylesFn"
      placeholder="Function"
      size="large"
    />
  </Flex>
</template>

<style scoped>
.demo-tp-root {
  width: 150px;
  border: 1px solid var(--apollo-color-primary);
}
</style>
`;export{e as default};
