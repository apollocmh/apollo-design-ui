const n=`<script setup lang="ts">
// 对齐 antd 的 shift demo：页面滚动后浮层跟随（纯展示，不 scroll 页面）
import { Button, Popconfirm } from '@apollo-design/ui';
<\/script>

<template>
  <div style="display: flex; align-items: center; justify-content: center; padding: 48px 0">
    <Popconfirm title="Thanks for using apollo-design. Have a nice day !" open>
      <Button type="primary">Scroll The Window</Button>
    </Popconfirm>
  </div>
</template>
`;export{n as default};
