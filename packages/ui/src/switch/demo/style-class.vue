<script setup lang="ts">
// 对齐 antd 的 style-class demo（语义化三槽：root / content / indicator）
// ⚠️ PLATFORM 替换：antd 用 antd-style 的 createStyles；本仓零运行时 —— 类名与样式
//    由 demo 自己的 <style> 提供（两边生成机制本就不同，比的是挂载结果）。
import { Flex, Switch } from '@apollo-design/ui';

/** 对象形态的 `styles`。 */
const stylesObject = { root: { backgroundColor: '#F5D2D2' } };

/** 函数形态的 `styles` —— 按合并后的 `size` 分支。 */
const stylesFn = (info: { props: { size?: string } }) =>
  info.props.size === 'medium' ? { root: { backgroundColor: '#BDE3C3' } } : {};
</script>

<template>
  <Flex vertical align="flex-start" justify="flex-start" gap="medium">
    <Switch
      size="small"
      checked-children="on"
      un-checked-children="off"
      :styles="stylesObject"
      :class-names="{ root: 'demo-switch-root' }"
    />
    <Switch
      size="medium"
      checked-children="on"
      un-checked-children="off"
      :styles="stylesFn"
      :class-names="{ root: 'demo-switch-root', content: 'demo-switch-content' }"
    />
    <Switch
      default-checked
      aria-label="MUI style switch"
      :class-names="{ root: 'demo-switch-mui-root', indicator: 'demo-switch-mui-indicator' }"
    />
  </Flex>
</template>

<style>
.demo-switch-root {
  width: 40px;
  background-color: #1677ff;
}
.demo-switch-content {
  font-style: italic;
}
/* MUI 风格：把轨道压扁、把手放大到轨道外（antd demo 的 muiRoot / muiIndicator） */
.demo-switch-mui-root {
  min-width: 32px;
  height: 14px;
  line-height: 14px;
}
.demo-switch-mui-root.apollo-switch-checked {
  background-color: rgba(25, 118, 210, 0.5);
}
.demo-switch-mui-root.apollo-switch-checked .apollo-switch-handle {
  inset-inline-start: calc(100% - 17px);
}
.demo-switch-mui-indicator {
  top: -3px;
  width: 20px;
  height: 20px;
  inset-inline-start: -3px;
}
.demo-switch-mui-indicator::before {
  background-color: rgb(25, 118, 210);
  border-radius: 999px;
  box-shadow:
    rgba(0, 0, 0, 0.2) 0 2px 1px -1px,
    rgba(0, 0, 0, 0.14) 0 1px 1px 0,
    rgba(0, 0, 0, 0.12) 0 1px 4px 0;
}
</style>
