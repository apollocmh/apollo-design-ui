<script lang="ts">
import { transformToken, useTheme } from '@apollo-design/theme';
import { useDevWarning } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  mergeProps,
  type PropType,
  ref,
  type SlotsType,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { createSpaceChildren } from './children';
import { isPresetSize, isValidGapNumber } from './gapSize';
import { SpaceItems } from './Item';
import type {
  SpaceConfig,
  SpaceProps,
  SpaceSemanticClassNames,
  SpaceSemanticStyles,
  SpaceSize,
  SpaceSlot,
} from './interface';
import { useSpaceFocus } from './use-focus';
import { useOrientation } from './useOrientation';

/** Read slot functions in render; appearance must never become business identity. */
export default defineComponent({
  name: 'ASpace',
  inheritAttrs: false,
  expose: ['nativeElement'],
  props: {
    prefixCls: String,
    size: { type: [String, Number, Array] as PropType<SpaceProps['size']> },
    direction: { type: String as PropType<SpaceProps['direction']> },
    orientation: { type: String as PropType<SpaceProps['orientation']> },
    vertical: { type: Boolean, default: undefined },
    align: { type: String as PropType<SpaceProps['align']> },
    split: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    separator: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    wrap: { type: Boolean, default: undefined },
    classNames: { type: [Object, Function] as PropType<SpaceProps['classNames']> },
    styles: { type: [Object, Function] as PropType<SpaceProps['styles']> },
  },
  slots: Object as SlotsType<{ default?: SpaceSlot; separator?: SpaceSlot }>,
  setup(props, { attrs, slots }) {
    const config = useComponentConfig<SpaceConfig>('space');
    const direction = useDirection();
    const prefix = computed(() => config.getPrefixCls('space', props.prefixCls));
    const orientation = useOrientation(
      () => props.orientation,
      () => props.vertical,
      () => props.direction,
    );
    const align = computed(() =>
      props.align === undefined && !orientation.value[1] ? 'center' : props.align,
    );
    const size = computed(() => props.size ?? config.size ?? 'small');
    const sizes = computed<[SpaceSize, SpaceSize]>(() =>
      Array.isArray(size.value) ? [size.value[0], size.value[1]] : [size.value, size.value],
    );
    const gapStyle = computed<CSSProperties>(() => {
      const [horizontal, vertical] = sizes.value;
      const style: CSSProperties = {};
      if (props.wrap) style.flexWrap = 'wrap';
      if (isValidGapNumber(horizontal)) style.columnGap = `${horizontal}px`;
      if (isValidGapNumber(vertical)) style.rowGap = `${vertical}px`;
      return style;
    });
    const semanticProps = computed<SpaceProps>(() => ({
      ...props,
      size: size.value,
      orientation: orientation.value[0],
      align: align.value,
    }));
    const semantic = useMergeSemantic<SpaceProps, SpaceSemanticClassNames, SpaceSemanticStyles>(
      [() => config.classNames, () => props.classNames],
      [() => config.styles, () => semanticRootStyle(config.style), () => props.styles],
      semanticProps,
    );
    const theme = useTheme();
    const themeStyle = computed(() =>
      Object.keys(theme.config.value).length ? transformToken(theme.token.value).vars : {},
    );
    const rootRef = ref<HTMLDivElement | null>(null);
    useSpaceFocus(rootRef);
    const readChildren = createSpaceChildren(true);
    const warning = useDevWarning('Space');
    watchEffect(() => {
      warning.deprecated(props.direction === undefined, 'direction', 'orientation');
      warning.deprecated(props.split === undefined, 'split', '#separator slot');
    });
    const renderSpace = () => {
      // Slot presence is non-reactive and may change with a parent render.
      const items = slots.default ? readChildren(slots.default()) : readChildren([]);
      if (!items.length) return null;
      const separator = slots.separator
        ? slots.separator()
        : props.separator !== undefined
          ? props.separator
          : props.split;
      const cls = prefix.value,
        classes = semantic.classNames.value,
        styles = semantic.styles.value;
      const [horizontal, vertical] = sizes.value;
      return h(
        'div',
        mergeProps(
          {
            ref: rootRef,
            class: [
              cls,
              config.className,
              `${cls}-${orientation.value[0]}`,
              {
                [`${cls}-rtl`]: direction.value === 'rtl',
                [`${cls}-align-${align.value}`]: align.value,
                [`${cls}-gap-row-${vertical}`]: isPresetSize(vertical),
                [`${cls}-gap-col-${horizontal}`]: isPresetSize(horizontal),
              },
              classes.root,
            ],
            ...styleAttrs({ ...themeStyle.value, ...gapStyle.value, ...styles.root }),
          },
          attrs,
        ),
        [h(SpaceItems, { items, prefix: cls, separator, classNames: classes, styles })],
      );
    };
    return { nativeElement: rootRef, renderSpace };
  },
  render() {
    return this.renderSpace();
  },
});
</script>
