<script setup lang="ts">
import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import {
  ConfigProvider,
  Result,
  type ResultProps,
  type ResultRef,
  type ResultStatusType,
} from '@apollo-design/ui';
import {
  computed,
  nextTick,
  onMounted,
  ref,
  type StyleValue,
  shallowReactive,
  shallowRef,
} from 'vue';

interface Options {
  status: ResultStatusType;
  source: boolean;
  provider: boolean;
  rtl: boolean;
  shown: boolean;
  native: boolean;
  icon: boolean | null | undefined;
  slot: 'absent' | 'full' | 'empty';
  mode: 'default' | 'dark' | 'compact' | 'both';
  style: StyleValue;
}
const state = shallowReactive<Options>({
  status: 'info',
  source: false,
  provider: false,
  rtl: false,
  shown: true,
  native: false,
  icon: undefined,
  slot: 'absent',
  mode: 'default',
  style: { padding: '6px' },
});
const iconDraft = ref('Icon draft'),
  bodyDraft = ref('Body draft'),
  clicks = ref(0),
  actions = ref(0);
const instance = shallowRef<ResultRef | null>(null);
const theme = computed(() => {
  if (!state.source && state.mode === 'default') return undefined;
  return {
    algorithm:
      state.mode === 'both'
        ? [darkAlgorithm, compactAlgorithm]
        : state.mode === 'dark'
          ? darkAlgorithm
          : state.mode === 'compact'
            ? compactAlgorithm
            : undefined,
    token: state.source ? { fontSize: 17 } : undefined,
    components: state.source
      ? {
          Result: {
            titleFontSize: 29,
            subtitleFontSize: '18px',
            iconFontSize: 84,
            extraMargin: '31px 0 0',
          },
        }
      : undefined,
  };
});
const components = computed(() =>
  state.provider
    ? {
        result: {
          className: 'current-result-provider',
          style: { marginBottom: '13px' },
          classNames: { title: 'current-provider-title' },
        },
      }
    : undefined,
);
const styles = ({ props }: { props: ResultProps }) => ({
  title: { opacity: props.status === 'success' ? 0.85 : 1 },
});
const nativeStyle = computed<StyleValue>(() => [
  state.style,
  state.native ? { '--apollo-result-title-font-size': '35px' } : {},
]);
declare global {
  interface Window {
    resultAudit: {
      set(options: Partial<Options>): Promise<void>;
      snapshot(): {
        nativeId: string | null;
        clicks: number;
        actions: number;
        iconDraft: string;
        bodyDraft: string;
      };
    };
  }
}
onMounted(() => {
  window.resultAudit = {
    async set(options) {
      Object.assign(state, options);
      await nextTick();
    },
    snapshot: () => ({
      nativeId: instance.value?.nativeElement?.id ?? null,
      clicks: clicks.value,
      actions: actions.value,
      iconDraft: iconDraft.value,
      bodyDraft: bodyDraft.value,
    }),
  };
});
</script>
<template>
  <main style="padding:24px;max-width:900px;margin:auto">
    <h1>Result native contracts</h1>
    <ConfigProvider :theme="theme" :components="components" :direction="state.rtl ? 'rtl' : 'ltr'">
      <section data-result-surface style="padding:16px;background:var(--apollo-color-bg-container);color:var(--apollo-color-text)">
        <Result v-if="state.shown" ref="instance" id="native-result" data-native-result="yes" tabindex="0" role="region" aria-label="Operation result" class="native-result" :status="state.status" :icon="state.icon" title="Operation result" sub-title="Please review the operation details." :style="nativeStyle" :styles="styles" @click="clicks++">
          <template v-if="state.slot !== 'absent'" #title><template v-if="state.slot === 'full'"><!-- leading --><h2 style="font:inherit;margin:0">Complete heading</h2><span>Title tail</span></template></template>
          <template v-if="state.slot !== 'absent'" #subTitle><template v-if="state.slot === 'full'"><span>Complete subtitle</span><strong>Subtitle tail</strong></template></template>
          <template v-if="state.slot !== 'absent'" #icon><template v-if="state.slot === 'full'"><!-- leading --><label>Icon draft<input v-model="iconDraft" aria-label="Result icon draft" /></label><strong>Icon tail</strong></template></template>
          <template v-if="state.slot !== 'absent'" #extra><template v-if="state.slot === 'full'"><button type="button" @click="actions++">Native result action</button><strong>Extra tail</strong></template></template>
          <template v-if="state.slot !== 'absent'" #default><template v-if="state.slot === 'full'"><!-- leading --><label>Body draft<input v-model="bodyDraft" aria-label="Result body draft" /></label><strong>Body tail</strong></template></template>
        </Result>
      </section>
    </ConfigProvider>
  </main>
</template>
