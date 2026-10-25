<script setup lang="ts">
import { Paragraph, Text, type TypographyProps } from '@apollo-design/ui';
import { computed, ref, type StyleValue } from 'vue';

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
 *    所以这里分支用的判据必须是基础 props 里有的（`prefixCls`）。
 */
const classNamesFn: TypographyProps['classNames'] = (info) =>
  info.props.prefixCls === 'apollo-typography-alt'
    ? { root: 'demo-typography-root--alt' }
    : { root: 'demo-typography-root' };

const phase = ref(0);
const nativeClass = computed(() => phase.value < 3 ? ['native-demo-root', `native-demo-phase-${phase.value}`] : undefined);
const nativeStyle = computed<StyleValue>(() => {
  if (phase.value === 0) return 'color:var(--apollo-color-primary);padding-inline-start:var(--apollo-padding-xs);--native-demo-phase:string';
  if (phase.value === 1) return ['color:var(--apollo-color-success);--native-demo-phase:array', { paddingInlineStart: 'var(--apollo-padding-sm)', paddingInlineEnd: 'var(--apollo-padding-xs)' }];
  if (phase.value === 2) return { color: 'var(--apollo-color-warning)', paddingInlineStart: 'var(--apollo-padding-md)', '--native-demo-phase': 'object' };
  return undefined;
});
const nativeSemanticStyles: TypographyProps['styles'] = {
  root: { color: 'var(--apollo-color-text-secondary)', paddingInlineStart: 'var(--apollo-padding-xxs)', '--semantic-demo-root': 'kept' },
};
</script>

<template>
  <Paragraph :class-names="classNamesObject" :styles="stylesObject" :copyable="true">
    Object form: classNames / styles
  </Paragraph>
  <Paragraph :class-names="classNamesFn">Function form: classNames</Paragraph>
  <Paragraph :class-names="classNamesFn" class="demo-alt">Function form, alt</Paragraph>
  <Text :class-names="classNamesObject" :styles="stylesObject" :copyable="true" />
  <section data-native-typography-style-demo>
    <p><button type="button" @mousedown.prevent @click="phase = (phase + 1) % 4">Cycle native typography styles</button></p>
    <Text data-demo-native-style :class="nativeClass" :style="nativeStyle"
      :class-names="{ root: 'semantic-demo-root' }" :styles="nativeSemanticStyles">
      Native style: {{ ['string', 'array', 'object', 'removed'][phase] }}
      <input aria-label="Semantic typography draft" />
    </Text>
  </section>
</template>
