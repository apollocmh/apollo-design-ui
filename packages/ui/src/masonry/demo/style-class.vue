<script setup lang="ts">
// 对齐 antd 的 style-class demo：`classNames` / `styles` 两个语义槽，
// 且**对象形态与函数形态都演示一遍**。
//
// ⚠️ antd 的 demo 用 `antd-style` 的 `createStaticStyles` 生成 CSS 类 ——
// 本仓没有这个依赖 ⇒ 用**普通类名**替换（真正的样式在 `styles` 里给），
// 缺口登记在 README §7。`Flex` / `Divider` / `Typography` 换成原生元素。
import { Masonry, type MasonryItemRenderInfo, type MasonryProps } from '@apollo-design/ui';
import { h } from 'vue';

const heights = [120, 80, 100, 60, 140, 90, 110, 70];

const items = heights.map((height, index) => ({ key: `item-${index}`, data: height }));

const renderItem = ({ data, index }: MasonryItemRenderInfo<unknown>) =>
  h(
    'div',
    {
      style: {
        height: `${Number(data)}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
      },
    },
    String(index + 1),
  );

/** 对象形态。 */
const styles: MasonryProps['styles'] = {
  root: { borderRadius: 12, padding: 20, height: 260, backgroundColor: 'rgba(250,250,250,0.5)' },
  item: { border: '1px solid #ccc', borderRadius: 12, overflow: 'hidden' },
};

/** 函数形态：入参的 `props.columns` 是**解析后的列数**。 */
const stylesFn: MasonryProps['styles'] = ({ props }) => ({
  root: {
    border: `2px solid ${typeof props.columns === 'number' && props.columns > 2 ? '#1890ff' : '#52c41a'}`,
    padding: 20,
    height: 280,
    backgroundColor: 'rgba(240,248,255,.6)',
  },
  item: { border: '1px solid #1890ff', borderRadius: 12, overflow: 'hidden' },
});

const classNames = { root: 'masonry-demo-root', item: 'masonry-demo-item' };

const base = { items, itemRender: renderItem, columns: 4, gutter: 16 } as const;
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 24px">
    <section>
      <h4 style="margin: 0 0 8px">classNames + styles（对象）</h4>
      <Masonry v-bind="base" :class-names="classNames" :styles="styles" />
    </section>
    <section>
      <h4 style="margin: 0 0 8px">styles（函数式，按解析后的 columns 分支）</h4>
      <Masonry v-bind="base" :class-names="classNames" :styles="stylesFn" />
    </section>
  </div>
</template>
