<script setup lang="ts">
// 对象与函数语义样式；标题跟随当前主题，数值色块使用成对的前景/背景。
import { Statistic } from '@apollo-design/ui';

const classNames = { root: 'demo-statistic-root' };

const styleFn = ({ props }: { props: { value?: number | string } }) => {
  const numValue = Number(props.value ?? 0);
  const isNegative = Number.isFinite(numValue) && numValue < 0;
  if (isNegative) {
    return {
      title: { color: 'var(--apollo-color-text-heading)' },
      content: { color: 'var(--apollo-color-text-heading)' },
      value: {
        backgroundColor: '#fff1f0',
        color: '#a8071a',
        borderRadius: '4px',
        paddingInline: '6px',
        userSelect: 'none' as const,
      },
    };
  }
  return {};
};
</script>

<template>
  <div class="demo-statistic-style-list">
    <Statistic
      :class-names="classNames"
      title="Monthly Active Users"
      :value="93241"
      prefix="↑"
      suffix="users"
      :styles="{
        title: { color: 'var(--apollo-color-text-heading)', fontWeight: 600 },
        content: { fontSize: '24px' },
        value: {
          backgroundColor: '#e6f4ff',
          borderRadius: '4px',
          color: '#0958d9',
          paddingInline: '6px',
          userSelect: 'none',
        },
      }"
    />
    <Statistic
      :class-names="classNames"
      title="Yearly Loss"
      :value="-18.7"
      :precision="1"
      :styles="styleFn"
      suffix="%"
    />
  </div>
</template>

<style scoped>
.demo-statistic-style-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>

<style>
.demo-statistic-root {
  border: 2px dashed #ccc;
  padding: 16px;
  border-radius: 8px;
}
</style>
