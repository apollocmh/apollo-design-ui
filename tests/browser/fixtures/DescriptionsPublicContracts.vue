<script setup lang="ts">
import {
  ConfigProvider,
  Descriptions,
  type DescriptionsConfig,
  DescriptionsItem,
  type DescriptionsItemProps,
  type DescriptionsItemSlots,
  type DescriptionsProps,
  type DescriptionsRef,
  type DescriptionsSemanticInfo,
  type DescriptionsSlots,
} from '@apollo-design/ui';
import { h, ref, type StyleValue } from 'vue';

const root = ref<DescriptionsRef>();
const style: StyleValue = ['padding: 4px', { maxWidth: '100%' }];
const config: DescriptionsConfig = {
  style: { padding: '2px' },
  classNames: ({ props }) => ({ label: props.size === 'small' ? 'small-field' : 'field' }),
};
const classes: DescriptionsProps['classNames'] = ({ props }) => ({
  content: props.layout === 'vertical' ? 'vertical-content' : 'content',
});
const parentSlots: DescriptionsSlots = { title: () => [h('b', 'Title'), 0] };
const itemSlots: DescriptionsItemSlots = {
  label: () => [h('b', 'Label'), 0],
  default: () => h('input'),
};
const itemProps: DescriptionsItemProps = { label: 'Text', span: 'filled' };
const current: DescriptionsSemanticInfo = { props: { column: 2 } };
void parentSlots;
void itemSlots;
void itemProps;
void current;
const invalid: DescriptionsProps = {
  // @ts-expect-error Header actions are the #extra slot, not a content prop.
  extra: () => h('button'),
};
const invalidScope: DescriptionsProps['classNames'] = (info) => {
  // @ts-expect-error Semantic callbacks use named { props }, never a bare props argument.
  const column = info.column;
  return { root: String(column) };
};
void invalid;
void invalidScope;
</script>
<template>
  <ConfigProvider :components="{ descriptions: config }" component-size="small">
    <Descriptions ref="root" title="Text fallback" :style="style" :class-names="classes" :column="2">
      <template #title><b>Title</b><i> tail</i>0</template>
      <template #extra><button type="button">Action</button></template>
      <DescriptionsItem id="published-item" label="Fallback" :style="style" :class-names="{ label: 'own-label' }">
        <template #label><b>Field</b><i> label</i>0</template>
        <input aria-label="Published field draft" value="Draft" />
      </DescriptionsItem>
      <Descriptions.Item label="Alias" span="filled">Alias content</Descriptions.Item>
    </Descriptions>
  </ConfigProvider>
</template>
