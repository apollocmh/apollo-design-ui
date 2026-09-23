/**
 * Collapse 主组件。
 *
 * 契约来源：antd 6.6.4 `es/collapse/Collapse.js`（90 行薄壳，逐行对拍）+
 * rc `@rc-component/collapse@1.2.0/es/Collapse.js`（activeKey 状态机在
 * `engine/`）。渲染函数选型（无 .vue）：items/children 双形态收集 + expandIcon
 * 回调 + role 条件，分支在渲染函数里最清晰。
 *
 * ── 与 antd 的有意差异 ────────────────────────────────────────────────────────
 *
 * 1. `onChange` ⇒ `change` emit（C19）；deprecated×2（destroyInactivePanel /
 *    expandIconPosition）与 Panel 的 `disabled` 告警逐条保留。
 * 2. `ref` ⇒ `expose({ nativeElement })`。
 * 3. `size` 走 ConfigProvider 的 `useConfigContext().components.collapse.size`？
 *    antd 的 useSize 读 componentSize 上下文 ⇒ 本仓读 `configContext.size`。
 */

import { RightOutlined } from '@apollo-design/icons';
import { initCollapseMotion } from '@apollo-design/motion';
import { devUseWarning, isFunction } from '@apollo-design/utils';
import {
  cloneVNode,
  computed,
  defineComponent,
  h,
  isVNode,
  type PropType,
  ref,
  type VNode,
  type VNodeChild,
  watch,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useConfigContext } from '../config-provider/context';
import { buildPanelInfos, getActiveKeysArray } from './engine';
import type {
  CollapseItemType,
  CollapsePanelProps,
  CollapseProps,
  CollapseSemanticClassNames,
  CollapseSemanticStyles,
  CollapsibleType,
} from './interface';
import { CollapsePanelInner } from './Panel';

/** antd 薄壳从 `useComponentConfig('collapse')` 读取的组件级配置。 */
interface CollapseComponentConfig {
  className?: string;
  style?: Record<string, string | number>;
  classNames?: CollapseSemanticClassNames;
  styles?: CollapseSemanticStyles;
  expandIcon?: CollapseProps['expandIcon'];
}

/** 收集 slot 里的 CollapsePanel vnode（跳过注释/文本/Fragment 展开）。 */
const collectChildren = (nodes: VNodeChild[]): VNodeChild[] => {
  const out: VNodeChild[] = [];
  const walk = (list: VNodeChild[]): void => {
    for (const node of list) {
      if (!node || typeof node !== 'object') continue;
      const v = node as { type?: unknown; children?: unknown };
      const typeStr = String((v as { type?: { toString(): string } }).type ?? '');
      if (typeStr === 'Symbol(v-cmt)') continue;
      if (typeStr === 'Symbol(v-fgt)') {
        walk((v.children as VNodeChild[]) ?? []);
        continue;
      }
      out.push(node);
    }
  };
  walk(nodes);
  return out;
};

