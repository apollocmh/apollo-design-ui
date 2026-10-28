---
order: 10
title:
  zh-CN: 紧凑布局调试
  en-US: Compact Debug
---

实际前后标签、计数输入、单项控件，以及纵向与单项 Addon。

Real prefix/suffix cells, counted inputs, single controls, vertical and single Addons.

```vue
<script setup lang="ts">
import { Button, Cascader, DatePicker, Input, InputNumber, Select, Space, SpaceAddon, SpaceCompact } from '@apollo-design/ui';
const options = [{ value: 'signup', label: 'Sign Up' }, { value: 'signin', label: 'Sign In' }];
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
  </Space>
</template>
```
