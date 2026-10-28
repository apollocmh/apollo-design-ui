<script setup lang="ts">
// 对齐 antd 的 custom-label demo：items[].label 接受 VNode
import { QuestionCircleOutlined } from '@apollo-design/icons';
import { Descriptions, Tooltip } from '@apollo-design/ui';
import { h } from 'vue';

const label = (text: string, tip: string) =>
  h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '4px' } }, [
    text,
    h(Tooltip, { title: tip, trigger: ['hover', 'focus'] }, () =>
      h(
        'button',
        {
          type: 'button',
          'aria-label': `${text}说明`,
          style: {
            display: 'inline-flex',
            padding: '2px',
            border: 0,
            background: 'transparent',
            color: 'var(--apollo-color-primary)',
            cursor: 'help',
          },
        },
        h(QuestionCircleOutlined, { 'aria-hidden': 'true' }),
      ),
    ),
  ]);

const items = [
  { key: '1', label: label('产品', '产品的展示名称'), children: '云数据库' },
  { key: '2', label: label('计费方式', '按量付费或包年包月'), children: '预付费' },
  { key: '3', label: label('到期时间', '到期后资源自动释放'), children: '2026-12-31' },
  { key: '4', label: label('状态', '实例当前的运行状态'), children: '运行中' },
];
</script>

<template>
  <Descriptions bordered :items="items" />
  <p>悬浮或使用 Tab 聚焦问号按钮，查看标签说明。</p>
</template>
