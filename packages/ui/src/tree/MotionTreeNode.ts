/**
 * MotionTreeNode —— 展开/收起动效容器（rc `MotionTreeNode.js` 的 Vue 移植）。
 *
 * rc 判据：
 *   - targetVisible = motionNodes && motionType !== 'hide'（hide ⇒ 离场）
 *   - motionNodes 变化时把 visible 拉到 targetVisible（rc useLayoutEffect）
 *   - onVisibleChanged(next) 与 targetVisible 一致时触发 onMotionEnd（只触发一次）
 *   - 非动效态直接透传 TreeNode（className/style 一并下传）
 */

import { CSSMotion, type MotionHooks } from '@apollo-design/motion';
import {
  computed,
  defineComponent,
  h,
  onMounted,
  type PropType,
  ref,
  type SlotsType,
  watch,
} from 'vue';
import { clsx } from '../_internal/clsx';
import type { FlattenNode } from '../_internal/tree/tree-util';
import { getTreeNodeProps } from '../_internal/tree/tree-util';
import type { TreeSlots } from './interface';
import type { TreeNodeRequiredProps } from './TreeContext';
import TreeNode from './TreeNode';

export default defineComponent({
  name: 'ATreeMotionTreeNode',
  slots: Object as SlotsType<TreeSlots>,
  props: {
    prefixCls: { type: String, required: true },
    motion: { type: Object as PropType<Record<string, unknown> | undefined>, default: undefined },
    motionNodes: { type: Array as PropType<FlattenNode[] | null>, default: null },
    motionType: { type: String as PropType<'show' | 'hide' | null>, default: null },
    onMotionStart: { type: Function as PropType<() => void>, required: true },
    onMotionEnd: { type: Function as PropType<() => void>, required: true },
    active: { type: Boolean, default: false },
    treeNodeRequiredProps: { type: Object as PropType<TreeNodeRequiredProps>, required: true },
    treeId: { type: String, required: true },
    // ---- 直通 TreeNode 的字段（非动效态）----
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    isStart: { type: Array as unknown as () => boolean[], required: true },
    isEnd: { type: Array as unknown as () => boolean[], required: true },
    node: { type: Object as PropType<FlattenNode>, required: true },
  },
  setup(props, { slots }) {
    const visible = ref(true);
    // Should only trigger once
    const triggerMotionEndRef = ref(false);

    const targetVisible = computed(() => !!(props.motionNodes && props.motionType !== 'hide'));

    // rc：useLayoutEffect —— motionNodes 存在且目标可见态与当前不同 ⇒ 切换
    //
    // ⚠️ **挂载时也必须跑一次**（2026-10-17 修）。rc 的 `useLayoutEffect` 在挂载时
    //    就会执行，而 Vue 的 `watch` 默认不会 —— 这一处差异正是「收起失效」的根因：
    //    收起时哨兵节点是**连同 `motionNodes` 一起新建**的（`NodeList` 在
    //    `transitionData` 里插入 MOTION_KEY 哨兵 ⇒ 新 key ⇒ 新组件实例），
    //    `props.motionNodes` 从未「变化」过，watch 永远不触发 ⇒ `visible` 停在
    //    初始的 `true` ⇒ 离场动效永不开始 ⇒ `onVisibleChanged` 永不回调 ⇒
    //    `onMotionEnd` 不到 ⇒ `listChanging` 永久为真 ⇒ 后续展开/收起全部被
    //    `Tree.onNodeExpand` 的 `if (listChanging) return` 吞掉。
    //
    // ⚠️ 用 `onMounted` 而不是 `watch(immediate: true)`：后者在 setup 期就把
    //    `visible` 置成 false，CSSMotion 从第一帧起就不可见 ⇒ 元素根本不渲染、
    //    更不会有离场过渡。必须先以 `visible=true` 渲染一帧，再翻到 false。
    function syncVisible() {
      if (props.motionNodes && targetVisible.value !== visible.value) {
        visible.value = targetVisible.value;
      }
    }
    onMounted(() => {
      syncVisible();
      // rc `useUnmount(triggerMotionStart, triggerMotionEnd)`：挂载后的下一次提交
      // 触发 `onMotionStart`（`listChanging` 由此置位）。⚠️ 它**不是** CSSMotion 的
      // hook —— 曾经把 `triggerMotionStart` 挂在 `onAppearStart / onLeaveStart` 上，
      // 结果把 collapse 预设自己的 height handler **顶掉**了（详见下方 `hooks`）。
      triggerMotionStart();
    });
    watch(() => props.motionNodes, syncVisible);

    function triggerMotionStart() {
      if (props.motionNodes) {
        props.onMotionStart();
      }
    }

    function triggerMotionEnd() {
      if (props.motionNodes && !triggerMotionEndRef.value) {
        triggerMotionEndRef.value = true;
        props.onMotionEnd();
      }
    }

    function onVisibleChanged(nextVisible: boolean) {
      if (targetVisible.value === nextVisible) {
        triggerMotionEnd();
      }
    }

    return () => {
      const { motionNodes, motionType, prefixCls } = props;

      if (motionNodes) {
        // rc `_extends({ ref, visible }, motion, { motionAppear: motionType === 'show',
        // onVisibleChanged })` —— **整个 `motion` 都要摊进去**，不只是 `motionName`。
        //
        // ⚠️ 曾经只取 `motionName`，并把 `triggerMotionStart` 塞进
        //    `onAppearStart / onLeaveStart`。后果有两层：
        //      1. collapse 预设的 `onLeaveStart`（`height: offsetHeight`）与
        //         `onLeaveActive`（`height: 0`）被顶掉 ⇒ 高度从不变化
        //         ⇒ CSS `transition: height` 根本没有过渡可跑
        //         ⇒ `transitionend` 永不到 ⇒ 动效永不结束；
        //      2. `motionDeadline`（antd 是 500ms 兜底）也没带上 ⇒ 连兜底都没有。
        //    这就是「收起之后整棵树再也点不动」的最后一环（2026-10-17 修）。
        //
        // ⚠️ antd 那 9 个 handler 是**平铺**在 motion 对象上的（Collapse / Upload /
        //    Form 同款），本仓 `CSSMotion` 收的是 `hooks` 对象 ⇒ 这里按 Panel 的范式收拢。
        const motionProps = (props.motion ?? {}) as Record<string, unknown>;
        const hooks: MotionHooks = {};
        const rest: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(motionProps)) {
          if (key in MOTION_HOOK_KEYS) {
            (hooks as Record<string, unknown>)[key] = value;
          } else {
            rest[key] = value;
          }
        }
        return h(
          CSSMotion,
          {
            visible: visible.value,
            ...rest,
            hooks,
            // rc：motionAppear **覆盖** motion 自带的（antd 给的是 false，展开仍要播）
            motionAppear: motionType === 'show',
            onVisibleChanged,
          } as never,
          {
            default: (slotProps: { className?: string; style?: Record<string, unknown> }) =>
              h(
                'div',
                {
                  class: clsx(`${prefixCls}-treenode-motion`, slotProps.className),
                  style: slotProps.style,
                },
                motionNodes.map((treeNode) => {
                  const treeNodeProps = getTreeNodeProps(
                    treeNode.key as never,
                    props.treeNodeRequiredProps as never,
                  );
                  return h(
                    TreeNode,
                    {
                      key: treeNode.key,
                      treeId: props.treeId,
                      ...treeNodeProps,
                      title: treeNode.title,
                      active: props.active,
                      data: treeNode.data as Record<string, unknown>,
                      isStart: treeNode.isStart,
                      isEnd: treeNode.isEnd,
                      // rc `{...restProps}` 判据：data 自有字段透传（isLeaf/disabled/icon…）
                      ...dataPropsOf(treeNode),
                    } as never,
                    slots,
                  );
                }),
              ),
          },
        );
      }

      // 非动效态：直通 TreeNode
      // eslint-disable-next-line no-console
      const treeNodeProps = getTreeNodeProps(
        props.node.key as never,
        props.treeNodeRequiredProps as never,
      );
      return h(
        TreeNode,
        {
          className: props.className,
          style: props.style,
          treeId: props.treeId,
          // rc `{...restProps}` 判据：data 自有字段透传（isLeaf/disabled/icon…）
          ...dataPropsOf(props.node),
          ...treeNodeProps,
          title: props.node.title,
          pos: props.node.pos,
          eventKey: props.node.key,
          active: props.active,
          data: props.node.data as Record<string, unknown>,
          isStart: props.node.isStart,
          isEnd: props.node.isEnd,
        } as never,
        slots,
      );
    };
  },
});

