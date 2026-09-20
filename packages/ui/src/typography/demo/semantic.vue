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
 *
 * ⚠️ `info.props` 的类型是 `BaseTypographyProps`（= `TypographyProps`），**不含**
 *    `disabled` / `type` / `copyable` 这些 `BlockProps` 独有的字段 —— 上游 antd 也如此
 *    （`TypographySemanticAllType = GenerateSemantic<TypographySemanticType, BaseTypographyProps>`）。
 *    所以这里分支用的判据必须是基础 props 里有的（`rootClassName`）。
 */
const classNamesFn: TypographyProps['classNames'] = (info) =>
  info.props.rootClassName
    ? { root: 'demo-typography-root--alt' }
    : { root: 'demo-typography-root' };
</script>

<template>
  <Paragraph :class-names="classNamesObject" :styles="stylesObject" :copyable="true">
    Object form: classNames / styles
  </Paragraph>
  <Paragraph :class-names="classNamesFn">Function form: classNames</Paragraph>
  <Paragraph :class-names="classNamesFn" root-class-name="demo-alt">Function form, alt</Paragraph>
  <Text :class-names="classNamesObject" :styles="stylesObject" :copyable="true" />
</template>
