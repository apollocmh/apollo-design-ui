<script setup lang="ts">
import { compactAlgorithm, darkAlgorithm, transformToken, useTheme } from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { type Component, defineComponent, h, nextTick, onMounted, reactive } from 'vue';

const demos = import.meta.glob<Component>('../../../packages/ui/src/timeline/demo/*.vue', {
  eager: true,
  import: 'default',
});
const DemoFrame = defineComponent({
  setup(_props, { slots }) {
    const theme = useTheme();
    return () =>
      h(
        'section',
        {
          id: 'timeline-demo-frame',
          style: {
            ...transformToken(theme.token.value).vars,
            padding: '16px',
            boxSizing: 'border-box',
            color: 'var(--apollo-color-text)',
            background: 'var(--apollo-color-bg-container)',
            fontFamily: 'var(--apollo-font-family)',
            fontSize: 'var(--apollo-font-size)',
          },
        },
        slots.default?.(),
      );
  },
});
interface State {
  demo: string;
  theme: 'default' | 'dark' | 'compact' | 'both';
  serial: number;
}
const state = reactive<State>({ demo: 'basic', theme: 'default', serial: 0 });
const algorithms = {
  default: undefined,
  dark: darkAlgorithm,
  compact: compactAlgorithm,
  both: [darkAlgorithm, compactAlgorithm],
};
declare global {
  interface Window {
    timelineDemos: {
      names: string[];
      set: (patch: Pick<State, 'demo' | 'theme'>) => Promise<void>;
    };
  }
}
onMounted(() => {
  window.timelineDemos = {
    names: Object.keys(demos)
      .map((name) => name.split('/').at(-1)?.replace('.vue', '') ?? '')
      .sort(),
    async set(patch) {
      Object.assign(state, patch);
      state.serial += 1;
      await nextTick();
    },
  };
});
</script>

<template>
  <main>
    <h1 style="font: 18px sans-serif; margin: 16px">Timeline {{ state.demo }} · {{ state.theme }}</h1>
    <ConfigProvider :theme="{ algorithm: algorithms[state.theme] }">
      <DemoFrame>
        <component :is="demos[`../../../packages/ui/src/timeline/demo/${state.demo}.vue`]" :key="state.serial" />
      </DemoFrame>
    </ConfigProvider>
  </main>
</template>
