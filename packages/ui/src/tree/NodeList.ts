/**
 * NodeList —— 虚拟列表 + 展开 motion diff（rc `NodeList.js` 的 Vue 移植）。
 *
 * rc 判据（行号对 1.4.0 产物）：
 *   - MOTION_KEY 哨兵：随机串，MotionEntity（level 0 / pos '0'）注入 keyEntities
 *     （Tree 侧），MotionFlattenData 插进 transitionData 挖洞位
 *   - getMinimumRangeTransitionRange：虚拟时只取 `ceil(height/itemHeight)+1` 条可见段
 *   - itemKey = getKey(key, pos)
 *   - motion diff：expandedKeys 变化 ⇒ findExpandedKeys 找单键 diff ⇒
 *     add：在 prevData 的 keyIndex+1 插哨兵 + range=新数据范围 + 'show'；
 *     remove：在 data 的 keyIndex+1 插哨兵 + range=旧数据范围 + 'hide'
 *   - 无单键 diff 但 data 变化 ⇒ 直接刷新（prevData = transitionData = data）
 *   - dragging 结束 ⇒ 强制收尾 motion（拖挂起时跳过动画）
 *   - onVisibleChange：可见列表里已无哨兵 ⇒ onMotionEnd（虚拟下哨兵可能滚出窗口）
 *   - 隐藏的 indent 量测 div（aria-hidden + absolute + height:0）
 */

import { useId } from '@apollo-design/utils';
import { VirtualList } from '@apollo-design/virtual-list';
import { computed, defineComponent, h, onUnmounted, type PropType, ref, watch } from 'vue';
import type { TreeKey } from './interface';
import MotionTreeNode from './MotionTreeNode';
import type { TreeNodeRequiredProps } from './TreeContext';
import { findExpandedKeys, getExpandRange } from './utils/diffUtil';
import { type FlattenNode, getKey, getTreeNodeProps } from './utils/treeUtil';

export const MOTION_KEY = `RC_TREE_MOTION_${Math.random()}`;
const MotionNode = { key: MOTION_KEY };
export const MotionEntity = {
  key: MOTION_KEY,
  level: 0,
  index: 0,
  pos: '0',
  node: MotionNode,
  nodes: [MotionNode],
};
const MotionFlattenData: FlattenNode = {
  parent: null,
  children: [],
  pos: MotionEntity.pos,
  data: MotionNode as never,
  title: null,
  key: MOTION_KEY,
  /** Hold empty list here since we do not use it */
  isStart: [],
  isEnd: [],
};

/** 只取可见段播动画（虚拟列表下范围外的节点不渲染）。 */
export function getMinimumRangeTransitionRange(
  list: FlattenNode[],
  virtual: boolean | undefined,
  height: number | undefined,
  itemHeight: number | undefined,
): FlattenNode[] {
  if (virtual === false || !height) {
    return list;
  }
  return list.slice(0, Math.ceil(height / (itemHeight ?? 1)) + 1);
}

function itemKey(item: FlattenNode): TreeKey {
  return getKey(item.key, item.pos);
}

