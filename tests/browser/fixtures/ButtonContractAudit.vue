<script setup lang="ts">
import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import {
  Button,
  type ButtonComponentToken,
  type ButtonConfig,
  type ButtonProps,
  type ButtonRef,
  ConfigProvider,
  SpaceCompact,
} from '@apollo-design/ui';
import {
  computed,
  defineComponent,
  h,
  nextTick,
  onMounted,
  ref,
  type StyleValue,
  shallowReactive,
  shallowRef,
} from 'vue';

interface Options {
  visible: boolean;
  mode: 'default' | 'dark' | 'compact' | 'both';
  source: boolean;
  motion?: boolean;
  nativeDirection?: string;
  adjacentSolid: boolean;
  tokens: Partial<ButtonComponentToken>;
  provider?: ButtonConfig;
  props: ButtonProps;
  style?: StyleValue;
  label: string;
  slot: 'full' | 'plain' | 'empty' | 'absent';
  iconSlot: 'full' | 'empty' | 'absent';
  ariaLabel?: string;
  tabindex?: number;
  rtl: boolean;
  compactSize?: ButtonProps['size'];
}
const state = shallowReactive<Options>({
  visible: true,
  adjacentSolid: false,
  mode: 'default',
  source: false,
  tokens: {},
  props: {},
  label: 'Save',
  slot: 'full',
  iconSlot: 'absent',
  rtl: false,
});
const instance = shallowRef<ButtonRef | null>(null),
  child = shallowRef<HTMLElement | null>(null);
const compactInstance = shallowRef<InstanceType<typeof SpaceCompact> | null>(null);
const compactElement = computed<HTMLDivElement | null>(
  () => compactInstance.value?.nativeElement ?? null,
);
const clicks = ref(0),
  submits = ref(0),
  resets = ref(0),
  parents = ref(0),
  mounts = ref(0),
  focuses = ref(0);
const Label = defineComponent({
  setup() {
    onMounted(() => mounts.value++);
    return () => h('strong', { ref: child, 'data-business-label': 'yes' }, state.label);
  },
});
const theme = computed(() =>
  state.source || state.mode !== 'default' || state.motion !== undefined
    ? {
        ...(state.mode === 'dark'
          ? { algorithm: darkAlgorithm }
          : state.mode === 'compact'
            ? { algorithm: compactAlgorithm }
            : state.mode === 'both'
              ? { algorithm: [darkAlgorithm, compactAlgorithm] }
              : {}),
        ...(state.motion === undefined ? {} : { token: { motion: state.motion } }),
        ...(state.source ? { components: { Button: state.tokens } } : {}),
      }
    : undefined,
);
const snapshot = () => ({
  clicks: clicks.value,
  submits: submits.value,
  resets: resets.value,
  parents: parents.value,
  mounts: mounts.value,
  focuses: focuses.value,
  nativeTag: instance.value?.nativeElement?.tagName ?? null,
  nativeId: instance.value?.nativeElement?.id ?? null,
  compactNativeTag: compactElement.value?.tagName ?? null,
  compactName: SpaceCompact.name,
  childText: child.value?.textContent ?? null,
});
declare global {
  interface Window {
    buttonAudit: { set(options: Partial<Options>): Promise<void>; snapshot: typeof snapshot };
  }
}
onMounted(() => {
  window.buttonAudit = {
    set: async (options) => {
      Object.assign(state, options);
      await nextTick();
    },
    snapshot,
  };
});
</script>
<template>
  <ConfigProvider :theme="theme" :components="state.provider ? {button:state.provider} : {}" :direction="state.rtl?'rtl':'ltr'">
    <main style="padding:24px;min-height:300px;background:var(--apollo-color-bg-container);color:var(--apollo-color-text);font-family:var(--apollo-font-family)">
      <h1>Button contract audit</h1>
      <form id="button-audit-form" @submit.prevent="submits++" @reset="resets++" @click="parents++">
        <label>Draft <input aria-label="Button sibling draft" value="Initial draft"></label>
        <SpaceCompact ref="compactInstance" :size="state.compactSize">
          <Button v-if="state.visible" id="audit-button" ref="instance" class="audit-button" v-bind="state.props" :style="state.style" :tabindex="state.tabindex" :dir="state.nativeDirection" :aria-label="state.ariaLabel" @click="clicks++" @focus="focuses++">
            <template v-if="state.slot!=='absent'" #default>
              <template v-if="state.slot==='full'"><Label/><em> Tail</em><span>0</span></template>
              <template v-else-if="state.slot==='plain'">{{state.label}}</template>
            </template>
            <template v-if="state.iconSlot!=='absent'" #icon><template v-if="state.iconSlot==='full'"><i>Icon</i><b>Tail</b><span>0</span></template></template>
          </Button>
          <Button class="audit-adjacent" :type="state.adjacentSolid?'primary':'default'">Adjacent</Button>
        </SpaceCompact>
      </form>
      <p aria-live="polite">Clicks {{clicks}}; submitted {{submits}}; reset {{resets}}</p>
    </main>
  </ConfigProvider>
</template>
