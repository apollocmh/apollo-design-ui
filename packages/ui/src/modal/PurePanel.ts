/**
 * `PurePanel` —— antd `components/modal/PurePanel.tsx` 的 Vue 版。
 *
 * 用途：`_InternalPanelDoNotUseOrYouWillBeFired` —— **不 portal、不 mask、不动效**，
 * 直接把面板渲染在当前位置。它是 L4/L6 的取证入口（PITFALLS 177）。
 *
 * 判据：
 *   1. 根类 = `{p} {p}-pure-panel [className] [{p}-confirm] [{p}-confirm-{type}]`
 *      —— ⚠️ `{p}`（面板类）必须在，否则静态 CSS 的变量声明块挂不上（D69）；
 *   2. `type` 有值 ⇒ 渲染 `ConfirmContent`，`closable` 默认 **false**、`title`/`footer` 置空；
 *      否则 `closable` 默认 **true**、正常渲染 title/footer；
 *   3. 包一层 `withPureRenderTheme`（antd 用来把主题变量限定在纯面板内）——
 *      本仓的变量声明块已经在 `.apollo-modal` 上，无需额外包裹（平台差异）。
 */
import { defineComponent, h, type PropType, type VNodeChild } from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { ConfirmContent } from './ConfirmDialog';
import Panel from './engine/Panel';
import type { ModalProps, ModalSemanticType, ModalSemanticTypeInput, ModalType } from './interface';
import ModalPanel, { renderCloseIcon } from './ModalPanel';

export default defineComponent({
  name: 'AModalPurePanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    closable: {
      type: [Boolean, Object] as unknown as PropType<ModalProps['closable']>,
      default: undefined,
    },
    closeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    type: { type: String as PropType<ModalType>, default: undefined },
    title: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    footer: {
      type: [String, Number, Object, Array, Function] as unknown as PropType<ModalProps['footer']>,
      default: undefined,
    },
    content: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    classNames: {
      type: [Object, Function] as unknown as PropType<ModalSemanticTypeInput['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as unknown as PropType<ModalSemanticTypeInput['styles']>,
      default: undefined,
    },
  },
  setup(props, { attrs, slots }) {
    const config = useComponentConfig<{
      className?: string;
      style?: Record<string, unknown>;
      classNames?: ModalSemanticType['classNames'];
      styles?: ModalSemanticType['styles'];
    }>('modal');

    const semantic = useMergeSemantic<
      Record<string, unknown>,
      NonNullable<ModalSemanticType['classNames']>,
      NonNullable<ModalSemanticType['styles']>
    >(
      [
        () => config.classNames,
        // 见下方说明：函数形态由 `resolveSemantic` 在运行时处理，类型面收敛成对象形态
        () => props.classNames as unknown as NonNullable<ModalSemanticType['classNames']>,
      ],
      [
        () => config.styles,
        // `useSemanticRootStyle(style)` 的等价物：把裸 style 当成 `root` 槽
        () =>
          props.style
            ? ({ root: props.style } as unknown as NonNullable<ModalSemanticType['styles']>)
            : undefined,
        () => props.styles as unknown as NonNullable<ModalSemanticType['styles']>,
      ],
      props as unknown as Record<string, unknown>,
    );

    return () => {
      const prefixCls = props.prefixCls || config.getPrefixCls('modal');
      const rootPrefixCls = config.getPrefixCls();
      const confirmPrefixCls = `${prefixCls}-confirm`;
      const cn = semantic.classNames.value as ModalSemanticType['classNames'];
      const st = semantic.styles.value as ModalSemanticType['styles'];

      const className = [
        // ⚠️ **不含** `prefixCls` 本身 —— `Panel` 的根类已经会加它（上游同样只在
        //    PurePanel 这里加 `-pure-panel` 与 confirm 段）
        `${prefixCls}-pure-panel`,
        props.type ? confirmPrefixCls : undefined,
        props.type ? `${confirmPrefixCls}-${props.type}` : undefined,
        props.className,
        config.className,
        cn?.root,
      ]
        .filter(Boolean)
        .join(' ');

      const children = props.type
        ? h(ConfirmContent, {
            ...(attrs as Record<string, unknown>),
            prefixCls,
            confirmPrefixCls,
            rootPrefixCls,
            type: props.type,
            title: props.title,
            // ⚠️ 上游给 ConfirmContent 的 `content` 是 **children**（`content={children}`），
            //    **不是** `content` prop —— `PurePanel` 的 type 分支里 `content` prop 被忽略。
            //    L6 抓到：传 `content` 会多出一行正文（confirm 用例差 0.68–1.43%）
            content: slots.default?.(),
            closable: props.closable ?? false,
          } as never)
        : slots.default?.();

      const additionalProps = props.type
        ? { closable: props.closable ?? false, title: undefined, footer: undefined }
        : {
            closable: props.closable ?? true,
            title: props.title,
            footer:
              props.footer !== null
                ? h(ModalPanel, {
                    ...(props as unknown as Record<string, unknown>),
                    footer: props.footer,
                  } as never)
                : undefined,
          };

      return h(
        Panel,
        {
          ...(attrs as Record<string, unknown>),
          prefixCls,
          className,
          style: st?.root,
          classNames: cn,
          styles: st,
          closeIcon: renderCloseIcon(prefixCls, props.closeIcon),
          ...additionalProps,
        } as never,
        { default: () => children },
      );
    };
  },
});
