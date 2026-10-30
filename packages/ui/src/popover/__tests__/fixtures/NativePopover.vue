<script setup lang="ts">
import type { ThemeConfig } from '@apollo-design/theme';
import { nextTick, ref, type StyleValue, useTemplateRef } from 'vue';
import ConfigProvider from '../../../config-provider/ConfigProvider';
import { Popover, PopoverPurePanel, type PopoverRef } from '../../index';

const open = ref(false);
const popover = useTemplateRef<PopoverRef>('popover');
const theme = ref<ThemeConfig | undefined>({
  token: { colorBgElevated: '#123456', borderRadiusLG: 18, sizePopupArrow: 24, marginXXS: 10 },
  components: {
    Popover: { titleMinWidth: 220, zIndexPopup: 2030, innerPadding: 18, titleMarginBottom: 11 },
    Tooltip: { zIndexPopup: 9999 },
  },
});
const native = ref<StyleValue>();
const semantic = ref<Record<string, string>>({});
const changes = ref<boolean[]>([]);
const finished = ref<boolean[]>([]);
const openedOnce = ref(0);
const clickedOnce = ref(0);
const clickTargets = ref<string[]>([]);
function clicked(event: MouseEvent) {
  if (event.target instanceof HTMLElement) clickTargets.value.push(event.target.id);
}
function refValid() {
  const target: HTMLElement | null | undefined = popover.value?.nativeElement;
  const popup: HTMLDivElement | null | undefined = popover.value?.popupElement;
  popover.value?.forceAlign();
  return (
    target === document.getElementById('popover-target') &&
    popup === document.querySelector('.main-popover')
  );
}
async function patch(kind: string) {
  if (kind === 'next')
    theme.value = {
      token: { colorBgElevated: '#654321', borderRadiusLG: 6, sizePopupArrow: 16, marginXXS: 4 },
      components: {
        Popover: { titleMinWidth: 300, zIndexPopup: 3030, innerPadding: 20, titleMarginBottom: 4 },
      },
    };
  if (kind === 'semantic') semantic.value = { '--apollo-popover-inner-padding': '24px' };
  if (kind === 'native') native.value = '--apollo-popover-inner-padding: 28px; padding: 20px';
  if (kind === 'removeNative') native.value = undefined;
  if (kind === 'clear') {
    theme.value = undefined;
    semantic.value = {};
  }
  await nextTick();
  await nextTick();
}
function events() {
  return {
    changes: changes.value,
    finished: finished.value,
    openedOnce: openedOnce.value,
    clickedOnce: clickedOnce.value,
    clickTargets: clickTargets.value,
  };
}
defineExpose({ patch, refValid, events });
</script>

<template>
  <ConfigProvider :theme="theme" :components="{ popover: { className: 'own-config' }, tooltip: { className: 'foreign-config' } }">
    <Popover
      ref="popover"
      v-model:open="open"
      title="Title"
      trigger="click"
      placement="topLeft"
      :arrow="{ pointAtCenter: true }"
      :class="['native-popover', { active: true }]"
      :style="native"
      :styles="{ root: semantic }"
      :class-names="{ root: 'main-popover' }"
      data-trigger="kept"
      @open-change="(value) => changes.push(value)"
      @open-change.once="openedOnce += 1"
      @after-open-change="(value) => finished.push(value)"
      @popup-click="clicked"
      @popup-click.once="clickedOnce += 1"
    >
      <button id="popover-target" type="button">Target</button>
      <template #content>
        <input id="popover-editor" aria-label="Draft" />
        <button id="popover-action" type="button">Action</button>
        <Popover v-if="open" :open="true" title="Nested popup" placement="right" :class-names="{ root: 'nested-popover' }">
          <button id="nested-target" type="button">Nested target</button>
        </Popover>
      </template>
    </Popover>
    <section id="panels">
      <PopoverPurePanel class="current-panel" title="Panel" content="Panel content" />
      <ConfigProvider :theme="{ components: { Popover: { innerPadding: 6 } } }">
        <PopoverPurePanel class="nested-panel" title="Nested" content="Nested panel" />
      </ConfigProvider>
    </section>
  </ConfigProvider>
</template>
