const n=`<script setup lang="ts">
import type { SpinProps } from '../../index';
import { Spin } from '../../index';

/**
 * 语义化 \`classNames\` / \`styles\`：对象式与函数式两种形态。
 *
 * ⚠️ 函数式拿到的 \`info.props\` 是**合并后**的 props（\`size\` 已并入 ConfigProvider 的取值、
 *    \`description\` 已折成 \`description ?? tip\` 的结果、\`percent\` 是 \`auto\` 解析后的值），
 *    所以可以放心用它做条件分支。
 */
const classNamesObject: SpinProps['classNames'] = {
  root: 'demo-spin-root',
  indicator: 'demo-spin-indicator',
  description: 'demo-spin-description',
};

const stylesObject: SpinProps['styles'] = {
  indicator: { color: '#00d4ff' },
};

const stylesFn: SpinProps['styles'] = (info) =>
  info.props.size === 'small' ? { indicator: { color: '#722ed1' } } : {};

const rowStyle = { display: 'flex', alignItems: 'center', gap: '16px' };
<\/script>

<template>
  <div :style="rowStyle">
    <Spin spinning :percent="0" :class-names="classNamesObject" :styles="stylesObject" />
    <Spin spinning :percent="0" size="small" :styles="stylesFn" />
  </div>
</template>
`;export{n as default};
