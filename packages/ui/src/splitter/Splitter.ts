/** Splitter layout: current Vue Panel VNodes, accepted sizes and owned notifications. */
import { devUseWarning, toArray, useResizeObserver } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  Fragment,
  getCurrentInstance,
  h,
  onBeforeUnmount,
  type PropType,
  ref,
  type SlotsType,
  toRef,
} from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useOrientation } from '../_internal/use-orientation';
import { useComponentConfig, useConfigContext } from '../config-provider/context';
import { getAriaBounds } from './hooks/ariaBounds';
import { getItems, type SplitterItem } from './hooks/useItems';
import { useResizable } from './hooks/useResizable';
import { useResize } from './hooks/useResize';
import { useSizes } from './hooks/useSizes';
import type {
  SplitterProps,
  SplitterSemanticClassNames,
  SplitterSemanticStyles,
  SplitterSlots,
} from './interface';
import { InternalPanel, SplitterPanel } from './Panel';
import SplitBar from './SplitBar';
import { useSplitterTheme } from './use-splitter-theme';

interface SplitterComponentConfig {
  className?: string;
  style?: import('vue').CSSProperties;
  classNames?: SplitterProps['classNames'];
  styles?: SplitterProps['styles'];
}

export const Splitter = defineComponent({
  name: 'ASplitter',
  inheritAttrs: false,
  expose: ['nativeElement'],
  slots: Object as SlotsType<SplitterSlots>,
  props: {
    prefixCls: { type: String, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<SplitterProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<SplitterProps['styles']>, default: undefined },
    collapsible: { type: Object as PropType<SplitterProps['collapsible']>, default: undefined },
    layout: { type: String as PropType<SplitterProps['layout']>, default: undefined },
    orientation: { type: String as PropType<SplitterProps['orientation']>, default: undefined },
    vertical: { type: Boolean, default: undefined },
    destroyOnHidden: { type: Boolean, default: undefined },
    collapsibleIcon: {
      type: Object as PropType<SplitterProps['collapsibleIcon']>,
      default: undefined,
    },
    lazy: { type: Boolean, default: undefined },
  },
  emits: {
    resizeStart: (_sizes: number[]) => true,
    resize: (_sizes: number[]) => true,
    resizeEnd: (_sizes: number[]) => true,
    collapse: (_collapsed: boolean[], _sizes: number[]) => true,
    draggerDoubleClick: (_index: number) => true,
  },
  setup(props, { slots, emit, attrs }) {
    const context = useComponentConfig<SplitterComponentConfig>('splitter');
    const configContext = useConfigContext();
    const instance = getCurrentInstance();
    const nativeElement = ref<HTMLDivElement | null>(null);
    let movedFocus: HTMLElement | null = null;
    const captureFocus = () => {
      const root = nativeElement.value;
      const active = root?.ownerDocument.activeElement;
      movedFocus = active instanceof HTMLElement && root?.contains(active) ? active : null;
    };
    const restoreFocus = () => {
      const root = nativeElement.value;
      if (
        movedFocus?.isConnected &&
        root?.contains(movedFocus) &&
        root.ownerDocument.activeElement === root.ownerDocument.body
      ) {
        movedFocus.focus({ preventScroll: true });
      }
      movedFocus = null;
    };
    onBeforeUnmount(() => {
      movedFocus = null;
    });
    const orientationInfo = useOrientation(
      () => props.orientation,
      () => props.vertical,
      () => props.layout,
    );
    const orientation = computed(() => orientationInfo.value[0]);
    const vertical = computed(() => orientationInfo.value[1]);
    const reverse = computed(() => !vertical.value && configContext.direction === 'rtl');
    const prefix = computed(() => context.getPrefixCls('splitter', props.prefixCls));
    const themeStyle = useSplitterTheme(() => prefix.value);

    // The current render owns this plain metadata. Getter refs deliberately do not cache slots.
    let currentItems: SplitterItem[] = [];
    const unkeyed: symbol[] = [];
    const items = toRef(() => currentItems);
    const measured = ref({ width: 0, height: 0 });
    const containerSize = computed(
      () => (vertical.value ? measured.value.height : measured.value.width) || undefined,
    );
    useResizeObserver({
      target: nativeElement,
      onResize: (info) => {
        if (!info.offsetWidth && !info.offsetHeight) return;
        measured.value = { width: info.offsetWidth, height: info.offsetHeight };
      },
    });
    const sizes = useSizes(items, containerSize);
    const resizableInfos = useResizable(items, sizes.pxSizes, reverse);
    const resize = useResize(
      items,
      resizableInfos,
      sizes.ptgSizes,
      containerSize,
      sizes.setInnerSizes,
      reverse,
    );
    const forget = (key: SplitterItem['key']) => {
      sizes.forget(key);
      resize.forget(key);
    };
    const onStart = (index: number) => {
      resize.onOffsetStart(index);
      emit('resizeStart', sizes.pxSizes.value);
    };
    const onUpdate = (index: number, offsetX: number, offsetY: number, lazyEnd?: boolean) => {
      let offset = vertical.value ? offsetY : offsetX;
      if (reverse.value) offset = -offset;
      const next = resize.onOffsetUpdate(index, offset);
      emit('resize', next);
      if (lazyEnd) emit('resizeEnd', next);
    };
    const onEnd = (lazyEnd?: boolean) => {
      resize.onOffsetEnd();
      if (!lazyEnd) emit('resizeEnd', sizes.pxSizes.value);
    };
    const onCollapse = (index: number, type: 'start' | 'end') => {
      const next = resize.onCollapse(index, type);
      emit('resize', next);
      emit('resizeEnd', next);
      emit(
        'collapse',
        next.map((size) => Math.abs(size) < Number.EPSILON),
        next,
      );
    };
    const semanticProps = computed<SplitterProps>(() => ({
      ...props,
      orientation: orientation.value,
    }));
    const { classNames, styles } = useMergeSemantic<
      SplitterProps,
      SplitterSemanticClassNames,
      SplitterSemanticStyles
    >(
      [() => context.classNames, () => props.classNames],
      [
        () => context.styles,
        () => (context.style ? { root: context.style } : undefined),
        () => props.styles,
      ],
      semanticProps,
      { dragger: { _default: 'default' } },
    );
    const warning = devUseWarning('Splitter');
    const renderSplitter = () => {
      currentItems = getItems(
        toArray(slots.default?.()).filter((node) => node.type === SplitterPanel),
        unkeyed,
      );
      const hasControlled = currentItems.some((item) => item.size !== undefined);
      if (
        hasControlled &&
        currentItems.some((item) => item.size === undefined) &&
        !instance?.vnode.props?.onResize
      ) {
        warning(
          false,
          'When part of `Splitter.Panel` has `size`, listen to `resize` or use `defaultSize`.',
        );
      }
      if (props.layout !== undefined) warning.deprecated(false, 'layout', 'orientation');
      if (props.collapsibleIcon !== undefined)
        warning.deprecated(false, 'collapsibleIcon', 'collapsible.icon');
      const cls = prefix.value;
      const panelSizes = sizes.panelSizes.value;
      const panelKeys = currentItems.map((item) => item.key);
      const stack: number[] = [];
      sizes.ptgSizes.value.forEach((value, index) => {
        stack[index] = (stack[index - 1] ?? 0) + value;
      });
      const content = currentItems.map((item, index) => {
        const info = resizableInfos.value[index];
        const aria = getAriaBounds(stack, sizes.ptgMinSizes.value, sizes.ptgMaxSizes.value, index);
        const draggerClass = classNames.value.dragger;
        return h(Fragment, { key: item.key }, [
          h(
            InternalPanel,
            {
              prefixCls: cls,
              itemKey: item.key,
              forget,
              rememberAccepted: sizes.rememberAccepted,
              rememberInitial: () => sizes.rememberInitial(item.key, item.defaultSize),
              className: classNames.value.panel,
              style: styles.value.panel,
              size: panelSizes[index],
              supportMotion: !!props.collapsible?.motion && resize.movingIndex.value === undefined,
              destroyOnHidden: item.destroyOnHidden ?? props.destroyOnHidden,
            },
            { default: () => item.node },
          ),
          info
            ? h(SplitBar, {
                prefixCls: cls,
                vertical: vertical.value,
                reverse: reverse.value,
                index,
                panelKeys,
                active: resize.movingIndex.value === index,
                resizable: info.resizable,
                lazy: !!props.lazy,
                containerSize: containerSize.value ?? 0,
                ariaNow: aria.now,
                ariaMin: aria.min,
                ariaMax: aria.max,
                startCollapsible: info.startCollapsible,
                endCollapsible: info.endCollapsible,
                showStartCollapsibleIcon: info.showStartCollapsibleIcon,
                showEndCollapsibleIcon: info.showEndCollapsibleIcon,
                draggerIcon: slots.draggerIcon?.(),
                draggerStyle: styles.value.dragger,
                draggerClassName:
                  typeof draggerClass === 'string' ? { default: draggerClass } : draggerClass,
                collapsibleIcon: props.collapsible?.icon ?? props.collapsibleIcon,
                onOffsetStart: onStart,
                onOffsetUpdate: onUpdate,
                onOffsetEnd: onEnd,
                onOffsetCancel: resize.onOffsetEnd,
                onCollapse,
                onDraggerDoubleClick: (bar: number) => emit('draggerDoubleClick', bar),
              })
            : null,
        ]);
      });
      return h(
        'div',
        {
          ...attrs,
          ref: nativeElement,
          onVnodeBeforeUpdate: captureFocus,
          onVnodeUpdated: restoreFocus,
          class: [
            cls,
            `${cls}-${orientation.value}`,
            { [`${cls}-rtl`]: configContext.direction === 'rtl' },
            context.className,
            classNames.value.root,
            attrs.class,
          ],
          style: [themeStyle.value, styles.value.root, attrs.style],
        },
        [
          ...content,
          resize.movingIndex.value !== undefined
            ? h('div', {
                key: 'mask',
                'aria-hidden': true,
                class: [`${cls}-mask`, `${cls}-mask-${orientation.value}`],
              })
            : null,
        ],
      );
    };
    return { nativeElement, renderSplitter };
  },
  render() {
    return this.renderSplitter();
  },
});

export const SplitterWithPanel = Object.assign(Splitter, { Panel: SplitterPanel });
export default SplitterWithPanel;
