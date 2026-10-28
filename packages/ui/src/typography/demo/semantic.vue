<script setup lang="ts">
import {
  ConfigProvider,
  type ConfigProviderProps,
  Paragraph,
  Text,
  type TypographyConfig,
  type TypographyProps,
} from '@apollo-design/ui';
import { computed, ref, type StyleValue } from 'vue';

/** 对象式：直接给槽位类名 / 样式。 */
const classNamesObject: TypographyProps['classNames'] = {
  root: 'demo-typography-root',
  actions: 'demo-typography-actions',
  action: 'demo-typography-action',
};

const stylesObject: TypographyProps['styles'] = {
  root: { backgroundColor: 'var(--apollo-color-fill-alter)' },
  actions: { marginInlineStart: '8px' },
};

/**
 * 函数式：`info.props` 是**合并后**的 props —— `prefixCls` 已是解析后的
 * `apollo-typography`，`direction` 也已并入 ConfigProvider 的取值。
 *
 * ⚠️ `info.props` 的类型是 `BaseTypographyProps`（= `TypographyProps`），**不含**
 *    `disabled` / `type` / `copyable` 这些 `BlockProps` 独有的字段 —— 上游 antd 也如此
 *    （`TypographySemanticAllType = GenerateSemantic<TypographySemanticType, BaseTypographyProps>`）。
 *    所以这里分支用的判据必须是基础 props 里有的（`prefixCls`）。
 */
const classNamesFn: TypographyProps['classNames'] = (info) =>
  info.props.prefixCls === 'apollo-typography-alt'
    ? { root: 'demo-typography-root--alt' }
    : { root: 'demo-typography-root' };

const phase = ref(0);
const nativeClass = computed(() =>
  phase.value < 3 ? ['native-demo-root', `native-demo-phase-${phase.value}`] : undefined,
);
const nativeStyle = computed<StyleValue>(() => {
  if (phase.value === 0)
    return 'color:var(--apollo-color-text);padding-inline-start:var(--apollo-padding-xs);--native-demo-phase:string';
  if (phase.value === 1)
    return [
      'color:var(--apollo-color-text-secondary);--native-demo-phase:array',
      {
        paddingInlineStart: 'var(--apollo-padding-sm)',
        paddingInlineEnd: 'var(--apollo-padding-xs)',
      },
    ];
  if (phase.value === 2)
    return {
      color: 'var(--apollo-color-text)',
      paddingInlineStart: 'var(--apollo-padding-md)',
      '--native-demo-phase': 'object',
    };
  return undefined;
});
const nativeSemanticStyles: TypographyProps['styles'] = {
  root: {
    color: 'var(--apollo-color-text-secondary)',
    paddingInlineStart: 'var(--apollo-padding-xxs)',
    '--semantic-demo-root': 'kept',
  },
};

