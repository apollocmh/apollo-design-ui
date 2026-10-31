/** Decorates one real HTML host; effects remain outside the child's VNode/slot ownership. */
import { getElement, isHTMLElement, isNonNullable, isNumber, isString } from '@apollo-design/utils';
import {
  Comment,
  type CSSProperties,
  cloneVNode,
  computed,
  defineComponent,
  Fragment,
  h,
  isVNode,
  mergeProps,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  type PropType,
  type ShallowRef,
  type SlotsType,
  shallowRef,
  Teleport,
  Text,
  type VNode,
  type VNodeChild,
  watch,
} from 'vue';
import { type ComponentStyleConfig, useComponentConfig } from '../config-provider/context';
import { subscribeBorderSample } from './border-sampler';
import type {
  BorderBeamColor,
  BorderBeamProps,
  BorderBeamSemanticClassNames,
  BorderBeamSemanticStyles,
  BorderBeamSlots,
} from './interface';
import { DEFAULT_BORDER_BEAM_DURATION, getBorderBeamGradient, isSameBorderWidth } from './util';

const getInset = (width: number | string): string =>
  isString(width) ? `calc(-1 * ${width})` : `-${width}px`;

/** Comments and blank whitespace do not turn a conditional single root into a multi-root host. */
function singleRoot(children: VNodeChild): VNode | undefined {
  let root: VNode | undefined;
  let count = 0;
  const visit = (child: VNodeChild) => {
    if (Array.isArray(child)) {
      for (const item of child) visit(item);
    } else if (isVNode(child)) {
      if (child.type === Fragment) {
        if (Array.isArray(child.children)) visit(child.children);
      } else if (
        child.type !== Comment &&
        !(child.type === Text && String(child.children ?? '').trim() === '')
      ) {
        root = child;
        count += 1;
      }
    } else if (typeof child === 'number' || (typeof child === 'string' && child.trim() !== '')) {
      count += 1;
    }
  };
  visit(children);
  return count === 1 && root && root.type !== Text ? root : undefined;
}

/** Replace only the selected VNode; preserve Fragment siblings, keys and slot ownership. */
function withHost(children: VNodeChild, host: VNode, replacement: VNode): VNodeChild {
  if (children === host) return replacement;
  if (Array.isArray(children)) return children.map((child) => withHost(child, host, replacement));
  if (isVNode(children) && children.type === Fragment && Array.isArray(children.children)) {
    return Object.assign(cloneVNode(children), {
      children: children.children.map((child) => withHost(child, host, replacement)),
      dynamicChildren: null,
    });
  }
  return children;
}

function useBorderSize(host: ShallowRef<HTMLElement | null>) {
  const empty = [0, 0, 0, 0] as const;
  const widths = shallowRef<readonly number[]>(empty);
  const normalize = (value: string): number => {
    const size = Number.parseFloat(value);
    return Number.isFinite(size) ? size : 0;
  };
  watch(
    host,
    (element, _, onCleanup) => {
      if (!element) {
        widths.value = empty;
        return;
      }
      const read = () => {
        const view = element.ownerDocument.defaultView;
        if (!view) return;
        const style = view.getComputedStyle(element);
        const next = [
          style.borderTopWidth,
          style.borderRightWidth,
          style.borderBottomWidth,
          style.borderLeftWidth,
        ].map(normalize);
        if (!isSameBorderWidth(widths.value, next)) widths.value = next;
      };
      if (!element.ownerDocument.hidden) read();
      onCleanup(subscribeBorderSample(read, () => element.ownerDocument));
    },
    { flush: 'sync' },
  );
  return widths;
}

/** Isolate Teleport patching from host textContent updates without adding a DOM wrapper. */
const BorderBeamEffects = defineComponent({
  name: 'ABorderBeamEffects',
  inheritAttrs: false,
  props: {
    host: { type: Object as PropType<HTMLElement>, required: true },
    revision: { type: Number, required: true },
  },
  slots: Object as SlotsType<BorderBeamSlots>,
  setup(props, { slots }) {
    let previous: VNode | undefined;
    let revision = 0;
    return () => {
      // A native text patch can remove external children and the Teleport's anchors.
      // Ordinary target changes keep their anchor, so Vue still moves the same effect DOM.
      if (previous?.targetAnchor && previous.targetAnchor.parentNode !== previous.target) {
        revision += 1;
      }
      const raw = slots.default?.() ?? [];
      previous = h(Teleport, { key: revision, to: props.host }, Array.isArray(raw) ? raw : [raw]);
      return previous;
    };
  },
});

