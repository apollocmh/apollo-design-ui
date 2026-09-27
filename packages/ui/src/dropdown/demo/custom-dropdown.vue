<script setup lang="ts">
// 对齐 antd demo/custom-dropdown.tsx。C8-R2：popupRender 走 `#popupRender="{ originNode }"` 插槽。
import { Dropdown } from '@apollo-design/ui';
import { defineComponent, type PropType, type VNodeChild } from 'vue';

/** demo 局部辅助：在模板里渲染一个 VNode（Vue 模板没有 h() 的直接入口）。 */
const RenderVNode = defineComponent({
  props: { node: { type: null as unknown as PropType<VNodeChild>, default: undefined } },
  setup: (props) => () => props.node,
});
</script>

<template>
  <Dropdown>
    <template #popupRender="{ originNode }">
      <div style="padding: 8px; width: 200px">
        <RenderVNode :node="originNode" />
        <div style="border-top: 1px solid #f0f0f0; padding-top: 8px; margin-top: 4px">
          This is a custom dropdown content.
        </div>
      </div>
    </template>
    <a class="cursor-pointer" @click.prevent>
      Hover me
    </a>
  </Dropdown>
</template>
