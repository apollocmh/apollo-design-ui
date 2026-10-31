/** Anchor composes native links with the existing section and scrolling algorithms. */
import {
  getScroll,
  isWindow,
  observeResize,
  throttleByAnimationFrame,
  useDevWarning,
  useResizeObserver,
} from '@apollo-design/utils';
import scrollIntoView from 'scroll-into-view-if-needed';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  mergeProps,
  onMounted,
  onScopeDispose,
  onUpdated,
  type PropType,
  provide,
  ref,
  type SlotsType,
  shallowRef,
  type VNodeChild,
  watch,
  watchEffect,
} from 'vue';
import { scrollTo } from '../_internal/scroll-to';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { Affix } from '../affix';
import { useComponentConfig, useConfigContext } from '../config-provider/context';
import { AnchorLink } from './AnchorLink';
import { type AnchorContextValue, anchorContextKey } from './context';
import { getAnchorTarget } from './get-target';
import type {
  AnchorContainer,
  AnchorLinkInfo,
  AnchorLinkItemProps,
  AnchorProps,
  AnchorSemanticClassNames,
  AnchorSemanticStyles,
  AnchorSlots,
} from './interface';
import { useAnchorTheme } from './use-anchor-theme';

function getOffsetTop(element: HTMLElement, container: AnchorContainer): number {
  if (!element.getClientRects().length) return 0;
  const rect = element.getBoundingClientRect();
  if (rect.width || rect.height) {
    return (
      rect.top -
      (isWindow(container)
        ? element.ownerDocument.documentElement.clientTop
        : container.getBoundingClientRect().top)
    );
  }
  return rect.top;
}
interface RegisteredLink {
  href: string;
  targetOffset?: number;
  element: () => HTMLElement | null;
}

