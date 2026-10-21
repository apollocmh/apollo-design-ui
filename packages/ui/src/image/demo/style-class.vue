<script setup lang="ts">
// 语义化 classNames / styles：root / image / cover 三个槽位。
import { Image } from '@apollo-design/ui';

const src = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#1677ff"/>
        <stop offset="1" stop-color="#eb2f96"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#g)"/>
    <circle cx="500" cy="96" r="56" fill="rgba(255,255,255,0.28)"/>
    <circle cx="96" cy="280" r="92" fill="rgba(255,255,255,0.14)"/>
    <text x="40" y="320" fill="#ffffff" font-family="sans-serif" font-size="28">
      Apollo Design
    </text>
  </svg>`,
)}`;

const classNames = {
  root: 'demo-image-style-root',
  image: 'demo-image-style-img',
  cover: 'demo-image-style-cover',
};

const styles = {
  root: { borderRadius: '12px', overflow: 'hidden' },
  cover: {
    background: 'rgba(22, 119, 255, 0.4)',
    color: '#ffffff',
    fontSize: '14px',
  },
};

const preview = { cover: '点击预览' };
</script>

<template>
  <div class="demo-image-style-wrap">
    <Image
      :width="320"
      :src="src"
      alt="Gradient artwork"
      :preview="preview"
      :class-names="classNames"
      :styles="styles"
    />
    <p class="demo-image-style-hint">悬停查看自定义遮罩，点击打开预览。</p>
  </div>
</template>

<style>
.demo-image-style-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.demo-image-style-root {
  border: 1px solid var(--apollo-color-border);
  box-shadow: var(--apollo-box-shadow-tertiary);
}

.demo-image-style-img {
  display: block;
}

.demo-image-style-cover {
  backdrop-filter: blur(2px);
}
</style>
