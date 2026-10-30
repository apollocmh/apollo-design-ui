<script setup lang="ts">
// 对齐 antd 的 render-panel demo：在候选菜单前后插入自定义面板内容。
import type { DefaultOptionType } from '@apollo-design/ui';
import { AutoComplete, Button, Divider, Text } from '@apollo-design/ui';
import { defineComponent, h, type PropType, ref, type VNodeChild } from 'vue';

const value = ref('');
const options = ref<DefaultOptionType[]>([]);

const onSearch = (text: string) => {
  options.value = text ? [{ value: text }, { value: `${text}${text}` }] : [];
};

/** demo 局部辅助：在模板里渲染一个 VNode（Vue 模板没有 h() 的直接入口）。 */
const RenderVNode = defineComponent({
  props: { node: { type: null as unknown as PropType<VNodeChild>, default: undefined } },
  setup: (props) => () => props.node,
});
</script>

<template>
  <div>
    <AutoComplete
      v-model:value="value"
      aria-label="自定义候选面板的自动补全"
      :options="options"
      placeholder="输入以生成候选"
      style="width: 280px"
      @search="onSearch"
    >
      <template #popupRender="{ menu }">
        <div>
          <div style="padding: 8px">Render Panel</div>
          <RenderVNode :node="menu" />
          <Divider style="margin: 0" />
          <Button type="text" block @click="value = ''">Close</Button>
        </div>
      </template>
    </AutoComplete>
    <div style="margin-top: 8px">
      <Text type="secondary">当前值：{{ value || '（空）' }}</Text>
    </div>
  </div>
</template>
