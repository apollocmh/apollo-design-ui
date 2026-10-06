/**
 * Splitter —— 分割面板主组件。
 *
 * 契约来源：antd 6.6.4 `es/splitter/Splitter.js`（231 行，逐行对拍）。
 * 渲染函数选型（无 .vue）：items 的动态列表 + SplitBar 的事件接线 + mask 条件渲染
 * 由上游机械规则决定（见 docs/analysis/splitter.md §3）。
 *
 * ── 与 antd 的有意差异 ────────────────────────────────────────────────────────
 *
 * 1. 事件：onResizeStart/onResize/onResizeEnd/onCollapse/onDraggerDoubleClick ⇒
 *    `resize-start/resize/resize-end/collapse/dragger-double-click` emits（C19，I2）。
 * 2. `ref` ⇒ `expose({ nativeElement })`（I3）。
 * 3. `@rc-component/resize-observer` ⇒ utils 的 `useResizeObserver`（I4）。
 * 4. dragger 语义槽 string ⇒ `{default}` 展平手动归一化（I5）。
 */

import { devUseWarning, useResizeObserver } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  type PropType,
  ref,
  type VNode,
  type VNodeChild,
  watch,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useOrientation } from '../_internal/use-orientation';
import { useComponentConfig, useConfigContext } from '../config-provider/context';
import { useItems } from './hooks/useItems';
import { useResizable } from './hooks/useResizable';
import { useResize } from './hooks/useResize';
import { useSizes } from './hooks/useSizes';
import type {
  SplitterDraggerClassNames,
  SplitterProps,
  SplitterSemanticClassNames,
  SplitterSemanticStyles,
} from './interface';
import { InternalPanel, SplitterPanel } from './Panel';
import SplitBar from './SplitBar';

/** antd 薄壳从 `useComponentConfig('splitter')` 读取的组件级配置。 */
interface SplitterComponentConfig {
  className?: string;
  style?: Record<string, string | number>;
  classNames?: SplitterSemanticClassNames;
  styles?: SplitterSemanticStyles;
}

/** 收集 slot 里的元素 vnode（跳过注释/文本，展开 Fragment —— descriptions 同范式）。 */
const collectChildren = (nodes: VNodeChild[]): VNode[] => {
  const out: VNode[] = [];
  const walk = (list: VNodeChild[]): void => {
    for (const node of list) {
      if (!node || typeof node !== 'object') continue;
      const v = node as VNode;
      if (v.type.toString() === 'Symbol(v-cmt)') continue;
      if (v.type.toString() === 'Symbol(v-fgt)') {
        walk((v.children as VNodeChild[]) ?? []);
        continue;
      }
      out.push(v);
    }
  };
  walk(nodes);
  return out;
};

/** dragger 语义槽展平：string ⇒ `{ default }`（antd `_default: 'default'` 语义）。 */
const normalizeDraggerClassNames = (
  input: SplitterSemanticClassNames['dragger'],
): SplitterDraggerClassNames | undefined =>
  input === undefined ? undefined : typeof input === 'string' ? { default: input } : input;

/** Panel vnode 的 children 归一化：`h(Panel, …, () => …)` 的 children 是槽函数/槽对象。 */
const renderPanelChildren = (raw: VNode | undefined): VNodeChild => {
  const c = raw?.children as VNodeChild | { default?: () => VNodeChild } | undefined;
  if (typeof c === 'function') {
    return (c as () => VNodeChild)();
  }
  if (c && typeof c === 'object' && typeof (c as { default?: unknown }).default === 'function') {
    return (c as { default: () => VNodeChild }).default();
  }
  if (Array.isArray(c)) return c;
  // 其余对象形态（无 default 的槽对象）不可渲染 ⇒ null
  return c === null || c === undefined ? null : (c as VNodeChild);
};

