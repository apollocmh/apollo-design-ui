const e=`<script setup lang="ts">
// 对齐 antd 的 toggle-debug demo（隐藏情况下计算字符对齐）。
import { Avatar, Button, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const hide = ref(true);
const sizes = ['small', 'medium', 'large'] as const;
const sizeIndex = ref(2);
const scale = ref(1);

const size = () => sizes[sizeIndex.value];

const toggle = () => {
  hide.value = !hide.value;
};
const toggleSize = () => {
  sizeIndex.value = (sizeIndex.value + 1) % sizes.length;
};
const changeScale = () => {
  scale.value = scale.value === 1 ? 2 : 1;
};
const hidden = () => ({ display: hide.value ? 'none' : '' });
<\/script>

<template>
  <Space wrap>
    <Button @click="toggle">Toggle Avatar visibility</Button>
    <Button @click="toggleSize">Toggle Avatar size</Button>
    <Button @click="changeScale">Change Avatar scale</Button>
  </Space>
  <div :style="{ textAlign: 'center', transform: \`scale(\${scale})\`, marginTop: '24px' }">
    <Avatar :size="size()" :style="{ ...hidden(), background: '#7265e6' }">Avatar</Avatar>
    <Avatar :size="size()" src="invalid" :style="{ ...hidden(), background: '#00a2ae' }">
      Invalid
    </Avatar>
    <div :style="hidden()">
      <Avatar :size="size()" :style="{ background: '#7265e6' }">Avatar</Avatar>
      <Avatar :size="size()" src="invalid" :style="{ background: '#00a2ae' }">Invalid</Avatar>
    </div>
  </div>
</template>
`;export{e as default};
