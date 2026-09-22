/**
 * Alert —— 警告提示。
 *
 * 契约来源：antd 6.6.4 的 `es/alert/Alert.js`（判据逐条对齐，G1 分析 §2）。
 *
 * ── 为什么是 render 函数 ─────────────────────────────────────────────────────
 *
 * CSSMotion 的函数插槽要求根 div 在 slot 内部产出（motion 类与 data-show 落根
 * 元素），且 IconNode / CloseIconNode 是带判据的子结构（back-top/badge 同范式）。
 *
 * ── 八条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 * 1. **isClosable 判据链**：closable 对象 ⇒ true；`closeText` 真值 ⇒ true；
 *    boolean ⇒ 原值；**`closeIcon !== false && isNonNullable(closeIcon)` ⇒ true**
 *    （`0` / `''` 也算可关）；否则 `!!contextClosable`。
 * 2. **关闭即收起动画**：`closed=true` → CSSMotion visible=false →
 *    `-motion-leave`（onLeaveStart 回填 maxHeight = 当前高度）→
 *    `-motion-leave-active`（收拢到 0）→ leave 结束卸载 → afterClose。
 * 3. **mergedCloseIcon 优先级**：closable.closeIcon → closeText →
 *    closeIcon（!== undefined）→ contextClosable.closeIcon → contextCloseIcon；
 *    CloseIconNode 内 `true || undefined` ⇒ 默认 CloseOutlined 图标。
 * 4. **type 未传**：`banner ? 'warning' : 'info'`；banner 且未传 showIcon ⇒
 *    **恒显图标**。
 * 5. **role**：根 div 先写 `role="alert"`，再 spread pickAttrs({aria,data}) ⇒
 *    用户 role 覆盖默认；data-show = `!closed`。
 * 6. **可渲染判据 = isRenderable**：`title={0} / description={0} / action={0}`
 *    都渲染（测试钉住）；description 可渲染 ⇒ `-with-description`。
 * 7. **closable 对象的 aria/data**：`pickAttrs(closableObj, {aria,data})` 落在
 *    关闭 button 上（不是根元素）。
 * 8. **类名顺序**：prefixCls → `-type` → `-variant` → {with-description, no-icon,
 *    banner, rtl} → contextClassName → className → rootClassName → 语义化 root
 *    （motion 类再拼在最外层 clsx）。
 */

