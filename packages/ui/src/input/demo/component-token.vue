<script setup lang="ts">
import { compactAlgorithm, type ThemeConfig } from '@apollo-design/theme';
import { ConfigProvider, Input, InputSearch, TextArea } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const compact = ref(false);
const roomy = ref(false);
const ancestorStyle = ref(false);
const theme = computed<ThemeConfig>(() => {
  const input: Record<string, string | number> = {};
  if (roomy.value) {
    input.paddingBlock = 8;
    input.inputAffixPadding = 10;
  }
  return {
    ...(compact.value ? { algorithm: compactAlgorithm } : {}),
    components: { Input: input },
  };
});
</script>

<template>
  <ConfigProvider :theme="theme">
    <div class="demo-input-token" :class="{ 'demo-input-token--ancestor': ancestorStyle }">
      <div class="demo-input-token__controls">
        <button type="button" :aria-pressed="compact" @click="compact = !compact">紧凑主题</button>
        <button type="button" :aria-pressed="roomy" @click="roomy = !roomy">
          增大内边距与前缀间距
        </button>
        <button type="button" :aria-pressed="ancestorStyle" @click="ancestorStyle = !ancestorStyle">
          祖先样式切换
        </button>
      </div>
      <div class="demo-input-token__field">
        <span class="demo-input-token__label">内边距与紫色聚焦态</span>
        <Input aria-label="令牌示例输入框" placeholder="聚焦查看紫色描边" />
      </div>
      <div class="demo-input-token__field">
        <span class="demo-input-token__label">带前缀的输入框</span>
        <Input aria-label="带前缀的令牌示例" prefix="@" default-value="apollo" />
      </div>
      <div class="demo-input-token__field">
        <span class="demo-input-token__label">搜索按钮随输入自然伸展</span>
        <InputSearch aria-label="主题搜索示例" enter-button="搜索" default-value="Apollo" />
      </div>
      <div class="demo-input-token__field">
        <span class="demo-input-token__label">文本域随主题与宽度重新量测</span>
        <TextArea
          aria-label="主题自适应文本域"
          :auto-size="{ minRows: 2, maxRows: 4 }"
          default-value="保留输入内容，切换主题或增大内边距。"
        />
      </div>
      <p class="demo-input-token__hint">
        覆盖 --apollo-input-padding-inline / --apollo-input-hover-border-color /
        --apollo-input-active-border-color / --apollo-input-active-shadow。
        主题配置消费当前字号与间距，显式 CSS 变量继续生效；祖先样式改变后文本域也会重测。
      </p>
    </div>
  </ConfigProvider>
</template>

<style>
.demo-input-token {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(100%, 360px);
}

.demo-input-token__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.demo-input-token__controls button {
  padding: 4px 8px;
  color: var(--apollo-color-text);
  background: var(--apollo-color-bg-container);
  border: 1px solid var(--apollo-color-border);
  border-radius: 4px;
  cursor: pointer;
}

.demo-input-token__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.demo-input-token__label {
  color: var(--apollo-color-text-secondary);
  font-size: 12px;
}

.demo-input-token .apollo-input,
.demo-input-token .apollo-input-affix-wrapper {
  --apollo-input-padding-inline: 16px;
  --apollo-input-hover-border-color: color-mix(in srgb, #9254de 85%, var(--apollo-color-text));
  --apollo-input-active-border-color: color-mix(in srgb, #722ed1 75%, var(--apollo-color-text));
  --apollo-input-hover-bg: color-mix(in srgb, #9254de 8%, var(--apollo-color-bg-container));
  --apollo-input-active-bg: var(--apollo-color-bg-container);
  --apollo-input-active-shadow: 0 0 0 2px rgb(114 46 209 / 18%);
}

.demo-input-token__hint {
  margin: 0;
  color: var(--apollo-color-text-secondary);
  font-size: 12px;
}

.demo-input-token--ancestor .apollo-input,
.demo-input-token--ancestor .apollo-input-affix-wrapper {
  font-size: 20px;
  padding-block: 10px;
}
</style>