export const Anchor = defineComponent({
  name: 'AAnchor',
  inheritAttrs: false,
  slots: Object as SlotsType<AnchorSlots>,
  props: {
    prefixCls: { type: String as PropType<string | undefined>, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<AnchorProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<AnchorProps['styles']>, default: undefined },
    items: { type: Array as PropType<AnchorLinkItemProps[] | undefined>, default: undefined },
    direction: { type: String as PropType<AnchorProps['direction']>, default: undefined },
    offsetTop: { type: Number as PropType<number | undefined>, default: undefined },
    bounds: { type: Number as PropType<number | undefined>, default: undefined },
    targetOffset: { type: Number as PropType<number | undefined>, default: undefined },
    affix: { type: [Boolean, Object] as PropType<AnchorProps['affix']>, default: undefined },
    showInkInFixed: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    getContainer: { type: Function as PropType<AnchorProps['getContainer']>, default: undefined },
    getCurrentAnchor: {
      type: Function as PropType<AnchorProps['getCurrentAnchor']>,
      default: undefined,
    },
    replace: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  },
  emits: {
    change: (_link: string) => true,
    click: (_event: MouseEvent, _link: AnchorLinkInfo) => true,
  },
  setup(props, { slots, emit, attrs }) {
    const context = useComponentConfig<{
      className?: string;
      style?: CSSProperties;
      classNames?: AnchorSemanticClassNames;
      styles?: AnchorSemanticStyles;
    }>('anchor');
    const config = useConfigContext();
    const prefixCls = computed(() => context.getPrefixCls('anchor', props.prefixCls));
    const anchorDirection = computed(() => props.direction ?? 'vertical');
    const mergedAffix = computed(() => props.affix ?? true);
    const theme = useAnchorTheme(prefixCls);
    const mounted = ref(false);
    const currentContainer = computed(() => {
      if (!mounted.value) return null;
      const resolve = props.getContainer ?? config.getTargetContainer;
      return resolve ? (resolve() ?? null) : window;
    });
    const ownerDocument = () => {
      const container = currentContainer.value;
      return container
        ? isWindow(container)
          ? container.document
          : container.ownerDocument
        : null;
    };
    const registrations = shallowRef(new Map<symbol, RegisteredLink>());
    const registerLink: AnchorContextValue['registerLink'] = (href, targetOffset, element) => {
      const id = Symbol();
      registrations.value = new Map(registrations.value).set(id, { href, targetOffset, element });
      return () => {
        const next = new Map(registrations.value);
        next.delete(id);
        registrations.value = next;
      };
    };
    const links = computed(() => {
      const result = new Map<string, RegisteredLink>();
      for (const link of registrations.value.values()) result.set(link.href, link);
      return [...result.values()];
    });
    const activeLink = ref<string | null>(null);
    let rawActiveLink: string | null = null;
    const wrapperRef = ref<HTMLElement | null>(null);
    const inkStyle = shallowRef<CSSProperties>();
    let animating = false;
    let animationLink: string | null = null;
    let cancelScroll: (() => void) | null = null;
    const stopAnimation = () => {
      cancelScroll?.();
      cancelScroll = null;
      animating = false;
      animationLink = null;
    };
    const setCurrentActiveLink = (link: string, force = false) => {
      rawActiveLink = link;
      const mapped = props.getCurrentAnchor ? props.getCurrentAnchor(link) : link;
      if (activeLink.value === mapped && !force) return;
      activeLink.value = mapped;
      emit('change', link);
    };
    const handleScroll = () => {
      if (!mounted.value || animating) return;
      const container = currentContainer.value;
      const document = ownerDocument();
      if (!container || !document) {
        setCurrentActiveLink('');
        return;
      }
      let selected = '',
        highest = -Infinity;
      const offset = props.targetOffset ?? props.offsetTop ?? 0;
      for (const link of links.value) {
        const target = getAnchorTarget(link.href, document);
        if (!target) continue;
        const top = getOffsetTop(target, container);
        if (top <= (link.targetOffset ?? offset) + (props.bounds ?? 5) && top > highest) {
          selected = link.href;
          highest = top;
        }
      }
      setCurrentActiveLink(selected);
    };
    const handleScrollTo = (href: string, targetOffset?: number) => {
      const container = currentContainer.value;
      const document = ownerDocument();
      if (!container || !document) return;
      const previous = rawActiveLink;
      setCurrentActiveLink(href, previous !== href);
      const target = getAnchorTarget(href, document);
      if (!target || (animating && animationLink === href)) return;
      stopAnimation();
      const y =
        (getScroll(container) ?? 0) +
        getOffsetTop(target, container) -
        (targetOffset ?? props.targetOffset ?? props.offsetTop ?? 0);
      animating = true;
      animationLink = href;
      cancelScroll = scrollTo(y, {
        getContainer: () => container,
        callback: () => {
          cancelScroll = null;
          animating = false;
          animationLink = null;
        },
      });
    };

    let previousInk = '';
    const updateInk = () => {
      if (!mounted.value) return;
      let link: HTMLElement | null = null;
      for (const registered of registrations.value.values()) {
        if (registered.href === activeLink.value) {
          link = registered.element();
          if (link) break;
        }
      }
      if (!link) {
        if (!activeLink.value && inkStyle.value) {
          inkStyle.value = undefined;
          previousInk = '';
        }
        return;
      }
      const horizontal = anchorDirection.value === 'horizontal';
      const next: CSSProperties = horizontal
        ? { left: `${link.offsetLeft}px`, width: `${link.clientWidth}px` }
        : { top: `${link.offsetTop + link.clientHeight / 2}px`, height: `${link.clientHeight}px` };
      const signature = `${prefixCls.value}:${activeLink.value}:${JSON.stringify(next)}`;
      if (signature !== previousInk) {
        inkStyle.value = next;
        previousInk = signature;
        if (horizontal) scrollIntoView(link, { scrollMode: 'if-needed', block: 'nearest' });
      }
    };
    const scheduledGeometry = throttleByAnimationFrame(() => {
      handleScroll();
      updateInk();
    });
    const semanticProps: AnchorProps = { ...props, direction: anchorDirection.value };
    watchEffect(() => Object.assign(semanticProps, props, { direction: anchorDirection.value }));
    const { classNames, styles } = useMergeSemantic<
      AnchorProps,
      AnchorSemanticClassNames,
      AnchorSemanticStyles
    >(
      [() => context.classNames, () => props.classNames],
      [() => context.styles, () => semanticRootStyle(context.style), () => props.styles],
      semanticProps,
    );
    provide(anchorContextKey, {
      registerLink,
      get activeLink() {
        return activeLink.value;
      },
      get prefixCls() {
        return prefixCls.value;
      },
      get direction() {
        return anchorDirection.value;
      },
      get replace() {
        return props.replace;
      },
      get classNames() {
        return classNames.value;
      },
      get styles() {
        return styles.value;
      },
      scrollTo: handleScrollTo,
      onClick: (event, link) => emit('click', event, link),
    });
    const warning = useDevWarning('Anchor');

    let attachedContainer: AnchorContainer | null = null;
    let detachContainer: (() => void) | undefined;
    const syncContainer = () => {
      const container = currentContainer.value;
      if (container === attachedContainer) return;
      detachContainer?.();
      detachContainer = undefined;
      attachedContainer = container;
      stopAnimation();
      if (container) {
        const view = isWindow(container) ? container : container.ownerDocument.defaultView;
        container.addEventListener('scroll', handleScroll);
        view?.addEventListener('resize', scheduledGeometry);
        detachContainer = () => {
          container.removeEventListener('scroll', handleScroll);
          view?.removeEventListener('resize', scheduledGeometry);
        };
      }
      handleScroll();
    };
    watch(currentContainer, syncContainer, { flush: 'post' });
    watch(
      [links, () => props.offsetTop, () => props.targetOffset, () => props.bounds],
      () => {
        if (!mounted.value) return;
        stopAnimation();
        handleScroll();
      },
      { flush: 'post' },
    );
    watch(
      () => props.getCurrentAnchor,
      () => {
        if (mounted.value) setCurrentActiveLink(rawActiveLink ?? '');
      },
      { flush: 'post' },
    );
    watch(
      () => {
        const document = ownerDocument();
        const nodes = [...registrations.value.values()].map((link) => link.element());
        if (document)
          for (const link of links.value) nodes.push(getAnchorTarget(link.href, document));
        return [...new Set(nodes.filter((node): node is HTMLElement => node !== null))];
      },
      (nodes, _previous, cleanup) => {
        const stops = nodes.map((node) => observeResize(node, scheduledGeometry));
        cleanup(() => {
          for (const stop of stops) stop();
        });
        updateInk();
      },
      { flush: 'post' },
    );
    useResizeObserver({ target: wrapperRef, onResize: scheduledGeometry });
    useResizeObserver({
      target: () => {
        const target = currentContainer.value;
        return target && !isWindow(target) ? target : null;
      },
      onResize: scheduledGeometry,
    });
    onMounted(() => {
      mounted.value = true;
      syncContainer();
      updateInk();
    });
    onUpdated(updateInk);
    onScopeDispose(() => {
      mounted.value = false;
      stopAnimation();
      detachContainer?.();
      scheduledGeometry.cancel();
    });

    const createNestedLink = (items?: AnchorLinkItemProps[]): VNodeChild =>
      items?.map(({ children, ...item }) =>
        h(
          AnchorLink,
          { replace: props.replace, ...item, key: item.key },
          children?.length && anchorDirection.value === 'vertical'
            ? { default: () => createNestedLink(children) }
            : undefined,
        ),
      );
    return () => {
      warning(
        anchorDirection.value !== 'horizontal' ||
          !!slots.default ||
          !props.items?.some((item) => item.children?.length),
        '`Anchor items#children` is not supported when `Anchor` direction is horizontal.',
      );
      const base = prefixCls.value;
      const affix = mergedAffix.value;
      const content = h(
        'div',
        mergeProps(
          {
            ref: wrapperRef,
            dir: context.direction,
            class: [
              `${base}-css-var`,
              `${base}-wrapper`,
              anchorDirection.value === 'horizontal' ? `${base}-wrapper-horizontal` : undefined,
              context.direction === 'rtl' ? `${base}-rtl` : undefined,
              context.className,
              classNames.value.root,
            ],
            style: [
              theme.aliasStyle.value,
              { maxHeight: props.offsetTop ? `calc(100vh - ${props.offsetTop}px)` : '100vh' },
              styles.value.root,
            ],
          },
          attrs,
        ),
        [
          h(
            'div',
            {
              class: [base, !affix && !props.showInkInFixed ? `${base}-fixed` : undefined],
              style: theme.componentStyle.value,
            },
            [
              h('span', {
                class: [
                  `${base}-ink`,
                  classNames.value.indicator,
                  activeLink.value ? `${base}-ink-visible` : undefined,
                ],
                style: [inkStyle.value, styles.value.indicator],
              }),
              slots.default ? slots.default() : createNestedLink(props.items),
            ],
          ),
        ],
      );
      return affix
        ? h(
            Affix,
            {
              offsetTop: props.offsetTop,
              target: () => currentContainer.value,
              ...(typeof affix === 'object' ? affix : undefined),
            },
            { default: () => content },
          )
        : content;
    };
  },
});
export default Anchor;
