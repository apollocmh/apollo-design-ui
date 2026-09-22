<script setup lang="ts">
// 对齐 antd 的 style-class demo（components/statistic/demo/style-class.tsx）
// ⚠️ antd 用 antd-style 的 createStaticStyles —— 我们直接传对象/函数形态的
//    classNames / styles（同一 API 面的本体），差异登记在 README §5。
import { Statistic } from '@apollo-design/ui';

const classNames = { root: 'demo-statistic-root' };

const styleFn = ({ props }: { props: { value?: number | string } }) => {
  const numValue = Number(props.value ?? 0);
  const isNegative = Number.isFinite(numValue) && numValue < 0;
  if (isNegative) {
    return {
      title: { color: '#ff4d4f' },
      content: { color: '#ff7875' },
      value: {
        backgroundColor: '#fff1f0',
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
        title: { color: '#1890ff', fontWeight: 600 },
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
