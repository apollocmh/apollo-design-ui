<script setup lang="ts">
/**
 * `prefixCls` —— 三层继承的第一层。
 *
 * 本仓库默认前缀是 `apollo`（裁决 `prefix-cls-default` = A），但零运行时的静态 CSS
 * **同时**为 `apollo` 与 `ant` 两份前缀生成了产物，所以把 `prefixCls` 设成 `ant`
 * 是真正可用的 —— 这是从 antd 迁移时成本最低的一条路。
 */
import { ConfigProvider, Empty } from '../../index';
</script>

<template>
  <ConfigProvider prefix-cls="ant">
    <Empty description="类名变成了 ant-empty" />
  </ConfigProvider>
</template>
