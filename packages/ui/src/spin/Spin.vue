<script setup lang="ts">
/** Native Vue loading content, with stable host, section and indicator ownership. */
import { debounce, isEmptyVNode, mergeDomAttrs, useDevWarning } from '@apollo-design/utils';
import { computed, h, ref, shallowReactive, useAttrs, watchEffect } from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import { Indicator } from './components/Indicator';
import { getDefaultIndicator } from './defaultIndicator';
import type {
  SpinConfig,
  SpinProps,
  SpinSemanticClassNames,
  SpinSemanticStyles,
  SpinSlots,
} from './interface';
import { useSpinTheme } from './use-spin-theme';
import { usePercent } from './usePercent';

defineOptions({ name: 'ASpin', inheritAttrs: false });
const props = withDefaults(defineProps<SpinProps>(), {
  prefixCls: undefined,
  spinning: true,
  size: undefined,
  tip: undefined,
  description: undefined,
  delay: 0,
  wrapperClassName: undefined,
  percent: undefined,
  fullscreen: false,
  classNames: undefined,
  styles: undefined,
});
const slots = defineSlots<SpinSlots>();
const attrs = useAttrs();
const config = useComponentConfig<SpinConfig>('spin');
const prefixCls = computed(() => config.getPrefixCls('spin', props.prefixCls));
const theme = useSpinTheme(() => prefixCls.value);
const mergedSize = useSize((ctxSize) => props.size ?? ctxSize);
const delay = computed(() => (Number.isFinite(props.delay) && props.delay > 0 ? props.delay : 0));
const spinning = ref(props.spinning && delay.value === 0);
watchEffect((onCleanup) => {
  if (!props.spinning) {
    spinning.value = false;
    return;
  }
  if (!delay.value) {
    spinning.value = true;
    return;
  }
  const show = debounce(delay.value, () => {
    spinning.value = true;
  });
  show();
  onCleanup(() => show.cancel());
});
const rawPercent = usePercent(spinning, () => props.percent);
const percent = computed(() =>
  typeof rawPercent.value === 'number' && Number.isFinite(rawPercent.value)
    ? rawPercent.value
    : undefined,
);
const description = computed(() => props.description ?? props.tip);
const semanticProps = shallowReactive<SpinProps>({ ...props });
watchEffect(() =>
  Object.assign(semanticProps, props, {
    size: mergedSize.value,
    spinning: spinning.value,
    tip: description.value,
    description: description.value,
    percent: percent.value,
  }),
);
const { classNames, styles } = useMergeSemantic<
  SpinProps,
  SpinSemanticClassNames,
  SpinSemanticStyles
>(
  [() => config.classNames, () => props.classNames],
  [() => config.styles, () => semanticRootStyle(config.style), () => props.styles],
  semanticProps,
);
const warning = useDevWarning('Spin');
watchEffect(() => {
  warning.deprecated(props.size !== 'default', 'size="default"', 'size="medium"');
  warning.deprecated(!props.tip, 'tip', 'description');
  warning.deprecated(!props.wrapperClassName, 'wrapperClassName', 'classNames.root');
  warning.deprecated(
    !(classNames.value.tip || styles.value.tip),
    'classNames.tip and styles.tip',
    'classNames.description and styles.description',
  );
});
const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });

// Forward actual slot functions and attrs on each parent update. No rendered VNodes
// or slot-existence flags are cached in computed state.
const SpinRender = Object.assign(
  (input: { contentSlots: SpinSlots; rootAttrs: Record<string, unknown> }) => {
    const current = input.contentSlots;
    const p = prefixCls.value;
    const hasBody = current.default !== undefined;
    const cn = classNames.value;
    const st = styles.value;
    const loadingChildren = () => {
      const configured = config.indicator ?? getDefaultIndicator();
      const custom = !!current.indicator || configured != null;
      const indicator = current.indicator
        ? current.indicator({ percent: percent.value })
        : configured;
      const text = current.description ? current.description() : description.value;
      return [
        !custom || !isEmptyVNode(indicator)
          ? h(Indicator, {
              key: 'indicator',
              prefixCls: p,
              indicator,
              custom,
              percent: percent.value,
              className: cn.indicator,
              style: st.indicator,
            })
          : null,
        !isEmptyVNode(text)
          ? h(
              'div',
              {
                key: 'description',
                class: [`${p}-description`, cn.tip, cn.description],
                ...styleAttrs({ ...st.tip, ...st.description }),
              },
              [h(NodeRenderer, { node: text })],
            )
          : null,
      ];
    };
    const inactiveMask = props.fullscreen && !spinning.value;
    const section =
      spinning.value || props.fullscreen
        ? h(
            'div',
            {
              key: 'section',
              class: [`${p}-section`, cn.section, props.fullscreen && [`${p}-mask`, cn.mask]],
              ...styleAttrs({ ...st.section, ...(props.fullscreen ? st.mask : {}) }),
              ...(inactiveMask ? { 'aria-hidden': true, inert: true } : {}),
            },
            spinning.value ? loadingChildren() : [],
          )
        : null;
    const body = hasBody
      ? h(
          'div',
          {
            key: 'content',
            class: [`${p}-container`, cn.container],
            ...styleAttrs(st.container),
          },
          [current.default?.()],
        )
      : null;
    const nativeAttrs = mergeDomAttrs(
      {
        class: [
          p,
          {
            [`${p}-nested`]: hasBody,
            [`${p}-sm`]: mergedSize.value === 'small',
            [`${p}-lg`]: mergedSize.value === 'large',
            [`${p}-spinning`]: spinning.value,
            [`${p}-rtl`]: config.direction === 'rtl',
            [`${p}-fullscreen`]: props.fullscreen,
          },
          cn.root,
          (hasBody || props.fullscreen) && props.wrapperClassName,
          config.className,
        ],
        ...styleAttrs({ ...theme.styles.value, ...st.root }),
        'aria-live': 'polite',
        'aria-busy': spinning.value,
      },
      input.rootAttrs,
    );
    return h('div', { ...nativeAttrs, ref: rootRef }, [section, body]);
  },
  { props: ['contentSlots', 'rootAttrs'], inheritAttrs: false },
);
</script>

<template>
  <SpinRender :contentSlots="{ ...slots }" :rootAttrs="{ ...attrs }" />
</template>