const providerPhase = ref(0);
const makeProviderConfig = (phase: number): TypographyConfig => {
  const marker = phase === 0 ? 'first' : phase === 1 ? 'second' : 'function';
  const classes = {
    root: `demo-provider-root-${marker}`,
    actions: `demo-provider-actions-${marker}`,
    action: `demo-provider-action-${marker}`,
    textarea: `demo-provider-textarea-${marker}`,
  };
  const semanticStyles = {
    root: { paddingBlockStart: 'var(--apollo-padding-xxs)', '--provider-demo-semantic': marker },
    actions: {
      paddingInlineEnd:
        phase === 0
          ? 'var(--apollo-padding-xxs)'
          : phase === 1
            ? 'var(--apollo-padding-xs)'
            : 'var(--apollo-padding-sm)',
    },
    action: {
      color:
        phase === 0
          ? 'var(--apollo-color-text)'
          : phase === 1
            ? 'var(--apollo-color-text-secondary)'
            : 'var(--apollo-color-text)',
    },
    textarea: {
      fontSize:
        phase === 0
          ? 'var(--apollo-font-size-sm)'
          : phase === 1
            ? 'var(--apollo-font-size)'
            : 'var(--apollo-font-size-lg)',
    },
  };
  return {
    className: `demo-provider-class-${marker}`,
    style: {
      color: 'var(--apollo-color-text)',
      paddingBlockStart:
        phase === 0
          ? 'var(--apollo-padding-xs)'
          : phase === 1
            ? 'var(--apollo-padding-sm)'
            : 'var(--apollo-padding-md)',
      paddingBlockEnd: 'var(--apollo-padding-xxs)',
      '--provider-demo-style': marker,
    },
    classNames:
      phase === 2
        ? ({ props }) => ({
            ...classes,
            root: `${classes.root} ${props.prefixCls === 'apollo-typography' ? 'demo-provider-prefix-resolved' : 'demo-provider-prefix-missing'}`,
          })
        : classes,
    styles:
      phase === 2
        ? ({ props }) => ({
            ...semanticStyles,
            root: {
              ...semanticStyles.root,
              '--provider-demo-prefix': props.prefixCls ?? 'missing',
            },
          })
        : semanticStyles,
  };
};
const providerComponents = ref<NonNullable<ConfigProviderProps['components']>>({
  typography: { ...makeProviderConfig(0) },
});
const replaceProvider = () => {
  providerPhase.value = (providerPhase.value + 1) % 4;
  providerComponents.value =
    providerPhase.value === 3 ? {} : { typography: { ...makeProviderConfig(providerPhase.value) } };
};
const providerLocalStyles: TypographyProps['styles'] = {
  root: {
    color: 'var(--apollo-color-text-secondary)',
    paddingBlockEnd: 'var(--apollo-padding-xs)',
  },
  actions: { marginInlineStart: 'var(--apollo-margin-sm)' },
  action: { fontWeight: 'var(--apollo-font-weight-strong)' },
  textarea: { lineHeight: 'var(--apollo-line-height)' },
};
</script>

<template>
  <Paragraph :class-names="classNamesObject" :styles="stylesObject" :copyable="true">
    Object form: classNames / styles
  </Paragraph>
  <Paragraph :class-names="classNamesFn">Function form: classNames</Paragraph>
  <Paragraph :class-names="classNamesFn" class="demo-alt">Function form, alt</Paragraph>
  <Text :class-names="classNamesObject" :styles="stylesObject" :copyable="true" />
  <section data-native-typography-style-demo>
    <p><button type="button" @mousedown.prevent @click="phase = (phase + 1) % 4">Cycle native typography styles</button></p>
    <Text data-demo-native-style :class="nativeClass" :style="nativeStyle"
      :class-names="{ root: 'semantic-demo-root' }" :styles="nativeSemanticStyles">
      Native style: {{ ['string', 'array', 'object', 'removed'][phase] }}
      <input aria-label="Semantic typography draft" />
    </Text>
  </section>
  <section data-typography-provider-demo>
    <p><button type="button" @mousedown.prevent @click="replaceProvider">Replace typography provider</button></p>
    <ConfigProvider :components="providerComponents">
      <Paragraph data-provider-demo-rich class="demo-native-provider-root" :style="{ color: 'var(--apollo-color-text)' }"
        :class-names="{ root: 'demo-local-provider-root' }" :styles="providerLocalStyles" copyable>
        Current provider: {{ ['first object', 'new object', 'function', 'removed'][providerPhase] }}
        <input aria-label="Provider typography draft" />
      </Paragraph>
      <div data-provider-demo-editor>
        <Text aria-label="Provider typography editor" :editable="{ editing: true }"
          class="demo-native-provider-root" :style="{ color: 'var(--apollo-color-text)' }"
          :class-names="{ root: 'demo-local-provider-root' }" :styles="providerLocalStyles">Current provider draft</Text>
      </div>
    </ConfigProvider>
  </section>
</template>
