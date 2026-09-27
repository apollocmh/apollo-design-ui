/**
 * `Notice` —— rc `Notification.js` 的 Vue 版（**单条**通知）。
 *
 * 结构（逐字对齐上游，L4 的目标）：
 * ```html
 * <div class="{p}-notice [{p}-notice-closable] [{p}-notice-stack-in-threshold]"
 *      role="alert" data-notification-index="N"
 *      style="--notification-index:N; --notification-y:…px">
 *   <div class="{p}-notice-wrapper">            <!-- 有 icon 才包这层 -->
 *     <div class="{p}-notice-icon">{icon}</div>
 *     <div class="{p}-notice-title">{title}</div>  <!-- 有 description ⇒ 换成 -section 包两个 -->
 *   </div>
 *   <div class="{p}-notice-actions">…</div>     <!-- 可选 -->
 *   <button class="{p}-notice-close" aria-label="Close">×</button>  <!-- closable=false ⇒ 不渲染 -->
 *   <progress class="{p}-notice-progress" max="100">                <!-- showProgress && duration>0 -->
 * </div>
 * ```
 *
 * ⚠️ 三处「看着多余但必须保留」的上游行为：
 *   1. `offset` / `notificationIndex` 用 **ref 记住上一次的值**（`?? ` 回退）——
 *      删除动画期间新值可能是 `undefined`，直接取会让位置跳一下；
 *   2. `--notification-index` 恒写（即使 undefined ⇒ 0），`--notification-y` **只在有值时写**；
 *   3. 鼠标事件里 `pauseOnHover && !forcedHovering` 才恢复计时 —— 列表 hover（堆叠折叠）
 *      期间强制暂停，此时单条离开不该恢复。
 */
import { computed, defineComponent, h, type PropType, ref, type VNodeChild, watch } from 'vue';
import { useClosable } from './hooks/useClosable';
import { useNoticeTimer } from './hooks/useNoticeTimer';
import type { NoticeClassNames, NoticeProps, NoticeStyles } from './interface';
import DefaultProgress from './Progress';
import { clsx } from './util';

/** rc 的默认时长（message 会覆盖成 3）。 */
const DEFAULT_DURATION = 4.5;

