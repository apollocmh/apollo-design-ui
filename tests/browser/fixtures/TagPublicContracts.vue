<script setup lang="ts">
import {
  type CheckableTag,
  CheckableTagGroup,
  type CheckableTagGroupRef,
  ConfigProvider,
  Tag,
  type TagConfig,
} from '@apollo-design/ui';
import { computed, ref } from 'vue';

const instance = ref<InstanceType<typeof Tag> | null>(null);
const checkableInstance = ref<InstanceType<typeof CheckableTag> | null>(null);
const checked = ref(false);
const single = ref<string | null>(null);
const multiple = ref<string[]>([]);
const dynamicMode = ref(false);
const dynamicValue = ref<string | string[] | null>(null);
const groupInstance = ref<CheckableTagGroupRef | null>(null);
const options = ['Books', 'Music'];
const context = computed<TagConfig>(() => ({
  variant: 'outlined',
  styles: { root: { paddingInline: '9px' } },
}));
const Child = Tag.CheckableTag;
const Group = Tag.CheckableTagGroup;
const native = () => [
  instance.value?.nativeElement,
  checkableInstance.value?.nativeElement,
  groupInstance.value?.nativeElement,
];
</script>
<template>
  <ConfigProvider :components="{ tag: context }">
    <Tag ref="instance" :style="[{ paddingInline: '11px' }]" closable>
      <template #icon><svg width="16" height="16" aria-hidden="true"/><strong>Icon tail</strong></template>
      Label
      <template #closeIcon><svg width="12" height="12" aria-hidden="true"/><span>Close tail</span></template>
    </Tag>
    <CheckableTag ref="checkableInstance" v-model:checked="checked">Choice</CheckableTag>
    <CheckableTagGroup ref="groupInstance" v-model:value="single" :options="options" />
    <CheckableTagGroup v-model:value="multiple" :options="options" multiple />
    <Child v-model:checked="checked">Static child</Child>
    <Group v-model:value="single" :options="options" />
    <Group v-model:value="dynamicValue" :options="options" :multiple="dynamicMode" />
    <button type="button" @click="native">Read exposed roots</button>
  </ConfigProvider>
</template>
