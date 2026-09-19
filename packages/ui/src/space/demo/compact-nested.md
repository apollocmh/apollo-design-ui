---
order: 9
title:
  zh-CN: 嵌套紧凑布局
  en-US: Nested Compact
---

嵌套使用的紧凑布局。

嵌套是 `Space.Compact` 最有信息量的用法：**内层会覆盖外层注入的上下文**。
于是「内层的第一项」在视觉上是外层的中间项 —— 边框该不该合并由**最近的一层**决定。

⚠️ 同「紧凑布局」：依赖 Cascader / TimePicker / InputNumber / Select，此处用替身。

```vue
<script setup lang="ts">
import { Space, SpaceCompact } from '@apollo-design/ui';
import { BTN_PRIMARY, INPUT, SELECT } from './_standin';

const COLUMN = { display: 'flex', flexDirection: 'column', gap: '16px' } as const;
</script>

<template>
  <div :style="COLUMN">
    <SpaceCompact block>
      <SpaceCompact>
        <SpaceCompact>
          <input
            :style="{ ...INPUT, width: '90px' }"
            aria-label="typing"
            placeholder="Typing..."
          />
          <button type="button" :style="BTN_PRIMARY">Search</button>
        </SpaceCompact>
        <SpaceCompact>
          <input :style="INPUT" aria-label="nested number" type="number" value="12" />
          <select :style="SELECT" aria-label="nested option">
            <option>Opt1</option>
            <option>Opt2</option>
          </select>
        </SpaceCompact>
      </SpaceCompact>
      <button type="button" :style="BTN_PRIMARY">Separator</button>
      <SpaceCompact>
        <SpaceCompact>
          <input
            :style="{ ...INPUT, width: '110px' }"
            aria-label="nested search"
            placeholder="Search"
          />
          <button type="button" :style="BTN_PRIMARY">Submit</button>
        </SpaceCompact>
        <SpaceCompact>
          <input :style="INPUT" aria-label="nested site" value="mysite" />
          <button type="button" :style="BTN_PRIMARY">Copy</button>
        </SpaceCompact>
      </SpaceCompact>
    </SpaceCompact>

    <SpaceCompact block>
      <SpaceCompact>
        <input :style="INPUT" aria-label="nested time" type="time" />
        <button type="button" :style="BTN_PRIMARY">Submit</button>
      </SpaceCompact>
      <button type="button" :style="BTN_PRIMARY">~</button>
      <button type="button" :style="BTN_PRIMARY">~</button>
      <SpaceCompact>
        <select :style="SELECT" aria-label="nested address">
          <option>Zhejiang</option>
          <option>Jiangsu</option>
        </select>
        <button type="button" :style="BTN_PRIMARY">Submit</button>
      </SpaceCompact>
    </SpaceCompact>

    <SpaceCompact>
      <button type="button" :style="BTN_PRIMARY">Button 1</button>
      <button type="button" :style="BTN_PRIMARY">Button 2</button>
      <button type="button" :style="BTN_PRIMARY">Button 3</button>
      <button type="button" :style="BTN_PRIMARY">Button 4</button>
    </SpaceCompact>
  </div>
</template>
```