import {
  CheckCircleFilled,
  CloseCircleFilled,
  CloseOutlined,
  ExclamationCircleFilled,
  InfoCircleFilled,
} from '@apollo-design/icons';
import { CSSMotion, type MotionHooks } from '@apollo-design/motion';
import { isPlainObject, isRenderable, pickAttrs, useDevWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  type PropType,
  ref,
  shallowRef,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import type {
  AlertClosable,
  AlertConfig,
  AlertProps,
  AlertSemanticClassNames,
  AlertSemanticStyles,
  AlertType,
  AlertVariant,
} from './interface';

export default defineComponent({
  name: 'AAlert',
  inheritAttrs: false,
  props: {
    type: { type: String as PropType<AlertType>, default: undefined },
    variant: { type: String as PropType<AlertVariant>, default: undefined },
    closable: {
      type: [Boolean, Object] as PropType<AlertProps['closable']>,
      default: undefined,
    },
    closeText: { type: null as unknown as PropType<AlertProps['closeText']>, default: undefined },
    title: { type: null as unknown as PropType<AlertProps['title']>, default: undefined },
    message: { type: null as unknown as PropType<AlertProps['message']>, default: undefined },
    description: {
      type: null as unknown as PropType<AlertProps['description']>,
      default: undefined,
    },
    onClose: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    afterClose: { type: Function as PropType<() => void>, default: undefined },
    showIcon: { type: Boolean, default: undefined },
    // ⚠️ role 不声明为 prop：antd 把 role 留在 rest 里经 pickAttrs 覆盖默认
    //    `role="alert"` —— Vue 侧同理，role 落 attrs 再被挑出（不是漏了）。
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    banner: { type: Boolean, default: undefined },
    icon: { type: null as unknown as PropType<AlertProps['icon']>, default: undefined },
    closeIcon: { type: null as unknown as PropType<AlertProps['closeIcon']>, default: undefined },
    action: { type: null as unknown as PropType<AlertProps['action']>, default: undefined },
    id: { type: String, default: undefined },
    onMouseenter: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    onMouseleave: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    onClick: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    // 语义化输入是「对象 | 函数」两态 —— Vue prop 校验需显式放行 Function
    classNames: {
      type: [Object, Function] as PropType<AlertProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<AlertProps['styles']>,
      default: undefined,
    },
  },
  setup(props, { attrs, expose, slots }) {
    const context = useComponentConfig<AlertConfig>('alert');
    const { getPrefixCls } = context;
    const contextVariant = context.variant;
    const contextClosable = context.closable;
    const contextCloseIcon = context.closeIcon;
    const contextClassName = context.className;
    const contextStyle = context.style;
    const contextClassNames = context.classNames;
    const contextStyles = context.styles;
    const direction = useDirection();

    const rootRef = shallowRef<HTMLDivElement | null>(null);
    expose({
      get nativeElement() {
        return rootRef.value;
      },
    });

    // ============================= Warning ==============================
    const warning = useDevWarning('Alert');
    warning.deprecated(props.closeText === undefined, 'closeText', 'closable.closeIcon');
    warning.deprecated(props.message === undefined, 'message', 'title');

    const prefixCls = computed(() => getPrefixCls('alert', props.prefixCls));

    // ============================= Closed ===============================
    const closed = ref(false);

    const handleClose = (e: MouseEvent) => {
      closed.value = true;
      const closableOnClose = isPlainObject(props.closable)
        ? (props.closable as AlertClosable).onClose
        : undefined;
      (closableOnClose ?? props.onClose)?.(e);
    };

    // ============================== Type ================================
    const type = computed<AlertType>(() => {
      if (props.type !== undefined) {
        return props.type;
      }
      // banner mode defaults to 'warning'
      return props.banner ? 'warning' : 'info';
    });

    const mergedVariant = computed<AlertVariant>(
      () => props.variant ?? contextVariant ?? 'outlined',
    );

    // ============================ Closable ==============================
    const isClosable = computed<boolean>(() => {
      if (isPlainObject(props.closable)) {
        return true;
      }
      if (props.closeText) {
        return true;
      }
      if (typeof props.closable === 'boolean') {
        return props.closable;
      }
      // should be true when closeIcon is 0 or ''
      if (props.closeIcon !== false && props.closeIcon != null) {
        return true;
      }
      return !!contextClosable;
    });

    // banner mode defaults to Icon
    const isShowIcon = computed<boolean | undefined>(() =>
      props.banner && props.showIcon === undefined ? true : props.showIcon,
    );

    // =========== Merged Props for Semantic ===========
    // antd：{...props, prefixCls, variant, type, showIcon, closable} ——
    // 普通对象 + watchEffect 同步（skeleton 同条）。
    const semanticProps: AlertProps = { ...props };
    watchEffect(() => {
      Object.assign(semanticProps, props);
      semanticProps.variant = mergedVariant.value;
      semanticProps.type = type.value;
      semanticProps.showIcon = isShowIcon.value;
      semanticProps.closable = isClosable.value;
    });

    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      AlertProps,
      AlertSemanticClassNames,
      AlertSemanticStyles
    >(
      [() => contextClassNames, () => props.classNames],
      [
        () => contextStyles as AlertSemanticStyles | undefined,
        () => semanticRootStyle(contextStyle as AlertProps['style']),
        () => props.styles,
        () => semanticRootStyle(props.style),
      ],
      semanticProps,
    );

    // ========================== Close Icon ==============================
    const mergedCloseIcon = computed<VNodeChild>(() => {
      if (isPlainObject(props.closable) && (props.closable as AlertClosable).closeIcon) {
        return (props.closable as AlertClosable).closeIcon;
      }
      if (props.closeText) {
        return props.closeText;
      }
      if (props.closeIcon !== undefined) {
        return props.closeIcon;
      }
      if (isPlainObject(contextClosable) && contextClosable.closeIcon) {
        return contextClosable.closeIcon;
      }
      return contextCloseIcon;
    });

    const mergedAriaProps = computed<Record<string, unknown>>(() => {
      const merged = props.closable ?? contextClosable;
      if (isPlainObject(merged)) {
        return pickAttrs(merged, { data: true, aria: true });
      }
      return {};
    });

    // ============================== Render ==============================
    return () => {
      const cls = prefixCls.value;
      // ReactNode prop 的 Vue 双通道（button/icon 同约定）：**prop 优先，插槽兜底**。
      const mergedTitle: VNodeChild = props.title ?? props.message ?? slots.title?.();
      const descriptionValue: VNodeChild = props.description ?? slots.description?.();
      const actionValue: VNodeChild = props.action ?? slots.action?.();

      const alertCls = [
        cls,
        `${cls}-${type.value}`,
        `${cls}-${mergedVariant.value}`,
        {
          [`${cls}-with-description`]: isRenderable(props.description),
          [`${cls}-no-icon`]: !isShowIcon.value,
          [`${cls}-banner`]: !!props.banner,
          [`${cls}-rtl`]: direction.value === 'rtl',
        },
        contextClassName,
        props.className,
        props.rootClassName,
        mergedClassNames.value.root,
      ];

      const restProps = pickAttrs(attrs, { aria: true, data: true });

      // 图标：icon 覆盖默认类型图标；ConfigProvider 四类图标可换（antd 的 iconMapFilled）
      const iconMapFilled: Record<AlertType, VNodeChild> = {
        success: context.successIcon ?? h(CheckCircleFilled),
        info: context.infoIcon ?? h(InfoCircleFilled),
        error: context.errorIcon ?? h(CloseCircleFilled),
        warning: context.warningIcon ?? h(ExclamationCircleFilled),
      };

      const hooks: MotionHooks = {
        onLeaveStart: (element) => ({
          maxHeight: (element as HTMLElement | null)?.offsetHeight ?? 0,
        }),
        onLeaveEnd: () => {
          const closableAfterClose = isPlainObject(props.closable)
            ? (props.closable as AlertClosable).afterClose
            : undefined;
          (closableAfterClose ?? props.afterClose)?.();
        },
      };

      return h(
        CSSMotion,
        {
          visible: !closed.value,
          motionName: `${cls}-motion`,
          motionAppear: false,
          motionEnter: false,
          hooks,
        },
        {
          default: ({
            className: motionClassName,
            style: motionStyle,
          }: {
            className: string;
            style: Record<string, string | number> | null;
          }) =>
            h(
              'div',
              {
                id: props.id,
                ref: rootRef,
                'data-show': !closed.value,
                class: [alertCls, motionClassName],
                style: {
                  ...(mergedStyles.value.root as Record<string, string | number | undefined>),
                  ...(motionStyle ?? {}),
                },
                onMouseenter: props.onMouseenter,
                onMouseleave: props.onMouseleave,
                onClick: props.onClick,
                role: 'alert',
                ...restProps,
              },
              [
                isShowIcon.value
                  ? h(
                      'span',
                      {
                        class: [`${cls}-icon`, mergedClassNames.value.icon],
                        style: mergedStyles.value.icon as never,
                      },
                      [props.icon ?? iconMapFilled[type.value]],
                    )
                  : null,
                h(
                  'div',
                  {
                    class: [`${cls}-section`, mergedClassNames.value.section],
                    style: mergedStyles.value.section as never,
                  },
                  [
                    isRenderable(mergedTitle)
                      ? h(
                          'div',
                          {
                            class: [`${cls}-title`, mergedClassNames.value.title],
                            style: mergedStyles.value.title as never,
                          },
                          [mergedTitle as VNodeChild],
                        )
                      : null,
                    isRenderable(descriptionValue)
                      ? h(
                          'div',
                          {
                            class: [`${cls}-description`, mergedClassNames.value.description],
                            style: mergedStyles.value.description as never,
                          },
                          [descriptionValue as VNodeChild],
                        )
                      : null,
                  ],
                ),
                isRenderable(actionValue)
                  ? h(
                      'div',
                      {
                        class: [`${cls}-actions`, mergedClassNames.value.actions],
                        style: mergedStyles.value.actions as never,
                      },
                      [actionValue as VNodeChild],
                    )
                  : null,
                isClosable.value
                  ? h(
                      'button',
                      {
                        type: 'button',
                        onClick: handleClose,
                        class: [`${cls}-close-icon`, mergedClassNames.value.close],
                        tabIndex: 0,
                        style: mergedStyles.value.close as never,
                        ...mergedAriaProps.value,
                      },
                      // antd：closeIcon === true || undefined ⇒ 默认 CloseOutlined
                      mergedCloseIcon.value === true || mergedCloseIcon.value === undefined
                        ? h(CloseOutlined)
                        : [mergedCloseIcon.value as VNodeChild],
                    )
                  : null,
              ],
            ),
        },
      );
    };
  },
});
