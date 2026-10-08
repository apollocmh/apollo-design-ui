const n=`<script setup lang="ts">
// 对齐 antd 的 link demo（Badge 包裹可点击元素）
import { Badge } from '@apollo-design/ui';
<\/script>

<template>
  <a href="#">
    <Badge :count="5">
      <div style="width: 40px; height: 40px; background: #f0f0f0; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center">link</div>
    </Badge>
  </a>
</template>
`;export{n as default};
