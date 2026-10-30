<script setup lang="ts">
import type { ThemeConfig } from '@apollo-design/theme';
import { nextTick, ref, type StyleValue, useTemplateRef } from 'vue';
import ConfigProvider from '../../../config-provider/ConfigProvider';
import Popover from '../../../popover/Popover';
import Tooltip from '../../../tooltip/Tooltip';
import type { Popconfirm as PublicPopconfirm } from '../../index';
import type { PopconfirmRef } from '../../interface';
import Popconfirm from '../../Popconfirm';
import PurePanel from '../../PurePanel';

const open = ref(false);
const popconfirm = useTemplateRef<InstanceType<typeof PublicPopconfirm>>('popconfirm');
const theme = ref<ThemeConfig | undefined>({
  token: { colorWarning: '#123456', marginXS: 18, colorTextHeading: '#234567' },
  components: {
    Popconfirm: { zIndexPopup: 2060 },
    Popover: { zIndexPopup: 9030 },
    Tooltip: { zIndexPopup: 9999 },
  },
});
const ownConfig = ref<{ className: string; styles?: { title: { paddingTop: string } } }>({
  className: 'own-config',
  styles: { title: { paddingTop: '3px' } },
});
const native = ref<StyleValue>();
const semantic = ref<Record<string, string>>({});
const changes = ref<boolean[]>([]);
const finished = ref<boolean[]>([]);
const openedOnce = ref(0);
const clickedOnce = ref(0);
const clickTargets = ref<string[]>([]);
const requests: (() => void)[] = [];
function confirm(): Promise<void> {
  return new Promise<void>((resolve) => requests.push(resolve));
}
function clicked(event: MouseEvent) {
  if (event.target instanceof HTMLElement) clickTargets.value.push(event.target.id);
}
function refValid() {
  const instance: PopconfirmRef | null = popconfirm.value;
  const target: HTMLElement | null | undefined = instance?.nativeElement;
  const popup: HTMLDivElement | null | undefined = instance?.popupElement;
  instance?.forceAlign();
  return (
    target === document.getElementById('confirm-target') &&
    popup === document.querySelector('.main-confirm')
  );
}
async function patch(kind: string) {
  if (kind === 'next') {
    theme.value = {
      token: { colorWarning: '#654321', marginXS: 10, colorTextHeading: '#345678' },
      components: { Popconfirm: { zIndexPopup: 3060 } },
    };
    ownConfig.value = { className: 'replaced-config', styles: { title: { paddingTop: '7px' } } };
  }
  if (kind === 'semantic') semantic.value = { '--apollo-popconfirm-z-index-popup': '4060' };
  if (kind === 'native')
    native.value = ['--apollo-popconfirm-z-index-popup: 5060', { padding: '20px' }];
  if (kind === 'removeNative') native.value = undefined;
  if (kind === 'clear') {
    theme.value = undefined;
    ownConfig.value = { className: 'cleared-config' };
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
    requests: requests.length,
  };
}
defineExpose({ patch, refValid, events, resolveRequest: (index: number) => requests[index]?.() });
</script>

<template>
  <ConfigProvider :theme="theme" :components="{ popconfirm: ownConfig, popover: { className: 'popover-config' }, tooltip: { className: 'tooltip-config' } }">
    <Popconfirm
      ref="popconfirm"
      v-model:open="open"
      title="Delete the task?"
      :on-confirm="confirm"
      :class="['native-confirm', { active: true }]"
      :style="native"
      :styles="{ root: semantic }"
      :class-names="{ root: 'main-confirm' }"
      data-trigger="kept"
      @open-change="(value) => changes.push(value)"
      @open-change.once="openedOnce += 1"
      @after-open-change="(value) => finished.push(value)"
      @popup-click="clicked"
      @popup-click.once="clickedOnce += 1"
    >
      <button id="confirm-target" type="button">Delete task</button>
      <template #description>
        <input id="confirm-editor" aria-label="Draft" />
        <button id="confirm-action" type="button">Edit details</button>
        <Popover :open="open" title="Nested popup" placement="right" :class-names="{ root: 'nested-popover' }">
          <button id="nested-target" type="button">Nested target</button>
        </Popover>
        <Tooltip :open="open" title="Nested tooltip" placement="right" :class-names="{ root: 'nested-tooltip' }">
          <button id="tooltip-target" type="button">Tooltip target</button>
        </Tooltip>
      </template>
    </Popconfirm>
    <section id="panels">
      <PurePanel class="current-panel" title="Panel" description="Details" />
      <ConfigProvider :theme="{ components: { Popconfirm: { zIndexPopup: 6060 } } }">
        <PurePanel class="nested-panel" title="Nested panel" />
      </ConfigProvider>
    </section>
  </ConfigProvider>
</template>
