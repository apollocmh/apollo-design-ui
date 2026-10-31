/**
 * `NoticeList` —— rc `NotificationList/index.js` 的 Vue 版。
 *
 * 一个 placement 一个列表：list 容器（hover 态 + stack 类）→ content（高度 + 顶条尺寸变量）
 * → `MotionList`（四态 diff 的逐条动效）→ 每条 notice。
 *
 * 必须逐字保留的判据：
 *   1. `expanded = stackEnabled && (listHovering || keys.length <= threshold)`
 *      —— 折叠态与展开态决定 `stackPosition` 是否传给 `useListPosition`；
 *   2. **gap 实测**：从 content 的 computed style 读 `row-gap || gap`
 *      （CSS gap 会影响堆叠偏移与总高，写死会与主题分叉）；
 *   3. 每条 notice 的 `classNames` / `styles` 要按 **9 个槽**逐槽合并
 *      （列表级 + 该条自己的），不是整体替换；
 *   4. `stackInThreshold`：`notificationIndex < threshold` 的条目才带
 *      `-notice-stack-in-threshold` 类（折叠时它们是被盖住的那几条）。
 */
import { MotionList, type MotionListSlotProps } from '@apollo-design/motion';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  toValue,
  watch,
} from 'vue';
import { clsx } from '../../_internal/clsx';
import { useListPosition } from './hooks/useListPosition';
import { useStack } from './hooks/useStack';
import type {
  NoticeClassNames,
  NoticeKey,
  NoticeListConfig,
  NoticeListProps,
  NoticeStyles,
  NotificationClassNames,
  NotificationStyles,
} from './interface';
import Notice from './Notice';
import NoticeListContent from './NoticeListContent';
import { useNotificationContext } from './NotificationProvider';

/** rc 的 9 个 notice 槽（顺序即合并顺序）。 */
type NoticeMotionEntry = { key: string; config: NoticeListConfig };

const NOTICE_SLOT_KEYS = [
  'wrapper',
  'root',
  'icon',
  'section',
  'title',
  'description',
  'actions',
  'close',
  'progress',
] as const;

