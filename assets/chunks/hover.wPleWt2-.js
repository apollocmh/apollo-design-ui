const e=`<script setup lang="ts">
// 对齐 antd 的 hover demo（悬浮时显示：CSS 由 hover 类驱动，这里演示受控开关等价形态）

import { BorderBeam } from '@apollo-design/ui';
import { ref } from 'vue';

const hovered = ref(false);
<\/script>

<template>
  <BorderBeam v-if="hovered">
    <div
      :style="{ position: 'relative', border: '1px solid #ddd', borderRadius: '8px', padding: '24px', cursor: 'pointer' }"
      @mouseenter="hovered = true"
      @mouseleave="hovered = false"
    >
      Hover me
    </div>
  </BorderBeam>
  <div v-else
    :style="{ position: 'relative', border: '1px solid #ddd', borderRadius: '8px', padding: '24px', cursor: 'pointer' }"
    @mouseenter="hovered = true"
  >
    Hover me
  </div>
</template>
`;export{e as default};
