const n=`<script setup lang="ts">
// 对齐 antd demo/component-token.tsx
// ⚠️ antd 用 ConfigProvider 的 theme.components.Notification 覆盖组件 token；本仓的
//    组件级 token 覆盖尚未落地（D25/D83 同判）⇒ 以**默认主题**渲染面板。
import { notification } from '@apollo-design/ui';

const InternalPanel = notification._InternalPanelDoNotUseOrYouWillBeFired;
<\/script>

<template>
  <div>
    <component :is="InternalPanel" title="Hello World!" description="Description" type="error" />
    <component :is="InternalPanel" title="Hello World!" description="Description" type="error" />
  </div>
</template>
`;export{n as default};
