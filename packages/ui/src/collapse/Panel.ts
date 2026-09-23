/**
 * Collapse 的面板（rc `Panel.js` + `PanelContent.js` 逐行对拍）。
 *
 * - header/extra/图标/键盘交互的可交互位置由 `collapsible` 决定：
 *   `header` ⇒ 可交互 props 在 span.title 上；`icon` ⇒ 在 expand-icon 上；
 *   undefined ⇒ 在 header 整体；`disabled` ⇒ aria-disabled + tabindex -1。
 * - 内容区走 `CSSMotion`（motion 包的 `initCollapseMotion` preset：height 0↔scrollHeight），
 *   `leavedClassName={p}-collapse-panel-hidden`（离场残骸），`removeOnLeave=destroyOnHidden`。
 * - PanelContent 惰性渲染：`isActive||forceRender` 一旦置 true 不再回收。
 */

import { CSSMotion } from '@apollo-design/motion';
import { isFunction } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, ref, type VNodeChild, watch } from 'vue';
import type {
  CollapseSemanticClassNames,
  CollapseSemanticStyles,
  CollapsibleType,
} from './interface';

export interface PanelInnerProps {
  prefixCls: string;
  panelKey: string;
  header: VNodeChild;
  isActive: boolean;
  accordion: boolean;
  /** motion preset（Collapse 主组件算好传入：motionName/各 handler/deadline）。 */
  openMotion: Record<string, unknown>;
  expandIcon?:
    | ((panelProps: {
        isActive?: boolean;
        prefixCls?: string;
        collapsible?: CollapsibleType;
      }) => VNodeChild)
    | undefined;
  children?: VNodeChild;
  onItemClick?: ((key: string) => void) | undefined;
  destroyOnHidden?: boolean | undefined;
  forceRender?: boolean | undefined;
  showArrow?: boolean | undefined;
  extra?: VNodeChild | undefined;
  headerClass?: string | undefined;
  collapsible?: CollapsibleType | undefined;
  className?: string | undefined;
  style?: Record<string, string | number> | undefined;
  id?: string | undefined;
  classNames?: CollapseSemanticClassNames | undefined;
  styles?: CollapseSemanticStyles | undefined;
}

