const e=`<script setup lang="ts">
import type { DividerProps } from '../../index';
import { Divider } from '../../index';

/**
 * 语义化 \`classNames\` / \`styles\`：对象式与函数式两种形态。
 *
 * ⚠️ 函数式拿到的 \`info.props\` 是**合并后**的 props（\`titlePlacement\` 已折成 start/end、
 *    \`size\` 已并入 ConfigProvider 的取值），所以可以放心用它做条件分支。
 */
const classNamesObject: DividerProps['classNames'] = {
  root: 'demo-divider-root',
  content: 'demo-divider-content',
  rail: 'demo-divider-rail',
};

const classNamesFn: DividerProps['classNames'] = (info) =>
  info.props.titlePlacement === 'start'
    ? { root: 'demo-divider-root--start' }
    : { root: 'demo-divider-root--default' };

const stylesObject: DividerProps['styles'] = {
  root: { borderWidth: '2px', borderStyle: 'dashed' },
  content: { fontStyle: 'italic' },
  rail: { opacity: 0.85 },
};

const stylesFn: DividerProps['styles'] = (info) =>
  info.props.size === 'small'
    ? { root: { opacity: 0.6, cursor: 'default' } }
    : { root: { backgroundColor: '#fafafa', borderColor: '#d9d9d9' } };
<\/script>

<template>
  <div>
    <Divider :class-names="classNamesObject">classNames Object</Divider>
    <Divider title-placement="start" :class-names="classNamesFn">classNames Function</Divider>
    <Divider :styles="stylesObject">styles Object</Divider>
    <Divider size="small" :styles="stylesFn">styles Function</Divider>
  </div>
</template>
`;export{e as default};
