---
order: 13
title:
  zh-CN: 自定义面板
  en-US: Custom Panel
---

使用 #panelRender 定制布局；panel 是稳定的 Vue 组件引用，可直接用 <component :is="panel" />，extra 提供 Picker / Presets 子面板。

```vue
<script setup lang="ts">
// Custom panels use Vue scoped slots and stable component references.
import type { PresetsItem } from '@apollo-design/ui';
import { Col, ColorPicker, Divider, Row, Space } from '@apollo-design/ui';

/** `token.colorPrimary` 的等值字面量。 */
const COLOR_PRIMARY = '#1677ff';

/** `generate('#1677ff')` 的 10 档色板。 */
const PRIMARY_PALETTE = [
  '#e6f4ff',
  '#bae0ff',
  '#91caff',
  '#69b1ff',
  '#4096ff',
  '#1677ff',
  '#0958d9',
  '#003eb3',
  '#002c8c',
  '#001d66',
];
/** `@ant-design/colors` 的 `red`。 */
const RED_PALETTE = [
  '#fff1f0',
  '#ffccc7',
  '#ffa39e',
  '#ff7875',
  '#ff4d4f',
  '#f5222d',
  '#cf1322',
  '#a8071a',
  '#820014',
  '#5c0011',
];
/** `@ant-design/colors` 的 `green`。 */
const GREEN_PALETTE = [
  '#f6ffed',
  '#d9f7be',
  '#b7eb8f',
  '#95de64',
  '#73d13d',
  '#52c41a',
  '#389e0d',
  '#237804',
  '#135200',
  '#092b00',
];
/** `@ant-design/colors` 的 `cyan`。 */
const CYAN_PALETTE = [
  '#e6fffb',
  '#b5f5ec',
  '#87e8de',
  '#5cdbd3',
  '#36cfc9',
  '#13c2c2',
  '#08979c',
  '#006d75',
  '#00474f',
  '#002329',
];

/** 上游 `genPresets`：把色板表折成 `{ label, colors, key }` 数组。 */
const genPresets = (palettes: Record<string, string[]>): PresetsItem[] =>
  Object.entries(palettes).map(([label, colors]) => ({ label, colors, key: label }));

const presets = genPresets({
  primary: PRIMARY_PALETTE,
  red: RED_PALETTE,
  green: GREEN_PALETTE,
  cyan: CYAN_PALETTE,
});

</script>

<template>
  <Space vertical>
    <Space>
      <span>Add title:</span>
      <ColorPicker default-value="#1677ff">
        <template #panelRender="{ panel }">
          <section class="custom-panel">
            <div :style="{ fontSize: '12px', color: 'var(--apollo-color-text)', lineHeight: '20px', marginBottom: '8px' }">Color Picker</div>
            <component :is="panel" />
          </section>
        </template>
      </ColorPicker>
    </Space>
    <Space>
      <span>Horizontal layout:</span>
      <ColorPicker :default-value="COLOR_PRIMARY" :styles="{ popupOverlayInner: { width: '480px' } }" :presets="presets">
        <template #panelRender="{ extra }">
          <Row justify="space-between" :wrap="false">
            <Col :span="12"><component :is="extra.components.Presets" /></Col>
            <Divider vertical :style="{ height: 'auto' }" />
            <Col flex="auto"><component :is="extra.components.Picker" /></Col>
          </Row>
        </template>
      </ColorPicker>
    </Space>
  </Space>
</template>
```
