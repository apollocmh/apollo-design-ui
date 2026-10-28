<script setup lang="ts">
import { type ItemType, Menu, type MenuInfo } from '@apollo-design/ui';
import { h, nextTick, onMounted, ref } from 'vue';

const disabled = ref(false),
  cancel = ref(false),
  selected = ref<string[]>([]);
const counts = { nativeButton: 0, nativeLink: 0, menu: 0, selected: 0, open: 0 };
const items: ItemType[] = [
  {
    key: 'link',
    label: h(
      'a',
      { href: '#native-destination', onClick: () => counts.nativeLink++ },
      'Native destination',
    ),
  },
  {
    key: 'button',
    label: h('button', { type: 'button', onClick: () => counts.nativeButton++ }, 'Native action'),
  },
  {
    key: 'cancel',
    label: h(
      'a',
      {
        href: '#cancelled-destination',
        onClick: (event: MouseEvent) => {
          if (cancel.value) event.preventDefault();
        },
      },
      'Cancellable destination',
    ),
  },
  {
    key: 'disabled',
    disabled: true,
    label: h('a', { href: '#disabled-destination' }, 'Disabled destination'),
  },
  { key: 'plain', label: 'Plain action' },
  {
    key: 'sub',
    label: 'Submenu',
    children: [
      { key: 'nested', label: h('a', { href: '#nested-destination' }, 'Nested destination') },
    ],
  },
];
const record = (_info: MenuInfo) => counts.menu++;
onMounted(() => {
  Object.assign(window, {
    menuNative: {
      snapshot: () => ({ ...counts, hash: location.hash }),
      async reset() {
        counts.nativeButton = 0;
        counts.nativeLink = 0;
        counts.menu = 0;
        counts.selected = 0;
        counts.open = 0;
        selected.value = [];
        history.replaceState(null, '', location.pathname);
        await nextTick();
      },
      async set(patch: { disabled?: boolean; cancel?: boolean }) {
        if (patch.disabled !== undefined) disabled.value = patch.disabled;
        if (patch.cancel !== undefined) cancel.value = patch.cancel;
        await nextTick();
      },
    },
  });
});
</script>
<template>
  <main>
    <h1>Menu native actions</h1>
    <Menu v-model:selectedKeys="selected" :items="items" :disabled="disabled" aria-label="Primary menu" @click="record" @select="counts.selected++" @open-change="counts.open++" />
    <div id="native-destination">Destination</div>
    <div id="nested-destination">Nested destination</div>
    <button id="outside" type="button">Outside</button>
  </main>
</template>
