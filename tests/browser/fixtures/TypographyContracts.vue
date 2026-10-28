<script setup lang="ts">
import { compactAlgorithm, darkAlgorithm, type ThemeConfig } from '@apollo-design/theme';
import {
  ConfigProvider,
  Link,
  Paragraph,
  Text,
  Title,
  Typography,
  type TypographyRef,
} from '@apollo-design/ui';
import { computed, defineComponent, h, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue';

const state = reactive({
  mounts: 0,
  unmounts: 0,
  mode: 'default',
  tokenStage: 0,
  editing: false,
  refuse: false,
  editText:
    'An editor with enough words to wrap onto several lines in its narrow container. '.repeat(4),
  editorWidth: 240,
  minRows: 2,
  maxRows: 4,
  autoSize: true,
  saved: '',
  saves: 0,
  disabled: false,
  linkEditing: false,
  linkClicks: 0,
  textOnly: false,
  width: 300,
  rows: 2,
  expanded: false,
  measure: false,
});
const MeasuredBusiness = defineComponent({
  name: 'MeasuredBusiness',
  setup() {
    onMounted(() => {
      state.mounts++;
    });
    onUnmounted(() => {
      state.unmounts++;
    });
    return () => h('input', { 'aria-label': 'Measured business draft', style: { width: '80px' } });
  },
});
const editRef = ref<TypographyRef | null>(null);
const theme = computed<ThemeConfig>(() => ({
  algorithm:
    state.mode === 'both'
      ? [darkAlgorithm, compactAlgorithm]
      : state.mode === 'dark'
        ? darkAlgorithm
        : state.mode === 'compact'
          ? compactAlgorithm
          : undefined,
  token: { linkFocusDecoration: 'overline' },
  components:
    state.tokenStage === 1
      ? { Typography: { titleMarginTop: '2em', titleMarginBottom: '0.8em' } }
      : state.tokenStage === 2
        ? { Typography: { titleMarginTop: '0px', titleMarginBottom: '0px' } }
        : {},
}));
const editable = computed(() => ({
  editing: state.editing,
  text: state.editText,
  autoSize: state.autoSize ? { minRows: state.minRows, maxRows: state.maxRows } : false,
  triggerType: state.textOnly ? ['text' as const] : ['icon' as const],
  onStart() {
    if (!state.refuse) state.editing = true;
  },
  onChange(value: string) {
    state.saved = value;
    state.saves++;
    if (!state.refuse) state.editing = false;
  },
  onCancel() {
    if (!state.refuse) state.editing = false;
  },
}));
Object.assign(window, {
  typographyAudit: {
    async set(patch: Partial<typeof state>) {
      Object.assign(state, patch);
      await nextTick();
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    },
    snapshot() {
      return {
        ...state,
        refIsEditRoot:
          editRef.value?.nativeElement ===
          document.querySelector('#editable .apollo-typography-edit-content'),
      };
    },
  },
});
const semanticTypes = ['secondary', 'success', 'warning', 'danger'] as const;
</script>
<template>
  <ConfigProvider :theme="theme">
    <Typography id="tokens"><Title :level="3">First title</Title><Paragraph>Body between titles.</Paragraph><Title :level="3" data-second-title>Second title</Title></Typography>
    <section id="editable">
      <Text ref="editRef" id="edit-identity" aria-label="Contract editor" :editable="editable" :style="{ width: `${state.editorWidth}px`, display: 'block' }">Display text</Text>
    </section>
    <section id="semantic-links"><template v-for="kind in semanticTypes" :key="kind"><Text :data-tone-text="kind" :type="kind">Semantic {{ kind }}</Text><Link :data-tone-link="kind" :type="kind" href="#owned-target">Semantic {{ kind }}</Link></template><Link data-focus-link href="#owned-target">Focus link</Link></section>
    <section id="owned-link"><Link href="#owned-target" :disabled="state.disabled" :editable="{ editing: state.linkEditing, text: 'Link draft' }" @click="state.linkClicks++" copyable><span data-link-body>Owned link</span></Link></section>
    <span id="owned-target">Link destination</span>
    <section id="text-only"><button id="before-text" type="button">Before edit text</button><Text aria-label="Text edit control" :editable="{ triggerType: ['text'] }">Keyboard editable text</Text><button id="after-text" type="button">After edit text</button></section>
    <section id="measure">
      <Paragraph :style="{ width: `${state.width}px` }" :ellipsis="state.measure ? { rows: state.rows, expandable: 'collapsible', expanded: state.expanded } : false">
        <MeasuredBusiness key="business" />
        This long text fills the remaining measured lines and needs a real ellipsis decision. {{ 'More text follows. '.repeat(20) }}
      </Paragraph>
    </section>
  </ConfigProvider>
</template>