export const Collapse = defineComponent({
  name: 'ACollapse',
  inheritAttrs: false,
  props: {
    items: { type: Array as PropType<CollapseItemType[]>, default: undefined },
    activeKey: {
      type: [Array, String, Number] as PropType<CollapseProps['activeKey']>,
      default: undefined,
    },
    defaultActiveKey: {
      type: [Array, String, Number] as PropType<CollapseProps['defaultActiveKey']>,
      default: undefined,
    },
    accordion: { type: Boolean, default: undefined },
    destroyInactivePanel: { type: Boolean, default: undefined },
    destroyOnHidden: { type: Boolean, default: undefined },
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    style: {
      type: Object as PropType<Record<string, string | number>>,
      default: undefined,
    },
    bordered: { type: Boolean, default: true },
    prefixCls: { type: String, default: undefined },
    expandIcon: {
      type: Function as PropType<CollapseProps['expandIcon']>,
      default: undefined,
    },
    expandIconPlacement: {
      type: String as PropType<'start' | 'end'>,
      default: undefined,
    },
    expandIconPosition: {
      type: String as PropType<'start' | 'end'>,
      default: undefined,
    },
    ghost: { type: Boolean, default: undefined },
    size: {
      type: String as PropType<'large' | 'middle' | 'small'>,
      default: undefined,
    },
    collapsible: {
      type: String as PropType<'header' | 'icon' | 'disabled'>,
      default: undefined,
    },
    onChange: {
      type: Function as PropType<(key: string[]) => void>,
      default: undefined,
    },
    classNames: { type: Object as PropType<CollapseSemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<CollapseSemanticStyles>, default: undefined },
  },
  emits: ['change'],
  setup(props, { slots, emit, expose, attrs }) {
    const context = useComponentConfig<CollapseComponentConfig>('collapse');
    const configContext = useConfigContext();

    const rootRef = ref<HTMLDivElement | null>(null);
    expose({ nativeElement: rootRef });

    const prefixCls = computed(() => context.getPrefixCls('collapse', props.prefixCls));

    // ======================== Direct ========================
    const mergedSize = computed(() => props.size ?? 'middle');
    const mergedPlacement = computed(
      () => props.expandIconPlacement ?? props.expandIconPosition ?? 'start',
    );
    const isRTL = computed(() => configContext.direction === 'rtl');

    // ======================== Semantic ========================
    const mergedClassNames = computed<CollapseSemanticClassNames>(() => {
      const { classNames } = useMergeSemantic<
        CollapseProps,
        CollapseSemanticClassNames,
        CollapseSemanticStyles
      >(
        [() => context.classNames, () => props.classNames],
        [
          () => context.styles,
          () => semanticRootStyle(context.style as never),
          () => props.styles,
          () => semanticRootStyle(props.style),
        ],
        props,
      );
      return classNames.value;
    });
    const mergedStyles = computed<CollapseSemanticStyles>(() => {
      const { styles } = useMergeSemantic<
        CollapseProps,
        CollapseSemanticClassNames,
        CollapseSemanticStyles
      >(
        [() => context.classNames, () => props.classNames],
        [
          () => context.styles,
          () => semanticRootStyle(context.style as never),
          () => props.styles,
          () => semanticRootStyle(props.style),
        ],
        props,
      );
      return styles.value;
    });

    // ======================== Warning ========================
    watch(
      () => [props.destroyInactivePanel, props.expandIconPosition] as const,
      ([destroyInactivePanel, expandIconPosition]) => {
        const warning = devUseWarning('Collapse');
        if (destroyInactivePanel !== undefined) {
          warning.deprecated(false, 'destroyInactivePanel', 'destroyOnHidden');
        }
        if (expandIconPosition !== undefined) {
          warning.deprecated(false, 'expandIconPosition', 'expandIconPlacement');
        }
      },
      { immediate: true },
    );

    // ======================== activeKey 状态机 ========================
    const internalActiveKey = ref(props.defaultActiveKey);
    const activeKeys = computed<string[]>(() =>
      getActiveKeysArray(props.activeKey !== undefined ? props.activeKey : internalActiveKey.value),
    );
    const triggerActiveKey = (next: (string | number)[] | string | number | undefined): void => {
      const nextKeys = getActiveKeysArray(next);
      internalActiveKey.value = nextKeys;
      props.onChange?.(nextKeys);
      emit('change', nextKeys);
    };
    const onItemClick = (key: string): void => {
      if (props.accordion) {
        triggerActiveKey(activeKeys.value[0] === key ? [] : [key]);
      } else {
        triggerActiveKey(
          activeKeys.value.includes(key)
            ? activeKeys.value.filter((item) => item !== key)
            : [...activeKeys.value, key],
        );
      }
    };

    // ======================== expandIcon ========================
    const mergedExpandIcon = computed(() => props.expandIcon ?? context.expandIcon);
    const renderExpandIcon = (
      panelProps: CollapsePanelProps & { isActive?: boolean; collapsible?: CollapsibleType },
    ): VNodeChild => {
      const iconIsInteractive =
        panelProps.collapsible === 'header' || panelProps.collapsible === 'icon';
      let icon: VNodeChild;
      if (isFunction(mergedExpandIcon.value)) {
        icon = mergedExpandIcon.value!(panelProps);
      } else {
        icon = h(RightOutlined, {
          rotate: panelProps.isActive ? (isRTL.value ? -90 : 90) : undefined,
          ...(iconIsInteractive
            ? { 'aria-label': panelProps.isActive ? 'expanded' : 'collapsed' }
            : { 'aria-hidden': true }),
        });
      }
      // antd 用 cloneElement 给图标追加 `{prefix}-arrow` 类（默认与定制图标都加）
      if (isVNode(icon)) {
        const ori = icon as VNode;
        return cloneVNode(ori, {
          class: [(ori.props as { class?: unknown } | null)?.class, `${prefixCls.value}-arrow`],
        });
      }
      return icon;
    };

    // ======================== openMotion ========================
    const rootPrefixCls = computed(() => context.getPrefixCls());
    const openMotion = computed(() => ({
      ...initCollapseMotion(rootPrefixCls.value),
      motionAppear: false,
      leavedClassName: `${prefixCls.value}-panel-hidden`,
    }));

    // ======================== 面板数据（items 优先，children 兜底） ========================
    const panelInfos = computed(() => {
      // items 优先（antd useItems：Array.isArray(items) ⇒ items 路径）
      if (Array.isArray(props.items)) {
        return buildPanelInfos(props.items, {
          accordion: props.accordion,
          collapsible: props.collapsible,
          destroyOnHidden: props.destroyOnHidden ?? props.destroyInactivePanel,
          activeKeys: activeKeys.value,
          onItemTrigger: onItemClick,
        });
      }
      // children 形态：从 Collapse.Panel vnode 的 props 读（getNewChild 对拍）
      const children = collectChildren(slots.default?.() ?? []);
      const items: CollapseItemType[] = children.map((child, index) => {
        const cProps = ((child as { props?: Record<string, unknown> }).props ??
          {}) as CollapsePanelProps;
        return {
          key: (child as { key?: string | number | null }).key ?? cProps.key ?? String(index),
          header: cProps.header,
          className: cProps.className,
          style: cProps.style,
          showArrow: cProps.showArrow,
          forceRender: cProps.forceRender,
          extra: cProps.extra,
          collapsible: cProps.collapsible,
          destroyOnHidden: cProps.destroyOnHidden,
          onItemClick: cProps.onItemClick,
          headerClass: cProps.headerClass,
          id: cProps.id,
          children:
            typeof cProps.children !== 'object'
              ? cProps.children
              : ((child as { children?: unknown }).children as VNodeChild),
        };
      });
      return buildPanelInfos(items, {
        accordion: props.accordion,
        collapsible: props.collapsible,
        destroyOnHidden: props.destroyOnHidden ?? props.destroyInactivePanel,
        activeKeys: activeKeys.value,
        onItemTrigger: onItemClick,
      });
    });

    // Panel vnode 的 children（items 形态取 item.children；children 形态取 vnode children）
    const childrenOf = (info: ReturnType<typeof buildPanelInfos>[number]): VNodeChild => {
      if (Array.isArray(props.items)) {
        return info.item.children;
      }
      const idx = panelInfos.value.findIndex((p) => p.key === info.key);
      const raw = collectChildren(slots.default?.() ?? [])[idx];
      const cProps = (raw as { props?: CollapsePanelProps } | undefined)?.props;
      // `h(Panel, null, () => content)` ⇒ children 是槽函数/槽对象
      const c = raw
        ? ((raw as { children?: unknown }).children as
            | VNodeChild
            | { default?: () => VNodeChild }
            | undefined)
        : undefined;
      if (typeof c === 'function') {
        return (c as () => VNodeChild)();
      }
      if (
        c &&
        typeof c === 'object' &&
        typeof (c as { default?: unknown }).default === 'function'
      ) {
        return (c as { default: () => VNodeChild }).default();
      }
      return (cProps?.children as VNodeChild) ?? (Array.isArray(c) ? (c as VNodeChild) : null);
    };

    return () => {
      const cls = prefixCls.value;

      const rootClassNames = [
        `${cls}-icon-placement-${mergedPlacement.value}`,
        { [`${cls}-borderless`]: !props.bordered },
        { [`${cls}-rtl`]: isRTL.value },
        { [`${cls}-ghost`]: !!props.ghost },
        { [`${cls}-large`]: mergedSize.value === 'large' },
        { [`${cls}-small`]: mergedSize.value === 'small' },
        context.className,
        props.className,
        props.rootClassName,
        mergedClassNames.value.root,
        attrs.class,
      ];

      return h(
        'div',
        {
          ...attrs,
          ref: rootRef,
          class: [cls, ...rootClassNames],
          style: [mergedStyles.value.root, attrs.style],
          role: props.accordion ? 'tablist' : undefined,
        },
        panelInfos.value.map((info) => {
          const item = info.item;
          return h(CollapsePanelInner, {
            key: info.key,
            panelKey: info.key,
            prefixCls: cls,
            header: item.label ?? item.header,
            isActive: info.isActive,
            accordion: !!props.accordion,
            openMotion: openMotion.value,
            // antd 恒传 expandIcon 函数（默认 RightOutlined 在函数内部兜底）
            expandIcon: (p: CollapsePanelProps & { isActive?: boolean }) => renderExpandIcon(p),
            children: childrenOf(info),
            onItemClick: info.onItemClick,
            destroyOnHidden: info.destroyOnHidden,
            forceRender: item.forceRender,
            showArrow: item.showArrow,
            extra: item.extra,
            headerClass: item.headerClass,
            collapsible: info.collapsible,
            className: item.className,
            style: item.style,
            id: item.id,
            classNames: mergedClassNames.value,
            styles: mergedStyles.value,
          });
        }),
      );
    };
  },
});

import { CollapsePanel } from './Panel';

/** 复合组件：`Collapse.Panel`（renderless 承 props，children 收集器读取）。 */
export const CollapseWithPanel = Object.assign(Collapse, { Panel: CollapsePanel });
export default CollapseWithPanel;
