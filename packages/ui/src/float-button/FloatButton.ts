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
import { isPlainObject, mergeDomAttrs, useDevWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  normalizeStyle,
  type PropType,
  ref,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import Badge from '../badge';
import Button from '../button/Button.vue';
import type {
  ButtonProps,
  ButtonRef,
  ButtonSemanticClassNames,
  ButtonSemanticStyles,
} from '../button/interface';
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
      ButtonSemanticClassNames,
      ButtonSemanticStyles
    >(
      [
        () => ({ icon: `${prefixCls.value}-icon`, content: `${prefixCls.value}-content` }),
        () => groupContext?.classNames ?? {},
        () => props.classNames ?? {},
      ],
      [() => groupContext?.styles ?? {}, () => props.styles ?? {}],
      props,
    );

    // Read the same current Vue style sequence consumed by the real Button root.
    const explicitZIndex = (): string | number | undefined => {
      const style = normalizeStyle([mergedStyles.value.root, attrs.style]);
      if (!style || typeof style === 'string') return undefined;
      let value: string | number | undefined;
      for (const [name, current] of Object.entries(style))
        if (name === 'zIndex' || name === 'z-index') value = current;
      return value;
    };
    const zIndex = useZIndex('FloatButton', () => {
      const value = explicitZIndex();
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value)))
        return Number(value);
      return undefined;
    });

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
    const buttonRef = ref<ButtonRef | null>(null);
    expose({
      get nativeElement() {
        return buttonRef.value?.nativeElement ?? null;
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
      const buttonProps: ButtonProps = {
        type: mergedType.value,
        shape: mergedShape.value === 'circle' ? 'circle' : 'default',
        size: 'large',
        icon: mergedIcon.value,
        href: props.href,
        htmlType: props.htmlType,
        disabled: props.disabled,
        classNames: { root: mergedClassNames.value.root, icon: mergedClassNames.value.icon },
        styles: { root: mergedStyles.value.root, icon: mergedStyles.value.icon },
      };
      const fallback =
        explicitZIndex() === undefined && zIndex.value !== undefined
          ? { zIndex: zIndex.value }
          : undefined;
      const buttonNode = h(
        Button,
        mergeDomAttrs({ style: fallback }, attrs, {
          ...buttonProps,
          ref: buttonRef,
          target: props.target,
          'aria-label': props['aria-label'],
          class: [
            prefixCls.value,
            `${prefixCls.value}-${mergedType.value}`,
            `${prefixCls.value}-${mergedShape.value}`,
            direction.value === 'rtl' ? `${prefixCls.value}-rtl` : '',
            mergedIndividual.value ? `${prefixCls.value}-individual` : '',
            iconOnly.value ? `${prefixCls.value}-icon-only` : '',
          ],
        }),
        {
          // ⚠️ 空 content/badge 不进 children（否则多出空节点 ⇒ L4 子节点数错位）
          default: () =>
            [
              isRenderableContent(mergedContent.value)
                ? h(
                    'span',
                    {
                      class: mergedClassNames.value.content,
                      style: mergedStyles.value.content,
                    },
                    [h(NodeRenderer, { node: mergedContent.value })],
                  )
                : null,
              badgeNode.value,
            ].filter((n) => n !== null && n !== undefined && n !== false),
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
