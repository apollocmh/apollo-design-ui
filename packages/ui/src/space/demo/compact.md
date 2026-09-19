---
order: 6
title:
  zh-CN: 紧凑布局
  en-US: Compact Mode
---

使用 `Space.Compact` 让表单组件之间紧凑连接且合并边框。

`Space.Compact` **自己不产子元素包装**：它把 `compactSize` / `compactDirection` /
`isFirstItem` / `isLastItem` 通过 `useCompactItemContext` 注入给**子组件**，
由子组件自己拼 `{自己的前缀}-compact-item` 类名。这是 Space 最重要的一条跨组件协议
（Button / Input / Select / DatePicker 等 10 个组件消费它）。

⚠️ **本 demo 是精简版**：antd 的 `compact.tsx` 有 15 组，其中多组依赖 Select / DatePicker /
Cascader / TreeSelect / InputNumber / AutoComplete / TimePicker / ColorPicker，它们在本仓库
尚未实现（Space 在 DAG 上先于它们）。这里保留 11 组，全部用原生 `<input>` / `<select>` 替身。
替身只保证**尺寸与间距**可比，没有自己的 hover / focus / disabled 视觉。缺口见 `README.md` §7。

```vue
<script setup lang="ts">
import { Space, SpaceAddon, SpaceCompact } from '@apollo-design/ui';
import { BTN_PRIMARY, BTN_TEXT, INPUT, INPUT_DISABLED, SELECT } from './_standin';
</script>

<template>
  <Space orientation="vertical">
    <SpaceCompact block>
      <input :style="{ ...INPUT, width: '20%' }" aria-label="area code" value="0571" />
      <input :style="{ ...INPUT, width: '30%' }" aria-label="phone" value="26888888" />
    </SpaceCompact>

    <SpaceCompact block size="small">
      <input
        :style="{ ...INPUT, width: 'calc(100% - 200px)' }"
        aria-label="site url"
        value="https://ant.design"
      />
      <button type="button" :style="BTN_PRIMARY">Submit</button>
    </SpaceCompact>

    <SpaceCompact block>
      <input
        :style="{ ...INPUT, width: 'calc(100% - 200px)' }"
        aria-label="git url"
        value="git@github.com:ant-design/ant-design.git"
      />
      <button type="button" :style="BTN_TEXT">Copy</button>
    </SpaceCompact>

    <SpaceCompact block>
      <select :style="SELECT" aria-label="province">
        <option>Zhejiang</option>
        <option>Jiangsu</option>
      </select>
      <input
        :style="{ ...INPUT, width: '50%' }"
        aria-label="district"
        value="Xihu District, Hangzhou"
      />
    </SpaceCompact>

    <SpaceCompact block>
      <select :style="{ ...SELECT, width: '50%' }" aria-label="multi province" multiple size="3">
        <option selected>Zhejiang</option>
        <option>Jiangsu</option>
      </select>
      <input
        :style="{ ...INPUT, width: '50%' }"
        aria-label="district 2"
        value="Xihu District, Hangzhou"
      />
    </SpaceCompact>

    <SpaceCompact block>
      <select :style="SELECT" aria-label="option">
        <option>Option1</option>
        <option>Option2</option>
      </select>
      <input :style="{ ...INPUT, width: '50%' }" aria-label="input content" value="input content" />
      <input :style="INPUT" aria-label="number" type="number" value="12" />
    </SpaceCompact>

    <SpaceCompact block>
      <input :style="{ ...INPUT, width: '50%' }" aria-label="date prefix" value="input content" />
      <input :style="{ ...INPUT, width: '50%' }" aria-label="date" type="date" />
    </SpaceCompact>

    <SpaceCompact block>
      <select :style="SELECT" aria-label="sign">
        <option>Sign Up</option>
        <option>Sign In</option>
      </select>
      <input :style="{ ...INPUT, width: '70%' }" aria-label="email" placeholder="Email" />
    </SpaceCompact>

    <SpaceCompact block>
      <select :style="SELECT" aria-label="between">
        <option>Between</option>
        <option>Except</option>
      </select>
      <input
        :style="{ ...INPUT, width: '100px', textAlign: 'center' }"
        aria-label="minimum"
        placeholder="Minimum"
      />
      <input
        :style="{
          ...INPUT_DISABLED,
          width: '30px',
          textAlign: 'center',
          borderInlineStart: '0',
          borderInlineEnd: '0',
          pointerEvents: 'none',
        }"
        aria-label="separator"
        placeholder="~"
        disabled
      />
      <input
        :style="{ ...INPUT, width: '100px', textAlign: 'center' }"
        aria-label="maximum"
        placeholder="Maximum"
      />
    </SpaceCompact>

    <SpaceCompact>
      <input :style="INPUT" aria-label="addon input" placeholder="input here" />
      <SpaceAddon>$</SpaceAddon>
      <input
        :style="{ ...INPUT, width: '100%' }"
        aria-label="addon number a"
        placeholder="another input"
      />
      <input
        :style="{ ...INPUT, width: '100%' }"
        aria-label="addon number b"
        placeholder="another input"
      />
      <SpaceAddon>$</SpaceAddon>
    </SpaceCompact>

    <SpaceCompact>
      <button type="button" :style="BTN_PRIMARY">Button</button>
      <input :style="INPUT" aria-label="addon tail" placeholder="input here" />
      <SpaceAddon>$</SpaceAddon>
    </SpaceCompact>
  </Space>
</template>
```