export default defineComponent({
  name: 'ATreeNodeList',
  props: {
    prefixCls: { type: String, required: true },
    data: { type: Array as PropType<FlattenNode[]>, required: true },
    expandedKeys: { type: Array as PropType<TreeKey[]>, required: true },
    selectable: { type: Boolean, default: true },
    checkable: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    dragging: { type: Boolean, default: false },
    motion: { type: Object as PropType<Record<string, unknown> | undefined>, default: undefined },
    height: { type: Number, default: undefined },
    itemHeight: { type: Number, default: undefined },
    virtual: { type: Boolean, default: undefined },
    scrollWidth: { type: Number, default: undefined },
    focusable: { type: Boolean, default: true },
    activeKey: { type: [String, Number] as PropType<TreeKey | null>, default: null },
    tabIndex: { type: Number, default: 0 },
    treeNodeRequiredProps: { type: Object as PropType<TreeNodeRequiredProps>, required: true },
    // ⚠️ 事件键用 DOM 事件名小写（onKeydown / onMousedown）—— Vue 的 isOn 判据是
    //    /^on[a-z]/，onKeyDown（大写）会被当成普通 attribute 而非监听器（实测踩过）。
    onKeydown: { type: Function as PropType<(e: KeyboardEvent) => void>, default: undefined },
    onFocus: { type: Function as PropType<(e: FocusEvent) => void>, default: undefined },
    onBlur: { type: Function as PropType<(e: FocusEvent) => void>, default: undefined },
    onMousedown: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    onActiveChange: { type: Function as PropType<(key: TreeKey | null) => void>, required: true },
    onListChangeStart: { type: Function as PropType<() => void>, required: true },
    onListChangeEnd: { type: Function as PropType<() => void>, required: true },
  },
  setup(props, { attrs, expose }) {
    const treeId = useId();

    // =============================== Ref ================================
    const listRef = ref<{ scrollTo: (s: unknown) => void } | null>(null);
    const indentMeasurerRef = ref<HTMLElement | null>(null);

    expose({
      scrollTo: (scroll: unknown) => {
        listRef.value?.scrollTo(scroll);
      },
      getIndentWidth: () => indentMeasurerRef.value?.offsetWidth ?? 0,
    });

    // ============================== Motion ==============================
    const prevExpandedKeys = ref<TreeKey[]>([...props.expandedKeys]);
    const prevData = ref<FlattenNode[]>(props.data);
    const transitionData = ref<FlattenNode[]>(props.data);
    const transitionRange = ref<FlattenNode[]>([]);
    const motionType = ref<'show' | 'hide' | null>(null);

    function onMotionEnd() {
      const latestData = props.data;
      prevData.value = latestData;
      transitionData.value = latestData;
      transitionRange.value = [];
      motionType.value = null;
      props.onListChangeEnd();
    }

    // rc useLayoutEffect：expandedKeys/data 变化时算 diff
    watch(
      () => [props.expandedKeys, props.data] as const,
      ([nextKeys, nextData], [oldKeys, oldData]) => {
        // prevExpandedKeys 是 rc state（上一轮值）
        const diffExpanded = findExpandedKeys(prevExpandedKeys.value, nextKeys);
        prevExpandedKeys.value = [...nextKeys];
        if (diffExpanded.key !== null) {
          if (diffExpanded.add) {
            const keyIndex = prevData.value.findIndex(({ key }) => key === diffExpanded.key);
            const rangeNodes = getMinimumRangeTransitionRange(
              getExpandRange(prevData.value, nextData, diffExpanded.key),
              props.virtual,
              props.height,
              props.itemHeight,
            );
            const newTransitionData = prevData.value.slice();
            newTransitionData.splice(keyIndex + 1, 0, MotionFlattenData);
            transitionData.value = newTransitionData;
            transitionRange.value = rangeNodes;
            motionType.value = 'show';
          } else {
            const keyIndex = nextData.findIndex(({ key }) => key === diffExpanded.key);
            const rangeNodes = getMinimumRangeTransitionRange(
              getExpandRange(nextData, prevData.value, diffExpanded.key),
              props.virtual,
              props.height,
              props.itemHeight,
            );
            const newTransitionData = nextData.slice();
            newTransitionData.splice(keyIndex + 1, 0, MotionFlattenData);
            transitionData.value = newTransitionData;
            transitionRange.value = rangeNodes;
            motionType.value = 'hide';
          }
        } else if (prevData.value !== nextData) {
          // If whole data changed, we just refresh the list
          prevData.value = nextData;
          transitionData.value = nextData;
        }
        void oldKeys;
        void oldData;
      },
      { flush: 'post' },
    );

    // 拖拽中跳过动画；结束强制收尾（rc useEffect 判据）
    watch(
      () => props.dragging,
      (dragging) => {
        if (!dragging) {
          onMotionEnd();
        }
      },
    );
    onUnmounted(() => {
      // rc useUnmount：动效中断时仍要触发 start/end 回调（listChanging 复位）
      if (motionType.value !== null) {
        props.onListChangeEnd();
      }
    });

    const mergedData = computed<FlattenNode[]>(() =>
      props.motion ? transitionData.value : props.data,
    );

    const activeItem = computed(() => {
      if (props.activeKey === null) return null;
      return props.data.find(({ key }) => key === props.activeKey) ?? null;
    });

    return () => {
      const treeNodeRequiredProps = props.treeNodeRequiredProps;
      const focusable = props.focusable !== false && !props.disabled;

      // ⚠️ rc 返回 Fragment（量测 div + VirtualList 平铺）—— 不包 wrapper div，
      //    契约基线钉根 div 子节点数（2 vs 1 差异源自包装层）。
      return [
        // ---- 隐藏的 indent 量测 div ----
        h(
          'div',
          {
            class: `${props.prefixCls}-treenode`,
            'aria-hidden': true,
            style: {
              position: 'absolute',
              pointerEvents: 'none',
              visibility: 'hidden',
              height: 0,
              overflow: 'hidden',
              border: 0,
              padding: 0,
            },
          },
          [
            h('div', { class: `${props.prefixCls}-indent` }, [
              h('div', { ref: indentMeasurerRef, class: `${props.prefixCls}-indent-unit` }),
            ]),
          ],
        ),
        h(
          VirtualList,
          {
            ...attrs,
            data: mergedData.value,
            itemKey: (item: FlattenNode) => itemKey(item) as unknown as string,
            height: props.height,
            fullHeight: false,
            virtual: props.virtual,
            itemHeight: props.itemHeight,
            scrollWidth: props.scrollWidth,
            onKeydown: props.onKeydown,
            onFocus: props.onFocus,
            onBlur: props.onBlur,
            onMousedown: props.onMousedown,
            prefixCls: `${props.prefixCls}-list`,
            ref: listRef as never,
            role: 'tree',
            tabIndex: focusable ? props.tabIndex : undefined,
            'aria-activedescendant': activeItem.value
              ? `${treeId}_${String(activeItem.value.key)}`
              : undefined,
            onVisibleChange: (originList: FlattenNode[]) => {
              // 虚拟下哨兵滚出可见窗口时也应收尾（rc 判据）
              if (originList.every((item) => itemKey(item) !== MOTION_KEY)) {
                onMotionEnd();
              }
            },
          } as never,
          {
            // ⚠️ 本仓 VirtualList 的 slot 签名是 { item, index, style, offsetX } 包装对象
            default: (slotItem: { item: FlattenNode }) => {
              const treeNode = slotItem.item;
              const mergedKey = getKey(treeNode.key, treeNode.pos);
              const treeNodeProps = getTreeNodeProps(mergedKey, treeNodeRequiredProps as never);
              return h(MotionTreeNode, {
                key: mergedKey as string | number,
                prefixCls: props.prefixCls,
                ...treeNodeProps,
                title: treeNode.title,
                active: !!activeItem.value && treeNode.key === activeItem.value.key,
                pos: treeNode.pos,
                data: treeNode.data as Record<string, unknown>,
                isStart: treeNode.isStart,
                isEnd: treeNode.isEnd,
                motion: props.motion,
                motionNodes: treeNode.key === MOTION_KEY ? transitionRange.value : null,
                motionType: motionType.value,
                onMotionStart: props.onListChangeStart,
                onMotionEnd: onMotionEnd,
                treeNodeRequiredProps: treeNodeRequiredProps,
                treeId: treeId,
                node: treeNode,
                onMouseMove: () => {
                  props.onActiveChange(null);
                },
              } as never);
            },
          },
        ),
      ];
    };
  },
});
