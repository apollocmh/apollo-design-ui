---
order: 13
title:
  zh-CN: 自定义面板
  en-US: Custom Panel
---

`panelRender` 是函数 prop，可完全接管面板内容（例如加标题、改成左右分栏）。

```vue
<script setup lang="ts">
// 对齐 antd 的 panel-render demo：用 `panelRender` 自由控制面板渲染。
//
// ⚠️ **三处 demo 级替换**（都不是能力缺口）：
//   1. 上游用 `theme.useToken()` 取 `colorPrimary` —— 本仓没有这个 hook ⇒ 写**等值
//      字面量** `#1677ff`（默认主题的 `colorPrimary` 解析值）。
//   2. 上游用 `@ant-design/colors` 的 `generate` / `red` / `green` / `cyan` —— 本仓没有
//      该依赖 ⇒ 把对应色板**固化成字面量**（值来自 `@ant-design/colors@8.0.1`，逐位一致）。
//   3. `panelRender` 是**函数 prop**，返回值是 VNode ⇒ 本仓用 `h()` 写（`.vue` 模板里
//      没有「渲染一个 VNode 变量」的语法）。
import type { ColorPickerProps, PresetsItem } from '@apollo-design/ui';
import { Col, ColorPicker, Divider, Row, Space } from '@apollo-design/ui';
import { h } from 'vue';

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

/** 横向布局：预设 + 竖分隔线 + 取色面板（组件引用由 `extra` 提供）。 */
const horizontalPanelRender: ColorPickerProps['panelRender'] = (
  _panel,
  { components: { Picker, Presets } },
) =>
  h(Row, { justify: 'space-between', wrap: false }, [
    h(Col, { span: 12 }, [h(Presets)]),
    h(Divider, { vertical: true, style: { height: 'auto' } }),
    h(Col, { flex: 'auto' }, [h(Picker)]),
  ]);

/** 在面板上方加一行标题。 */
const basicPanelRender: ColorPickerProps['panelRender'] = (panel) =>
  h('div', { class: 'custom-panel' }, [
    h(
      'div',
      {
        style: {
          fontSize: '12px',
          color: 'rgba(0, 0, 0, 0.88)',
          lineHeight: '20px',
          marginBottom: '8px',
        },
      },
      'Color Picker',
    ),
    panel,
  ]);
</script>

<template>
  <Space vertical>
    <Space>
      <span>Add title:</span>
      <ColorPicker default-value="#1677ff" :panel-render="basicPanelRender" />
    </Space>
    <Space>
      <span>Horizontal layout:</span>
      <ColorPicker
        :default-value="COLOR_PRIMARY"
        :styles="{ popupOverlayInner: { width: 480 } }"
        :presets="presets"
        :panel-render="horizontalPanelRender"
      />
    </Space>
  </Space>
</template>
```
