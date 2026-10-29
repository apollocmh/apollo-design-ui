<script setup lang="ts">
import {
  compactAlgorithm,
  darkAlgorithm,
  type ThemeConfig,
  ThemeProvider,
} from '@apollo-design/theme';
import {
  Alert,
  type AlertConfig,
  AlertErrorBoundary,
  type AlertRef,
  ConfigProvider,
  type ConfigProviderProps,
} from '@apollo-design/ui';
import { computed, defineComponent, h, nextTick, onMounted, reactive, ref, shallowRef } from 'vue';

interface State {
  provider: 'first' | 'second' | 'none';
  slot: 'rich' | 'empty' | 'absent';
  closeSlot: 'rich' | 'empty' | 'absent';
  listener: 'first' | 'second' | 'none';
  theme: 'default' | 'dark' | 'compact' | 'both';
  tokens: boolean;
  alias: boolean;
  motion: boolean;
  nativeToken: boolean;
  mounted: boolean;
  prefix: 'apollo' | 'audit';
  rtl: boolean;
  failed: boolean;
  errorKind: 'error' | 'zero' | 'false' | 'null' | 'undefined';
  boundaryKey: number;
  resetTheme: boolean;
  cssTheme: boolean;
  iconFallback: boolean;
}
const state = reactive<State>({
  provider: 'first',
  slot: 'rich',
  closeSlot: 'absent',
  listener: 'first',
  theme: 'default',
  tokens: false,
  alias: false,
  motion: true,
  nativeToken: false,
  mounted: true,
  prefix: 'apollo',
  rtl: false,
  failed: false,
  errorKind: 'error',
  boundaryKey: 0,
  resetTheme: true,
  cssTheme: false,
  iconFallback: false,
});
const draft = ref('Saved draft');
const sourceDraft = ref('Source business draft');
const alert = shallowRef<AlertRef | null>(null);
const events: {
  name: string;
  type?: string;
  native?: boolean;
  target?: string;
  removed?: boolean;
}[] = [];
let nativeOnce = 0;
const record = (name: string, event?: Event) =>
  events.push({
    name,
    type: event?.type,
    native: event instanceof Event,
    target: event?.target instanceof HTMLElement ? event.target.id : undefined,
  });
const config = computed<AlertConfig | undefined>(() =>
  state.provider === 'none'
    ? undefined
    : {
        variant: state.provider === 'first' ? 'outlined' : 'filled',
        closable: {
          closeIcon: true,
          onClose: (event) => record(`config-${state.provider}`, event),
          afterClose: () => record(`config-after-${state.provider}`),
          'data-close-owner': state.provider,
        },
        className: `provider-${state.provider}`,
        style: { '--provider-value': state.provider },
        classNames: ({ props }) => ({ title: `title-${state.provider}-${props.variant}` }),
        styles: { title: { fontWeight: state.provider === 'first' ? 400 : 700 } },
        infoIcon: state.iconFallback
          ? null
          : h(
              'span',
              { style: { color: 'var(--apollo-color-text)' } },
              state.provider === 'first' ? 'Info' : 'Current',
            ),
      },
);
const algorithms = {
  default: undefined,
  dark: darkAlgorithm,
  compact: compactAlgorithm,
  both: [darkAlgorithm, compactAlgorithm],
};
const theme = computed<ThemeConfig>(() => {
  const current: ThemeConfig = {
    algorithm: algorithms[state.theme],
    token: {
      motion: state.motion,
      ...(state.alias ? { colorInfoBg: '#123456', colorInfoBorder: '#654321' } : {}),
    },
  };
  if (state.tokens)
    current.components = {
      Alert: {
        borderRadius: 19,
        withDescriptionIconSize: 37,
        defaultPadding: '7px 13px',
        withDescriptionPadding: '11px 17px',
      },
    };
  return current;
});
const components = computed<NonNullable<ConfigProviderProps['components']>>(() => {
  const current = config.value;
  const result: NonNullable<ConfigProviderProps['components']> = {};
  if (current) result.alert = { ...current };
  return result;
});
const attrs = computed(() => ({
  tabindex: 0,
  'data-owner': state.listener,
  class: ['native-root', { updated: state.listener === 'second' }],
  style: [
    '--native-marker:present',
    state.nativeToken ? { '--apollo-alert-border-radius': '23px' } : {},
  ],
  ...(state.listener === 'none'
    ? {}
    : { onChange: (event: Event) => record(`native-${state.listener}`, event) }),
  onChangeOnce: () => {
    nativeOnce += 1;
  },
}));
const after = () =>
  events.push({
    name: 'after-close',
    removed: !document.querySelector('#alert-main') && alert.value?.nativeElement === null,
  });
