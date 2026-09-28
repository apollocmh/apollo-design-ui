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
import { computed, defineComponent, h, type PropType, ref, watch } from 'vue';
import { clsx } from '../notification/engine/util';
import type { TreeNodeRequiredProps } from './TreeContext';
import TreeNode from './TreeNode';
import type { FlattenNode } from './utils/treeUtil';
import { getTreeNodeProps } from './utils/treeUtil';

export default defineComponent({
  name: 'ATreeMotionTreeNode',
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
  setup(props) {
    const visible = ref(true);
    // Should only trigger once
    const triggerMotionEndRef = ref(false);

    const targetVisible = computed(() => !!(props.motionNodes && props.motionType !== 'hide'));

    // rc：useLayoutEffect —— motionNodes 存在且目标可见态与当前不同 ⇒ 切换
    watch(
      () => props.motionNodes,
      () => {
        if (props.motionNodes && targetVisible.value !== visible.value) {
          visible.value = targetVisible.value;
        }
      },
    );

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
        const motionProps = (props.motion ?? {}) as Record<string, unknown>;
        const hooks: MotionHooks = {
          onAppearStart: triggerMotionStart,
          onLeaveStart: triggerMotionStart,
        };
        return h(
          CSSMotion,
          {
            visible: visible.value,
            motionName: motionProps.motionName as string | undefined,
            motionAppear: motionType === 'show',
            onVisibleChanged,
            hooks,
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
                  return h(TreeNode, {
                    key: treeNode.key,
                    treeId: props.treeId,
                    ...treeNodeProps,
                    title: treeNode.title,
                    active: props.active,
                    data: treeNode.data as Record<string, unknown>,
                    isStart: treeNode.isStart,
                    isEnd: treeNode.isEnd,
                  } as never);
                }),
              ),
          },
        );
      }

      // 非动效态：直通 TreeNode
      const treeNodeProps = getTreeNodeProps(
        props.node.key as never,
        props.treeNodeRequiredProps as never,
      );
      return h(TreeNode, {
        className: props.className,
        style: props.style,
        treeId: props.treeId,
        ...treeNodeProps,
        title: props.node.title,
        pos: props.node.pos,
        eventKey: props.node.key,
        active: props.active,
        data: props.node.data as Record<string, unknown>,
        isStart: props.node.isStart,
        isEnd: props.node.isEnd,
      } as never);
    };
  },
});
