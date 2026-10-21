<script setup lang="ts">
// 对齐 antd 的 complex demo：Skeleton.Node 自定义占位内容
import { PictureOutlined } from '@apollo-design/icons';
import { Button, Skeleton } from '@apollo-design/ui';
import { ref } from 'vue';

const active = ref(true);

const toggle = () => {
  active.value = !active.value;
};
</script>

<template>
  <Button @click="toggle">{{ active ? '关闭微光动画' : '开启微光动画' }}</Button>
  <div style="display: flex; gap: 16px; margin-top: 16px">
    <Skeleton.Node :active="active" :style="{ width: '160px', height: '120px' }">
      <PictureOutlined style="font-size: 40px; color: #bfbfbf" />
    </Skeleton.Node>
    <Skeleton :active="active" avatar :paragraph="{ rows: 3 }" style="flex: 1" />
  </div>
</template>
