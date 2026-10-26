<script setup lang="ts">
import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import {
  Card,
  ConfigProvider,
  Skeleton,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonImage,
  SkeletonInput,
  SkeletonNode,
  type SkeletonRef,
  Statistic,
} from '@apollo-design/ui';
import { computed, nextTick, onMounted, ref, type StyleValue, shallowRef } from 'vue';

type Mode = 'default' | 'dark' | 'compact' | 'both';
type ImageSlot = 'content' | 'empty' | 'absent';
const source = ref(false),
  provider = ref(false),
  rtl = ref(false),
  loading = ref(true),
  active = ref(true),
  shown = ref(true),
  native = ref(false),
  motionOff = ref(false);
const mode = ref<Mode>('default'),
  imageSlot = ref<ImageSlot>('content');
const style = shallowRef<StyleValue>({ padding: '6px' });
const contentDraft = ref('Loaded draft'),
  nodeDraft = ref('Node draft'),
  imageDraft = ref('Image draft');
const clicks = ref(0),
  rows = ref(3),
  round = ref(false);
const instance = shallowRef<SkeletonRef | null>(null);
const components = computed(() =>
  provider.value
    ? {
        skeleton: {
          className: 'current-skeleton-provider',
          style: { marginBottom: '13px' },
          classNames: { title: 'current-provider-title' },
        },
      }
    : undefined,
);
const theme = computed(() => {
  if (!source.value && mode.value === 'default' && !motionOff.value) return undefined;
  return {
    algorithm:
      mode.value === 'both'
        ? [darkAlgorithm, compactAlgorithm]
        : mode.value === 'dark'
          ? darkAlgorithm
          : mode.value === 'compact'
            ? compactAlgorithm
            : undefined,
    token: {
      ...(source.value ? { controlHeight: 44 } : {}),
      ...(motionOff.value ? { motion: false } : {}),
    },
    components: source.value
      ? {
          Skeleton: {
            gradientFromColor: '#dce8ff',
            gradientToColor: '#8cafff',
            titleHeight: 28,
            paragraphLiHeight: 19,
            blockRadius: 8,
            paragraphMarginTop: 34,
          },
        }
      : undefined,
  };
});
const nativeStyle = computed<StyleValue>(() => [
  style.value,
  native.value ? { '--apollo-skeleton-title-height': '35px' } : {},
]);
const semantics = ({ props }: { props: { round?: boolean } }) => ({
  title: { opacity: props.round ? 0.65 : 1 },
});
declare global {
  interface Window {
    skeletonAudit: {
      set(options: {
        source?: boolean;
        provider?: boolean;
        rtl?: boolean;
        loading?: boolean;
        active?: boolean;
        shown?: boolean;
        native?: boolean;
        motionOff?: boolean;
        mode?: Mode;
        imageSlot?: ImageSlot;
        rows?: number;
        round?: boolean;
        style?: StyleValue;
      }): Promise<void>;
      snapshot(): { nativeId: string | null; clicks: number };
    };
  }
}
onMounted(() => {
  window.skeletonAudit = {
    async set(options) {
      if (options.source !== undefined) source.value = options.source;
      if (options.provider !== undefined) provider.value = options.provider;
      if (options.rtl !== undefined) rtl.value = options.rtl;
      if (options.loading !== undefined) loading.value = options.loading;
      if (options.active !== undefined) active.value = options.active;
      if (options.shown !== undefined) shown.value = options.shown;
      if (options.native !== undefined) native.value = options.native;
      if (options.motionOff !== undefined) motionOff.value = options.motionOff;
      if (options.mode !== undefined) mode.value = options.mode;
      if (options.imageSlot !== undefined) imageSlot.value = options.imageSlot;
      if (options.rows !== undefined) rows.value = options.rows;
      if (options.round !== undefined) round.value = options.round;
      if ('style' in options) style.value = options.style;
      await nextTick();
    },
    snapshot: () => ({ nativeId: instance.value?.nativeElement?.id ?? null, clicks: clicks.value }),
  };
});
</script>
<template>
  <main style="padding:24px;max-width:900px;margin:auto">
    <h1>Skeleton native contracts</h1>
    <ConfigProvider :theme="theme" :components="components" :direction="rtl ? 'rtl' : 'ltr'" component-size="large">
      <section data-theme-surface style="padding:16px;background:var(--apollo-color-bg-container);color:var(--apollo-color-text)">
      <div v-if="shown" data-skeleton-main-host>
        <Skeleton ref="instance" id="skeleton-main" data-native-root="main" class="native-skeleton" :loading="loading" :active="active" :round="round" :style="nativeStyle" role="region" aria-label="Loading article" @click="clicks++"
          :avatar="{ className: 'configured-avatar', style: { opacity: 0.7 } }" :title="{ className: 'configured-title' }" :paragraph="{ rows, width: ['85%', '70%', '50%'] }"
          :class-names="{ root: 'local-root', header: 'local-header', section: 'local-section', avatar: 'local-avatar', title: 'local-title', paragraph: 'local-paragraph' }" :styles="semantics">
          <label>Loaded article<input v-model="contentDraft" aria-label="Skeleton content draft" /></label>
        </Skeleton>
      </div>
      <div v-if="shown" style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;margin-top:20px">
        <div data-skeleton-avatar-host><SkeletonAvatar id="skeleton-avatar" data-native-root="avatar" :active="active" :size="40" shape="square" :style="nativeStyle" /></div>
        <div data-skeleton-button-host><SkeletonButton id="skeleton-button" data-native-root="button" :active="active" shape="round" :style="nativeStyle" /></div>
        <div data-skeleton-input-host><SkeletonInput id="skeleton-input" data-native-root="input" :active="active" :style="nativeStyle" :styles="{ content: { width: '135px' } }" /></div>
      </div>
      <div v-if="shown" data-skeleton-image-host style="margin-top:16px">
        <SkeletonImage id="skeleton-image" data-native-root="image" :active="active" :style="nativeStyle" :styles="{ content: { width: '260px', minHeight: '110px', background: 'var(--apollo-color-bg-container)', color: 'var(--apollo-color-text)' } }">
          <template v-if="imageSlot !== 'absent'" #default><template v-if="imageSlot !== 'empty'"><!-- leading --><label>Image draft<input v-model="imageDraft" aria-label="Skeleton image draft" style="max-width:150px" /></label><b>Tail</b></template></template>
        </SkeletonImage>
      </div>
      <div v-if="shown" data-skeleton-node-host style="margin-top:16px">
        <SkeletonNode id="skeleton-node" data-native-root="node" :active="active" :style="nativeStyle" :styles="{ content: { width: '100%', height: 'auto', minHeight: '80px', padding: '12px', background: 'var(--apollo-color-bg-container)', color: 'var(--apollo-color-text)' } }">
          <!-- leading --><label>Node draft<input v-model="nodeDraft" aria-label="Skeleton node draft" /></label><b v-if="round">Extra content</b>
        </SkeletonNode>
      </div>
      <Card title="Actual loading Card" loading style="margin-top:16px" />
      <Statistic title="Actual loading Statistic" :value="1234" loading style="margin-top:16px" />
      </section>
    </ConfigProvider>
  </main>
</template>
