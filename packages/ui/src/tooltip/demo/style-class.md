---
order: 113
---
## zh-CN

语义化 `classNames` / `styles`（对象与函数两种形态），以及当前主题的 Tooltip maxWidth。第三个按钮可在提示打开时切换令牌。

## en-US

Semantic `classNames` / `styles` (object and function forms), plus the current Tooltip maxWidth token. Click the third button while the hint is open to change it.

```vue
<script setup lang="ts">
// 对齐 antd 的 demo/style-class.tsx（antd-style 的 createStaticStyles ⇒ 普通 object）

import { Button, ConfigProvider, Flex, Tooltip } from '@apollo-design/ui';
import { ref } from 'vue';

const maxWidth = ref(160);

const classNames = { container: 'demo-tooltip-container' };
const styles = { container: { borderRadius: '12px', boxShadow: 'inset 0 0 8px #ccc' } };
const stylesFn = (info: { props: { arrow?: unknown } }) => {
  if (!info.props.arrow) {
    return {
      container: {
        backgroundColor: 'rgba(53, 71, 125, 0.8)',
        padding: '12px',
        color: '#fff',
        borderRadius: '4px',
      },
    };
  }
  return {};
};
</script>

<template>
  <div style="font-family: sans-serif">
    <Flex gap="medium">
      <Tooltip :class-names="classNames" :styles="styles" :arrow="false" title="Object text">
        <Button>Object Style</Button>
      </Tooltip>
      <Tooltip :class-names="classNames" :styles="stylesFn" :arrow="false" title="Function text">
        <Button type="primary">Function Style</Button>
      </Tooltip>
      <ConfigProvider :theme="{ components: { Tooltip: { maxWidth } } }">
        <Tooltip
          class="demo-current-tooltip"
          style="--demo-tooltip: current"
          title="Click to change the current Tooltip maxWidth token while this hint remains open."
        >
          <Button @click="maxWidth = maxWidth === 160 ? 280 : 160">Max width: {{ maxWidth }}px</Button>
        </Tooltip>
      </ConfigProvider>
    </Flex>
  </div>
</template>

```
