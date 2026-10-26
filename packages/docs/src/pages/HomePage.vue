<script setup lang="ts">
import { Button } from '@apollo-design/ui';
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
            ? '独立发展的 Vue 3 原生组件库。TypeScript、静态 CSS 与 CSS 变量，为业务应用提供一致的交互和主题。'
            : 'An independent Vue 3 component library. TypeScript, static CSS and CSS variables for consistent interactions and themes.'
        }}
      </p>
      <div class="home-cta">
        <RouterLink v-slot="{ href, navigate }" custom to="/guide/getting-started">
          <Button type="primary" size="large" :href="href" @click="navigate">
            {{ locale === 'zh-CN' ? '快速开始' : 'Get Started' }}
          </Button>
        </RouterLink>
        <RouterLink v-slot="{ href, navigate }" custom to="/components">
          <Button size="large" :href="href" @click="navigate">
            {{ locale === 'zh-CN' ? '组件总览' : 'Components' }}
          </Button>
        </RouterLink>
        <Button
          size="large"
          :href="siteManifest.repoUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </Button>
      </div>
      <div class="home-meta">
        <span class="site-badge">v{{ siteManifest.apolloVersion }}</span>
        <span class="site-badge">
          Vue 3 Native
        </span>
        <span class="site-badge">
          {{ siteManifest.components.length }} {{ locale === 'zh-CN' ? '组件' : 'components' }}
        </span>
      </div>
    </section>

    <RouterLink class="home-progress" to="/guide/audit-progress">
      <strong>{{ locale === 'zh-CN' ? '2026-10-26 · 整改进展' : '2026-10-26 · Audit progress' }}</strong>
      <span>{{ locale === 'zh-CN' ? 'Image、List与Spin已验收；QRCode集中整改正在验收。查看进展与示例 →' : 'Image, List and Spin verified; QRCode fixes under validation. See progress and live examples →' }}</span>
    </RouterLink>

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
        <h3>{{ locale === 'zh-CN' ? '一致的组件体验' : 'Consistent component experience' }}</h3>
        <p>{{
          locale === 'zh-CN'
            ? '公开 API、真实使用场景与明确组件契约，共同驱动功能、无障碍与视觉回归。'
            : 'Public APIs, user scenarios and explicit contracts guide behavior, accessibility and visual regression.'
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
            ? '使用 v-model、插槽和语义化 classNames / styles，自然地组合 Vue 组件。'
            : 'Compose Vue components with v-model, slots and semantic classNames / styles.'
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

.home-meta {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.home-progress {
  display: grid;
  gap: 8px;
  margin: 32px auto 0;
  padding: 18px 20px;
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  background: var(--site-bg-soft);
  text-align: left;
  color: var(--site-text);
}

.home-progress span {
  color: var(--site-text-secondary);
  font-size: 14px;
}

.home-demo {
  margin: 44px auto;
  padding: 30px 20px;
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
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
  border-radius: var(--site-radius);
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
