/** A native link plus optional vertical child-link composition. */
import { isEmptyVNode, useDevWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  inject,
  mergeProps,
  type PropType,
  ref,
  type SlotsType,
  type VNodeChild,
  watch,
} from 'vue';
import { useConfigContext } from '../config-provider/context';
import { contentProp } from './content-prop';
import { anchorContextKey } from './context';
import { getLocalHash } from './get-target';
import type { AnchorLinkInfo, AnchorLinkSlots } from './interface';

export const AnchorLink = defineComponent({
  name: 'AAnchorLink',
  inheritAttrs: false,
  slots: Object as SlotsType<AnchorLinkSlots>,
  props: {
    prefixCls: { type: String as PropType<string | undefined>, default: undefined },
    href: { type: String, required: true },
    target: { type: String as PropType<string | undefined>, default: undefined },
    title: contentProp,
    className: { type: String as PropType<string | undefined>, default: undefined },
    replace: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    targetOffset: { type: Number as PropType<number | undefined>, default: undefined },
  },
  emits: { click: (_event: MouseEvent, _link: AnchorLinkInfo) => true },
  setup(props, { slots, attrs, emit }) {
    const context = inject(anchorContextKey, undefined);
    const config = useConfigContext();
    const prefixCls = computed(
      () => props.prefixCls ?? context?.prefixCls ?? config.getPrefixCls('anchor'),
    );
    const active = computed(() => context?.activeLink === props.href);
    const linkRef = ref<HTMLAnchorElement | null>(null);
    const devWarning = useDevWarning('Anchor.Link');
    let renderedTitle: VNodeChild;
    watch(
      () => [props.href, props.targetOffset] as const,
      ([href, offset], _old, cleanup) => {
        const unregister = context?.registerLink(href, offset, () => linkRef.value);
        if (unregister) cleanup(unregister);
      },
      { immediate: true, flush: 'post' },
    );

    const handleClick = (event: MouseEvent) => {
      const info = { title: renderedTitle, href: props.href };
      emit('click', event, info);
      context?.onClick?.(event, info);
      const link = linkRef.value;
      if (
        !link ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        link.hasAttribute('download') ||
        (link.target && link.target.toLowerCase() !== '_self')
      )
        return;
      const document = link.ownerDocument;
      const view = document.defaultView;
      if (!view) return;
      const replace = props.replace ?? context?.replace;
      if (getLocalHash(props.href, document) === null) {
        if (replace && (link.protocol === 'http:' || link.protocol === 'https:')) {
          event.preventDefault();
          view.location.replace(link.href);
        }
        return;
      }
      event.preventDefault();
      context?.scrollTo(props.href, props.targetOffset);
      view.history[replace ? 'replaceState' : 'pushState'](null, '', props.href);
    };

    return () => {
      const base = prefixCls.value;
      renderedTitle = slots.title ? slots.title() : props.title;
      const children = slots.default?.();
      const horizontal = context?.direction === 'horizontal';
      devWarning(
        !horizontal || isEmptyVNode(children),
        '`Anchor.Link children` is not supported when `Anchor` direction is horizontal',
      );
      const rootAttrs: Record<string, unknown> = {};
      const linkAttrs: Record<string, unknown> = {};
      for (const [name, value] of Object.entries(attrs)) {
        if (
          name.startsWith('aria-') ||
          name === 'tabindex' ||
          name === 'tabIndex' ||
          [
            'download',
            'rel',
            'hreflang',
            'referrerpolicy',
            'referrerPolicy',
            'type',
            'ping',
            'accesskey',
            'accessKey',
          ].includes(name) ||
          /^on(?:Focus|Blur|Keydown|Keyup|Keypress)/.test(name)
        )
          linkAttrs[name] = value;
        else rootAttrs[name] = value;
      }
      return h(
        'div',
        mergeProps(
          {
            class: [
              `${base}-link`,
              props.className,
              context?.classNames?.item,
              active.value ? `${base}-link-active` : undefined,
            ],
            style: context?.styles?.item,
          },
          rootAttrs,
        ),
        [
          h(
            'a',
            mergeProps(
              {
                ref: linkRef,
                class: [
                  `${base}-link-title`,
                  context?.classNames?.itemTitle,
                  active.value ? `${base}-link-title-active` : undefined,
                ],
                style: context?.styles?.itemTitle,
                href: props.href,
                title: typeof renderedTitle === 'string' ? renderedTitle : undefined,
                target: props.target,
                'aria-current': active.value ? 'location' : undefined,
              },
              linkAttrs,
              { onClick: handleClick },
            ),
            [renderedTitle],
          ),
          horizontal ? null : children,
        ],
      );
    };
  },
});
export default AnchorLink;
