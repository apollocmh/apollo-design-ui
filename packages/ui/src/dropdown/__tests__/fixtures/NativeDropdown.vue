<script setup lang="ts">
import { computed, h, nextTick, ref, type VNodeChild, watch } from 'vue';
import ConfigProvider from '../../../config-provider/ConfigProvider';
import Tooltip from '../../../tooltip/Tooltip';
import Dropdown from '../../Dropdown';
import DropdownButton from '../../DropdownButton';
import type { DropdownButtonRef, DropdownOpenInfo, DropdownRef } from '../../interface';
import PurePanel from '../../PurePanel';

const RenderNode = (props: { node: VNodeChild }) => props.node;
const open = ref(false);
const hintOpen = ref(false);
watch(open, (value) => {
  hintOpen.value = value;
});
const splitOpen = ref(false);
const iconPhase = ref(0);
const custom = ref(true);
const root = ref<DropdownRef | null>(null);
const split = ref<DropdownButtonRef | null>(null);
const events: string[] = [];
const items = [
  { key: 'one', label: 'One action', icon: h('span', 'I') },
  { key: 'sub', label: 'Submenu', children: [{ key: 'two', label: 'Nested action' }] },
];
const theme = computed(() =>
  custom.value
    ? {
        token: { marginXXS: 10, sizePopupArrow: 20 },
        components: { Dropdown: { zIndexPopup: 2500, paddingBlock: 9 } },
      }
    : undefined,
);
const source = computed(() => ({
  dropdown: {
    trigger: ['click'],
    arrow: true,
    className: custom.value ? 'configured-dropdown' : undefined,
  },
}));
function changed(value: boolean, info: DropdownOpenInfo) {
  events.push(`${value}:${info.source}`);
}
defineExpose({
  async patch(kind: string) {
    if (kind === 'theme') custom.value = !custom.value;
    if (kind === 'icon') iconPhase.value = (iconPhase.value + 1) % 3;
    if (kind === 'close') {
      open.value = false;
      splitOpen.value = false;
    }
    await nextTick();
    await nextTick();
  },
  events: () => [...events],
  refsValid: () =>
    root.value?.nativeElement() === document.getElementById('native-dropdown-trigger') &&
    root.value?.popupElement() === document.querySelector('.main-dropdown') &&
    split.value?.nativeElement() === document.querySelector('.split-dropdown button:last-child'),
});
</script>

<template>
  <ConfigProvider :theme="theme" :components="source">
    <Dropdown ref="root" v-model:open="open" :menu="{ items }"
      :class-names="{ root: 'main-dropdown', item: 'mapped-item' }"
      :styles="{ root: { minWidth: '260px' }, item: { letterSpacing: '1px' } }"
      @open-change="changed" @after-open-change="(value) => events.push(`after:${value}`)">
      <button id="native-dropdown-trigger">Open actions</button>
      <template #popupRender="{ originNode }">
        <RenderNode :node="originNode" />
        <Tooltip v-model:open="hintOpen" title="Nested hint" :arrow="false" :class-names="{ root: 'dropdown-child-tooltip' }">
          <button>Nested hint target</button>
        </Tooltip>
        <input aria-label="Dropdown draft" />
      </template>
    </Dropdown>
    <DropdownButton ref="split" v-model:open="splitOpen" class="split-dropdown" split
      :menu="{ items }" :trigger="['click']" @click="events.push('main-click')">
      Main action
      <template #icon v-if="iconPhase !== 0">
        <template v-if="iconPhase === 1"><span>A</span><span>B</span></template>
      </template>
      <template #buttonsRender="{ buttons }">
        <RenderNode :node="buttons[0]" /><RenderNode :node="buttons[1]" />
      </template>
    </DropdownButton>
    <PurePanel class="dropdown-static-panel" :menu="{ items }" style="margin-top: 80px; padding: 5px" />
  </ConfigProvider>
</template>