export default defineComponent({
  name: 'ANotificationList',
  props: {
    configList: { type: Array as PropType<NoticeListConfig[]>, default: () => [] },
    prefixCls: { type: String, default: 'apollo-notification' },
    placement: { type: String as PropType<NoticeListProps['placement']>, required: true },
    pauseOnHover: { type: Boolean, default: undefined },
    classNames: { type: Object as PropType<NotificationClassNames>, default: undefined },
    styles: { type: Object as PropType<NotificationStyles>, default: undefined },
    components: { type: Object as PropType<NoticeListProps['components']>, default: undefined },
    stack: { type: [Boolean, Object] as PropType<NoticeListProps['stack']>, default: undefined },
    motion: { type: [Object, Function] as PropType<NoticeListProps['motion']>, default: undefined },
    className: { type: String, default: undefined },
    style: {
      type: [Object, Array, String] as PropType<import('vue').StyleValue>,
      default: undefined,
    },
    onNoticeClose: {
      type: Function as PropType<(key: string | number, source: NoticeListConfig) => void>,
      default: undefined,
    },
    onAllRemoved: {
      type: Function as PropType<(placement: NoticeListProps['placement']) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const context = useNotificationContext();

    const keys = computed(() =>
      props.configList.map((config) => ({ config, key: `${typeof config.key}:${config.key}` })),
    );

    const placementMotion = computed(() =>
      typeof props.motion === 'function' ? props.motion(props.placement) : props.motion,
    );

    const { enabled: stackEnabled, params: stackParams } = useStack(() => props.stack);
    const listHovering = ref(false);
    const expanded = computed(
      () =>
        stackEnabled.value &&
        (listHovering.value || keys.value.length <= stackParams.value.threshold),
    );
    const stackPosition = computed(() =>
      !stackEnabled.value || expanded.value ? undefined : stackParams.value,
    );

    // ---------------- gap 实测 ----------------
    const gap = ref(0);
    const contentRef = ref<HTMLElement | null>(null);
    const measureGap = (): void => {
      const node = contentRef.value;
      if (!node || typeof window === 'undefined') return;
      const { gap: cssGap, rowGap } = window.getComputedStyle(node);
      const next = Number.parseFloat(rowGap || cssGap) || 0;
      if (next !== gap.value) gap.value = next;
    };
    // ⚠️ 两个触发点都必须有：
    //   1. **挂载后一次** —— 静态列表（`configList` 一开始就非空，如 PureList）时
    //      「长度变化」永远不发生，只 watch 长度会一次都不测 ⇒ gap 恒 0
    //      （实测：4 条消息的 `--notification-y` 变成 0/40/80/120，而 antd 是
    //      0/56/112/168 —— L6 的 `types` 用例 1.7%–6.5% block-diff）；
    //   2. **长度变化后一次** —— 列表从空到有（命令式路径的首次 open）时，
    //      content 元素是这次渲染才出现的，必须等 DOM 提交后再测（`flush: 'post'`）。
    onMounted(measureGap);
    watch(
      () => props.configList.length,
      () => nextTick(measureGap),
      { flush: 'post' },
    );

    const { position, setNodeSize, totalHeight, topNoticeHeight, topNoticeWidth } = useListPosition(
      computed(() => props.configList),
      stackPosition,
      gap,
    );

    /**
     * 尺寸测量通道。
     *
     * ⭐ 两个 Vue 侧必须补的点（MN-03）：
     *   1. **按 key 稳定的函数 ref**：上游 `useCallback([setNodeSize, strKey])` 保证
     *      引用稳定；Vue 若在每次渲染都新建函数 ref，patch 会先以 `null` 调用旧 ref、
     *      再以元素调用新 ref ⇒ `sizeMap` 被「先删后测」，布局在过渡帧里短暂变成
     *      height=0，产生 y 突跳。
     *   2. **ResizeObserver 重测**：调用方用同一个 key 更新文案（尤其是变高/换行）时，
     *      稳定 ref 不会再触发测量；上游 2.0.8 同样不重测，但那会让 `--notification-y`
     *      停在旧高度。这里补一个观察器，仅在元素 border-box 变化时重测。
     */
    const elementByKey = new Map<NoticeKey, HTMLElement>();
    const elementKeys = new WeakMap<Element, NoticeKey>();
    const noticeRefs = new Map<NoticeKey, (inst: unknown) => void>();
    let resizeObserver: ResizeObserver | null = null;

    const getResizeObserver = (): ResizeObserver | null => {
      if (typeof ResizeObserver === 'undefined') return null;
      if (!resizeObserver) {
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const el = entry.target;
            if (!(el instanceof HTMLElement)) continue;
            const key = elementKeys.get(el);
            if (key !== undefined) setNodeSize(key, el);
          }
        });
      }
      return resizeObserver;
    };

    const getNoticeRef = (key: NoticeKey): ((inst: unknown) => void) => {
      let fn = noticeRefs.get(key);
      if (fn) return fn;
      fn = (inst: unknown) => {
        const el = ((inst as { $el?: HTMLElement } | null)?.$el ?? null) as HTMLElement | null;
        const prev = elementByKey.get(key);
        if (!el) {
          if (prev) {
            resizeObserver?.unobserve(prev);
            elementByKey.delete(key);
            elementKeys.delete(prev);
          }
          noticeRefs.delete(key);
          setNodeSize(key, null);
          return;
        }
        if (prev && prev !== el) {
          resizeObserver?.unobserve(prev);
          elementKeys.delete(prev);
        }
        elementByKey.set(key, el);
        elementKeys.set(el, key);
        getResizeObserver()?.observe(el);
        setNodeSize(key, el);
      };
      noticeRefs.set(key, fn);
      return fn;
    };

    onBeforeUnmount(() => {
      resizeObserver?.disconnect();
      resizeObserver = null;
      elementByKey.clear();
      noticeRefs.clear();
    });

    /**
     * rc 2.0.8：`{...placementMotion}` 整个展开进 CSSMotionList。
     * 这里用白名单显式映射，避免调用方覆盖 keys/component/onAllRemoved。
     * `motionDeadline` 的 500ms 是本仓为「样式表未加载 / transitionend 丢失」
     * 保留的兜底；真实浏览器 transitionend 先到时它不会生效（浏览器门禁会采样
     * 每次离场的实际结束路径）。
     */
    const motionProps = computed(() => {
      const motion = placementMotion.value ?? {};
      return {
        motionName: motion.motionName,
        motionAppear: motion.motionAppear ?? true,
        motionEnter: motion.motionEnter,
        motionLeave: motion.motionLeave,
        motionLeaveImmediately: motion.motionLeaveImmediately,
        motionDeadline: motion.motionDeadline ?? 500,
        removeOnLeave: motion.removeOnLeave,
        forceRender: motion.forceRender,
        leavedClassName: motion.leavedClassName,
        hooks: motion.hooks,
        supportMotion: motion.supportMotion,
      };
    });

    const getIndex = (key: NoticeKey): number | undefined => {
      const index = keys.value.findIndex((item) => item.config.key === key);
      return index === -1 ? undefined : keys.value.length - index - 1;
    };

    /** 逐槽合并：列表级 + 该条自己的（rc 的 `fillClassNames` / `fillStyles`）。 */
    const mergeSlots = (
      config: NoticeListConfig,
    ): {
      classNames: NoticeClassNames;
      styles: NoticeStyles;
    } => {
      const classNames: NoticeClassNames = {};
      const styles: NoticeStyles = {};
      for (const key of NOTICE_SLOT_KEYS) {
        classNames[key] = clsx(
          context.value.classNames?.[key],
          props.classNames?.[key],
          config.classNames?.[key],
        );
        styles[key] = Object.assign({}, props.styles?.[key], config.styles?.[key]);
      }
      return {
        classNames,
        styles,
      };
    };

    const renderItem = (
      config: NoticeListConfig,
      motionClassName: string | undefined,
      motionStyle: CSSProperties | null,
    ) => {
      const key = config.key;
      const {
        placement: _itemPlacement,
        onRemoved: _removed,
        onClose: _close,
        onMouseEnter: _mouseEnter,
        onMouseLeave: _mouseLeave,
        props: rootProps,
        ...noticeConfig
      } = config;
      const notificationIndex = getIndex(key);
      const merged = mergeSlots(config);

      return h(Notice, {
        ...noticeConfig,
        // ⚠️ 必须按 key 复用同一个函数 ref（MN-03）：每次渲染新建会让 Vue 在 patch
        //    时先 null 后 element，把 sizeMap 清掉再测，布局瞬态归零。
        ref: getNoticeRef(key),
        prefixCls: props.prefixCls,
        rootProps,
        onMouseenter: config.onMouseEnter,
        onMouseleave: config.onMouseLeave,
        className: clsx(toValue(config.className), motionClassName),
        closable: toValue(config.closable),
        style: { ...(motionStyle ?? {}), ...(config.style ?? {}) },
        classNames: merged.classNames,
        styles: merged.styles,
        components: { ...(props.components ?? {}), ...(config.components ?? {}) },
        active: props.configList.some(
          (item) => item.key === config.key && item.times === config.times,
        ),
        hovering: stackEnabled.value && listHovering.value,
        pauseOnHover: config.pauseOnHover ?? props.pauseOnHover,
        offset: position.value.get(key),
        notificationIndex,
        stackInThreshold:
          stackEnabled.value && notificationIndex !== undefined
            ? notificationIndex < stackParams.value.threshold
            : undefined,
        onClose: () => {
          props.onNoticeClose?.(config.key, config);
        },
      });
    };

    return () => {
      const listPrefixCls = `${props.prefixCls}-list`;
      return h(
        'div',
        {
          class: [
            props.prefixCls,
            listPrefixCls,
            `${props.prefixCls}-${props.placement}`,
            context.value.classNames?.list,
            props.className,
            props.classNames?.list,
            stackEnabled.value ? `${props.prefixCls}-stack` : undefined,
            expanded.value ? `${props.prefixCls}-stack-expanded` : undefined,
            listHovering.value ? `${listPrefixCls}-hovered` : undefined,
          ],
          onMouseenter: () => {
            listHovering.value = true;
          },
          onMouseleave: () => {
            listHovering.value = false;
          },
          style: [props.styles?.list, props.style],
        },
        [
          h(
            NoticeListContent,
            {
              ref: (inst: unknown) => {
                contentRef.value = ((inst as { $el?: HTMLElement } | null)?.$el ??
                  null) as HTMLElement | null;
              },
              listPrefixCls,
              height: totalHeight.value,
              topNoticeHeight: topNoticeHeight.value,
              topNoticeWidth: topNoticeWidth.value,
              className: clsx(context.value.classNames?.listContent, props.classNames?.listContent),
              style: props.styles?.listContent,
            },
            {
              default: () =>
                h(
                  MotionList<NoticeMotionEntry>,
                  {
                    component: false,
                    // ⚠️ 必须把 `{ key, config }` **整个对象**交给 MotionList：
                    //    MotionList 的 removed entity 会保留这份 eventProps，离场中的
                    //    notice 才能继续渲染。只传 key 字符串时，slot 回查实时的
                    //    `keys` 找不到已删除项 ⇒ 返回 null ⇒ 通知立即卸载、
                    //    没有 -fade-leave-*（2026-10-21 阶段 0 实测）。
                    keys: keys.value,
                    // rc 2.0.8：`{...placementMotion}`（白名单见 motionProps 注释）
                    ...motionProps.value,
                    onAllRemoved: () => {
                      if (props.placement) props.onAllRemoved?.(props.placement);
                    },
                  },
                  {
                    default: (slotProps: MotionListSlotProps<NoticeMotionEntry>) =>
                      renderItem(slotProps.config, slotProps.className, slotProps.style),
                  },
                ),
            },
          ),
        ],
      );
    };
  },
});
