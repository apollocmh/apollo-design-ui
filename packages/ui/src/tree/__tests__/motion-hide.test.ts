/**
 * 受控 expandedKeys + autoExpandParent 收起链路（回归哨兵）。
 *
 * 用户场景：basic-controlled demo —— onExpand 回写的 keys 恰好等于原 props 值
 * （被 conduct 补进来的父级 key 只存在于组件内部 ref），且 autoExpandParent
 * 同步 true→false。历史坑：
 *   1. 分支 A' 缺 rc gDSFP 的 autoExpandParent **双向**重同步（false ⇒ 纯同步丢父级）；
 *   2. MotionTreeNode 的 hide 型 motion 行**新挂载**时 visible 未翻转
 *      （rc useLayoutEffect 挂载也跑）⇒ CSSMotion 永不走 leave ⇒
 *      onMotionEnd 永不触发 ⇒ transitionData 卡死 ⇒「展开收起节点始终显示」。
 */
import { mount } from '@vue/test-utils';
import { h, nextTick, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { detectMotionSupport } from '@apollo-design/motion';
import Tree from '../Tree';

const treeData = [
  {
    title: '0-0',
    key: '0-0',
    children: [
      {
        title: '0-0-0',
        key: '0-0-0',
        children: [
          { title: '0-0-0-0', key: '0-0-0-0' },
          { title: '0-0-0-1', key: '0-0-0-1' },
        ],
      },
      { title: '0-0-1', key: '0-0-1' },
    ],
  },
  { title: '0-1', key: '0-1' },
  { title: '0-2', key: '0-2' },
];

const visibleCount = () =>
  document.querySelectorAll('.apollo-tree-treenode:not([aria-hidden="true"])').length;

const raf2 = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

describe('Tree 受控收起 × hide motion', () => {
  it('onExpand 回写（同值数组 + autoExpandParent 翻 false）⇒ leave 完成 ⇒ 节点收起', async () => {
    const expandedKeys = ref(['0-0-0', '0-0-1']);
    const autoExpandParent = ref(true);

    const w = mount(
      () =>
        h(Tree, {
          expandedKeys: expandedKeys.value,
          autoExpandParent: autoExpandParent.value,
          treeData,
          onExpand: (keys: (string | number)[]) => {
            expandedKeys.value = keys;
            autoExpandParent.value = false;
          },
        }),
      { attachTo: document.body },
    );
    await nextTick();

    // conduct（autoExpandParent=true）补进 '0-0' ⇒ 0-0,0-0-0,0-0-0-0,0-0-0-1,0-0-1,0-1,0-2
    const init = visibleCount();
    expect(init).toBe(7);

    await w.find('.apollo-tree-switcher').trigger('click');
    // leave 步进（prepare/start/active 走 double rAF）
    await raf2();
    // jsdom 下 leave 可能已在微任务/帧步进中完成（motion 元素已移除）；
    // 若元素仍在（如浏览器时序），按探测到的结束事件名手动派发 animationend。
    const motionEl = document.querySelector('.apollo-tree-treenode-motion');
    if (motionEl) {
      motionEl.dispatchEvent(new Event(detectMotionSupport().animationEndName));
    }
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // onMotionEnd ⇒ transitionData 落地 ⇒ 收起（0-0,0-1,0-2）
    expect(visibleCount()).toBe(3);
    expect(expandedKeys.value).toEqual(['0-0-0', '0-0-1']);
    expect(autoExpandParent.value).toBe(false);
    w.unmount();
  });
});
