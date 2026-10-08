<script setup lang="ts">
// 对齐 antd 的 demo/presuffix.tsx —— prefix/suffix 支持 prop（string/VNode）与插槽两种用法。
import { UserOutlined } from '@apollo-design/icons';
import { Input } from '@apollo-design/ui';
</script>

<template>
  <div style="font-family: sans-serif; display: flex; flex-direction: column; gap: 8px; width: 260px">
    <Input prefix="¥" suffix="RMB" placeholder="prefix & suffix (prop)" />
    <Input suffix="%" placeholder="suffix only (prop)" />
    <Input placeholder="prefix & suffix (slot)">
      <template #prefix><UserOutlined /></template>
      <template #suffix>
        <span style="color: #999">单位</span>
      </template>
    </Input>
  </div>
</template>
