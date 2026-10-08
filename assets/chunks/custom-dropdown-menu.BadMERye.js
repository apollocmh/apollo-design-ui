const n=`<script setup lang="ts">
// 对齐 antd demo/custom-dropdown-menu.tsx（popupRender 作用域插槽，在菜单末尾追加内容）
import { Button, Select } from '@apollo-design/ui';
import { defineComponent, h, type PropType, type VNodeChild } from 'vue';

const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
];

/** demo 局部辅助：在模板里渲染一个 VNode（Vue 模板没有 h() 的直接入口）。 */
const RenderVNode = defineComponent({
  props: { node: { type: null as unknown as PropType<VNodeChild>, default: undefined } },
  setup: (props) => () => props.node,
});
<\/script>

<template>
  <Select :options="options" style="width: 200px">
    <template #popupRender="{ menu }">
      <div>
        <RenderVNode :node="menu" />
        <div style="padding: 8px"><Button>more</Button></div>
      </div>
    </template>
  </Select>
</template>
`;export{n as default};
