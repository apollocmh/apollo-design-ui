/**
 * `Notifications` —— rc `Notifications.js` 的 Vue 版（**容器层**）。
 *
 * 职责：持有 `configList`，按 `placement` 分组，portal 到 `container`，
 * 每个 placement 渲染一个 `NoticeList`（可经 `renderNotifications` 包一层）。
 *
 * 必须逐字保留的判据：
 *   1. `open` 同 key ⇒ **原地替换**并把 `times` 累加（rc 的「更新同一条」语义，
 *      它是 `update` demo 与 `message` 的 `open({key})` 契约）；
 *   2. `maxCount` 超出 ⇒ `slice(-maxCount)`（保留**最后** N 条）；
 *   3. 分组时**保留已存在的空 placement**（`Object.keys(placements)` 那一轮），
 *      否则某个 placement 的最后一条关掉后列表会瞬间消失、动效播不出来；
 *   4. `onAllRemoved` 只在「曾经非空 → 变空」时触发一次（`emptyRef` 判据）；
 *   5. `container` 为空 ⇒ 整体不渲染（不 portal）。
 */

import { Portal } from '@apollo-design/portal';
import {
  cloneVNode,
  defineComponent,
  h,
  type PropType,
  ref,
  shallowRef,
  type VNodeChild,
  watch,
  watchEffect,
} from 'vue';

import type {
  NoticeListConfig,
  NotificationClassNames,
  NotificationStyles,
  NotificationsProps,
  Placement,
} from './interface';
import NoticeList from './NoticeList';

/** placement → 该组下的 notice 列表。 */
type PlacementGroups = Record<string, NoticeListConfig[]>;

export default defineComponent({
  name: 'ANotifications',
  props: {
    prefixCls: { type: String, default: 'apollo-notification' },
    container: { type: Object as PropType<NotificationsProps['container']>, default: undefined },
    motion: {
      type: [Object, Function] as PropType<NotificationsProps['motion']>,
      default: undefined,
    },
    maxCount: { type: Number, default: undefined },
    pauseOnHover: { type: Boolean, default: undefined },
    classNames: { type: Object as PropType<NotificationClassNames>, default: undefined },
    styles: { type: Object as PropType<NotificationStyles>, default: undefined },
    components: { type: Object as PropType<NotificationsProps['components']>, default: undefined },
    className: { type: Function as PropType<NotificationsProps['className']>, default: undefined },
    style: { type: Function as PropType<NotificationsProps['style']>, default: undefined },
    onAllRemoved: { type: Function as PropType<() => void>, default: undefined },
    stack: { type: [Boolean, Object] as PropType<NotificationsProps['stack']>, default: undefined },
    renderNotifications: {
      type: Function as PropType<NotificationsProps['renderNotifications']>,
      default: undefined,
    },
  },
  setup(props, { expose }) {
    const configList = ref<NoticeListConfig[]>([]);
    const emptyRef = ref(false);

    /** ⚠️ 保留空 placement：见文件头 3。 */
    // ⚠️ 用 `shallowRef` + `watchEffect` 而不是 `computed<T>()`：`NoticeListConfig`
    //    里含递归的 `VNodeChild`，Vue 的 `computed` 会对 `T` 做 `UnwrapRef` 深度展开
    //    ⇒ TS2589（Type instantiation is excessively deep）。`shallowRef` 不展开，
    //    且这里每次都是整体替换对象，不需要深层响应式。
    const placements = shallowRef<PlacementGroups>({});
    watchEffect(() => {
      const next: PlacementGroups = {};
      for (const config of configList.value) {
        const placement = (config.placement ?? 'topRight') as Placement;
        if (!next[placement]) next[placement] = [];
        next[placement].push(config);
      }
      placements.value = next;
    });

    const open = (config: Partial<NoticeListConfig>): void => {
      const list = [...configList.value];
      const index = list.findIndex((item) => item.key === config.key);
      const innerConfig = { ...config } as NoticeListConfig;
      if (index >= 0) {
        innerConfig.times = (list[index]?.times ?? 0) + 1;
        list[index] = innerConfig;
      } else {
        innerConfig.times = 0;
        list.push(innerConfig);
      }
      const maxCount = props.maxCount;
      configList.value =
        maxCount && maxCount > 0 && list.length > maxCount ? list.slice(-maxCount) : list;
    };

    const close = (key: string | number): void => {
      configList.value = configList.value.filter((item) => item.key !== key);
    };

    const destroy = (): void => {
      configList.value = [];
    };

    const onAllNoticeRemoved = (placement: Placement): void => {
      const clone = { ...placements.value };
      if (!(clone[placement] ?? []).length) delete clone[placement];
    };

    // 曾非空 → 变空：通知一次（onAllRemoved）。⚠️ 必须在 watch 里做（rc 也是 effect）——
    // 放进 render 会「渲染期改状态」，Vue 会告警且可能自激。
    watch(
      () => Object.keys(placements.value).length,
      () => {
        if (Object.keys(placements.value).length > 0) {
          emptyRef.value = true;
        } else if (emptyRef.value) {
          props.onAllRemoved?.();
          emptyRef.value = false;
        }
      },
      { flush: 'post' },
    );

    // ⚠️ 渲染函数组件里没有 `defineExpose` 宏（那是 `<script setup>` 专属），
    //    要用 setup 上下文的 `expose`。
    expose({ open, close, destroy });

    return () => {
      if (!props.container) return null;

      const list: VNodeChild[] = Object.keys(placements.value).map((placement) => {
        const key = placement as Placement;
        // ⚠️ props 对象显式收成 Record：直接内联对象字面量会让 TS 在
        //    「组件 props × 泛型 h()」上做深度实例化（TS2589）。
        const listProps: Record<string, unknown> = {
          key,
          configList: placements.value[key],
          placement: key,
          prefixCls: props.prefixCls,
          pauseOnHover: props.pauseOnHover,
          classNames: props.classNames,
          styles: props.styles,
          components: props.components,
          className: props.className?.(key),
          style: props.style?.(key),
          motion: props.motion,
          stack: props.stack,
          onNoticeClose: (closeKey: string | number) => {
            configList.value = configList.value.filter((item) => item.key !== closeKey);
          },
          onAllRemoved: onAllNoticeRemoved,
        };
        const noticeList = h(NoticeList, listProps as never);

        if (props.renderNotifications) {
          const wrapped = props.renderNotifications(noticeList, {
            prefixCls: props.prefixCls,
            key,
          });
          return cloneVNode(wrapped as never, { key });
        }
        return noticeList;
      });

      return h(
        Portal,
        {
          open: true,
          autoDestroy: false,
          getContainer: () => props.container as HTMLElement,
        },
        { default: () => list },
      );
    };
  },
});
