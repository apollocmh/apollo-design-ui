<script setup lang="ts">
import type { TypographyProps } from '../../index';
import { Paragraph, Text } from '../../index';

/** 对象式：直接给槽位类名 / 样式。 */
const classNamesObject: TypographyProps['classNames'] = {
  root: 'demo-typography-root',
  actions: 'demo-typography-actions',
  action: 'demo-typography-action',
};

const stylesObject: TypographyProps['styles'] = {
  root: { backgroundColor: '#fafafa' },
  actions: { marginInlineStart: '8px' },
};

/**
 * 函数式：`info.props` 是**合并后**的 props —— `prefixCls` 已是解析后的
 * `apollo-typography`，`direction` 也已并入 ConfigProvider 的取值。
 */
const classNamesFn: TypographyProps['classNames'] = (info) =>
  info.props.disabled
    ? { root: 'demo-typography-root--disabled' }
    : { root: 'demo-typography-root' };
</script>

<template>
  <Paragraph :class-names="classNamesObject" :styles="stylesObject" :copyable="true">
    Object form: classNames / styles
  </Paragraph>
  <Paragraph :class-names="classNamesFn">Function form: classNames</Paragraph>
  <Paragraph :class-names="classNamesFn" disabled>Function form, disabled</Paragraph>
  <Text :class-names="classNamesObject" :styles="stylesObject" :copyable="true" />
</template>
