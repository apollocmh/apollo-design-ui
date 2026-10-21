<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useSiteLocale } from '../composables/locale';
import { siteManifest } from '../composables/manifest';

const { locale, t } = useSiteLocale();
const logoSrc = `${import.meta.env.BASE_URL}logo.svg`;

/** 首页实时示例：与所有 demo 一致，仅客户端动态加载（SSR 安全 + 按需 chunk）。 */
const hero = ref<Record<string, unknown>>({});
const count = ref(3);
const enabled = ref(true);

onMounted(async () => {
  const ui = await import('@apollo-design/ui');
  hero.value = {
    Button: ui.Button,
    Space: ui.Space,
    Tag: ui.Tag,
    InputNumber: ui.InputNumber,
    Switch: ui.Switch,
  };
});
</script>

<template>
  <div class="home">
    <section class="home-hero">
      <div class="home-hero-logo">
        <img :src="logoSrc" alt="Apollo Design" />
      </div>
      <h1 class="home-title">Apollo Design</h1>
      <p class="home-subtitle">
        {{
          locale === 'zh-CN'
            ? '以 Ant Design 6.6.4 为兼容规格，用 Vue 3 + TypeScript 原生重写的组件库。零 React 运行时，静态 CSS + CSS 变量。'
            : 'A Vue 3 + TypeScript component library that treats Ant Design 6.6.4 as its compatibility spec. Zero React runtime, static CSS + CSS variables.'
        }}
      </p>
      <div class="home-cta">
        <RouterLink class="home-cta-primary" to="/guide/getting-started">
          {{ locale === 'zh-CN' ? '快速开始' : 'Get Started' }}
        </RouterLink>
        <RouterLink class="home-cta-secondary" to="/components">
          {{ locale === 'zh-CN' ? '组件总览' : 'Components' }}
        </RouterLink>
        <a
          class="home-cta-secondary"
          :href="siteManifest.repoUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </div>
      <div class="home-meta">
        <span class="site-badge">v{{ siteManifest.apolloVersion }}</span>
        <span class="site-badge">
          antd {{ siteManifest.antdTarget }} {{ locale === 'zh-CN' ? '兼容' : 'compatible' }}
        </span>
        <span class="site-badge">
          {{ siteManifest.components.length }} {{ locale === 'zh-CN' ? '组件' : 'components' }}
        </span>
      </div>
    </section>

    <!-- 真实组件实时示例（客户端挂载） -->
    <section v-if="hero.Button" class="home-demo" :aria-label="t('liveDemo')">
      <component :is="hero.Space" wrap align="center" style="row-gap: 12px">
        <component :is="hero.Button" type="primary" @click="count += 1">
          +1 ({{ count }})
        </component>
        <component :is="hero.Button" @click="count = 0">Reset</component>
        <component
          :is="hero.InputNumber"
          v-model:value="count"
          :min="0"
          style="width: 120px"
        />
        <component :is="hero.Switch" v-model:checked="enabled" />
        <component v-if="enabled" :is="hero.Tag" color="blue">live demo</component>
      </component>
    </section>

    <section class="home-features">
      <div class="home-feature">
        <h3>{{ locale === 'zh-CN' ? '对齐 antd，不依赖 React' : 'antd-aligned, React-free' }}</h3>
        <p>{{
          locale === 'zh-CN'
            ? '行为、DOM、ARIA 与视觉以 antd 6.6.4 为规格，七层门禁逐项对拍。'
            : 'Behavior, DOM, ARIA and visuals are gated against antd 6.6.4 by a seven-layer test harness.'
        }}</p>
      </div>
      <div class="home-feature">
        <h3>{{ locale === 'zh-CN' ? '静态 CSS + 令牌' : 'Static CSS + tokens' }}</h3>
        <p>{{
          locale === 'zh-CN'
            ? '零 CSS-in-JS 运行时；设计令牌走 --apollo-* 变量，暗色即时切换。'
            : 'No CSS-in-JS runtime; design tokens are --apollo-* variables with instant dark mode.'
        }}</p>
      </div>
      <div class="home-feature">
        <h3>{{ locale === 'zh-CN' ? 'Vue 原生' : 'Vue native' }}</h3>
        <p>{{
          locale === 'zh-CN'
            ? 'v-model、插槽、语义化 classNames / styles 都是 Vue 的心智模型，不是 React 的翻译腔。'
            : 'v-model, slots and semantic classNames / styles follow Vue idioms, not translated React patterns.'
        }}</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: 880px;
  margin: 0 auto;
  padding: 56px 8px 80px;
  text-align: center;
}

.home-hero-logo img {
  width: 72px;
  height: 72px;
}

.home-title {
  font-size: 44px;
  font-weight: 700;
  margin: 18px 0 10px;
  letter-spacing: -0.02em;
}

.home-subtitle {
  font-size: 16px;
  color: var(--site-text-secondary);
  max-width: 560px;
  margin: 0 auto 28px;
}

.home-cta {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.home-cta-primary,
.home-cta-secondary {
  display: inline-block;
  padding: 8px 26px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
}

.home-cta-primary {
  background: var(--site-brand);
  color: #fff;
}

.home-cta-primary:hover {
  background: var(--site-brand-hover);
  color: #fff;
}

.home-cta-secondary {
  border: 1px solid var(--site-border-strong);
  color: var(--site-text);
}

.home-cta-secondary:hover {
  border-color: var(--site-brand);
  color: var(--site-brand);
}

.home-meta {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.home-demo {
  margin: 44px auto;
  padding: 30px 20px;
  border: 1px solid var(--site-border);
  border-radius: 12px;
  background: var(--site-bg-soft);
}

.home-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 32px;
  text-align: left;
}

@media (max-width: 800px) {
  .home-features {
    grid-template-columns: 1fr;
  }
}

.home-feature {
  border: 1px solid var(--site-border);
  border-radius: 12px;
  padding: 20px;
  background: var(--site-bg);
}

.home-feature h3 {
  margin: 0 0 8px;
  font-size: 15.5px;
}

.home-feature p {
  margin: 0;
  color: var(--site-text-secondary);
  font-size: 13.5px;
}
</style>
