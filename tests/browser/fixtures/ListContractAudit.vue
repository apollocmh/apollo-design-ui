<script setup lang="ts">
import { ConfigProvider, List, type ListGridType, ListItem, ListItemMeta } from '@apollo-design/ui';
import { ref } from 'vue';

const grid = ref<ListGridType>({ column: 2, xs: 1, md: 3 });
const layout = ref<'horizontal' | 'vertical'>('horizontal');
const extra = ref(true);
const themed = ref(true);
const bordered = ref(false);
const actionCount = ref(0);
const fullscreenBusy = ref(false);
const fullscreenMode = ref(true);
const fullscreenClicks = ref(0);
const tokens = {
  contentWidth: 180,
  itemPadding: '21px 23px',
  itemPaddingSM: '7px 11px',
  itemPaddingLG: '25px 27px',
  headerBg: 'rgb(221, 238, 255)',
  footerBg: 'rgb(238, 221, 255)',
  emptyTextPadding: 31,
  metaMarginBottom: 17,
  avatarMarginRight: 19,
  titleMarginBottom: 13,
  descriptionFontSize: 18,
};
</script>

<template>
  <h1>List contract audit</h1>
  <h2>Native interaction and theme</h2>
  <h3>Current configuration</h3>
  <button id="before-list" type="button">Before list</button>
  <List id="native-focus" :data-source="[1]">
    <template #item>
      <ListItem>
        <template #actions><button id="native-action" type="button" @click="actionCount += 1">Native action</button></template>
        Row
      </ListItem>
    </template>
  </List>
  <output id="native-action-count">{{ actionCount }}</output>
  <List id="primitive-content" :header="true" :data-source="[1]">
    <template #item><ListItem><ListItemMeta :title="true" :description="0" /></ListItem></template>
  </List>
  <List id="zero-empty" :locale="{ emptyText: 0 }" />
  <ConfigProvider :theme="themed ? { components: { List: tokens } } : undefined">
    <List id="tokens" item-layout="vertical" :bordered="bordered" :data-source="[1]" header="Header" footer="Footer">
      <template #item>
        <ListItem>
          <ListItemMeta title="Token title" description="Token description">
            <template #avatar><span>Avatar</span></template>
          </ListItemMeta>
          <input aria-label="Token draft" />
          <template #extra><span>Extra</span></template>
        </ListItem>
      </template>
    </List>
    <List id="tokens-small" size="small" :data-source="[1]">
      <template #item><ListItem>Small</ListItem></template>
    </List>
    <List id="tokens-large" size="large" :data-source="[1]">
      <template #item><ListItem>Large</ListItem></template>
    </List>
    <List id="tokens-empty" />
    <List id="native-token" :bordered="bordered" :data-source="[1]" style="--apollo-list-item-padding: 33px 35px">
      <template #item><ListItem>Native override</ListItem></template>
    </List>
  </ConfigProvider>
  <button id="toggle-theme" type="button" @click="themed = !themed">Toggle theme</button>
  <button id="toggle-borders" type="button" @click="bordered = !bordered">Toggle borders</button>
  <ConfigProvider direction="rtl">
    <List id="rtl" :data-source="[1]">
      <template #item>
        <ListItem>
          Text <span>mixed</span>
          <template #actions><button type="button">RTL action</button></template>
        </ListItem>
      </template>
    </List>
  </ConfigProvider>
  <List id="outer" size="small" bordered item-layout="vertical" :data-source="[1]">
    <template #item>
      <ListItem>
        <List id="inner" size="large" :split="false" :data-source="[1, 2]">
          <template #item>
            <ListItem><ListItemMeta title="Inner title" description="Inner description" /></ListItem>
          </template>
        </List>
      </ListItem>
    </template>
  </List>
  <List id="sparse-grid" :data-source="[1, 2, 3]" :grid="grid" row-key="toString">
    <template #item="{ item }"><ListItem><input :aria-label="`Grid ${item}`" /></ListItem></template>
  </List>
  <button id="toggle-grid-config" type="button" @click="grid = grid.md ? { column: 2 } : { column: 2, xs: 1, md: 3 }">Toggle grid configuration</button>
  <List id="stable" :data-source="[1]" :item-layout="layout">
    <template #extra><button v-if="extra" type="button">Root extra</button></template>
    <template #item>
      <ListItem :class-names="{ extra: 'semantic-extra' }" :styles="{ extra: { color: 'rgb(12, 34, 56)' } }">
        <input aria-label="Stable draft" />
        <template #extra><span v-if="extra">Item extra</span></template>
      </ListItem>
    </template>
  </List>
  <button id="toggle-layout" type="button" @click="layout = layout === 'horizontal' ? 'vertical' : 'horizontal'">Toggle layout</button>
  <button id="toggle-extra" type="button" @click="extra = !extra">Toggle extra</button>
  <List id="thin-loading" :loading="{ description: 0 }" :data-source="[1]">
    <template #item><span /></template>
  </List>
  <List id="fullscreen-list" :loading="{
    spinning: fullscreenBusy,
    fullscreen: fullscreenMode,
    description: 'Syncing task',
    classNames: { root: 'spin-flow-host', mask: 'list-loading-mask' },
    styles: ({ props }) => ({ mask: { backgroundColor: props.spinning ? 'rgba(0, 0, 0, 0.6)' : 'transparent' } }),
  }" :data-source="[1]">
    <template #item><ListItem><input aria-label="Fullscreen draft" @click="fullscreenClicks += 1" /></ListItem></template>
  </List>
  <button id="toggle-fullscreen-busy" type="button" @click="fullscreenBusy = !fullscreenBusy">Toggle fullscreen busy</button>
  <button id="toggle-fullscreen-mode" type="button" @click="fullscreenMode = !fullscreenMode">Toggle fullscreen mode</button>
  <output id="fullscreen-clicks">{{ fullscreenClicks }}</output>
  <List id="top-pagination" :data-source="[1]" :pagination="{ position: 'top', total: 20 }">
    <template #item><ListItem>Top only</ListItem></template>
  </List>
</template>
