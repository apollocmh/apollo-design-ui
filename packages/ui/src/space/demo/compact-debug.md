---
order: 10
title:
  zh-CN: 紧凑布局调试
  en-US: Compact Debug
---

调试 Input 前置/后置标签。这个 demo 演示的是 `Space.Compact` 与 `Space.Addon` 的配合：
`Space.Addon` 用的是**自己的**前缀（`apollo-space-addon`，不是 `apollo-space-compact`），
所以它的紧凑项类名落在 `-space-addon-compact-*` 上。

⚠️ **本 demo 是精简版**：antd 的 `compact-debug.tsx` 还覆盖 Modal / Drawer / Dropdown.Button /
Popover 里的上下文传播（这些浮层组件在本仓库尚未实现），这里保留 12 组与 `Space.Addon` 相关的。

```vue
<script setup lang="ts">
import { Space, SpaceAddon, SpaceCompact } from '@apollo-design/ui';
import {
  BTN_DASHED,
  BTN_DEFAULT,
  BTN_PRIMARY,
  BTN_SMALL,
  BTN_TEXT,
  INPUT,
  SELECT,
} from './_standin';
</script>

<template>
  <Space orientation="vertical">
    <SpaceCompact block>
      <button type="button" :style="BTN_DEFAULT">default Button</button>
      <button type="button" :style="BTN_DEFAULT">danger Button</button>
      <button type="button" :style="BTN_DASHED">dashed Button</button>
      <button type="button" :style="BTN_TEXT">text Button</button>
      <button type="button" :style="BTN_TEXT">Link Button</button>
      <button type="button" :style="BTN_DEFAULT" disabled>Download</button>
    </SpaceCompact>
    <br />
    <SpaceCompact>
      <button type="button" :style="BTN_DEFAULT">Prefix</button>
      <input :style="INPUT" aria-label="site with prefix" value="mysite" />
      <button type="button" :style="BTN_PRIMARY">Submit</button>
    </SpaceCompact>
    <SpaceCompact>
      <input :style="INPUT" aria-label="prefix field" placeholder="prefix" />
      <input :style="INPUT" aria-label="mysite field" value="mysite" />
      <button type="button" :style="BTN_DEFAULT">Copy</button>
    </SpaceCompact>
    <SpaceCompact>
      <input :style="INPUT" aria-label="search a" placeholder="Search" />
      <input :style="INPUT" aria-label="search b" placeholder="Search" />
      <button type="button" :style="BTN_DEFAULT">Copy</button>
    </SpaceCompact>
    <SpaceCompact>
      <input :style="INPUT" aria-label="suffix field" value="mysite" />
      <button type="button" :style="BTN_PRIMARY">Submit</button>
      <input :style="INPUT" aria-label="suffix tail" placeholder="suffix" />
    </SpaceCompact>
    <SpaceCompact>
      <input :style="INPUT" aria-label="counted field" value="mysite" />
      <button type="button" :style="BTN_PRIMARY">Submit</button>
      <input :style="INPUT" aria-label="counted tail" value="mysite" />
      <input :style="INPUT" aria-label="counted tail 2" value="mysite" />
    </SpaceCompact>
    <br />
    <SpaceCompact>
      <input :style="INPUT" aria-label="number with addons" type="number" value="100" />
      <SpaceAddon>$</SpaceAddon>
    </SpaceCompact>
    <SpaceCompact>
      <select :style="SELECT" aria-label="sign up">
        <option>Sign Up</option>
        <option>Sign In</option>
      </select>
    </SpaceCompact>
    <SpaceCompact>
      <input :style="INPUT" aria-label="single date" type="date" />
    </SpaceCompact>
    <SpaceCompact>
      <input :style="INPUT" aria-label="single number" type="number" value="12" />
    </SpaceCompact>
    <SpaceCompact>
      <select :style="SELECT" aria-label="single address">
        <option>Zhejiang</option>
        <option>Jiangsu</option>
      </select>
    </SpaceCompact>
    <SpaceCompact orientation="vertical">
      <button type="button" :style="BTN_SMALL">vertical compact button A</button>
    </SpaceCompact>
  </Space>
</template>
```
