<script setup lang="ts">
/**
 * 独立图标目录（2026-10-21 审计 A13）。
 *
 * 这是 `@apollo-design/icons` 的资源文档，**不是**第 73 个 UI 组件：
 * 不进 registry/components.json，不伪造 packages/ui/src/icon 目录。
 *
 * 性能约束：848 个图标通过窗口滚动虚拟行按需动态 import；
 * 搜索与风格筛选只读构建期 manifest，不加载任何图标组件。
 */
import { Button, Input, Select } from '@apollo-design/ui';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import VirtualIconGrid from '../components/icons/VirtualIconGrid.vue';
import {
  filterIcons,
  type IconCopyMode,
  type IconStyleFilter,
  iconSnippet,
} from '../composables/icon-catalog';
import { useSiteLocale } from '../composables/locale';
import { siteManifest } from '../composables/manifest';
import { useSeo } from '../composables/seo';
import { useTocState } from '../composables/toc';

const { locale } = useSiteLocale();
const { setToc } = useTocState();
const isZh = computed(() => locale.value === 'zh-CN');
const txt = (zh: string, en: string): string => (isZh.value ? zh : en);

const icons = siteManifest.icons.items;
const query = ref('');
const styleFilter = ref<IconStyleFilter>('all');
const copyMode = ref<IconCopyMode>('import');
const copyOptions = computed(() => [
  { value: 'import', label: txt('import 语句', 'import statement') },
  { value: 'name', label: txt('图标名称', 'icon name') },
  { value: 'tag', label: txt('Vue 标签', 'Vue tag') },
]);
const copied = ref('');
const copyFailed = ref(false);

const filtered = computed(() => filterIcons(icons, query.value, styleFilter.value));

const styleTabs = computed(() => [
  { value: 'all' as const, label: txt('全部', 'All'), count: siteManifest.icons.total },
  {
    value: 'outlined' as const,
    label: txt('线框风格', 'Outlined'),
    count: siteManifest.icons.byStyle.outlined,
  },
  {
    value: 'filled' as const,
    label: txt('实底风格', 'Filled'),
    count: siteManifest.icons.byStyle.filled,
  },
  {
    value: 'twoTone' as const,
    label: txt('双色风格', 'TwoTone'),
    count: siteManifest.icons.byStyle.twoTone,
  },
]);

let copiedTimer: ReturnType<typeof setTimeout> | null = null;
async function copy(name: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(iconSnippet(name, copyMode.value));
    copied.value = name;
    copyFailed.value = false;
  } catch {
    copyFailed.value = true;
    copied.value = name;
  }
  if (copiedTimer) clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => {
    copied.value = '';
    copyFailed.value = false;
  }, 1800);
}

const usageCode = [
  "import { SearchOutlined } from '@apollo-design/icons';",
  '',
  '<template>',
  '  <SearchOutlined />',
  '</template>',
].join('\n');

const toc = computed(() => [
  { level: 2 as const, text: txt('使用方式', 'Usage'), id: 'icon-usage' },
  { level: 2 as const, text: txt('图标目录', 'Icon catalog'), id: 'icon-catalog' },
  { level: 2 as const, text: 'API', id: 'icon-api' },
]);
watch(toc, (next) => setToc(next), { immediate: true });

useSeo(
  computed(() => txt('图标', 'Icons')),
  computed(() =>
    txt(
      `@apollo-design/icons 提供 ${siteManifest.icons.total} 个 Vue 图标。`,
      `${siteManifest.icons.total} Vue icons from @apollo-design/icons.`,
    ),
  ),
);

onBeforeUnmount(() => {
  setToc([]);
  if (copiedTimer) clearTimeout(copiedTimer);
});
</script>

