<script setup lang="ts">
import {
  computed,
  defineComponent,
  h,
  reactive,
  ref,
  type StyleValue,
  shallowRef,
  Teleport,
} from 'vue';
import { ConfigProvider } from '../../../config-provider';
import type { ConfigProviderProps } from '../../../config-provider/interface';
import { Modal } from '../../../modal';
import { usePanelRef } from '../../context';
import { Watermark } from '../../index';
import type { WatermarkProps, WatermarkRef } from '../../interface';

const main = shallowRef<WatermarkRef | null>(null);
const visible = ref(true);
const mainProps = reactive<WatermarkProps>({
  content: 'Alpha',
  width: 80,
  height: 30,
  rotate: 0,
  gap: [20, 20],
  font: { fontSize: 16, color: '#ff0000' },
});
const style = shallowRef<StyleValue>([
  { position: 'relative', overflow: 'visible', height: '100px' },
  'color: red; --watermark-test: first',
]);
const components = shallowRef<NonNullable<ConfigProviderProps['components']>>({
  watermark: {
    className: 'provider-first',
    style: { position: 'absolute', overflow: 'auto', backgroundColor: 'white' },
  },
});
const theme = ref<ConfigProviderProps['theme']>({
  token: { zIndexPopupBase: 2400, colorFill: '#008000', fontSizeLG: 20 },
});
const nestedInherit = ref(true);
const panelVisible = ref(true);
const panelTag = ref('section');
const modalOpen = ref(false);
const events = reactive({ first: 0, second: 0, once: 0, click: 0 });
const secondListener = ref(false);
const onRemove = computed(() =>
  secondListener.value ? () => events.second++ : () => events.first++,
);
const Panel = defineComponent({
  setup() {
    const register = usePanelRef();
    return () =>
      h(Teleport, { to: '#watermark-portal' }, [
        h(panelTag.value, { id: 'watermark-panel', ref: register }, [
          h('input', { 'aria-label': 'Panel draft' }),
        ]),
      ]);
  },
});

function patch(kind: string) {
  switch (kind) {
    case 'image-a':
      mainProps.image = '/wm-a.svg';
      break;
    case 'image-b':
      mainProps.image = '/wm-b.svg';
      break;
    case 'slow-a':
      mainProps.image = '/wm-slow-a.svg';
      break;
    case 'slow-text':
      mainProps.image = '/wm-slow-text.svg';
      break;
    case 'slow-unmount':
      mainProps.image = '/wm-slow-unmount.svg';
      break;
    case 'image-error':
      mainProps.image = '/wm-error.svg';
      break;
    case 'text':
      mainProps.image = undefined;
      mainProps.content = 'Text fallback';
      break;
    case 'burst-a':
      mainProps.content = 'First frame';
      break;
    case 'burst-b':
      mainProps.content = 'Last frame';
      break;
    case 'font':
      mainProps.font = { fontSize: '24px', color: '#0000ff' };
      break;
    case 'auto-font':
      mainProps.width = undefined;
      mainProps.height = undefined;
      mainProps.font = { fontSize: '2rem', color: '#0000ff' };
      break;
    case 'theme':
      mainProps.font = {};
      theme.value = { token: { zIndexPopupBase: 3600, colorFill: '#0000ff', fontSizeLG: 24 } };
      break;
    case 'zero':
      mainProps.zIndex = 0;
      break;
    case 'provider-clear':
      components.value = {};
      theme.value = {};
      mainProps.zIndex = undefined;
      break;
    case 'attrs':
      style.value =
        'position: fixed !important; overflow: auto; --watermark-test: second; height: 100px';
      break;
    case 'listener':
      secondListener.value = true;
      break;
    case 'inherit':
      nestedInherit.value = !nestedInherit.value;
      break;
    case 'panel-root':
      panelTag.value = panelTag.value === 'section' ? 'article' : 'section';
      break;
    case 'panel-hide':
      panelVisible.value = false;
      break;
    case 'panel-show':
      panelVisible.value = true;
      break;
    case 'modal-open':
      modalOpen.value = true;
      break;
    case 'modal-close':
      modalOpen.value = false;
      break;
    case 'hide':
      visible.value = false;
      break;
    case 'show':
      mainProps.image = undefined;
      visible.value = true;
      break;
    default:
      throw new Error(`Unknown Watermark fixture action: ${kind}`);
  }
}
defineExpose({ patch, events, nativeElement: () => main.value?.nativeElement ?? null });
</script>

<template>
  <ConfigProvider :components="components" :theme="theme">
    <Watermark
      v-if="visible"
      v-bind="mainProps"
      id="watermark-main"
      ref="main"
      class="consumer"
      aria-label="Protected document"
      :style="style"
      @remove="onRemove"
      @remove.once="events.once++"
      @click="events.click++"
    >
      <input aria-label="Document draft" />
      <span id="watermark-content">{{ mainProps.content }}</span>
    </Watermark>
    <Watermark id="watermark-independent" content="Independent" :rotate="0" :width="80" :height="30" />
    <Watermark id="watermark-outer" content="Outer" :width="20" :height="20" :rotate="0" :gap="[10, 10]">
      <Watermark id="watermark-inner" content="Inner" :width="40" :height="20" :rotate="0" :gap="[10, 10]" :inherit="nestedInherit">
        <Panel v-if="panelVisible" />
      </Watermark>
      <Modal :open="modalOpen" title="Inherited watermark" :footer="null" :scroll-lock="false" @cancel="modalOpen = false">
        <p id="watermark-modal-content">Actual Modal consumer</p>
      </Modal>
    </Watermark>
  </ConfigProvider>
</template>
