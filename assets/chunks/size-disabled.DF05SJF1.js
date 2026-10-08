const n=`<script setup lang="ts">
/**
 * \`componentSize\` / \`componentDisabled\` —— 两个**独立** context。
 *
 * 下游组件用 \`useSize(props.size)\` / \`useDisabled(props.disabled)\` 读取，
 * 或者用 \`useConfig()\` 一次拿两个。
 *
 * ⚠️ 探针必须挂在 \`ConfigProvider\` **内部**：\`inject\` 只沿父链解析，
 *    写在同一个 setup 里是拿不到的（PITFALLS 37）。
 */
import { h } from 'vue';
import { ConfigProvider, useConfig } from '../../index';

const Child = {
  name: 'AUseConfigChild',
  setup() {
    const { componentSize, componentDisabled } = useConfig();
    return () =>
      h('div', null, [
        h('div', null, \`componentSize：\${componentSize.value ?? '（未设置）'}\`),
        h('div', null, \`componentDisabled：\${String(componentDisabled.value)}\`),
      ]);
  },
};
<\/script>

<template>
  <ConfigProvider component-size="large" :component-disabled="true">
    <Child />
  </ConfigProvider>
</template>
`;export{n as default};
