/**
 * FloatButtonGroup —— antd `FloatButtonGroup.tsx`（344 行）的 Vue 版。
 *
 * ## 文件头判据
 *
 * 1. **menu 模式**：trigger ∈ click/hover；列表经 CSSMotion（`${listCls}-motion`）。
 * 2. **click 模式外部点击**：document **capture 级**监听（rc 逐字）。
 * 3. **individual**：shape === 'circle' ⇒ Flex；square ⇒ Space.Compact。
 * 4. **双 context**：listContext（item 系语义）+ triggerContext（trigger 系 + individual）。
 * 5. **open**：受控/非受控二选一（useControlledValue）；disabled 抑制开合。
 */

import { CloseOutlined, FileTextOutlined } from '@apollo-design/icons';
import { CSSMotion } from '@apollo-design/motion';
import { useZIndex } from '@apollo-design/portal';
import { useControlledValue, useDevWarning } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  onMounted,
  onScopeDispose,
  type PropType,
  ref,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useConfigContext, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import Flex from '../flex';
import { SpaceCompact } from '../space';
import { provideFloatButtonGroup } from './context';
import FloatButtonComponent, { floatButtonPrefixCls } from './FloatButton';
import type {
  FloatButtonGroupPlacement,
  FloatButtonGroupProps,
  FloatButtonGroupSemanticClassNames,
  FloatButtonGroupSemanticStyles,
  FloatButtonShape,
  FloatButtonType,
} from './interface';

