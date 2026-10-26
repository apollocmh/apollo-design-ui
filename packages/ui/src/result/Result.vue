<script lang="ts">
import { transformToken, useTheme } from '@apollo-design/theme';
import { isEmptyVNode, mergeDomAttrs } from '@apollo-design/utils';
import {
  type Component,
  computed,
  defineComponent,
  h,
  type PropType,
  type SlotsType,
  shallowRef,
  type VNodeChild,
} from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import type {
  ResultConfig,
  ResultProps,
  ResultSemanticClassNames,
  ResultSemanticStyles,
  ResultSlots,
  ResultStatusType,
} from './interface';
import { ExceptionMap, IconMap } from './maps';
import { prepareResultComponentToken } from './style/token';

function statusIcon(status: ResultStatusType): { component: Component; exception: boolean } {
  switch (status) {
    case 403:
    case '403':
      return { component: ExceptionMap[403], exception: true };
    case 404:
    case '404':
      return { component: ExceptionMap[404], exception: true };
    case 500:
    case '500':
      return { component: ExceptionMap[500], exception: true };
    case 'success':
      return { component: IconMap.success, exception: false };
    case 'error':
      return { component: IconMap.error, exception: false };
    case 'warning':
      return { component: IconMap.warning, exception: false };
    default:
      return { component: IconMap.info, exception: false };
  }
}
const length = (value: unknown, fallback: number | string): string => {
  const current =
    (typeof value === 'number' && Number.isFinite(value) && value >= 0) ||
    (typeof value === 'string' && value.trim())
      ? value
      : fallback;
  return typeof current === 'number' ? `${current}px` : current;
};

/** Complete Vue slots and current root configuration; exception illustrations remain decoration. */
export default defineComponent({
  name: 'AResult',
  inheritAttrs: false,
  expose: ['nativeElement'],
  props: {
    prefixCls: String,
    status: { type: [String, Number] as PropType<ResultStatusType>, default: 'info' },
    icon: { type: Boolean as PropType<boolean | null>, default: undefined },
    title: String,
    subTitle: String,
    classNames: { type: [Object, Function] as PropType<ResultProps['classNames']> },
    styles: { type: [Object, Function] as PropType<ResultProps['styles']> },
  },
  slots: Object as SlotsType<ResultSlots>,
  setup(props, { attrs, slots }) {
    const context = useComponentConfig<ResultConfig>('result');
    const direction = useDirection();
    const prefix = computed(() => context.getPrefixCls('result', props.prefixCls));
    const theme = useTheme();
    const themeStyle = computed<Record<string, string>>(() => {
      if (!Object.keys(theme.config.value).length) return {};
      const base = prepareResultComponentToken(theme.token.value);
      const custom = theme.config.value.components?.Result ?? {};
      const cls = prefix.value;
      return {
        ...transformToken(theme.token.value).vars,
        [`--${cls}-title-font-size`]: length(custom.titleFontSize, base.titleFontSize),
        [`--${cls}-subtitle-font-size`]: length(custom.subtitleFontSize, base.subtitleFontSize),
        [`--${cls}-icon-font-size`]: length(custom.iconFontSize, base.iconFontSize),
        [`--${cls}-extra-margin`]:
          typeof custom.extraMargin === 'string' && custom.extraMargin.trim()
            ? custom.extraMargin
            : base.extraMargin,
      };
    });
    const root = shallowRef<HTMLDivElement | null>(null);
    const semantic = useMergeSemantic<ResultProps, ResultSemanticClassNames, ResultSemanticStyles>(
      [() => context.classNames, () => props.classNames],
      [() => context.styles, () => semanticRootStyle(context.style), () => props.styles],
      props,
    );
    const renderResult = () => {
      const cls = prefix.value,
        classes = semantic.classNames.value,
        styles = semantic.styles.value;
      const title = slots.title ? slots.title() : props.title;
      const subTitle = slots.subTitle ? slots.subTitle() : props.subTitle;
      const extra = slots.extra?.();
      const body = slots.default?.();
      const customIcon = slots.icon?.();
      const fallback = statusIcon(props.status);
      const showDefaultIcon = !slots.icon && props.icon !== false && props.icon !== null;
      const icon = slots.icon
        ? customIcon
        : showDefaultIcon
          ? h(
              fallback.component,
              fallback.exception ? { 'aria-hidden': 'true', focusable: 'false' } : undefined,
            )
          : undefined;
      const section = (key: keyof ResultSemanticClassNames, suffix: string, content: VNodeChild) =>
        isEmptyVNode(content)
          ? null
          : h(
              'div',
              {
                key,
                class: [
                  `${cls}-${suffix}`,
                  key === 'icon' && showDefaultIcon && fallback.exception
                    ? `${cls}-image`
                    : undefined,
                  classes[key],
                ],
                style: styles[key],
              },
              [h(NodeRenderer, { node: content })],
            );
      return h(
        'div',
        mergeDomAttrs(
          {
            ref: root,
            class: [
              cls,
              `${cls}-${props.status}`,
              { [`${cls}-rtl`]: direction.value === 'rtl' },
              context.className,
              classes.root,
            ],
            style: [themeStyle.value, styles.root],
          },
          attrs,
        ),
        [
          section('icon', 'icon', icon),
          section('title', 'title', title),
          section('subTitle', 'subtitle', subTitle),
          section('extra', 'extra', extra),
          section('body', 'body', body),
        ],
      );
    };
    return { nativeElement: root, renderResult };
  },
  render() {
    return this.renderResult();
  },
});
</script>
