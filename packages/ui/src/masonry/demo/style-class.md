---
order: 5
title:
  zh-CN: 自定义样式
  en-US: Custom Style
---

`classNames` / `styles` 两个语义槽都支持**对象**与**函数**两种形态；
函数形态的入参 `props.columns` 是**解析后的列数**（不是原始 prop）。

⚠️ 与 antd 的 demo 的差异：上游用 `antd-style` 的 `createStaticStyles` 生成类名，
本仓没有这个依赖 ⇒ 用普通类名替换；`Flex` / `Divider` / `Typography` 换成原生元素。
**缺口登记在 `README.md` §7。**

```vue
<script setup lang="ts">
// 对齐 antd 的 style-class demo：`classNames` / `styles` 两个语义槽，
// 且**对象形态与函数形态都演示一遍**。
//
// ⚠️ antd 的 demo 用 `antd-style` 的 `createStaticStyles` 生成 CSS 类 ——
// 本仓没有这个依赖 ⇒ 用**普通类名**替换（真正的样式在 `styles` 里给），
// 缺口登记在 README §7。`Flex` / `Divider` / `Typography` 换成原生元素。
import { Masonry, type MasonryProps } from '@apollo-design/ui';

const heights = [120, 80, 100, 60, 140, 90, 110, 70];

const items = heights.map((height, index) => ({ key: `item-${index}`, data: height }));

/** 对象形态。 */
const styles: MasonryProps<number>['styles'] = {
  root: { borderRadius: 12, padding: 20, height: 260, backgroundColor: 'rgba(250,250,250,0.5)' },
  item: { border: '1px solid #ccc', borderRadius: 12, overflow: 'hidden' },
};

/** 函数形态：入参的 `props.columns` 是**解析后的列数**。 */
const stylesFn: MasonryProps<number>['styles'] = ({ props }) => ({
  root: {
    border: `2px solid ${typeof props.columns === 'number' && props.columns > 2 ? '#1890ff' : '#52c41a'}`,
    padding: 20,
    height: 280,
    backgroundColor: 'rgba(240,248,255,.6)',
  },
  item: { border: '1px solid #1890ff', borderRadius: 12, overflow: 'hidden' },
});

const classNames = { root: 'masonry-demo-root', item: 'masonry-demo-item' };

const base = { items, columns: 4, gutter: 16 } as const;
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 24px">
    <section>
      <h4 style="margin: 0 0 8px">classNames + styles（对象）</h4>
      <Masonry v-bind="base" :class-names="classNames" :styles="styles">
        <template #item="{ data, index }">
          <div :style="{ height: `${data}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }">
            {{ index + 1 }}
          </div>
        </template>
      </Masonry>
    </section>
    <section>
      <h4 style="margin: 0 0 8px">styles（函数式，按解析后的 columns 分支）</h4>
      <Masonry v-bind="base" :class-names="classNames" :styles="stylesFn">
        <template #item="{ data, index }">
          <div :style="{ height: `${data}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }">
            {{ index + 1 }}
          </div>
        </template>
      </Masonry>
    </section>
  </div>
</template>

```