export default defineComponent({
  name: 'ABorderBeam',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    classNames: { type: Object as PropType<BorderBeamProps['classNames']>, default: undefined },
    styles: { type: Object as PropType<BorderBeamProps['styles']>, default: undefined },
    color: { type: [String, Array] as PropType<BorderBeamColor>, default: undefined },
    count: { type: Number, default: undefined },
    duration: { type: Number, default: undefined },
    lineWidth: { type: [Number, String] as PropType<number | string>, default: undefined },
    outset: { type: [Number, String] as PropType<number | string>, default: undefined },
    size: { type: [Number, String] as PropType<number | string>, default: undefined },
  },
  slots: Object as SlotsType<BorderBeamSlots>,
  setup(props, { attrs, slots }) {
    const config = useComponentConfig<
      ComponentStyleConfig & {
        classNames?: BorderBeamSemanticClassNames;
        styles?: BorderBeamSemanticStyles;
      }
    >('borderBeam');
    const prefixCls = computed(() => config.getPrefixCls('border-beam', props.prefixCls));
    const hostDom = shallowRef<HTMLElement | null>(null);
    const borderWidth = useBorderSize(hostDom);
    const beamGradient = computed(() => getBorderBeamGradient(props.color));
    const mergedCount = computed(() =>
      isNumber(props.count) && Number.isFinite(props.count) && props.count >= 1
        ? Math.floor(props.count)
        : 1,
    );
    const validDuration = computed(
      () => isNumber(props.duration) && Number.isFinite(props.duration) && props.duration > 0,
    );
    const mergedDuration = computed(() =>
      validDuration.value
        ? (props.duration ?? DEFAULT_BORDER_BEAM_DURATION)
        : DEFAULT_BORDER_BEAM_DURATION,
    );
    const insetOffset = computed(() =>
      isNonNullable(props.outset)
        ? getInset(props.outset)
        : borderWidth.value.map(getInset).join(' '),
    );
    const unit = (value: number | string): string => (isNumber(value) ? `${value}px` : value);
    const effectStyle = (index: number): CSSProperties => {
      const v = (name: string): string => `--${prefixCls.value}-${name}`;
      return {
        ...(beamGradient.value ? { [v('beam-gradient')]: beamGradient.value } : {}),
        ...(validDuration.value ? { [v('duration')]: `${mergedDuration.value}s` } : {}),
        ...(isNonNullable(props.lineWidth) ? { [v('line-width')]: unit(props.lineWidth) } : {}),
        ...(isNonNullable(props.size) ? { [v('size')]: unit(props.size) } : {}),
        ...(index > 0
          ? { [v('delay')]: `${(-mergedDuration.value * index) / mergedCount.value}s` }
          : {}),
        [v('inset-offset')]: insetOffset.value,
        ...config.style,
        ...config.styles?.effect,
        ...props.styles?.effect,
      };
    };

    let currentHost: VNode | undefined;
    let effects: VNode | undefined;
    const effectRevision = shallowRef(0);
    let disposed = false;
    const observed = new Map<
      VNode,
      { original: VNode['props']; augmented: NonNullable<VNode['props']> }
    >();
    const refreshHost = () => {
      if (disposed) return;
      const chain = new Set<VNode>();
      let node = currentHost;
      while (node?.component) {
        if (node !== currentHost) chain.add(node);
        node = singleRoot(node.component.subTree);
      }
      for (const [vnode, entry] of observed) {
        if (!chain.has(vnode)) {
          if (vnode.props === entry.augmented) vnode.props = entry.original;
          observed.delete(vnode);
        }
      }
      // A nested component can replace its root without rerendering the outer slot owner.
      for (const vnode of chain) {
        if (!observed.has(vnode)) {
          const original = vnode.props;
          const augmented = mergeProps(original ?? {}, {
            onVnodeMounted: refreshHost,
            onVnodeUpdated: refreshHost,
          });
          vnode.props = augmented;
          observed.set(vnode, { original, augmented });
        }
      }
      const element = node && typeof node.type === 'string' ? getElement(node.el) : undefined;
      hostDom.value = isHTMLElement(element) ? element : null;
      const portal = effects?.component?.subTree;
      if (portal?.targetAnchor && portal.targetAnchor.parentNode !== portal.target) {
        effectRevision.value += 1;
      }
    };
    onMounted(refreshHost);
    onUpdated(refreshHost);
    onBeforeUnmount(() => {
      disposed = true;
      for (const [vnode, entry] of observed) {
        if (vnode.props === entry.augmented) vnode.props = entry.original;
      }
      observed.clear();
      hostDom.value = null;
    });

    return () => {
      const raw = slots.default?.() ?? [];
      const children = Array.isArray(raw) ? raw : [raw];
      const host = singleRoot(children);
      currentHost = undefined;
      let output: VNodeChild = children;
      if (host) {
        // cloneVNode retains normalized template refs (including ref_for), keys and component slots.
        const clone = cloneVNode(host, attrs);
        clone.props = mergeProps(attrs, host.props ?? {}, {
          onVnodeMounted: refreshHost,
          onVnodeUpdated: refreshHost,
        });
        currentHost = clone;
        output = withHost(children, host, clone);
      }
      const beams = Array.from({ length: mergedCount.value }, (_, index) =>
        h('div', {
          key: index,
          'aria-hidden': 'true',
          class: [
            prefixCls.value,
            config.className,
            config.classNames?.effect,
            props.classNames?.effect,
          ],
          style: effectStyle(index),
        }),
      );
      // Keep a stable Fragment root: discovering a host must never remount its component or DOM.
      effects =
        host && hostDom.value
          ? h(
              BorderBeamEffects,
              { key: 'beam-effects', host: hostDom.value, revision: effectRevision.value },
              { default: () => beams },
            )
          : undefined;
      return [output, ...(effects ? [effects] : [])];
    };
  },
});
