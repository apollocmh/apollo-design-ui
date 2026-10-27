<script lang="ts">
import { useLocaleReactive } from '@apollo-design/locale';
import { isEmptyVNode, useDevWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  isVNode,
  mergeProps,
  type PropType,
  type SlotsType,
  shallowRef,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { EmptyImage as DefaultEmptyImage, SimpleEmptyImage } from './components/Images';
import { imageContent } from './components/NodeRenderer';
import type {
  EmptyConfig,
  EmptyImage,
  EmptyProps,
  EmptySemanticClassNames,
  EmptySemanticStyles,
  EmptySlots,
} from './interface';

/** Current configuration and complete Vue content, with one stable native root. */
export default defineComponent({
  name: 'AEmpty',
  inheritAttrs: false,
  expose: ['nativeElement'],
  props: {
    prefixCls: String,
    imageStyle: Object as PropType<EmptyProps['imageStyle']>,
    image: {
      type: [String, Number, Boolean, Object, Array, Function] as PropType<EmptyImage>,
      default: undefined,
    },
    description: {
      type: [String, Number, Boolean, Object, Array] as PropType<VNodeChild>,
      default: undefined,
    },
    classNames: [Object, Function] as PropType<EmptyProps['classNames']>,
    styles: [Object, Function] as PropType<EmptyProps['styles']>,
  },
  slots: Object as SlotsType<EmptySlots>,
  setup(props, { attrs, slots }) {
    const context = useComponentConfig<EmptyConfig>('empty');
    const direction = useDirection();
    const prefix = computed(() => context.getPrefixCls('empty', props.prefixCls));
    const [locale] = useLocaleReactive('Empty');
    const warning = useDevWarning('Empty');
    watchEffect(() =>
      warning.deprecated(props.imageStyle === undefined, 'imageStyle', 'styles.image'),
    );
    const semantic = useMergeSemantic<EmptyProps, EmptySemanticClassNames, EmptySemanticStyles>(
      [() => context.classNames, () => props.classNames],
      [() => context.styles, () => semanticRootStyle(context.style), () => props.styles],
      props,
    );
    const root = shallowRef<HTMLDivElement | null>(null);
    const renderEmpty = () => {
      const cls = prefix.value,
        classes = semantic.classNames.value,
        styles = semantic.styles.value;
      const description =
        props.description === undefined ? locale.value.description : props.description;
      const image =
        props.image === undefined
          ? context.image === undefined
            ? DefaultEmptyImage
            : context.image
          : props.image;
      const alt = typeof description === 'string' ? description : locale.value.description;
      // Read each slot only during this render. An intentionally empty slot suppresses its fallback.
      const picture = slots.image ? slots.image() : imageContent(image, alt);
      const text = slots.description ? slots.description() : description;
      const footer = slots.default?.();
      const actualImage = Array.isArray(picture) && picture.length === 1 ? picture[0] : picture;
      const simple = isVNode(actualImage) && actualImage.type === SimpleEmptyImage;
      const media =
        isVNode(actualImage) &&
        (actualImage.type === DefaultEmptyImage ||
          actualImage.type === SimpleEmptyImage ||
          (!slots.image && typeof image === 'string'));
      const section = (part: keyof EmptySemanticClassNames, content: VNodeChild) =>
        isEmptyVNode(content)
          ? null
          : h(
              'div',
              {
                key: part,
                class: [
                  `${cls}-${part}`,
                  part === 'image' && !media ? `${cls}-image-content` : undefined,
                  classes[part],
                ],
                ...styleAttrs(
                  part === 'image' ? { ...props.imageStyle, ...styles.image } : styles[part],
                ),
              },
              [h(NodeRenderer, { node: content })],
            );
      return h(
        'div',
        mergeProps(
          {
            class: [
              cls,
              context.className,
              classes.root,
              {
                [`${cls}-normal`]: simple,
                [`${cls}-rtl`]: (attrs.dir ?? direction.value) === 'rtl',
              },
            ],
            ...styleAttrs(styles.root),
          },
          attrs,
          { ref: root, dir: attrs.dir ?? direction.value },
        ),
        [section('image', picture), section('description', text), section('footer', footer)],
      );
    };
    return { nativeElement: root, renderEmpty };
  },
  render() {
    return this.renderEmpty();
  },
});
</script>