const Faulty = defineComponent({
  props: { failed: Boolean, kind: String },
  setup(props) {
    return () => {
      if (props.failed) {
        if (props.kind === 'zero') throw 0;
        if (props.kind === 'false') throw false;
        if (props.kind === 'null') throw null;
        if (props.kind === 'undefined') throw undefined;
        throw new Error('Descendant render failed');
      }
      return h(
        'button',
        {
          id: 'boundary-event',
          type: 'button',
          onClick() {
            throw new Error('Descendant event failed');
          },
        },
        'Fail descendant event',
      );
    };
  },
});
const snapshot = () => ({
  events: [...events],
  nativeOnce,
  nativeTag: alert.value?.nativeElement?.tagName ?? null,
  staticBoundary: Alert.ErrorBoundary === AlertErrorBoundary,
  serverRootSame: window.alertSSRRoot === document.querySelector('#alert-main'),
  serverDraftSame: window.alertSSRDraft === document.querySelector('#alert-draft'),
});
onMounted(() => {
  window.alertAudit = {
    set: async (patch) => {
      Object.assign(state, patch);
      await nextTick();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    },
    snapshot,
  };
});
declare global {
  interface Window {
    alertSSRRoot: Element | null;
    alertSSRDraft: Element | null;
    alertAudit: { set: (patch: Partial<State>) => Promise<void>; snapshot: typeof snapshot };
  }
}
</script>

<template>
  <main id="alert-fixture">
    <h1>Workspace notifications</h1>
    <button id="before-alert" type="button">Before alert</button>
    <ConfigProvider :components="components" :theme="theme" :prefix-cls="state.prefix" :direction="state.rtl ? 'rtl' : 'ltr'">
      <Alert v-if="state.mounted" id="alert-main" ref="alert" title="Fallback title" description="Fallback description" show-icon
        v-bind="attrs" @close="record('close', $event)" @after-close="after">
        <template v-if="state.slot !== 'absent'" #title>
          <template v-if="state.slot === 'rich'"><strong>Current task 0</strong><input id="alert-draft" v-model="draft" aria-label="Business draft" /></template>
        </template>
        <template v-if="state.slot !== 'absent'" #description><template v-if="state.slot === 'rich'"><span>Full description</span>{{ 0 }}</template></template>
        <template v-if="state.slot !== 'absent'" #action><template v-if="state.slot === 'rich'"><button type="button">Save</button><button type="button">More</button></template></template>
        <template v-if="state.closeSlot !== 'absent'" #closeIcon><template v-if="state.closeSlot === 'rich'"><span>Dismiss</span><strong> now</strong></template></template>
      </Alert>
      <Alert id="alert-sibling" title="Separate notification" :closable="false" />
    </ConfigProvider>
    <AlertErrorBoundary :key="state.boundaryKey" id="alert-boundary" class="failure-host" aria-label="Failure details" tabindex="0" style="color: purple">
      <Faulty :failed="state.failed" :kind="state.errorKind" />
    </AlertErrorBoundary>
    <section id="alert-theme-sources">
      <h2>Theme sources</h2>
      <div data-apollo-theme="dark-compact">
        <ConfigProvider :theme="state.cssTheme ? { token: { fontSize: 20, colorInfoBg: '#d9edff' } } : undefined">
          <Alert id="alert-css-source" title="CSS-only source" description="Unconfigured providers retain the static theme." />
        </ConfigProvider>
        <ConfigProvider :theme="{ token: { fontSize: 20 }, components: { Alert: { borderRadius: 21 } } }">
          <ThemeProvider :theme="state.resetTheme ? { token: { fontSize: 18 }, components: { Alert: { borderRadius: 19 } } } : {}">
            <ConfigProvider>
              <Alert id="alert-reset-source" description="An empty explicit source restores defaults.">
                <template #title><input id="alert-source-draft" v-model="sourceDraft" aria-label="Source business draft" /></template>
              </Alert>
            </ConfigProvider>
          </ThemeProvider>
        </ConfigProvider>
      </div>
    </section>
  </main>
</template>
<style scoped>
#alert-fixture { max-width: 100%; padding: 20px; }
#alert-main, #alert-sibling { margin-block: 12px; }
#alert-draft { width: 160px; max-width: 100%; margin-inline: 8px; }
#alert-theme-sources .apollo-alert { margin-block: 12px; }
</style>
