/** A real Vue component: lifecycle, attrs and slots stay with each stable Panel. */
import { CSSMotion, type MotionHooks } from '@apollo-design/motion';
import { isEmptyVNode, mergeDomAttrs, useDevWarning } from '@apollo-design/utils';
import type { VNodeChild } from 'vue';
import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  inject,
  isVNode,
  onBeforeUnmount,
  type PropType,
  ref,
  type SlotsType,
  shallowRef,
  Text,
  useId,
  watch,
} from 'vue';
import { mergeClassNames, mergeStyles } from '../_internal/use-merge-semantic';
import { withInstall } from '../_internal/with-install';
import { collapseContextKey } from './context';
import type { CollapsePanelProps, CollapsePanelSlots, CollapsibleType } from './interface';
import { tokenEntries } from './style/token';

function emptyHeader(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.every(emptyHeader);
  if (isVNode(value) && value.type === Text && typeof value.children === 'string')
    return value.children.trim() === '';
  return isEmptyVNode(value);
}
const PanelComponent = defineComponent({
  name: 'ACollapsePanel',
  inheritAttrs: false,
  slots: Object as SlotsType<CollapsePanelSlots>,
  props: {
    header: { type: String, default: undefined },
    label: {
      type: [String, Number, Boolean, Array, Object] as PropType<VNodeChild>,
      default: undefined,
    },
    className: { type: String, default: undefined },
    prefixCls: { type: String, default: undefined },
    showArrow: { type: Boolean, default: true },
    forceRender: { type: Boolean, default: false },
    collapsible: { type: String as PropType<CollapsibleType>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    destroyOnHidden: { type: Boolean, default: undefined },
    headerClass: { type: String, default: undefined },
    id: { type: String, default: undefined },
    classNames: { type: Object as PropType<CollapsePanelProps['classNames']>, default: undefined },
    styles: { type: Object as PropType<CollapsePanelProps['styles']>, default: undefined },
  },
  emits: { itemClick: (_key: string) => true },
  setup(props, { attrs, slots, emit }) {
    const context = inject(collapseContextKey, undefined);
    const warning = useDevWarning('CollapsePanel');
    if (!context) {
      warning(false, 'CollapsePanel must be rendered inside Collapse.');
      return () => null;
    }
    const vnodeKey = getCurrentInstance()?.vnode.key;
    const initialIndex = context.allocateKey();
    const key =
      typeof vnodeKey === 'string' || typeof vnodeKey === 'number'
        ? String(vnodeKey)
        : initialIndex;
    const id = `collapse-${useId()}`;
    const triggerId = `${id}-trigger`,
      bodyId = `${id}-body`,
      titleId = `${id}-title`;
    const trigger = shallowRef<HTMLButtonElement | null>(null);
    const body = shallowRef<HTMLDivElement | null>(null);
    const prefix = computed(() => props.prefixCls || context.prefixCls.value);
    const isActive = computed(() =>
      context.accordion.value
        ? context.activeKeys.value[0] === key
        : context.activeKeys.value.includes(key),
    );
    const requestedMode = computed(
      () => props.collapsible ?? (props.disabled ? 'disabled' : context.collapsible.value),
    );
    const mode = computed(() =>
      requestedMode.value === 'icon' && !props.showArrow ? 'disabled' : requestedMode.value,
    );
    const disabled = computed(() => mode.value === 'disabled');
    const destroy = computed(() => props.destroyOnHidden ?? context.destroyOnHidden.value);
    const rendered = ref(isActive.value || props.forceRender);
    const settledHidden = ref(!isActive.value);
    let active = true;
    onBeforeUnmount(() => {
      active = false;
    });
    watch(
      isActive,
      (value) => {
        settledHidden.value = false;
        if (value) rendered.value = true;
        else {
          const current = body.value?.ownerDocument.activeElement;
          if (current && body.value?.contains(current)) {
            if (disabled.value) context.focusRoot();
            else trigger.value?.focus({ preventScroll: true });
          }
        }
      },
      { flush: 'sync' },
    );
    watch(
      () => [props.forceRender, destroy.value] as const,
      ([force, remove]) => {
        if (force) rendered.value = true;
        else if (remove && settledHidden.value) rendered.value = false;
      },
      { flush: 'sync' },
    );
    const onVisibleChanged = (visible: boolean) => {
      if (!active || visible !== isActive.value) return;
      settledHidden.value = !visible;
      if (!visible && destroy.value && !props.forceRender) rendered.value = false;
    };
    watch(
      () => props.disabled,
      (value) => warning.deprecated(value === undefined, 'disabled', 'collapsible'),
      { immediate: true },
    );
    watch(
      () => [requestedMode.value, props.showArrow] as const,
      ([value, arrow]) => {
        warning(
          value !== 'icon' || arrow,
          'collapsible=icon requires showArrow; without an arrow the disclosure is disabled.',
        );
      },
      { immediate: true },
    );
    const activate = () => {
      if (disabled.value) return;
      context.toggle(key);
      emit('itemClick', key);
    };
    const hooks = computed<MotionHooks>(() => {
      const motion = context.motion.value;
      return {
        onAppearStart: motion.onAppearStart,
        onEnterStart: motion.onEnterStart,
        onAppearActive: motion.onAppearActive,
        onEnterActive: motion.onEnterActive,
        onLeaveStart: motion.onLeaveStart,
        onLeaveActive: motion.onLeaveActive,
        onAppearEnd: motion.onAppearEnd,
        onEnterEnd: motion.onEnterEnd,
        onLeaveEnd: motion.onLeaveEnd,
      };
    });
    return () => {
      const cls = prefix.value;
      const globalClasses = context.classNames.value,
        globalStyles = context.styles.value;
      const classes = mergeClassNames(
        {
          header: globalClasses.header,
          title: globalClasses.title,
          body: globalClasses.body,
          icon: globalClasses.icon,
        },
        props.classNames,
      );
      const styles = mergeStyles(
        {
          header: globalStyles.header,
          title: globalStyles.title,
          body: globalStyles.body,
          icon: globalStyles.icon,
        },
        props.styles,
      );
      const header = slots.header ? slots.header() : (props.header ?? props.label);
      const extra = slots.extra?.();
      const title = h(
        'span',
        { id: titleId, class: [`${cls}-title`, classes.title], style: styles.title },
        [header],
      );
      const icon = props.showArrow
        ? h(
            'span',
            {
              class: [`${cls}-expand-icon`, classes.icon],
              style: styles.icon,
              'aria-hidden': true,
            },
            [
              h('span', { class: `${cls}-arrow` }, [
                context.icon({
                  key,
                  isActive: isActive.value,
                  prefixCls: cls,
                  collapsible: mode.value,
                  direction: context.direction.value,
                }),
              ]),
            ],
          )
        : null;
      const button = h(
        'button',
        {
          ref: trigger,
          id: triggerId,
          type: 'button',
          class: `${cls}-trigger`,
          disabled: disabled.value,
          'aria-expanded': isActive.value,
          'aria-disabled': disabled.value,
          'aria-controls': bodyId,
          ...(emptyHeader(header)
            ? { 'aria-label': 'Toggle panel' }
            : { 'aria-labelledby': titleId }),
          onClick: activate,
        },
        mode.value === 'icon' ? [icon] : [icon, title],
      );
      const heading = h(
        `h${context.headingLevel.value}`,
        { class: [`${cls}-heading`, { [`${cls}-heading-icon`]: mode.value === 'icon' }] },
        [button],
      );
      const aliases: Record<string, string> = {};
      if (cls !== context.prefixCls.value)
        for (const [, suffix] of tokenEntries)
          aliases[`--${cls}-${suffix}`] = `var(--${context.prefixCls.value}-${suffix})`;
      const itemAttrs = mergeDomAttrs(
        {
          id: props.id,
          class: [
            `${cls}-item`,
            {
              [`${cls}-item-active`]: isActive.value,
              [`${cls}-item-disabled`]: disabled.value,
              [`${cls}-item-small`]: context.size.value === 'small',
              [`${cls}-item-large`]: context.size.value === 'large',
              [`${cls}-item-borderless`]: !context.bordered.value,
              [`${cls}-item-ghost`]: context.ghost.value,
              [`${cls}-item-end`]: context.placement.value === 'end',
              [`${cls}-item-header`]: mode.value === 'header',
              [`${cls}-item-icon`]: mode.value === 'icon',
              [`${cls}-item-rtl`]: context.direction.value === 'rtl',
            },
            props.className,
            props.classNames?.root,
          ],
          style: [aliases, props.styles?.root],
        },
        attrs,
      );
      return h('div', itemAttrs, [
        h(
          'div',
          {
            class: [
              `${cls}-header`,
              mode.value && `${cls}-collapsible-${mode.value}`,
              props.headerClass,
              classes.header,
            ],
            style: styles.header,
            onClick: (event: MouseEvent) => {
              if (
                mode.value === undefined &&
                event.target === event.currentTarget &&
                !disabled.value
              ) {
                trigger.value?.focus({ preventScroll: true });
                activate();
              }
            },
          },
          [
            heading,
            mode.value === 'icon' ? title : null,
            !isEmptyVNode(extra) ? h('div', { class: `${cls}-extra` }, [extra]) : null,
          ],
        ),
        h(
          CSSMotion,
          {
            visible: isActive.value,
            motionName: context.motion.value.motionName,
            motionDeadline: context.motion.value.motionDeadline,
            motionAppear: false,
            hooks: hooks.value,
            supportMotion: context.supportMotion.value ? undefined : false,
            forceRender: true,
            removeOnLeave: false,
            leavedClassName: `${cls}-panel-hidden`,
            onVisibleChanged,
          },
          {
            default: ({
              className,
              style,
            }: {
              className: string;
              style: Record<string, string | number> | null;
            }) =>
              h(
                'div',
                {
                  ref: body,
                  id: bodyId,
                  role: 'region',
                  'aria-labelledby': triggerId,
                  'aria-hidden': !isActive.value,
                  inert: !isActive.value,
                  hidden: settledHidden.value,
                  class: [
                    `${cls}-panel`,
                    {
                      [`${cls}-panel-active`]: isActive.value,
                      [`${cls}-panel-inactive`]: !isActive.value,
                    },
                    className,
                  ],
                  style: style ?? undefined,
                },
                rendered.value
                  ? [
                      h('div', { class: [`${cls}-body`, classes.body], style: styles.body }, [
                        slots.default?.(),
                      ]),
                    ]
                  : [],
              ),
          },
        ),
      ]);
    };
  },
});
export const CollapsePanel = withInstall(PanelComponent);
/** Kept as an internal name; items and declared Panels now use this same Vue component. */
export const CollapsePanelInner = CollapsePanel;
export default CollapsePanel;
