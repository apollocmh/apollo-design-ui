---
order: 10
title:
  zh-CN: 紧凑布局调试
  en-US: Compact Debug
---

实际前后标签、计数输入、单项控件，以及纵向与单项 Addon。三种尺寸的 underlined 展示 normal/error/warning/disabled 底线，borderless 对照保持无边框。disabled Addon 只提供装饰外观；示例中的操作 Button 另行显式传入 disabled，表示真实不可用的操作。

Real prefix/suffix cells, counted inputs, single controls, vertical and single Addons. Underlined cells show normal/error/warning/disabled bottom borders in three sizes; borderless cells retain no border. Addon disabled is decorative; each unavailable action Button explicitly receives its own disabled prop.

```vue
<script setup lang="ts">
import {
  Button,
  Cascader,
  DatePicker,
  Input,
  InputNumber,
  Select,
  Space,
  SpaceAddon,
  SpaceCompact,
} from '@apollo-design/ui';

const options = [
  { value: 'signup', label: 'Sign Up' },
  { value: 'signin', label: 'Sign In' },
];
const addonSizes = ['small', 'middle', 'large'] as const;
</script>
<template>
  <Space orientation="vertical" style="display: flex">
    <SpaceCompact><Button>Default</Button><Button danger>Danger</Button><Button type="dashed">Dashed</Button><Button type="text">Text</Button><Button type="link">Link</Button><Button disabled>Disabled</Button></SpaceCompact>
    <SpaceCompact block><SpaceAddon>Prefix</SpaceAddon><Input aria-label="Site with prefix" default-value="mysite" /><Button type="primary">Submit</Button></SpaceCompact>
    <SpaceCompact block><Input aria-label="Prefix field" placeholder="Prefix" /><Input aria-label="Site field" default-value="mysite" /><Button>Copy</Button></SpaceCompact>
    <SpaceCompact block><Input aria-label="Search A" placeholder="Search" /><Input aria-label="Search B" placeholder="Search" /><Button>Copy</Button></SpaceCompact>
    <SpaceCompact block><Input aria-label="Suffix field" default-value="mysite" /><Button type="primary">Submit</Button><Input aria-label="Suffix tail" placeholder="Suffix" /></SpaceCompact>
    <SpaceCompact block><Input aria-label="Counted field" default-value="mysite" show-count /><Button type="primary">Submit</Button><Input aria-label="Counted tail" default-value="mysite" show-count /><Input aria-label="Counted tail two" default-value="mysite" /></SpaceCompact>
    <SpaceCompact><InputNumber aria-label="Number with unit" :default-value="100" /><SpaceAddon>$</SpaceAddon></SpaceCompact>
    <SpaceCompact><Select aria-label="Single account action" :options="options" default-value="signup" style="width: 140px" /></SpaceCompact>
    <SpaceCompact><DatePicker aria-label="Single date" /></SpaceCompact>
    <SpaceCompact><InputNumber aria-label="Single number" :default-value="12" /></SpaceCompact>
    <SpaceCompact><Cascader aria-label="Single address" :options="[{ value: 'zhejiang', label: 'Zhejiang', children: [{ value: 'hangzhou', label: 'Hangzhou' }] }]" /></SpaceCompact>
    <SpaceCompact orientation="vertical" size="small"><Button>Vertical single button</Button></SpaceCompact>
    <SpaceCompact orientation="vertical"><SpaceAddon>Vertical first</SpaceAddon><SpaceAddon>Vertical middle</SpaceAddon><SpaceAddon>Vertical last</SpaceAddon></SpaceCompact>
    <SpaceCompact><SpaceAddon>Single addon</SpaceAddon></SpaceCompact>
    <SpaceCompact v-for="size in addonSizes" :key="size" :size="size"><SpaceAddon variant="underlined">Underlined {{ size }}</SpaceAddon><SpaceAddon variant="underlined" status="error">Error</SpaceAddon><SpaceAddon variant="underlined" status="warning">Warning</SpaceAddon><SpaceAddon variant="underlined" disabled><Button type="text" disabled>Disabled</Button></SpaceAddon></SpaceCompact>
    <SpaceCompact><SpaceAddon variant="borderless">Borderless</SpaceAddon><SpaceAddon variant="borderless" status="error">Error</SpaceAddon><SpaceAddon variant="borderless" status="warning">Warning</SpaceAddon><SpaceAddon variant="borderless" disabled><Button type="text" disabled>Disabled</Button></SpaceAddon></SpaceCompact>
  </Space>
</template>
```