export default defineComponent({
  name: 'ANotification',
  props: {
    prefixCls: { type: String, required: true },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<NoticeStyles['root']>, default: undefined },
    classNames: { type: Object as PropType<NoticeClassNames>, default: undefined },
    styles: { type: Object as PropType<NoticeStyles>, default: undefined },
    components: { type: Object as PropType<NoticeProps['components']>, default: undefined },
    // 内部：由父组件程序化传递/命令式 API 驱动，无模板上下文，VNode prop 合法
    // ⚠️ C8-R2：`title` / `description` / `icon` / `actions` 是内部 VNode prop（由 message /
    //    notification 的 PurePanel 把同名 slot / String prop 归一后透传），不暴露为公开 slot。
    title: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    description: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    icon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    actions: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    role: { type: String, default: undefined },
    closable: {
      type: [Boolean, Object] as PropType<NoticeProps['closable']>,
      default: undefined,
    },
    offset: { type: Number, default: undefined },
    notificationIndex: { type: Number, default: undefined },
    stackInThreshold: { type: Boolean, default: undefined },
    /**
     * rc 的 `times`（同 key 被 open 过几次）。
     *
     * ⚠️ 这里**声明但不用**：不声明的话它会落进 `$attrs` 并被自动继承到根元素上，
     * 产物里会多出一个 `times="0"` 属性（antd 的产物没有）。
     * 声明即「消费掉」，与 rc 把 `times` 留在 props 里不渲染是同一种效果。
     */
    times: { type: Number, default: undefined },
    rootProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    duration: {
      type: [Number, Boolean] as PropType<number | false | null>,
      default: DEFAULT_DURATION,
    },
    showProgress: { type: Boolean, default: undefined },
    hovering: { type: Boolean, default: undefined },
    pauseOnHover: { type: Boolean, default: true },
    onClick: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    onMouseEnter: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    onMouseLeave: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    onClose: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props) {
    const noticePrefixCls = computed(() => `${props.prefixCls}-notice`);
    const percent = ref(0);
    const hovering = ref(false);

    const { closable, config: closableConfig, ariaProps } = useClosable(() => props.closable);

    const onInternalClose = (): void => {
      closableConfig.value.onClose?.();
      props.onClose?.();
    };

    const { onResume, onPause } = useNoticeTimer(
      () => props.duration,
      onInternalClose,
      (v) => {
        percent.value = v;
      },
    );

    const validPercent = computed(() => 100 - Math.min(Math.max(percent.value * 100, 0), 100));

    // 暂停/恢复：forcedHovering（列表 hover）优先
    const forcedHovering = computed(() => props.hovering === true);
    watch(
      () => [forcedHovering.value, hovering.value, props.pauseOnHover] as const,
      () => {
        if (!props.pauseOnHover) return;
        if (forcedHovering.value) {
          onPause();
        } else if (!hovering.value) {
          onResume();
        }
      },
      { immediate: true },
    );

    const onInternalMouseEnter = (e: MouseEvent): void => {
      hovering.value = true;
      if (props.pauseOnHover) onPause();
      props.onMouseEnter?.(e);
    };
    const onInternalMouseLeave = (e: MouseEvent): void => {
      hovering.value = false;
      if (props.pauseOnHover && !forcedHovering.value) onResume();
      props.onMouseLeave?.(e);
    };
    const onInternalCloseClick = (e: MouseEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      onInternalClose();
    };

    // ⚠️ 记住上一次的位置：删除动画期间新值可能 undefined（见文件头 1）
    const offsetRef = ref(props.offset);
    const indexRef = ref(props.notificationIndex);

    return () => {
      if (props.offset !== undefined) offsetRef.value = props.offset;
      if (props.notificationIndex !== undefined) indexRef.value = props.notificationIndex;
      const mergedOffset = props.offset ?? offsetRef.value;
      const mergedIndex = props.notificationIndex ?? indexRef.value ?? 0;

      const cls = props.classNames ?? {};
      const sty = props.styles ?? {};

      // ---------------- Content ----------------
      const titleNode =
        props.title !== undefined && props.title !== null
          ? h(
              'div',
              { class: [`${noticePrefixCls.value}-title`, cls.title], style: sty.title },
              props.title as never,
            )
          : null;
      const descNode =
        props.description !== undefined && props.description !== null
          ? h(
              'div',
              {
                class: [`${noticePrefixCls.value}-description`, cls.description],
                style: sty.description,
              },
              props.description as never,
            )
          : null;
      let contentNode: VNodeChild = null;
      if (titleNode && descNode) {
        contentNode = h(
          'div',
          { class: [`${noticePrefixCls.value}-section`, cls.section], style: sty.section },
          [titleNode, descNode],
        );
      } else {
        contentNode = titleNode ?? descNode;
      }
      if (props.icon !== undefined && props.icon !== null) {
        contentNode = h(
          'div',
          { class: [`${noticePrefixCls.value}-wrapper`, cls.wrapper], style: sty.wrapper },
          [
            h(
              'div',
              { class: [`${noticePrefixCls.value}-icon`, cls.icon], style: sty.icon },
              props.icon as never,
            ),
            contentNode,
          ],
        );
      }

      const actionsNode = props.actions
        ? h(
            'div',
            { class: [`${noticePrefixCls.value}-actions`, cls.actions], style: sty.actions },
            props.actions as never,
          )
        : null;

      const Progress = props.components?.progress ?? DefaultProgress;

      const mergedStyle: Record<string, unknown> = {
        '--notification-index': mergedIndex,
        ...(sty.root ?? {}),
        ...(props.style ?? {}),
      };
      if (mergedOffset !== undefined) {
        mergedStyle['--notification-y'] = `${mergedOffset}px`;
      }

      return h(
        'div',
        {
          ...(props.rootProps ?? {}),
          role: props.role ?? (props.rootProps?.role as string | undefined) ?? 'alert',
          'data-notification-index': mergedIndex,
          class: [
            noticePrefixCls.value,
            props.className,
            cls.root,
            closable.value ? `${noticePrefixCls.value}-closable` : undefined,
            props.stackInThreshold ? `${noticePrefixCls.value}-stack-in-threshold` : undefined,
          ],
          style: mergedStyle,
          onClick: props.onClick,
          onMouseenter: onInternalMouseEnter,
          onMouseleave: onInternalMouseLeave,
        },
        [
          contentNode,
          actionsNode,
          closable.value
            ? h(
                'button',
                {
                  type: 'button',
                  class: [`${noticePrefixCls.value}-close`, cls.close],
                  'aria-label': 'Close',
                  ...ariaProps.value,
                  style: sty.close,
                  onClick: onInternalCloseClick,
                },
                closableConfig.value.closeIcon as never,
              )
            : null,
          props.showProgress && typeof props.duration === 'number' && props.duration > 0
            ? h(Progress, {
                className: clsx(`${noticePrefixCls.value}-progress`, cls.progress),
                percent: validPercent.value,
                style: sty.progress,
              })
            : null,
        ].filter((c) => c !== null && c !== undefined),
      );
    };
  },
});
