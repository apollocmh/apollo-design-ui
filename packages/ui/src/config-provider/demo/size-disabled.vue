<script setup lang="ts">
/**
 * `componentSize` / `componentDisabled` —— 两个**独立** context。
 *
 * 下游组件用 `useSize(() => props.size)` / `useDisabled(() => props.disabled)` 读取，
 * 或者用 `useConfig()` 一次拿两个。
 *
 * ⚠️ 探针必须挂在 `ConfigProvider` **内部**：`inject` 只沿父链解析，
 *    写在同一个 setup 里是拿不到的（PITFALLS 37）。
 */
import { h } from 'vue';
import { Button, ConfigProvider, Input, Space, useConfig } from '../../index';

const Child = {
  name: 'AUseConfigChild',
  setup() {
    const { componentSize, componentDisabled } = useConfig();
    return () =>
      h('div', null, [
        h('div', null, `componentSize：${componentSize.value ?? '（未设置）'}`),
        h('div', null, `componentDisabled：${String(componentDisabled.value)}`),
        h(Space, { style: { marginTop: '12px' } }, () => [
          h(Input, { 'aria-label': '全局禁用输入框', placeholder: '继承 large 与 disabled' }),
          h(Button, null, () => '已禁用按钮'),
        ]),
      ]);
  },
};
</script>

<template>
  <ConfigProvider component-size="large" :component-disabled="true">
    <Child />
  </ConfigProvider>
</template>
