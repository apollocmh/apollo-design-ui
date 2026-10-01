/**
 * `MotionList` —— `CSSMotionList.js` 的 Vue 等价物。
 *
 * 职责**只有**三件（`motion-contract.md` §3.9）：
 *   1. 对 `keys` 做四态 diff，每个 key 各自套一个 `CSSMotion`；
 *   2. 某个 key 的 leave 播完后把它标成 `removed` 并摘掉；
 *   3. 全部摘完后触发 `allRemoved`。
 *
 * ⚠️ **stagger（错峰）不在这一层**。antd 里错峰是各组件自己在 `motionDelay`
 *    / `style` 上加的（如 Collapse 逐项），CSSMotionList 不做这件事。
 *    本包同样不提供 —— 谁需要错峰谁自己给 `style` 加 `animation-delay`。
 */

import { type Component, defineComponent, h, type PropType, ref, watch } from 'vue';

import { CSSMotion } from './css-motion';
import type { KeyEntity } from './diff';
import { diffKeys, parseKeys, STATUS_ADD, STATUS_REMOVE, STATUS_REMOVED } from './diff';
import type { MotionHooks } from './driver';

export const MotionList = defineComponent({
  name: 'MotionList',
  props: {
    /** 当前应当存在的 key 列表。顺序有意义（diff 依赖它） */
    keys: { type: Array as PropType<unknown[]>, default: () => [] },
    /** 包裹元素。传 `null` / `false` 表示不包裹，直接返回片段 */
    component: {
      type: [String, Object, Boolean] as PropType<string | Component | false>,
      default: 'div',
    },
    // ---- 透传给每个 CSSMotion ----
    motionName: { type: String, default: undefined },
    motionAppear: { type: Boolean, default: true },
    motionEnter: { type: Boolean, default: true },
    motionLeave: { type: Boolean, default: true },
    motionLeaveImmediately: { type: Boolean, default: false },
    motionDeadline: { type: Number, default: 0 },
    removeOnLeave: { type: Boolean, default: true },
    forceRender: { type: Boolean, default: false },
    leavedClassName: { type: String, default: undefined },
    hooks: { type: Object as PropType<MotionHooks>, default: undefined },
    /** 透传给每个 CSSMotion。测试里必须显式传 true（理由同 CSSMotion） */
    supportMotion: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  },
  emits: {
    /** 所有被移除的 key 都播完离场后触发 */
    allRemoved: () => true,
  },
  setup(props, { slots, emit }) {
    const entities = ref<KeyEntity[]>(
      parseKeys(props.keys).map((obj) => ({ ...obj, status: STATUS_ADD })),
    );

    watch(
      () => props.keys,
      (next) => {
        const mixed = diffKeys(
          entities.value.map((e) => ({ ...e })),
          next,
        );
        // 已经标成 removed 的 key，本次又是 remove ⇒ 直接丢掉，不再留着播第二次
        entities.value = mixed.filter((entity) => {
          const prev = entities.value.find(({ key }) => entity.key === key);
          if (prev && prev.status === STATUS_REMOVED && entity.status === STATUS_REMOVE) {
            return false;
          }
          return true;
        });
      },
      { deep: true },
    );

    function markRemoved(key: string): void {
      entities.value = entities.value.map((entity) =>
        entity.key === key ? { ...entity, status: STATUS_REMOVED } : entity,
      );
      const rest = entities.value.filter(({ status }) => status !== STATUS_REMOVED).length;
      if (rest === 0) {
        emit('allRemoved');
      }
    }

    return () => {
      const children = entities.value.map((entity, entityIndex) => {
        const userHooks = props.hooks;
        const hooks: MotionHooks = {
          ...userHooks,
          onVisibleChanged: (visible: boolean) => {
            userHooks?.onVisibleChanged?.(visible);
            if (!visible) markRemoved(entity.key);
          },
        };

        /**
         * 上游 `CSSMotionList` 是 `keyEntities.map(({ status, ...eventProps }, index) => …)`
         * —— 它把 key 对象的**其余字段**当作 `eventProps` 交给 `CSSMotion`，
         * 而 `CSSMotion` 再把它们铺进给 children 的载荷里：
         *
         * ```js
         * const mergedProps = { ...eventProps, visible };
         * children({ ...mergedProps, [className], [style] }, nodeRef)
         * ```
         *
         * ⇒ 槽载荷 = **`{...key对象(去掉 status), visible, [className], [style], index}`**。
         *
         * ⚠️ 这里必须同样透传，否则「按 key 携带业务数据」的用法（masonry 就是）
         * 拿不到数据；更要命的是**离场中的 key 只在 `diffKeys` 的实体里**——
         * 列表里已经删掉了，只有这条通路还能拿到它的内容
         * （上游 `Masonry` 正是靠它让「被移除的 item 播完淡出」而不是瞬间变空）。
         *
         * 合并顺序与上游一致：**key 对象先铺、motion 字段覆盖同名键**
         * （`visible` / `className` / `style` 永远以 motion 为准）。
         */
        const { status: _diffStatus, ...eventProps } = entity;

        return h(
          CSSMotion,
          {
            key: entity.key,
            visible: entity.status !== STATUS_REMOVE && entity.status !== STATUS_REMOVED,
            motionName: props.motionName,
            motionAppear: props.motionAppear,
            motionEnter: props.motionEnter,
            motionLeave: props.motionLeave,
            motionLeaveImmediately: props.motionLeaveImmediately,
            motionDeadline: props.motionDeadline,
            removeOnLeave: props.removeOnLeave,
            forceRender: props.forceRender,
            leavedClassName: props.leavedClassName,
            supportMotion: props.supportMotion,
            hooks,
          },
          slots.default
            ? {
                default: (slotProps: Record<string, unknown>) =>
                  slots.default?.({
                    ...eventProps,
                    ...slotProps,
                    // 本仓既有契约（upload / form / notification 在用）：`itemKey` = `String(key)`
                    itemKey: entity.key,
                    // 上游同名：`keyEntities` 里的下标
                    index: entityIndex,
                  }),
              }
            : undefined,
        );
      });

      if (!props.component) return children;
      return h(props.component, null, children);
    };
  },
});
