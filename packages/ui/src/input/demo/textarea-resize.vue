<script setup lang="ts">
// 文本域缩放：通过原生 resize 控制可调整方向
import { TextArea } from '@apollo-design/ui';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px; width: min(100%, 360px)">
    <div>
      <div style="margin-bottom: 6px; color: var(--apollo-color-text-secondary); font-size: 12px">
        不可缩放（resize: none）
      </div>
      <TextArea
        aria-label="不可缩放的文本域"
        :rows="3"
        default-value="固定尺寸，适合布局稳定的表单。"
        :style="{ resize: 'none' }"
      />
    </div>
    <div>
      <div style="margin-bottom: 6px; color: var(--apollo-color-text-secondary); font-size: 12px">
        仅水平缩放
      </div>
      <TextArea
        aria-label="仅水平缩放的文本域"
        :rows="3"
        default-value="拖动右下角可改变宽度。"
        :style="{ resize: 'horizontal' }"
      />
    </div>
    <div>
      <div style="margin-bottom: 6px; color: var(--apollo-color-text-secondary); font-size: 12px">
        仅垂直缩放
      </div>
      <TextArea
        aria-label="仅垂直缩放的文本域"
        :rows="3"
        default-value="拖动右下角可改变高度。"
        :style="{ resize: 'vertical' }"
      />
    </div>
    <div>
      <div style="margin-bottom: 6px; color: var(--apollo-color-text-secondary); font-size: 12px">
        双向缩放（resize: both）
      </div>
      <TextArea
        aria-label="双向缩放的文本域"
        :rows="3"
        default-value="宽高都可以调整。"
        :style="{ resize: 'both' }"
      />
    </div>
  </div>
</template>
