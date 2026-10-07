/**
 * PurePanel —— antd `components/popover/PurePanel.tsx` 的 Vue 版。
 * `_InternalPanelDoNotUseOrYouWillBeFired` 静态面板（demo / 文档用）。
 *
 * 与 tooltip PurePanel 的结构差异（antd 源逐条对齐）：root 额外带
 * `{p}-placement-{placement}` 类；内容是 Overlay（title + content 两块）。
 */
import { defineComponent, h, type PropType, type VNodeChild } from 'vue';
import { clsx } from '../_internal/clsx';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import type { PopoverSemanticType } from './interface';

type StyleLike = Record<string, string | number>;

function stripClassStyle(attrs: Record<string, unknown>): Record<string, unknown> {
  const rest = { ...attrs };
  delete rest.class;
  delete rest.style;
  return rest;
}

/** antd `isReactRenderable`（`0` 合法）。 */
function isRenderable(value: unknown): boolean {
  return value !== null && value !== undefined && typeof value !== 'boolean';
}

const PurePanel = defineComponent({
  name: 'APopoverPurePanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    color: { type: String, default: undefined },
    placement: { type: String, default: 'top' },
    // ⚠️ C8-R2：title / content 收窄为 String（富内容走同名 slot，slot 读取见下）；
    //    公开 `Popover` 本体已同构（title/content 双通道），此处仅收窄 PurePanel 的 prop 类型。
    title: { type: String, default: undefined },
    content: { type: String, default: undefined },
    classNames: {
      type: Object as PropType<PopoverSemanticType['classNames']>,
      default: undefined,
    },
    styles: { type: Object as PropType<PopoverSemanticType['styles']>, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const { getPrefixCls } = useComponentConfig('popover');
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      Record<string, never>,
      NonNullable<PopoverSemanticType['classNames']>,
      NonNullable<PopoverSemanticType['styles']>
    >([() => props.classNames], [() => props.styles], {} as Record<string, never>);

    return () => {
      const prefixCls = props.prefixCls ?? getPrefixCls('popover');
      const placement = props.placement ?? 'top';
      // props 优先，插槽兜底（与 Popover 主体的 title/content 双通道同构）
      const title = props.title !== undefined ? props.title : slots.title?.();
      const content = props.content !== undefined ? props.content : slots.content?.();

      return h(
        'div',
        {
          class: clsx(
            typeof attrs.class === 'string' ? attrs.class : undefined,
            prefixCls,
            `${prefixCls}-pure`,
            `${prefixCls}-placement-${placement}`,
            mergedClassNames.value.root,
          ),
          style: {
            ...(mergedStyles.value.root ?? {}),
            ...((attrs.style as StyleLike | undefined) ?? {}),
          },
          ...stripClassStyle(attrs),
        },
        [
          h('div', { class: `${prefixCls}-arrow` }),
          h(
            'div',
            {
              class: clsx(`${prefixCls}-container`, mergedClassNames.value.container),
              // antd 事实契约：PurePanel 的 style 经 {...props} 摊进 rc Popup ⇒
              // 在 root 与 container **双落点**（覆盖 styles.container）。L6 钉住。
              style: {
                ...(mergedStyles.value.container as StyleLike | undefined),
                ...((attrs.style as StyleLike | undefined) ?? {}),
              },
              role: 'tooltip',
            },
            [
              isRenderable(title)
                ? h(
                    'div',
                    {
                      class: clsx(`${prefixCls}-title`, mergedClassNames.value.title),
                      style: mergedStyles.value.title as StyleLike | undefined,
                    },
                    [title as VNodeChild].filter((c) => c !== null && c !== undefined),
                  )
                : null,
              isRenderable(content)
                ? h(
                    'div',
                    {
                      class: clsx(`${prefixCls}-content`, mergedClassNames.value.content),
                      style: mergedStyles.value.content as StyleLike | undefined,
                    },
                    [content as VNodeChild].filter((c) => c !== null && c !== undefined),
                  )
                : null,
            ],
          ),
        ],
      );
    };
  },
});

export default PurePanel;