/**
 * antd `initCollapseMotion()` 摊在 motion 对象上的 9 个 handler
 * （`_util/motion.ts`）。本仓 `CSSMotion` 只认 `hooks` 对象 ⇒ 在 `MotionTreeNode`
 * 里按 key 收拢（Collapse 的 `Panel.ts` 是同一范式）。
 */
const MOTION_HOOK_KEYS: Record<string, true> = {
  onAppearStart: true,
  onEnterStart: true,
  onLeaveStart: true,
  onAppearActive: true,
  onEnterActive: true,
  onLeaveActive: true,
  onAppearEnd: true,
  onEnterEnd: true,
  onLeaveEnd: true,
};

/** rc：`delete restProps.children / key` —— data 自有字段（isLeaf/disabled/icon 等）
 * 原样作为 TreeNode props 透传（rc NodeList 的 `{...restProps}` 判据）。 */
function dataPropsOf(node: FlattenNode): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const fields = new Set([
    'checkable',
    'disabled',
    'disableCheckbox',
    'icon',
    'isLeaf',
    'selectable',
    'switcherIcon',
    'className',
    'style',
  ]);
  for (const [key, value] of Object.entries(node.data)) {
    if (fields.has(key) || /^(aria-|data-)/.test(key)) result[key] = value;
  }
  return result;
}