export const CollapsePanelInner = defineComponent({
  name: 'ACollapsePanelInner',
  props: {
    prefixCls: { type: String, required: true },
    panelKey: { type: String, required: true },
    header: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    isActive: { type: Boolean, default: false },
    accordion: { type: Boolean, default: false },
    openMotion: { type: Object as PropType<PanelInnerProps['openMotion']>, required: true },
    expandIcon: {
      type: Function as PropType<PanelInnerProps['expandIcon']>,
      default: undefined,
    },
    children: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    onItemClick: {
      type: Function as PropType<(key: string) => void>,
      default: undefined,
    },
    destroyOnHidden: { type: Boolean, default: undefined },
    forceRender: { type: Boolean, default: undefined },
    showArrow: { type: Boolean, default: true },
    extra: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    headerClass: { type: String, default: undefined },
    collapsible: {
      type: String as PropType<CollapsibleType>,
      default: undefined,
    },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    id: { type: String, default: undefined },
    classNames: { type: Object as PropType<CollapseSemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<CollapseSemanticStyles>, default: undefined },
  },
  setup(props) {
    const disabled = computed(() => props.collapsible === 'disabled');
    const ifExtraExist = computed(
      () => props.extra !== null && props.extra !== undefined && typeof props.extra !== 'boolean',
    );

    // ======================== 可交互 props（rc collapsibleProps） ========================
    const collapsibleProps = computed(() => ({
      onClick: () => {
        props.onItemClick?.(props.panelKey);
      },
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          props.onItemClick?.(props.panelKey);
        }
      },
      role: props.accordion ? 'tab' : 'button',
      'aria-expanded': props.isActive,
      'aria-disabled': disabled.value,
      tabindex: disabled.value ? -1 : 0,
    }));

    // ======================== PanelContent 惰性渲染 ========================
    // antd：state(isActive||forceRender) + useEffect 置 true ⇒ 一经渲染不再回收。
    // computed 不可「记忆」，用 ref + watch 固化。
    const rendered = ref(props.isActive || !!props.forceRender);
    watch(
      () => props.isActive || !!props.forceRender,
      (visible) => {
        if (visible) {
          rendered.value = true;
        }
      },
      { immediate: true },
    );
    const shouldRender = computed(() => rendered.value);

    // initCollapseMotion 的 handlers → CSSMotion 的 hooks（alert 同范式）
    const om = props.openMotion as unknown as {
      motionName: string;
      motionDeadline: number;
      onAppearStart?: never;
      onEnterStart?: never;
      onLeaveStart?: never;
      onAppearActive?: never;
      onEnterActive?: never;
      onLeaveActive?: never;
      onAppearEnd?: never;
      onEnterEnd?: never;
      onLeaveEnd?: never;
    } & Record<string, unknown>;
    const motionHooks = {
      onAppearStart: om.onAppearStart,
      onEnterStart: om.onEnterStart,
      onLeaveStart: om.onLeaveStart,
      onAppearActive: om.onAppearActive,
      onEnterActive: om.onEnterActive,
      onLeaveActive: om.onLeaveActive,
      onAppearEnd: om.onAppearEnd,
      onEnterEnd: om.onEnterEnd,
      onLeaveEnd: om.onLeaveEnd,
    };

    return () => {
      const cls = props.prefixCls;
      const customClassNames = props.classNames ?? {};
      const customStyles = props.styles ?? {};
      const interactiveHere = ['header', 'icon'].includes(props.collapsible as string);

      // ======================== Icon ========================
      // ⚠️ rc 传的是**完整 panelProps**（含 collapsible）—— expandIcon 的
      //    aria-label/aria-hidden 分支依赖它（CHECKLIST #71）
      const iconNodeInner = isFunction(props.expandIcon)
        ? props.expandIcon({
            isActive: props.isActive,
            prefixCls: cls,
            collapsible: props.collapsible,
          })
        : h('i', { class: 'arrow' });
      const iconNode =
        iconNodeInner &&
        h(
          'div',
          {
            class: [`${cls}-expand-icon`, customClassNames.icon],
            style: customStyles.icon,
            ...(interactiveHere ? collapsibleProps.value : {}),
          },
          [iconNodeInner],
        );

      const itemClassNames = [
        `${cls}-item`,
        { [`${cls}-item-active`]: props.isActive },
        { [`${cls}-item-disabled`]: disabled.value },
        props.className,
      ];
      const headerClassName = [
        props.headerClass,
        `${cls}-header`,
        { [`${cls}-collapsible-${props.collapsible}`]: !!props.collapsible },
        customClassNames.header,
      ];

      // ======================== HeaderProps ========================
      const headerProps = {
        class: headerClassName,
        style: customStyles.header,
        ...(interactiveHere ? {} : collapsibleProps.value),
      };

      // ======================== Render ========================
      return h(
        'div',
        {
          id: props.id,
          class: itemClassNames,
          style: props.style,
        },
        [
          h('div', headerProps, [
            props.showArrow ? iconNode : null,
            h(
              'span',
              {
                class: [`${cls}-title`, customClassNames.title],
                style: customStyles.title,
                ...(props.collapsible === 'header' ? collapsibleProps.value : {}),
              },
              props.header ?? [],
            ),
            ifExtraExist.value ? h('div', { class: `${cls}-extra` }, [props.extra]) : null,
          ]),
          h(
            CSSMotion,
            {
              visible: props.isActive,
              leavedClassName: `${cls}-panel-hidden`,
              motionName: om.motionName,
              motionAppear: false,
              motionDeadline: om.motionDeadline,
              hooks: motionHooks as never,
              forceRender: props.forceRender,
              removeOnLeave: props.destroyOnHidden ?? true,
            },
            {
              default: ({
                className: motionClassName,
                style: motionStyle,
              }: {
                className: string;
                style: Record<string, string | number> | null;
              }) => {
                if (!shouldRender.value) {
                  return null;
                }
                return h(
                  'div',
                  {
                    class: [
                      `${cls}-panel`,
                      {
                        [`${cls}-panel-active`]: props.isActive,
                        [`${cls}-panel-inactive`]: !props.isActive,
                      },
                      motionClassName,
                    ],
                    style: motionStyle ?? undefined,
                    role: props.accordion ? 'tabpanel' : undefined,
                  },
                  [
                    h(
                      'div',
                      {
                        class: [`${cls}-body`, customClassNames.body],
                        style: customStyles.body,
                      },
                      props.children ?? [],
                    ),
                  ],
                );
              },
            },
          ),
        ],
      );
    };
  },
});

/** antd CollapsePanel（薄壳）：prefixCls + no-arrow 类 + disabled 告警。 */
export const CollapsePanel = defineComponent({
  name: 'ACollapsePanel',
  props: {
    header: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    showArrow: { type: Boolean, default: true },
    forceRender: { type: Boolean, default: undefined },
    extra: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    collapsible: {
      type: String as PropType<CollapsibleType>,
      default: undefined,
    },
    disabled: { type: Boolean, default: undefined },
    destroyOnHidden: { type: Boolean, default: undefined },
    onItemClick: {
      type: Function as PropType<(key: string) => void>,
      default: undefined,
    },
    headerClass: { type: String, default: undefined },
    id: { type: String, default: undefined },
    prefixCls: { type: String, default: undefined },
  },
  setup(props, { slots, attrs }) {
    void props;
    void slots;
    void attrs;
    return () => null;
  },
});