const FloatButtonGroupComponent = defineComponent({
  name: 'AFloatButtonGroup',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    type: { type: String as PropType<FloatButtonType>, default: undefined },
    shape: { type: String as PropType<FloatButtonShape>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    'aria-label': { type: String, default: undefined },
    href: { type: String, default: undefined },
    target: { type: String, default: undefined },
    htmlType: { type: String as PropType<FloatButtonGroupProps['htmlType']>, default: undefined },
    tooltip: {
      type: [Object, String] as PropType<FloatButtonGroupProps['tooltip']>,
      default: undefined,
    },
    badge: { type: Object as PropType<FloatButtonGroupProps['badge']>, default: undefined },
    trigger: { type: String as PropType<FloatButtonGroupProps['trigger']>, default: undefined },
    open: { type: Boolean, default: undefined },
    onOpenChange: {
      type: Function as PropType<FloatButtonGroupProps['onOpenChange']>,
      default: undefined,
    },
    onClick: { type: Function as PropType<FloatButtonGroupProps['onClick']>, default: undefined },
    placement: {
      type: String as PropType<FloatButtonGroupProps['placement']>,
      default: undefined,
    },
    classNames: {
      type: [Object, Function] as PropType<FloatButtonGroupProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<FloatButtonGroupProps['styles']>,
      default: undefined,
    },
  },
  /**
   * ⚠️ 只声明 `update:open`（供 `v-model:open`）；onOpenChange 是 props 形态回调
   * （PITFALLS 35）—— 两者同时发出（C11）。
   */
  emits: ['update:open'],
  setup(props, { slots, attrs, expose, emit }) {
    const devWarning = useDevWarning('FloatButton.Group');
    const { getPrefixCls } = useConfigContext();
    const direction = useDirection();
    const contextDisabled = useDisabled();

    const prefixCls = computed(() => getPrefixCls(floatButtonPrefixCls, props.prefixCls));
    const groupPrefixCls = computed(() => `${prefixCls.value}-group`);

    const mergedType = computed<FloatButtonType>(() => props.type ?? 'default');
    const mergedShape = computed<FloatButtonShape>(() => props.shape ?? 'circle');
    const mergedDisabled = computed(() => props.disabled ?? contextDisabled.value);

    const isMenuMode = computed(() => props.trigger === 'click' || props.trigger === 'hover');
    const hoverTrigger = computed(() => props.trigger === 'hover');
    const clickTrigger = computed(() => props.trigger === 'click');

    // ---- placement ----
    const mergedPlacement = computed<FloatButtonGroupPlacement>(() => {
      const p = props.placement;
      return p === 'top' || p === 'left' || p === 'right' || p === 'bottom' ? p : 'top';
    });

    // ---- Warning（antd 逐字）----
    watchEffect(() => {
      devWarning(
        props.open === undefined || Boolean(props.trigger),
        '`open` need to be used together with `trigger`',
      );
    });

    // ---- open（受控/非受控）----
    const [mergedOpen, setOpen] = useControlledValue<boolean>({
      defaultValue: false,
      getValue: () => props.open,
      onChange: (next) => props.onOpenChange?.(next),
    });

    const triggerOpen = (next: boolean): void => {
      if (mergedDisabled.value) return;
      if (mergedOpen.value !== next) {
        setOpen(next);
        props.onOpenChange?.(next);
        emit('update:open', next);
      }
    };

    // ---- zIndex ----
    // 根 `style` 是 Vue 原生 attrs（zIndex 也从它读）
    const zIndex = useZIndex('FloatButton', (): number | undefined =>
      typeof attrs.style === 'object' && attrs.style !== null
        ? ((attrs.style as CSSProperties).zIndex as number | undefined)
        : undefined,
    );

    // ---- click 模式外部点击（document capture，rc 逐字）----
    const rootRef = ref<HTMLDivElement | null>(null);
    const onDocClick = (e: MouseEvent): void => {
      if (rootRef.value?.contains(e.target as Node)) return;
      triggerOpen(false);
    };
    onMounted(() => {
      if (!clickTrigger.value) return;
      document.addEventListener('click', onDocClick, { capture: true });
      onScopeDispose(() => document.removeEventListener('click', onDocClick, { capture: true }));
    });
    // trigger 卸载（menu → 非 menu）时摘监听
    onScopeDispose(() => {
      if (clickTrigger.value) {
        document.removeEventListener('click', onDocClick, { capture: true });
      }
    });

    // ---- 语义合并 ----
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      FloatButtonGroupProps,
      FloatButtonGroupSemanticClassNames,
      FloatButtonGroupSemanticStyles
    >([() => props.classNames], [() => props.styles], props);

    // ---- contexts（antd 逐字：list 与 trigger 两套）----
    const listContext = computed(() => ({
      shape: mergedShape.value,
      individual: mergedShape.value === 'circle',
      classNames: {
        root: mergedClassNames.value.item,
        icon: mergedClassNames.value.itemIcon,
        content: mergedClassNames.value.itemContent,
      },
      styles: {
        root: mergedStyles.value.item,
        icon: mergedStyles.value.itemIcon,
        content: mergedStyles.value.itemContent,
      },
    }));
    provideFloatButtonGroup(listContext);

    expose({
      get nativeElement() {
        return rootRef.value;
      },
    });

    // ---- 触发按钮事件 ----
    const onTriggerClick = (e: MouseEvent): void => {
      if (clickTrigger.value) {
        triggerOpen(!mergedOpen.value);
      }
      props.onClick?.(e);
    };

    return () => {
      const gCls = groupPrefixCls.value;
      const listCls = `${gCls}-list`;
      const vertical = mergedPlacement.value === 'top' || mergedPlacement.value === 'bottom';

      const listSharedClass = (motionClassName?: string) =>
        [listCls, mergedClassNames.value.list, motionClassName].filter(Boolean).join(' ');

      const renderList = (motionClassName?: string): ReturnType<typeof h> => {
        // Flex / SpaceCompact 都已迁移到「根 class 走原生 attrs」⇒ 这里必须用 `class`
        const shared = {
          class: listSharedClass(motionClassName),
          style: mergedStyles.value.list,
        };
        if (mergedShape.value === 'circle') {
          return h(Flex, { vertical: vertical, ...shared }, { default: () => slots.default?.() });
        }
        return h(SpaceCompact, { vertical: vertical, ...shared } as never, {
          default: () => slots.default?.(),
        });
      };

      // 触发按钮 icon：open ⇒ closeIcon（用户 #closeIcon 插槽 / 默认 CloseOutlined）
      const triggerIcon = computed<VNodeChild>(() => {
        if (mergedOpen.value) {
          const fromSlot = slots.closeIcon?.();
          if (fromSlot !== undefined) return fromSlot;
          return h(CloseOutlined);
        }
        const fromSlot = slots.icon?.();
        if (fromSlot !== undefined) return fromSlot;
        return h(FileTextOutlined);
      });

      // ⚠️ antd 的 triggerContext（trigger 系语义 + individual=true）依赖
      //    render 期 Provider —— Vue 的 provide 必须在 setup 期，v1 用 listContext
      //    承担 trigger 的 item 系语义（差异登记 README §3）
      const triggerNode = isMenuMode.value
        ? h(
            FloatButtonComponent,
            {
              type: mergedType.value,
              shape: mergedShape.value,
              icon: triggerIcon.value as never,
              'aria-label': props['aria-label'],
              className: `${gCls}-trigger`,
              onClick: onTriggerClick,
              disabled: props.disabled,
              href: props.href,
              target: props.target,
              htmlType: props.htmlType,
              tooltip: props.tooltip,
              badge: props.badge ?? undefined,
              ...attrs,
            } as never,
            { default: () => null },
          )
        : null;

      const rootClass = [
        gCls,
        direction.value === 'rtl' ? `${gCls}-rtl` : '',
        mergedShape.value === 'circle' ? `${gCls}-individual` : '',
        isMenuMode.value ? `${gCls}-${mergedPlacement.value}` : '',
        isMenuMode.value ? `${gCls}-menu-mode` : '',
        // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
        attrs.class,
      ]
        .filter(Boolean)
        .join(' ');

      return h(
        'div',
        {
          ref: rootRef,
          class: rootClass,
          style: {
            zIndex: zIndex.value,
            // 根 style 是 Vue 原生 attrs（位置与原先的 props.style 一致）
            ...(typeof attrs.style === 'object' ? attrs.style : {}),
            ...(mergedStyles.value.root ?? {}),
          },
          onMouseenter: () => {
            if (hoverTrigger.value) triggerOpen(true);
          },
          onMouseleave: () => {
            if (hoverTrigger.value) triggerOpen(false);
          },
          ...attrs,
        },
        [
          isMenuMode.value
            ? h(
                CSSMotion,
                { visible: mergedOpen.value, motionName: `${listCls}-motion` },
                {
                  default: ({ className: motionClassName }: { className?: string }) =>
                    renderList(motionClassName),
                },
              )
            : renderList(),
          // trigger 按钮（menu 模式）：triggerContext 经 useFloatButtonGroup 的
          // 注入不可在渲染期 provide —— 直接以 props 覆盖语义（等价传递）
          triggerNode,
        ],
      );
    };
  },
});

export default FloatButtonGroupComponent;
