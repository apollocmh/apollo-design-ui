/**
 * FloatButton —— antd `FloatButton.tsx`（228 行）的 Vue 版：**Button 的薄壳**。
 *
 * ## 文件头判据
 *
 * 1. **prefixCls = 'float-btn'**（antd 逐字，非 'float-button'）——root 类
 *    `.apollo-float-btn`，Button 自身的 `.apollo-btn` 类共存（产物逐字）。
 * 2. **icon-only 判据**：`!isReactRenderable(mergedContent)` —— 内容为空/纯 null
 *    ⇒ icon-only（默认 FileTextOutlined 图标兜底）。
 * 3. **badge**：`'badge' in props` 判据（Vue：`props.badge !== undefined`）；
 *    omit title/children/status/text 防透传；类 `-badge` / `-badge-dot`。
 * 4. **tooltip**：convertToTooltipProps（string ⇒ {title}；对象 ⇒ 逐字 props）。
 * 5. **GroupContext**：shape/individual/语义注入（item 或 trigger 两套）。
 * 6. C8-R2：icon/content → `#icon`/`#content` 插槽；description(deprecated) 并入
 *    `#content`；badge/tooltip 是数据 prop（豁免）。
 */

import { FileTextOutlined } from '@apollo-design/icons';
import { useZIndex } from '@apollo-design/portal';
import { isPlainObject, useDevWarning } from '@apollo-design/utils';
import {
  type ComponentPublicInstance,
  type CSSProperties,
  computed,
  defineComponent,
  h,
  type PropType,
  ref,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import Badge from '../badge';
import Button from '../button/Button.vue';
import { useConfigContext, useDirection } from '../config-provider/context';
import Tooltip from '../tooltip/Tooltip';
import {
  type FloatButtonGroupContextValue,
  provideFloatButtonGroup,
  useFloatButtonGroup,
} from './context';
import type {
  FloatButtonBadgeProps,
  FloatButtonProps,
  FloatButtonShape,
  FloatButtonType,
} from './interface';

/** antd 逐字：`export const floatButtonPrefixCls = 'float-btn'`。 */
export const floatButtonPrefixCls = 'float-btn';

const isRenderableContent = (content: unknown): boolean =>
  content !== undefined && content !== null && content !== false && content !== '';

const FloatButtonComponent = defineComponent({
  name: 'AFloatButton',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    type: { type: String as PropType<FloatButtonType>, default: undefined },
    shape: { type: String as PropType<FloatButtonShape>, default: undefined },
    description: { type: String, default: undefined },
    href: { type: String, default: undefined },
    target: { type: String, default: undefined },
    htmlType: { type: String as PropType<FloatButtonProps['htmlType']>, default: undefined },
    'aria-label': { type: String, default: undefined },
    disabled: { type: Boolean, default: undefined },
    tooltip: {
      type: [Object, String] as PropType<FloatButtonProps['tooltip']>,
      default: undefined,
    },
    badge: { type: Object as PropType<FloatButtonBadgeProps>, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<FloatButtonProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<FloatButtonProps['styles']>,
      default: undefined,
    },
  },
  emits: [],
  setup(props, { slots, attrs, expose }) {
    const devWarning = useDevWarning('FloatButton');
    const { getPrefixCls } = useConfigContext();
    const direction = useDirection();
    const groupContext = useFloatButtonGroup();

    const prefixCls = computed(() => getPrefixCls(floatButtonPrefixCls, props.prefixCls));

    const mergedShape = computed<FloatButtonShape>(
      () => groupContext?.shape ?? props.shape ?? 'circle',
    );
    const mergedIndividual = computed(() => groupContext?.individual ?? true);

    const mergedType = computed<FloatButtonType>(() => props.type ?? 'default');

    // ---- Warning（antd 逐字）----
    watchEffect(() => {
      const contentRenderable = isRenderableContent(slots.content?.() ?? props.description);
      devWarning(
        !(mergedShape.value === 'circle' && contentRenderable),
        'supported only when `shape` is `square`. Due to narrow space for text, short sentence is recommended.',
      );
      devWarning.deprecated(props.description === undefined, 'description', 'content');
    });

    // ---- 语义合并：内置基线（icon/content 类名）+ context + 用户 ----
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      FloatButtonProps,
      FloatButtonProps['classNames'] extends infer C ? (C extends object ? C : never) : never,
      FloatButtonProps['styles'] extends infer S ? (S extends object ? S : never) : never
    >(
      [
        () => ({ icon: `${prefixCls.value}-icon`, content: `${prefixCls.value}-content` }),
        () => groupContext?.classNames ?? {},
        () => props.classNames ?? {},
      ],
      [() => groupContext?.styles ?? {}, () => props.styles ?? {}],
      props,
    );

    // ---- zIndex ----
    // 根 `style` 是 Vue 原生 attrs（zIndex 也从它读，与 antd 同判）
    const zIndex = useZIndex('FloatButton', (): number | undefined =>
      typeof attrs.style === 'object' && attrs.style !== null
        ? ((attrs.style as CSSProperties).zIndex as number | undefined)
        : undefined,
    );

    const mergedStyle = computed<Record<string, unknown>>(() => ({
      ...((typeof attrs.style === 'object' && attrs.style !== null ? attrs.style : {}) as Record<
        string,
        unknown
      >),
      zIndex: zIndex.value,
    }));

    // ---- badge ----
    const badgeNode = computed<VNodeChild>(() => {
      if (props.badge === undefined) return null;
      const badgeProps = { ...props.badge } as Record<string, unknown>;
      delete badgeProps.title;
      delete badgeProps.children;
      delete badgeProps.status;
      delete badgeProps.text;
      return h(Badge, {
        ...(badgeProps as Record<string, unknown>),
        class: [
          (badgeProps.className as string) ?? '',
          `${prefixCls.value}-badge`,
          (props.badge as { dot?: boolean }).dot ? `${prefixCls.value}-badge-dot` : '',
        ]
          .filter(Boolean)
          .join(' '),
      });
    });

    // ---- 内容 / 图标 ----
    const mergedContent = computed<VNodeChild>(() => {
      const fromSlot = slots.content?.() as VNodeChild;
      if (fromSlot !== undefined) return fromSlot;
      return props.description ?? null;
    });

    const mergedIcon = computed<VNodeChild>(() => {
      const fromSlot = slots.icon?.() as VNodeChild;
      if (fromSlot !== undefined) return fromSlot;
      if (!isRenderableContent(mergedContent.value)) return h(FileTextOutlined);
      return null;
    });

    const iconOnly = computed(() => !isRenderableContent(mergedContent.value));

    // nativeElement 中继：Button 的 expose 面（focus 目标元素）
    const buttonRef = ref<ComponentPublicInstance | null>(null);
    expose({
      get nativeElement() {
        return (
          (buttonRef.value as unknown as { nativeElement?: HTMLElement | null } | null)
            ?.nativeElement ?? null
        );
      },
    });

    // ---- tooltip 包装 ----
    const tooltipProps = computed(() => {
      const t = props.tooltip;
      if (t === undefined || t === null) return undefined;
      if (isPlainObject(t)) return t;
      return { title: t };
    });

    return () => {
      const buttonNode = h(
        Button,
        {
          ref: buttonRef,
          ...attrs,
          type: mergedType.value,
          shape: mergedShape.value,
          size: 'large',
          icon: mergedIcon.value as never,
          href: props.href,
          target: props.target,
          htmlType: props.htmlType,
          disabled: props.disabled,
          'aria-label': props['aria-label'],
          class: [
            prefixCls.value,
            // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
            attrs.class,
            `${prefixCls.value}-${mergedType.value}`,
            `${prefixCls.value}-${mergedShape.value}`,
            direction.value === 'rtl' ? `${prefixCls.value}-rtl` : '',
            mergedIndividual.value ? `${prefixCls.value}-individual` : '',
            iconOnly.value ? `${prefixCls.value}-icon-only` : '',
          ]
            .filter(Boolean)
            .join(' '),
          style: mergedStyle.value,
          classNames: mergedClassNames.value as never,
          styles: mergedStyles.value as never,
        } as never,
        {
          // ⚠️ 空 content/badge 不进 children（否则多出空节点 ⇒ L4 子节点数错位）
          default: () =>
            [mergedContent.value, badgeNode.value].filter(
              (n) => n !== null && n !== undefined && n !== false,
            ),
        },
      );

      if (tooltipProps.value) {
        return h(Tooltip, tooltipProps.value as never, { default: () => buttonNode });
      }
      return buttonNode;
    };
  },
});

export type { FloatButtonGroupContextValue };
// `provideFloatButtonGroup` 供 Group 内部使用（re-export 便于单文件闭环）
export { provideFloatButtonGroup };
export default FloatButtonComponent;
