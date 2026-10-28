<script setup lang="ts">
import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider, Descriptions, DescriptionsItem } from '@apollo-design/ui';
import { computed, nextTick, onMounted, ref, type StyleValue, shallowRef } from 'vue';
import { genDescriptionsStyle } from '../../../packages/ui/src/descriptions/style';

const styleSheet = document.createElement('style');
styleSheet.textContent = genDescriptionsStyle('apollo');
document.head.append(styleSheet);
const column = ref<number | { xs: number; md: number }>(3),
  bordered = ref(false),
  vertical = ref(false);
const order = ref(['a', 'b', 'c']),
  filled = ref(false),
  title = ref(false),
  empty = ref(false),
  present = ref(true);
const source = ref(false),
  provider = ref(false),
  mode = ref('light'),
  rtl = ref(false),
  clicks = ref(0);
const nativeStyle = shallowRef<StyleValue>({ maxWidth: '760px' });
const tokens = {
  labelBg: '#e5f0ff',
  labelColor: '#123456',
  titleColor: '#234567',
  titleMarginBottom: 31,
  itemPaddingBottom: 7,
  itemPaddingEnd: 9,
  colonMarginRight: 3,
  colonMarginLeft: 2,
  contentColor: '#345678',
  extraColor: '#456789',
};
const theme = computed(() => ({
  algorithm:
    mode.value === 'dark' ? darkAlgorithm : mode.value === 'compact' ? compactAlgorithm : undefined,
  ...(source.value ? { components: { Descriptions: tokens } } : {}),
}));
const components = computed(() =>
  provider.value
    ? {
        descriptions: {
          className: 'current-provider',
          style: { padding: '8px' },
          classNames: { label: 'provider-label' },
          styles: { label: { letterSpacing: '1px' } },
        },
      }
    : undefined,
);

declare global {
  interface Window {
    descriptionsAudit: {
      set(options: {
        column?: number | { xs: number; md: number };
        bordered?: boolean;
        vertical?: boolean;
        order?: string[];
        filled?: boolean;
        title?: boolean;
        empty?: boolean;
        present?: boolean;
        source?: boolean;
        provider?: boolean;
        mode?: string;
        rtl?: boolean;
        style?: StyleValue;
      }): Promise<void>;
      snapshot(): { clicks: number };
    };
  }
}
onMounted(() => {
  window.descriptionsAudit = {
    async set(options) {
      if (options.column !== undefined) column.value = options.column;
      if (options.bordered !== undefined) bordered.value = options.bordered;
      if (options.vertical !== undefined) vertical.value = options.vertical;
      if (options.order !== undefined) order.value = options.order;
      if (options.filled !== undefined) filled.value = options.filled;
      if (options.title !== undefined) title.value = options.title;
      if (options.empty !== undefined) empty.value = options.empty;
      if (options.present !== undefined) present.value = options.present;
      if (options.source !== undefined) source.value = options.source;
      if (options.provider !== undefined) provider.value = options.provider;
      if (options.mode !== undefined) mode.value = options.mode;
      if (options.rtl !== undefined) rtl.value = options.rtl;
      if (options.style !== undefined) nativeStyle.value = options.style;
      await nextTick();
    },
    snapshot: () => ({ clicks: clicks.value }),
  };
});
</script>
<template>
  <main>
    <h1>Descriptions current Vue contracts</h1>
    <ConfigProvider :theme="theme" :components="components" :direction="rtl ? 'rtl' : 'ltr'">
      <section class="theme-surface" :style="{ color: 'var(--apollo-color-text)', background: 'var(--apollo-color-bg-container)', padding: '24px' }">
        <Descriptions v-if="present" id="native-descriptions" data-descriptions-main title="Fallback title" :column="column" :bordered="bordered" :layout="vertical ? 'vertical' : 'horizontal'" :style="nativeStyle" tabindex="0">
          <template v-if="title" #title><template v-if="!empty"><!-- first --><b>Native</b><i> title</i></template></template>
          <template #extra><button type="button" @click="clicks++">Refresh fields</button></template>
          <DescriptionsItem v-for="key in order" :key="key" :label="`Field ${key}`" :span="key === 'b' && filled ? 'filled' : 1" :id="`field-${key}`" :class="`item-${key}`" :styles="key === 'b' ? { content: { minWidth: '0' } } : undefined" :class-names="{ label: 'own-label', content: 'own-content' }">
            <template v-if="key === 'b'" #label><!-- leading --><strong>Native</strong><i> label</i></template>
            <input v-if="key === 'b'" aria-label="Persistent field draft" value="Original draft" style="width:100%;min-width:0;box-sizing:border-box" />
            <template v-else>{{ key === 'a' ? 'Alpha' : 'Gamma' }}</template>
          </DescriptionsItem>
        </Descriptions>
        <Descriptions data-independent :column="1" title="Independent fields" :items="[{ key: 'x', label: 'Independent', children: 'Value' }]" />
        <Descriptions data-nested :column="1" title="Nested fields">
          <DescriptionsItem label="Outer" :class-names="{ label: 'outer-label' }" :styles="{ label: { color: 'var(--apollo-color-text)' } }">
            <Descriptions :column="1" :items="[{ key: 'nested', label: 'Inner', children: 'Nested value' }]" />
          </DescriptionsItem>
        </Descriptions>
      </section>
    </ConfigProvider>
  </main>
</template>
