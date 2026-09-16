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

import { defineComponent, h, type PropType, ref, watch } from 'vue';

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
    component: { type: String, default: 'div' },
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
      const children = entities.value.map((entity) => {
        const userHooks = props.hooks;
        const hooks: MotionHooks = {
          ...userHooks,
          onVisibleChanged: (visible: boolean) => {
            userHooks?.onVisibleChanged?.(visible);
            if (!visible) markRemoved(entity.key);
          },
        };

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
                  slots.default?.({ ...slotProps, itemKey: entity.key }),
              }
            : undefined,
        );
      });

      if (!props.component) return children;
      return h(props.component, null, children);
    };
  },
});