export const Splitter = defineComponent({
  name: 'ASplitter',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    classNames: { type: Object as PropType<SplitterSemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<SplitterSemanticStyles>, default: undefined },
    collapsible: {
      type: Object as PropType<SplitterProps['collapsible']>,
      default: undefined,
    },
    layout: {
      type: String as PropType<SplitterProps['layout']>,
      default: undefined,
    },
    orientation: {
      type: String as PropType<SplitterProps['orientation']>,
      default: undefined,
    },
    vertical: { type: Boolean, default: undefined },
    destroyOnHidden: { type: Boolean, default: undefined },
    collapsibleIcon: {
      type: Object as PropType<SplitterProps['collapsibleIcon']>,
      default: undefined,
    },
    lazy: { type: Boolean, default: undefined },
    onResizeStart: {
      type: Function as PropType<(sizes: number[]) => void>,
      default: undefined,
    },
    onResize: { type: Function as PropType<(sizes: number[]) => void>, default: undefined },
    onResizeEnd: { type: Function as PropType<(sizes: number[]) => void>, default: undefined },
    onCollapse: {
      type: Function as PropType<(collapsed: boolean[], sizes: number[]) => void>,
      default: undefined,
    },
    onDraggerDoubleClick: {
      type: Function as PropType<(index: number) => void>,
      default: undefined,
    },
  },
  emits: ['resize-start', 'resize', 'resize-end', 'collapse', 'dragger-double-click'],
  setup(props, { slots, emit, expose, attrs }) {
    const context = useComponentConfig<SplitterComponentConfig>('splitter');
    const configContext = useConfigContext();

    const rootRef = ref<HTMLDivElement | null>(null);
    expose({ nativeElement: rootRef });

    // ======================== Direct ========================
    const orientationInfo = useOrientation(
      () => props.orientation,
      () => props.vertical,
      () => props.layout,
    );
    const mergedOrientation = computed(() => orientationInfo.value[0]);
    const isVertical = computed(() => orientationInfo.value[1]);
    const isRTL = computed(() => configContext.direction === 'rtl');
    const reverse = computed(() => !isVertical.value && isRTL.value);

    // ====================== Items Data ======================
    const childrenRef = computed(() => collectChildren(slots.default?.() ?? []));
    const items = useItems(childrenRef);

    // >>> Warning for uncontrolled（antd 在 render 里同步发；这里 watch immediate 等价）
    watch(
      () => [items.value, props.onResize, props.layout, props.collapsibleIcon] as const,
      ([nextItems, onResize, layout, collapsibleIcon]) => {
        const warning = devUseWarning('Splitter');
        const existSize = nextItems.some((item) => item.size !== undefined);
        const existUndefinedSize = nextItems.some((item) => item.size === undefined);
        if (existSize && existUndefinedSize && !onResize) {
          warning(
            false,
            'When part of `Splitter.Panel` has `size`, `onResize` is required or change `size` to `defaultSize`.',
          );
        }
        if (layout !== undefined) {
          warning.deprecated(!layout, 'layout', 'orientation');
        }
        if (collapsibleIcon !== undefined) {
          warning.deprecated(!collapsibleIcon, 'collapsibleIcon', 'collapsible.icon');
        }
      },
      { immediate: true },
    );

    // ====================== Container =======================
    const containerSize = ref<number | undefined>(undefined);
    useResizeObserver({
      target: rootRef,
      onResize: (info: { offsetWidth: number; offsetHeight: number }) => {
        const nextSize = isVertical.value ? info.offsetHeight : info.offsetWidth;
        // Skip when container has no size, Such as nested in a hidden tab panel
        if (nextSize === 0) {
          return;
        }
        containerSize.value = nextSize;
      },
    });
    // ========================= Size =========================
    const { panelSizes, pxSizes, ptgSizes, ptgMinSizes, ptgMaxSizes, setInnerSizes } = useSizes(
      items,
      containerSize,
    );

    // ====================== Resizable =======================
    const resizableInfos = useResizable(items, pxSizes, reverse);
    const resize = useResize(
      items,
      resizableInfos,
      ptgSizes,
      containerSize,
      setInnerSizes,
      reverse,
    );

    // ======================== Events ========================
    /**
     * 🚨 **只 `emit`，不要再手写 `props.onX?.(...)`。**
     *
     * Vue 的 `emit('resize')` 自己就会去找 `props.onResize` 并调用它
     * （`toHandlerKey(event)` 的映射，读的是 `instance.vnode.props`）——
     * 再手写一遍就是**每次回调都调两次**。
     *
     * 2026-10-01 实测（一次性探针：`props.onResize?.(x); emit('resize', x)` ⇒
     * `onResize` 被调 **2** 次）。本文件原先 5 个回调全是这个形态。
     * → PITFALLS 267
     *
     * 这一条 emit 同时满足两种写法：`<Splitter @resize>` 与 `:on-resize`。
     */
    const onInternalResizeStart = (index: number): void => {
      resize.onOffsetStart(index);
      emit('resize-start', pxSizes.value);
    };
    const onInternalResizeUpdate = (index: number, offset: number, lazyEnd?: boolean): void => {
      const nextSizes = resize.onOffsetUpdate(index, offset);
      if (lazyEnd) {
        emit('resize-end', nextSizes);
      } else {
        emit('resize', nextSizes);
      }
    };
    const onInternalResizeEnd = (lazyEnd?: boolean): void => {
      resize.onOffsetEnd();
      if (!lazyEnd) {
        emit('resize-end', pxSizes.value);
      }
    };
    const onInternalCollapse = (index: number, type: 'start' | 'end'): void => {
      const nextSizes = resize.onCollapse(index, type);
      emit('resize', nextSizes);
      emit('resize-end', nextSizes);
      const collapsed = nextSizes.map((size) => Math.abs(size) < Number.EPSILON);
      emit('collapse', collapsed, nextSizes);
    };

    // ======================== Semantic ========================
    // ⚠️ antd 第四参 `{ dragger: { _default: 'default' } }`（`Splitter.js:130-134`，
    //    §1.7b 已补）：把 string 形态 `classNames.dragger = 'a'` 归到 `dragger.default`，
    //    字符串 + 对象混用不再产垃圾键；root/panel 等未声明键照常 clsx 平铺。
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      Record<string, unknown>,
      SplitterSemanticClassNames,
      SplitterSemanticStyles
    >(
      [() => context.classNames, () => props.classNames],
      [
        () => context.styles,
        () => semanticRootStyle(context.style as never) as never,
        () => props.styles,
      ],
      { props: props as unknown as Record<string, unknown> },
      { dragger: { _default: 'default' } },
    );

    return () => {
      const getPrefixCls = context.getPrefixCls;
      const prefixCls = getPrefixCls('splitter', props.prefixCls);
      const rootPrefixCls = getPrefixCls();

      const containerClassName = [
        prefixCls,
        `${prefixCls}-${mergedOrientation.value}`,
        { [`${prefixCls}-rtl`]: isRTL.value },
        mergedClassNames.value.root,
        context.className,
        attrs.class,
      ];

      const maskCls = `${prefixCls}-mask`;
      const stackSizes: number[] = [];
      let stack = 0;
      const len = items.value.length;
      for (let i = 0; i < len; i += 1) {
        stack += ptgSizes.value[i] ?? 0;
        stackSizes.push(stack);
      }

      const nodes: VNodeChild[] = [];
      items.value.forEach((item, idx) => {
        const raw = childrenRef.value[idx];
        const panel = h(
          InternalPanel,
          {
            prefixCls,
            className: [mergedClassNames.value.panel, item.className].filter(Boolean).join(' '),
            style: { ...mergedStyles.value.panel, ...item.style },
            size: panelSizes.value[idx],
            supportMotion: !!props.collapsible?.motion && resize.movingIndex.value === undefined,
            destroyOnHidden: item.destroyOnHidden ?? props.destroyOnHidden,
          },
          // children 是 `<Splitter.Panel>{content}</Splitter.Panel>` 的 element.children
          { default: () => renderPanelChildren(raw) },
        );
        nodes.push(panel);

        // Split Bar
        const resizableInfo = resizableInfos.value[idx];
        if (resizableInfo) {
          const prevStackSize = Number.isFinite(stackSizes[idx - 1])
            ? (stackSizes[idx - 1] as number)
            : 0;
          const nextStackSize = Number.isFinite(stackSizes[idx + 1])
            ? (stackSizes[idx + 1] as number)
            : 1;
          const ariaMinStart = prevStackSize + (ptgMinSizes.value[idx] ?? 0);
          const ariaMinEnd = nextStackSize - (ptgMaxSizes.value[idx + 1] ?? 1);
          const ariaMaxStart = prevStackSize + (ptgMaxSizes.value[idx] ?? 1);
          const ariaMaxEnd = nextStackSize - (ptgMinSizes.value[idx + 1] ?? 0);

          nodes.push(
            h(SplitBar, {
              key: `split-bar-${idx}`,
              lazy: !!props.lazy,
              index: idx,
              active: resize.movingIndex.value === idx,
              prefixCls,
              rootPrefixCls,
              vertical: isVertical.value,
              resizable: resizableInfo.resizable,
              draggerStyle: mergedStyles.value.dragger ?? {},
              draggerClassName: normalizeDraggerClassNames(mergedClassNames.value.dragger) ?? {},
              // 内部：由 Splitter 的 #draggerIcon slot 程序化传递（VNode prop 合法）
              draggerIcon: slots.draggerIcon?.(),
              collapsibleIcon: props.collapsible?.icon || props.collapsibleIcon || {},
              ariaNow: (stackSizes[idx] ?? 0) * 100,
              ariaMin: Math.max(ariaMinStart, ariaMinEnd) * 100,
              ariaMax: Math.min(ariaMaxStart, ariaMaxEnd) * 100,
              startCollapsible: resizableInfo.startCollapsible,
              endCollapsible: resizableInfo.endCollapsible,
              showStartCollapsibleIcon: resizableInfo.showStartCollapsibleIcon,
              showEndCollapsibleIcon: resizableInfo.showEndCollapsibleIcon,
              onDraggerDoubleClick: (index: number) => {
                // 同上：只 emit（`emit` 会连带调 `props.onDraggerDoubleClick`）
                emit('dragger-double-click', index);
              },
              onOffsetStart: onInternalResizeStart,
              onOffsetUpdate: (
                index: number,
                offsetX: number,
                offsetY: number,
                lazyEnd?: boolean,
              ) => {
                let offset = isVertical.value ? offsetY : offsetX;
                if (reverse.value) {
                  offset = -offset;
                }
                onInternalResizeUpdate(index, offset, lazyEnd);
              },
              onOffsetEnd: onInternalResizeEnd,
              onCollapse: onInternalCollapse,
              containerSize: containerSize.value || 0,
            }),
          );
        }
      });

      return h(
        'div',
        {
          ...attrs,
          ref: rootRef,
          style: [mergedStyles.value.root, attrs.style],
          class: containerClassName,
        },
        [
          ...nodes,
          // antd 的 `isNumber(movingIndex)` —— movingIndex 在拖拽期间才是 number
          resize.movingIndex.value !== undefined && resize.movingIndex.value !== null
            ? h('div', {
                'aria-hidden': true,
                class: [maskCls, `${maskCls}-${mergedOrientation.value}`],
              })
            : null,
        ],
      );
    };
  },
});

/** 复合组件：`Splitter.Panel`（renderless，antd 的 `CompoundedComponent`）。 */
export const SplitterWithPanel = Object.assign(Splitter, { Panel: SplitterPanel });

export default SplitterWithPanel;
