<script setup lang="ts">
import type { ThemeConfig } from '@apollo-design/theme';
import { computed, ref, useTemplateRef } from 'vue';
import ConfigProvider from '../../../config-provider/ConfigProvider';
import Transfer from '../../index';
import type { TransferKey } from '../../interface';

const controls = { ConfigProvider, Transfer };
const instance = useTemplateRef('transfer');
const targets = ref<TransferKey[]>([]);
const selected = ref<TransferKey[]>([]);
const customized = ref(true);
const disabled = ref(false);
const mounted = ref(true);
const selectionSignals = ref(0);
const moves = ref(0);
const searches = ref<string[]>([]);
const listeners = {
  selectChange: [() => selectionSignals.value++, () => selectionSignals.value++],
};
const theme = computed(
  (): ThemeConfig =>
    customized.value
      ? {
          token: { colorText: '#123456' },
          components: {
            Transfer: {
              listWidth: 222,
              listHeight: 260,
              listWidthLG: 280,
              headerHeight: 48,
              itemHeight: 40,
              itemPaddingBlock: 8,
              transferHeaderVerticalPadding: 11,
            },
          },
        }
      : {},
);
const dataSource = Array.from({ length: 14 }, (_, index) => ({
  key: String(index),
  title: `Item ${index + 1}`,
  disabled: index === 3,
}));

function inspect() {
  return {
    targets: targets.value,
    selected: selected.value,
    selectionSignals: selectionSignals.value,
    moves: moves.value,
    searches: searches.value,
    validRef: instance.value?.nativeElement?.id === 'native-transfer',
  };
}
function patch(kind: 'tokens' | 'disabled' | 'mount') {
  if (kind === 'tokens') customized.value = !customized.value;
  if (kind === 'disabled') disabled.value = !disabled.value;
  if (kind === 'mount') mounted.value = !mounted.value;
}
defineExpose({
  inspect,
  patch,
  focus: () => instance.value?.focus({ preventScroll: true }),
  blur: () => instance.value?.blur(),
});
</script>

<template>
  <controls.ConfigProvider :theme="theme">
    <controls.Transfer
      v-if="mounted"
      id="native-transfer"
      ref="transfer"
      v-model:target-keys="targets"
      v-model:selected-keys="selected"
      :data-source="dataSource"
      :disabled="disabled"
      :titles="['Source', 'Target']"
      class="native-transfer"
      :style="[{ '--native-transfer': '1' }, 'margin: 8px']"
      show-search
      data-native="transfer"
      v-on="listeners"
      @change="moves++"
      @search="(direction, value) => searches.push(`${direction}:${value}`)"
    />
  </controls.ConfigProvider>
  <output id="transfer-state">{{ targets.join(',') }}|{{ selected.join(',') }}</output>
</template>