<template>
  <div class="icon-page">
    <header class="icon-header">
      <h1 class="icon-title">{{ txt('Icon 图标', 'Icon') }}</h1>
      <p class="icon-lead">
        {{
          txt(
            `@apollo-design/icons 提供 ${siteManifest.icons.total} 个基于 Ant Design 图标素材生成的 Vue 图标组件，支持 Outlined / Filled / TwoTone 三种风格。`,
            `@apollo-design/icons ships ${siteManifest.icons.total} Vue icon components generated from Ant Design icon artwork, in Outlined / Filled / TwoTone styles.`,
          )
        }}
      </p>
    </header>

    <section id="icon-usage" class="icon-section">
      <h2 class="icon-section-title">{{ txt('使用方式', 'Usage') }}</h2>
      <p class="icon-section-lead">
        {{
          txt(
            '从独立包按名称导入图标；图标继承当前文字颜色与字号，可使用 style / class 调整。',
            'Import icons by name from the standalone package. Icons inherit the current text color and font size; use style / class to adjust them.',
          )
        }}
      </p>
      <pre class="icon-code"><code>{{ usageCode }}</code></pre>
      <p class="icon-section-lead">
        {{ txt('更多用法（旋转、spin、TwoTone 调色、IconProvider、createIcon、createFromIconfontCN）见', 'More usage (rotate, spin, TwoTone colors, IconProvider, createIcon, createFromIconfontCN) is documented in') }}
        <RouterLink to="/guide/icons">{{ txt('图标指南', 'the icon guide') }}</RouterLink>.
      </p>
    </section>

    <section id="icon-catalog" class="icon-section">
      <div class="icon-catalog-head">
        <h2 class="icon-section-title">{{ txt('图标目录', 'Icon catalog') }}</h2>
        <span class="icon-count">
          {{ txt(`共 ${filtered.length} 个`, `${filtered.length} icons`) }}
        </span>
      </div>

      <div class="icon-toolbar">
        <label class="icon-search-wrap">
          <span id="icon-search-label" class="site-sr-only">
            {{ txt('搜索图标', 'Search icons') }}
          </span>
          <Input
            id="icon-search"
            v-model:value="query"
            class="icon-search"
            type="search"
            :placeholder="txt('搜索图标名称…', 'Search icon names…')"
            aria-labelledby="icon-search-label"
          />
        </label>

        <div class="icon-style-tabs" role="group" :aria-label="txt('图标风格', 'Icon style')">
          <Button
            v-for="tab in styleTabs"
            :key="tab.value"
            type="text"
            size="small"
            class="icon-style-tab"
            :class="{ active: styleFilter === tab.value }"
            :aria-pressed="styleFilter === tab.value"
            @click="styleFilter = tab.value"
          >
            {{ tab.label }} <span class="icon-style-count">{{ tab.count }}</span>
          </Button>
        </div>

        <div class="icon-copy-mode">
          <span>{{ txt('点击复制', 'Click copies') }}</span>
          <Select
            v-model:value="copyMode"
            :options="copyOptions"
            size="small"
            :aria-label="txt('复制内容', 'Copy content')"
          />
        </div>
      </div>

      <p class="icon-status" :class="{ error: copyFailed }" role="status" aria-live="polite">
        <template v-if="copied">
          {{ copyFailed ? txt(`复制失败：${copied}`, `Copy failed: ${copied}`) : txt(`已复制：${copied}`, `Copied: ${copied}`) }}
        </template>
      </p>

      <VirtualIconGrid v-if="filtered.length > 0" :items="filtered" :copy-label="txt('复制', 'Copy')" :label="txt('图标目录', 'Icon catalog')" @copy="copy" />
      <p v-else class="icon-empty">{{ txt('没有匹配的图标。', 'No icons match.') }}</p>
    </section>

    <section id="icon-api" class="icon-section">
      <h2 class="icon-section-title">API</h2>
      <table class="icon-api-table">
        <thead>
          <tr>
            <th scope="col">{{ txt('导出', 'Export') }}</th>
            <th scope="col">{{ txt('说明', 'Description') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>&lt;Icon /&gt;</code></td>
            <td>{{ txt('通用图标容器：component / rotate / spin / twoToneColor。', 'Generic icon container: component / rotate / spin / twoToneColor.') }}</td>
          </tr>
          <tr>
            <td><code>IconProvider</code></td>
            <td>{{ txt('覆盖图标前缀（默认 apollo-icon）。', 'Override the icon prefix class (default apollo-icon).') }}</td>
          </tr>
          <tr>
            <td><code>createIcon(definition, name)</code></td>
            <td>{{ txt('用自定义 SVG definition 创建图标。', 'Create an icon from a custom SVG definition.') }}</td>
          </tr>
          <tr>
            <td><code>createFromIconfontCN({ scriptUrl })</code></td>
            <td>{{ txt('从 iconfont.cn 脚本创建图标组件。', 'Create icon components from an iconfont.cn script.') }}</td>
          </tr>
          <tr>
            <td><code>setTwoToneColor(color)</code></td>
            <td>{{ txt('设置 TwoTone 图标的主色。', 'Set the primary color for TwoTone icons.') }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.icon-page {
  min-width: 0;
}
.icon-title {
  font-size: var(--site-title-size);
  font-weight: 600;
  margin: 0 0 var(--apollo-margin-lg);
  line-height: 1.4;
}
.icon-lead,
.icon-section-lead {
  line-height: 2;
}
.icon-section {
  margin-top: var(--apollo-margin-xl);
  scroll-margin-top: calc(var(--site-header-height) + var(--apollo-margin-lg));
}
.icon-section-title {
  font-size: var(--site-section-size);
  font-weight: 500;
  margin: 0 0 var(--apollo-margin-lg);
}
.icon-code {
  margin: var(--apollo-margin) 0;
  padding: var(--apollo-padding) var(--apollo-padding-lg);
  border-radius: var(--apollo-border-radius);
  background: var(--site-code-bg);
  overflow-x: auto;
  font-family: var(--site-font-code);
  font-size: var(--apollo-font-size-sm);
  line-height: 1.8;
}
.icon-catalog-head {
  display: flex;
  align-items: baseline;
  gap: var(--apollo-margin-sm);
}
.icon-count {
  color: var(--site-text-tertiary);
  font-size: var(--apollo-font-size-sm);
}
.icon-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--apollo-margin);
  margin: var(--apollo-margin) 0 var(--apollo-margin-xs);
}
.icon-search-wrap {
  order: 1;
  flex: 1;
  min-width: 180px;
}
.icon-search {
  width: 100%;
}
.icon-style-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--apollo-margin-xxs);
  padding: var(--apollo-padding-xxs);
  background: var(--site-bg-soft);
  border-radius: var(--apollo-border-radius);
}
.icon-style-tab {
  height: auto;
  border: 0;
  background: transparent;
  color: var(--site-text-secondary);
  border-radius: var(--apollo-border-radius-sm);
  padding: var(--apollo-padding-xs) var(--apollo-padding-sm);
  font-size: var(--apollo-font-size);
  box-shadow: none;
}
.icon-style-tab.active {
  color: var(--site-text);
  background: var(--site-bg);
  box-shadow: var(--apollo-box-shadow-tertiary);
}
.icon-style-count {
  margin-left: var(--apollo-margin-xxs);
  color: var(--site-text-tertiary);
  font-size: var(--apollo-font-size-sm);
}
.icon-copy-mode {
  order: 2;
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--apollo-margin-xs);
  color: var(--site-text-tertiary);
  font-size: var(--apollo-font-size-sm);
}
.icon-copy-mode :deep(.apollo-select) {
  min-width: 132px;
}
.icon-status {
  min-height: var(--apollo-font-size-heading-3);
  margin: var(--apollo-margin-xxs) 0 var(--apollo-margin-sm);
  color: var(--site-brand);
  font-size: var(--apollo-font-size-sm);
}
.icon-status.error {
  color: var(--apollo-color-error);
}
.icon-empty {
  padding: var(--apollo-padding-xl) 0;
  text-align: center;
  color: var(--site-text-tertiary);
}
.icon-api-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--apollo-font-size);
}
.icon-api-table th,
.icon-api-table td {
  border-bottom: var(--apollo-line-width) solid var(--site-border);
  padding: var(--apollo-padding-sm);
  text-align: left;
  vertical-align: top;
}
.icon-api-table th {
  background: var(--site-bg-soft);
  font-weight: 500;
}
.icon-api-table code {
  font-family: var(--site-font-code);
  font-size: var(--apollo-font-size-sm);
  overflow-wrap: anywhere;
}
.site-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@media (max-width: 640px) {
  .icon-style-tabs {
    width: 100%;
    justify-content: space-between;
  }
  .icon-style-tab {
    padding-inline: var(--apollo-padding-xs);
    font-size: var(--apollo-font-size-sm);
  }
  .icon-style-count {
    display: none;
  }
  .icon-api-table {
    font-size: var(--apollo-font-size-sm);
  }
}
</style>
