<script setup lang="ts">
import { en_US, zh_CN } from '@apollo-design/locale';
import { computed, ref } from 'vue';
import { ConfigProvider, Empty, Input, Pagination, Select, Space } from '../../index';

const language = ref<'en' | 'zh'>('zh');
const locale = computed(() => (language.value === 'zh' ? zh_CN : en_US));
const options = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
];
function changeLanguage(value: unknown) {
  if (value === 'en' || value === 'zh') language.value = value;
}
</script>

<template>
  <div>
    <Space style="margin-bottom: 16px">
      <span>locale</span>
      <Select :value="language" :options="options" aria-label="切换示例语言" style="width: 140px" @change="changeLanguage" />
    </Space>
    <ConfigProvider :locale="locale">
      <Input aria-label="切换语言时保留的草稿" placeholder="切换语言后草稿与焦点保持" style="width: 280px" />
      <Empty />
      <Pagination :total="80" :show-size-changer="true" />
    </ConfigProvider>
  </div>
</template>
