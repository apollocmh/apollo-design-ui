const s=`<script setup lang="ts">
// 对齐 antd 的 style-class demo（语义化 classNames / styles）
import { Button, Popconfirm } from '@apollo-design/ui';

const classNames = { root: 'custom-popconfirm', icon: 'custom-icon' };
const styles = { root: { padding: 20 }, icon: { color: 'red' } };
<\/script>

<template>
  <Popconfirm
    title="Delete the task"
    description="Are you sure to delete this task?"
    :class-names="classNames"
    :styles="styles"
  >
    <Button danger>Delete</Button>
  </Popconfirm>
</template>
`;export{s as default};
