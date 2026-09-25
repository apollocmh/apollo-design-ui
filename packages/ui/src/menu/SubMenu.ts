/**
 * SubMenu —— rc-menu `SubMenu/index.js`（328 行）的 Vue 版（v1）。
 *
 * 结构（rc 逐条）：li[role=none].{p}-submenu.{p}-submenu-{mode}
 *   ├─ div.{p}-submenu-title[aria-expanded/haspopup/controls]
 *   ├─ popup（horizontal/vertical）：hover/click 延迟开合，absolute 定位
 *   └─ inline：展开列表（v1 直接渲染/隐藏，CSSMotion PENDING）
 *
 * v1 裁剪：popup 的精确对齐（rc PopupTrigger 的 offset 计算）PENDING ——
 * 定位按「title 正下方」轻量实现；expandIcon 的 CSS 承担；RTL 由 `-rtl` 类。
 */
import {
  computed,
  defineComponent,
  h,
  inject,
  isVNode,
  type PropType,
  provide,
  Teleport,
  type VNode,
  type VNodeChild,
} from 'vue';

import {
  isSubPathKeyKey,
  type MenuContextData,
  menuContextKey,
  pathTrackerKey,
  useFullPath,
  useMeasure,
  useMenuContext,
} from './context';
import type { ParsedNode } from './engine/parse-items';
import { getMenuId } from './engine/use-accessibility';
import type { MenuHoverEventHandler, RenderIconType } from './interface';

