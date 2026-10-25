<script setup lang="ts">
// 对齐 antd demo/async.tsx
// ⚠️ demo 级替换（见 README §5）：
//    1. antd 用 `antd-style` 的 `createStyles` ⇒ 本仓改用内联 style 对象；
//    2. antd 用 `lodash/debounce` ⇒ 本仓用 setTimeout 等价实现；
//    3. antd 拉 GitHub 真实头像（外网图片会污染视觉基线）⇒ 本仓用本地 data URI；
//    4. antd 的 label 是 JSX fragment ⇒ 本仓用渲染函数 `h`（`label` 收 VNode）。
import { Mentions } from '@apollo-design/ui';
import { computed, h, onBeforeUnmount, ref } from 'vue';

const AVATAR =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiNkOWQ5ZDkiLz48L3N2Zz4=';

const USERS = [
  { login: 'afc163', avatar: AVATAR },
  { login: 'zombieJ', avatar: AVATAR },
  { login: 'yesmeck', avatar: AVATAR },
];

const value = ref('');
const query = ref('');
const showEmpty = ref(true);
const empty = ref(false);
const revision = ref(0);
const selections = ref(0);
const fallback = computed(() => `Default empty message for ${query.value || 'all users'}`);
const loading = ref(false);
const users = ref<{ login: string; avatar: string }[]>([]);
let timer: ReturnType<typeof setTimeout> | undefined;

const onSearch = (search: string) => {
  query.value = search;
  if (timer !== undefined) {
    clearTimeout(timer);
  }
  loading.value = !!search;
  users.value = [];
  if (!search) {
    return;
  }
  timer = setTimeout(() => {
    loading.value = false;
    users.value = USERS.filter((u) => u.login.toLowerCase().includes(search.toLowerCase()));
  }, 120);
};

onBeforeUnmount(() => {
  if (timer !== undefined) {
    clearTimeout(timer);
  }
});

const options = computed(() =>
  users.value.map(({ login, avatar }) => ({
    key: login,
    value: login,
    className: 'async-option',
    label: [
      h('img', {
        class: 'async-avatar',
        draggable: false,
        src: avatar,
        title: login,
        alt: login,
        style: { width: '20px', height: '20px', marginInlineEnd: '8px' },
      }),
      h('span', null, login),
    ],
  })),
);
</script>

<template>
  <div>
    <p>
      <button type="button" @mousedown.prevent @click="showEmpty = !showEmpty">Toggle custom empty message</button>
      <button type="button" @mousedown.prevent @click="empty = !empty">Empty custom message</button>
      <button type="button" @mousedown.prevent @click="revision++">Update empty message</button>
    </p>
    <Mentions v-model:value="value" aria-label="Search mention users" style="width: 100%"
      :loading="loading" :options="options" :not-found-content="fallback" allow-clear
      @search="onSearch" @select="selections++">
      <template v-if="showEmpty" #notFoundContent>
        <span v-if="!empty" data-native-empty-message>No users for {{ query || 'all users' }} · {{ revision }}</span>
      </template>
    </Mentions>
    <output data-async-mention-value>{{ value }}</output>
    <output data-async-mention-selections>Selections: {{ selections }}</output>
  </div>
</template>
