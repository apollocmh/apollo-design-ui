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
import { MotionList } from '@apollo-design/motion';
import { computed, defineComponent, h, type PropType, ref, watch } from 'vue';

import type {
  NoticeListConfig,
  NoticeListProps,
  NoticeStyles,
  NotificationClassNames,
  NotificationStyles,
} from '../interface';
import { useListPosition } from './hooks/useListPosition';
import { useStack } from './hooks/useStack';
import Notice from './Notice';
import NoticeListContent from './NoticeListContent';
import { useNotificationContext } from './NotificationProvider';
import { clsx } from './util';

/** rc 的 9 个 notice 槽（顺序即合并顺序）。 */
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
    style: { type: Object as PropType<NoticeListProps['style']>, default: undefined },
    onNoticeClose: {
      type: Function as PropType<(key: string | number) => void>,
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
      props.configList.map((config) => ({ config, key: String(config.key) })),
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
    watch(() => props.configList.length > 0, measureGap, { flush: 'post' });

    const { position, setNodeSize, totalHeight, topNoticeHeight, topNoticeWidth } = useListPosition(
      computed(() => props.configList),
      stackPosition,
      gap,
    );

    const getIndex = (key: string): number | undefined => {
      const index = keys.value.findIndex((item) => item.key === key);
      return index === -1 ? undefined : keys.value.length - index - 1;
    };

    /** 逐槽合并：列表级 + 该条自己的（rc 的 `fillClassNames` / `fillStyles`）。 */
    const mergeSlots = (
      config: NoticeListConfig,
    ): {
      classNames: NotificationClassNames;
      styles: NoticeStyles;
    } => {
      const classNames: Record<string, string> = {};
      const styles: Record<string, Record<string, unknown>> = {};
      for (const key of NOTICE_SLOT_KEYS) {
        classNames[key] = clsx(
          (props.classNames as Record<string, unknown> | undefined)?.[key],
          (config.classNames as Record<string, unknown> | undefined)?.[key],
        );
        styles[key] = Object.assign(
          {},
          (props.styles as Record<string, unknown> | undefined)?.[key] ?? {},
          (config.styles as Record<string, unknown> | undefined)?.[key] ?? {},
        );
      }
      return {
        classNames: classNames as NotificationClassNames,
        styles: styles as unknown as NoticeStyles,
      };
    };

    const renderItem = (
      config: NoticeListConfig,
      motionClassName: string | undefined,
      motionStyle: Record<string, unknown> | null,
    ) => {
      const key = String(config.key);
      const { placement: _itemPlacement, ...noticeConfig } = config;
      const notificationIndex = getIndex(key);
      const merged = mergeSlots(config);
      const contextNotice = (context.value.classNames as { notice?: string } | undefined)?.notice;

      return h(Notice, {
        ...(noticeConfig as Record<string, unknown>),
        ref: (inst: unknown) => {
          const el = (inst as { $el?: HTMLElement } | null)?.$el ?? null;
          setNodeSize(key, el as { offsetWidth: number; offsetHeight: number } | null);
        },
        prefixCls: props.prefixCls,
        className: clsx(contextNotice, config.className, motionClassName),
        style: { ...(motionStyle ?? {}), ...(config.style ?? {}) },
        classNames: merged.classNames,
        styles: merged.styles,
        components: { ...(props.components ?? {}), ...(config.components ?? {}) },
        hovering: stackEnabled.value && listHovering.value,
        pauseOnHover: config.pauseOnHover ?? props.pauseOnHover,
        offset: position.value.get(key),
        notificationIndex,
        stackInThreshold:
          stackEnabled.value && notificationIndex !== undefined
            ? notificationIndex < stackParams.value.threshold
            : undefined,
        onClose: () => {
          config.onClose?.();
          props.onNoticeClose?.(config.key);
        },
      } as never);
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
          style: { ...(props.styles?.list ?? {}), ...(props.style ?? {}) },
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
              className: props.classNames?.listContent,
              style: props.styles?.listContent,
            },
            {
              default: () =>
                h(
                  MotionList,
                  {
                    component: false,
                    keys: keys.value.map((item) => item.key),
                    motionAppear: true,
                    motionName: placementMotion.value?.motionName,
                    onAllRemoved: () => {
                      if (props.placement) props.onAllRemoved?.(props.placement);
                    },
                  },
                  {
                    default: (slotProps: Record<string, unknown>) => {
                      const itemKey = String(slotProps.itemKey);
                      const item = keys.value.find((entry) => entry.key === itemKey);
                      if (!item) return null;
                      return renderItem(
                        item.config,
                        slotProps.className as string | undefined,
                        slotProps.style as Record<string, unknown> | null,
                      );
                    },
                  },
                ),
            },
          ),
        ],
      );
    };
  },
});
