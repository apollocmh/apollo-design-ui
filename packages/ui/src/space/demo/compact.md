---
order: 6
title:
  zh-CN: 紧凑布局
  en-US: Compact Mode
---

十一组真实 Input、Select、InputNumber、DatePicker、Button 和 Addon。尺寸与紧凑类名通过响应式上下文传播，支持实际输入、选择与键盘焦点。

Eleven groups of real controls receive current sizes and compact edge classes through context. Inputs, selections and keyboard focus remain functional.

```vue
<script setup lang="ts">
import { Button, DatePicker, Input, InputNumber, Select, Space, SpaceAddon, SpaceCompact } from '@apollo-design/ui';
const provinces = [{ value: 'zhejiang', label: 'Zhejiang' }, { value: 'jiangsu', label: 'Jiangsu' }];
const actions = [{ value: 'signup', label: 'Sign Up' }, { value: 'signin', label: 'Sign In' }];
</script>
<template>
  <Space orientation="vertical" style="display: flex">
    <SpaceCompact block><Input aria-label="Area code" default-value="0571" style="width: 20%" /><Input aria-label="Phone" default-value="26888888" style="width: 80%" /></SpaceCompact>
    <SpaceCompact block size="small"><Input aria-label="Site URL" default-value="https://example.com" /><Button type="primary">Submit</Button></SpaceCompact>
    <SpaceCompact block><Input aria-label="Git URL" default-value="git@example.com:project/repository.git" /><Button>Copy</Button></SpaceCompact>
    <SpaceCompact block><Select aria-label="Province" :options="provinces" default-value="zhejiang" style="width: 140px" /><Input aria-label="District" default-value="Xihu District, Hangzhou" /></SpaceCompact>
    <SpaceCompact block><Select aria-label="Multiple provinces" :options="provinces" mode="multiple" :default-value="['zhejiang']" style="width: 50%" /><Input aria-label="Second district" default-value="Xihu District, Hangzhou" style="width: 50%" /></SpaceCompact>
    <SpaceCompact block><Select aria-label="Option" :options="provinces" default-value="zhejiang" style="width: 140px" /><Input aria-label="Input content" placeholder="Input content" /><InputNumber aria-label="Quantity" :default-value="12" /></SpaceCompact>
    <SpaceCompact block><Input aria-label="Date prefix" placeholder="Booking reference" /><DatePicker aria-label="Booking date" /></SpaceCompact>
    <SpaceCompact block><Select aria-label="Account action" :options="actions" default-value="signup" style="width: 140px" /><Input aria-label="Email" placeholder="Email" /></SpaceCompact>
    <SpaceCompact block><Select aria-label="Range rule" :options="[{ value: 'between', label: 'Between' }, { value: 'except', label: 'Except' }]" default-value="between" style="width: 130px" /><InputNumber aria-label="Minimum" placeholder="Minimum" /><SpaceAddon>~</SpaceAddon><InputNumber aria-label="Maximum" placeholder="Maximum" /></SpaceCompact>
    <SpaceCompact block><Input aria-label="First amount" placeholder="First amount" /><SpaceAddon>$</SpaceAddon><Input aria-label="Second amount" placeholder="Second amount" /><Input aria-label="Third amount" placeholder="Third amount" /><SpaceAddon>$</SpaceAddon></SpaceCompact>
    <SpaceCompact block><Button type="primary">Button</Button><Input aria-label="Amount with unit" placeholder="Input here" /><SpaceAddon>$</SpaceAddon></SpaceCompact>
  </Space>
</template>
```