const SubMenu = defineComponent({
  name: 'AMenuSubMenu',
  props: {
    eventKey: { type: String, default: undefined },
    title: { type: [String, Object, Number] as PropType<VNodeChild>, default: undefined },
    disabled: { type: Boolean, default: false },
    danger: { type: Boolean, default: false },
    icon: {
      type: [Object, String, Number, Function] as PropType<RenderIconType>,
      default: undefined,
    },
    popupClassName: { type: String, default: undefined },
    overflowDisabled: { type: Boolean, default: false },
    overflowCls: { type: String, default: undefined },
    internalPopupClose: { type: Boolean, default: false },
    /** items 模式：子节点由 Menu 解析后经 props 下发（Vue 无 cloneElement）。 */
    childrenNodes: { type: Array as PropType<ParsedNode[]>, default: () => [] },
    onMouseEnter: { type: Function as PropType<MenuHoverEventHandler>, default: undefined },
    onMouseLeave: { type: Function as PropType<MenuHoverEventHandler>, default: undefined },
    onTitleClick: {
      type: Function as PropType<(info: { key: string; domEvent: MouseEvent }) => void>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const measure = useMeasure();
    const connectedPath = useFullPath(props.eventKey);

    if (measure) {
      measure.registerPath(props.eventKey ?? '', connectedPath.value);
      return () => null;
    }

    const ctx = useMenuContext();
    // 子级 context 继承（rc InheritableContextProvider：popup 内容恒 vertical）
    const subCtx: MenuContextData = {
      ...ctx,
      mode: computed(() => (ctx.mode.value === 'horizontal' ? 'vertical' : ctx.mode.value)),
      firstLevel: false,
      overflowDisabled: false,
    };
    provide(menuContextKey, subCtx);
    // 子项 keyPath = [...connectedPath, childKey]（rc PathTrackerContext 同构）
    provide(pathTrackerKey, connectedPath);

    const mergedDisabled = computed(() => ctx.disabled || props.disabled);
    const originOpen = computed(() => ctx.openKeys.value.includes(props.eventKey ?? ''));
    const open = computed(
      () => !props.overflowDisabled && !props.internalPopupClose && originOpen.value,
    );
    const isActive = computed(
      () => ctx.activeKey.value === props.eventKey && !mergedDisabled.value,
    );
    const isSubPathKey = inject(isSubPathKeyKey, null);
    // rc：childrenSelected = selectedKeys 中某项的祖先路径含本 key
    const childrenSelected = computed(
      () => isSubPathKey?.(ctx.selectedKeys.value, props.eventKey ?? '') ?? false,
    );

    // ---------------- hover / click 开合（rc PopupTrigger 的简化） ------------
    let openTimer: ReturnType<typeof setTimeout> | null = null;
    let closeTimer: ReturnType<typeof setTimeout> | null = null;
    const clearTimers = (): void => {
      if (openTimer) clearTimeout(openTimer);
      if (closeTimer) clearTimeout(closeTimer);
      openTimer = null;
      closeTimer = null;
    };
    const onTitleMouseEnter = (e: MouseEvent): void => {
      clearTimers();
      if (!mergedDisabled.value && ctx.triggerSubMenuAction === 'hover') {
        openTimer = setTimeout(
          () => ctx.onOpenChange(props.eventKey ?? '', true),
          ctx.subMenuOpenDelay * 1000,
        );
      }
      ctx.onActive(props.eventKey ?? '');
      props.onMouseEnter?.({ key: props.eventKey ?? '', domEvent: e });
    };
    const onTitleMouseLeave = (e: MouseEvent): void => {
      clearTimers();
      if (ctx.triggerSubMenuAction === 'hover') {
        closeTimer = setTimeout(
          () => ctx.onOpenChange(props.eventKey ?? '', false),
          ctx.subMenuCloseDelay * 1000,
        );
      }
      ctx.onInactive(props.eventKey ?? '');
      props.onMouseLeave?.({ key: props.eventKey ?? '', domEvent: e });
    };
    const onInternalTitleClick = (e: MouseEvent): void => {
      if (mergedDisabled.value) return;
      props.onTitleClick?.({ key: props.eventKey ?? '', domEvent: e });
      const isInline = ctx.mode.value === 'inline';
      if (isInline || ctx.triggerSubMenuAction === 'click') {
        ctx.onOpenChange(props.eventKey ?? '', !originOpen.value);
      }
    };
    const onPopupMouseEnter = (): void => {
      clearTimers();
    };
    const onPopupMouseLeave = (): void => {
      clearTimers();
      if (ctx.triggerSubMenuAction === 'hover') {
        closeTimer = setTimeout(
          () => ctx.onOpenChange(props.eventKey ?? '', false),
          ctx.subMenuCloseDelay * 1000,
        );
      }
    };

    const renderChildren = (): VNode[] =>
      props.childrenNodes
        .map((node) => ctx.renderNode(node, connectedPath.value) as VNode)
        .filter((n) => n !== null && n !== undefined);

    return () => {
      const eventKey = props.eventKey ?? '';
      const subMenuPrefixCls = `${ctx.prefixCls}-submenu`;
      const popupId = getMenuId(ctx.menuId, `${eventKey}-popup`);
      const mode = ctx.mode.value;
      const isInline = mode === 'inline';

      const titleNode = h(
        'div',
        {
          // rc useDirectionStyle：仅 inline 模式缩进（vertical 的弹出子菜单无内联缩进）
          style:
            ctx.mode.value === 'inline'
              ? { paddingLeft: `${connectedPath.value.length * ctx.inlineIndent}px` }
              : undefined,
          class: `${subMenuPrefixCls}-title`,
          role: 'menuitem',
          'data-menu-id': props.overflowDisabled ? undefined : getMenuId(ctx.menuId, eventKey),
          tabindex: mergedDisabled.value ? undefined : -1,
          'aria-expanded': open.value,
          'aria-haspopup': true,
          'aria-controls': popupId,
          'aria-disabled': props.disabled ? true : undefined,
          onClick: onInternalTitleClick,
          onMouseenter: onTitleMouseEnter,
          onMouseleave: onTitleMouseLeave,
        },
        [
          // antd SubMenu titleNode 的三分支：折叠+根级+string ⇒ noicon 首字符；
          // title 是元素（VNode，如 overflowedIndicator 的 icon）⇒ 直接渲染；
          // 其余 string ⇒ title-content 包裹。
          ctx.inlineCollapsed && !props.icon && typeof props.title === 'string'
            ? h('div', { class: `${ctx.prefixCls}-inline-collapsed-noicon` }, props.title.charAt(0))
            : isVNode(props.title)
              ? props.title
              : h(
                  'span',
                  { class: `${ctx.prefixCls}-title-content` },
                  [props.title].filter((c) => c !== null && c !== undefined),
                ),
          h('i', { class: `${subMenuPrefixCls}-arrow` }),
        ],
      );

      // popup 走 portal（rc PopupTrigger 的 Trigger 语义）：浮层 DOM 不进 menu 的
      // ul 子树 —— DOM 契约里 popup 不可见（与 antd SSR 一致）。
      const popupNode =
        !isInline && open.value
          ? h(
              Teleport,
              { to: 'body' },
              h(
                'div',
                {
                  class: [`${subMenuPrefixCls}-popup`, props.popupClassName],
                  onMouseenter: onPopupMouseEnter,
                  onMouseleave: onPopupMouseLeave,
                  style: { position: 'absolute', visibility: 'hidden' } as Record<string, string>,
                },
                h(
                  'ul',
                  {
                    id: popupId,
                    class: [ctx.prefixCls, `${ctx.prefixCls}-sub`],
                    role: 'menu',
                    'data-menu-list': true,
                  },
                  renderChildren(),
                ),
              ),
            )
          : null;

      const inlineListNode =
        isInline && open.value
          ? h(
              'ul',
              {
                id: popupId,
                class: [ctx.prefixCls, `${ctx.prefixCls}-sub`, `${ctx.prefixCls}-inline`],
                role: 'menu',
                'data-menu-list': true,
              },
              renderChildren(),
            )
          : null;

      return h(
        'li',
        {
          ...attrs,
          role: 'none',
          class: [
            props.overflowCls,
            subMenuPrefixCls,
            `${subMenuPrefixCls}-${mode}`,
            open.value ? `${subMenuPrefixCls}-open` : undefined,
            isActive.value ? `${subMenuPrefixCls}-active` : undefined,
            childrenSelected.value ? `${subMenuPrefixCls}-selected` : undefined,
            mergedDisabled.value ? `${subMenuPrefixCls}-disabled` : undefined,
            props.danger ? `${subMenuPrefixCls}-danger` : undefined,
          ],
          style: attrs.style as Record<string, string | number> | undefined,
          onMouseenter: onTitleMouseEnter,
          onMouseleave: onTitleMouseLeave,
        },
        [titleNode, popupNode, inlineListNode].filter((n) => n !== null),
      );
    };
  },
});

export default SubMenu;
