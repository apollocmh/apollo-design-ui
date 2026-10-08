const e=`<script setup lang="ts">
// 对齐 antd demo/modal-render.tsx（上游用 react-draggable 做拖拽；
// 本 demo 保留「用 modalRender 把面板包一层 + 用语义槽给标题栏加把手」这一意图）
import { Button, Modal } from '@apollo-design/ui';
import { h, ref, type VNodeChild } from 'vue';

const open = ref(false);
<\/script>

<template>
  <Button @click="open = true">Open Customized Modal</Button>
  <Modal
    title="Customized Modal"
    :open="open"
    :class-names="{ title: 'modal-draggable-title' }"
    :styles="{ title: { cursor: 'move' } }"
    :modal-render="(node: VNodeChild) => h('div', { class: 'draggable-shell' }, [node])"
    @ok="open = false"
    @cancel="open = false"
  >
    <p>Just don't learn physics at school and your life will be full of magic and miracles.</p>
    <p>Day before yesterday I saw a rabbit, and yesterday a deer, and today, you.</p>
  </Modal>
</template>
`;export{e as default};
