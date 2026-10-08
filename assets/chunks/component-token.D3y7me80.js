const n=`<script setup lang="ts">
// 对齐 antd 的 component-token demo
// ⚠️ PLATFORM 等价替换：antd 用 \`ConfigProvider theme.components.Switch\` 注入 Component
//    Token；本仓零运行时 —— Component Token 就是 CSS 变量（\`--apollo-switch-*\`），
//    在容器上覆盖同名变量即可（完整清单见 index.zh-CN.md 的 Design Token 表）。
import { Space, Switch } from '@apollo-design/ui';
<\/script>

<template>
  <div class="demo-switch-token">
    <Space>
      <Switch default-checked aria-label="Component token switch" />
    </Space>
  </div>
</template>

<style>
/* 与 antd demo 的 token 覆盖逐项对应（trackHeight / trackMinWidth / colorPrimary /
   trackPadding / handleSize / handleBg / handleShadow）。⚠️ 选择器要比组件自身的
   声明更具体（0,2,0 > 0,1,0）。 */
.demo-switch-token .apollo-switch {
  --apollo-switch-track-height: 14px;
  --apollo-switch-track-min-width: 32px;
  --apollo-switch-track-padding: -3px;
  --apollo-switch-handle-size: 20px;
  --apollo-switch-handle-bg: rgb(25, 118, 210);
  --apollo-switch-handle-shadow:
    rgba(0, 0, 0, 0.2) 0px 2px 1px -1px, rgba(0, 0, 0, 0.14) 0px 1px 1px 0px,
    rgba(0, 0, 0, 0.12) 0px 1px 3px 0px;
  /* antd demo 同时覆盖了全局 colorPrimary */
  --apollo-color-primary: rgb(25, 118, 210, 0.5);
}
</style>
`;export{n as default};
