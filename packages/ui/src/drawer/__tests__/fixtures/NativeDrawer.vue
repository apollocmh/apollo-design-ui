<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import ConfigProvider from '../../../config-provider/ConfigProvider';
import type { ConfigProviderProps } from '../../../config-provider/interface';
import Drawer from '../../index';

const drawer = useTemplateRef('drawer');
const open = ref(false);
const configured = ref(true);
const trap = ref<boolean | undefined>(undefined);
const restore = ref(true);
const mounted = ref(true);
const first = ref(false);
const second = ref(false);
const resizable = ref(true);
const completed = ref<boolean[]>([]);
const closes = ref<string[]>([]);
const once = ref(0);
const resize = ref<number>();
const theme = computed(() =>
  configured.value
    ? {
        token: { colorText: '#123456' },
        components: {
          Drawer: {
            zIndexPopup: 1450,
            footerPaddingBlock: 3,
            footerPaddingInline: 7,
            draggerSize: 9,
          },
        },
      }
    : {},
);
const components = computed((): NonNullable<ConfigProviderProps['components']> => {
  if (!configured.value) return {};
  return {
    drawer: {
      classNames: { root: 'provider-drawer', body: 'provider-body' },
      styles: { body: { padding: '12px' } },
    },
  };
});
function close(event: Event) {
  closes.value.push(event.type);
  open.value = false;
}
function patch(
  kind:
    | 'open'
    | 'clear'
    | 'trap'
    | 'restore'
    | 'no-restore'
    | 'unmount'
    | 'first'
    | 'second'
    | 'disable-resize',
) {
  if (kind === 'open') open.value = true;
  if (kind === 'clear') configured.value = false;
  if (kind === 'trap') trap.value = true;
  if (kind === 'no-restore') restore.value = false;
  if (kind === 'restore') restore.value = true;
  if (kind === 'unmount') mounted.value = false;
  if (kind === 'first') first.value = !first.value;
  if (kind === 'second') second.value = !second.value;
  if (kind === 'disable-resize') resizable.value = false;
}
defineExpose({
  patch,
  focus: () => drawer.value?.focus({ preventScroll: true }),
  refValid: () => drawer.value?.nativeElement === document.querySelector('.native-drawer'),
  events: () => ({
    completed: completed.value,
    closes: closes.value,
    once: once.value,
    resize: resize.value,
  }),
});
</script>

<template>
  <button id="drawer-trigger" @click="open = true">Open drawer</button>
  <button id="drawer-outside">Outside action</button>
  <ConfigProvider :theme="theme" :components="components">
    <Drawer
      v-if="mounted"
      ref="drawer"
      :open="open"
      title="Native Drawer"
      :class="['native-drawer', { active: open }]"
      style="--native-root: 1; border-color: red"
      data-native="drawer-root"
      aria-label="Native drawer"
      destroy-on-hidden
      :default-size="300"
      :max-size="380"
      :resizable="resizable"
      :focusable="{ trap, focusTriggerAfterClose: restore }"
      :push="{ distance: '25%' }"
      @close="close"
      @close.once="once++"
      @after-open-change="value => completed.push(value)"
      @resize="value => resize = value"
    >
      <input id="drawer-editor" aria-label="Business draft" />
      <button id="drawer-last">Last action</button>
      <Drawer :open="first" :get-container="false" :auto-focus="false" title="First child" @close="first = false" />
      <Drawer :open="second" :get-container="false" :auto-focus="false" title="Second child" @close="second = false" />
      <template #footer>Current footer</template>
    </Drawer>
  </ConfigProvider>
</template>
