/**
 * Tree utils · calcDropPosition 直测（L1）。
 *
 * jsdom 无真实布局 ⇒ 用伪造 getBoundingClientRect 驱动（与 antd 测试的
 * spyElementPrototypes 同判，H5：不引 rc-util，用实例级覆写）。
 */

import { describe, expect, it } from 'vitest';
import { convertDataToEntities, flattenTreeData } from '../treeUtil';
import { calcDropPosition } from '../util';

const treeData = [
  {
    key: '0-0',
    title: '0-0',
    children: [
      { key: '0-0-0', title: '0-0-0' },
      { key: '0-0-1', title: '0-0-1' },
    ],
  },
  { key: '0-1', title: '0-1' },
];

const { keyEntities } = convertDataToEntities(treeData);
const flattenedNodes = flattenTreeData(treeData, ['0-0']).map(({ key, pos }) => ({ key, pos }));

const dragNodeProps = { data: { key: '0-1', title: '0-1' } };
const allowDrop = () => true;
const indent = 24;
const startMousePosition = { x: 100 };

/** 构造拖拽事件：target 是 24px 高、top=100 的行；horizontal 偏移由 clientX 控制。 */
function makeEvent(clientY: number, clientX = 90) {
  return {
    clientX,
    clientY,
    target: {
      getBoundingClientRect: () => ({ top: 100, height: 24 }),
    },
  };
}

describe('Tree utils · calcDropPosition', () => {
  it('展开节点的下半部 ⇒ drop inside（dropPosition 0）', () => {
    // target = '0-0'（已展开有 children），下半部 ⇒ abstract = 自身
    const result = calcDropPosition(
      makeEvent(118),
      dragNodeProps,
      { eventKey: '0-0' },
      indent,
      startMousePosition,
      allowDrop,
      flattenedNodes,
      keyEntities,
      ['0-0'],
    );
    expect(result.dropPosition).toBe(0);
    expect(result.dropTargetKey).toBe('0-0');
    expect(result.dropContainerKey).toBeNull();
    expect(result.dropAllowed).toBe(true);
  });

  it('非展开节点的下半部 ⇒ drop after（dropPosition 1）', () => {
    // target = '0-0-0'（叶子未展开），下半部 ⇒ drop after
    const result = calcDropPosition(
      makeEvent(168),
      dragNodeProps,
      { eventKey: '0-0-0' },
      indent,
      startMousePosition,
      allowDrop,
      flattenedNodes,
      keyEntities,
      ['0-0'],
    );
    expect(result.dropPosition).toBe(1);
    expect(result.dropTargetKey).toBe('0-0-0');
    expect(result.dropContainerKey).toBe('0-0');
  });

  it('首个节点的上半部 ⇒ dropPosition -1（置顶）', () => {
    const result = calcDropPosition(
      makeEvent(105),
      dragNodeProps,
      { eventKey: '0-0' },
      indent,
      startMousePosition,
      allowDrop,
      flattenedNodes,
      keyEntities,
      [],
    );
    expect(result.dropPosition).toBe(-1);
    expect(result.dropTargetKey).toBe('0-0');
  });

  it('allowDrop 拒绝 ⇒ dropAllowed false', () => {
    const result = calcDropPosition(
      makeEvent(118),
      dragNodeProps,
      { eventKey: '0-0' },
      indent,
      startMousePosition,
      () => false,
      flattenedNodes,
      keyEntities,
      ['0-0'],
    );
    expect(result.dropAllowed).toBe(false);
    expect(result.dropPosition).toBe(0);
  });

  it('rtl：横向偏移取反', () => {
    // clientX=110（右移）在 rtl 下 horizontalMouseOffset = -1 * (100-110) = 10
    const ltr = calcDropPosition(
      makeEvent(168, 110),
      dragNodeProps,
      { eventKey: '0-0-0' },
      indent,
      startMousePosition,
      allowDrop,
      flattenedNodes,
      keyEntities,
      ['0-0'],
    );
    const rtl = calcDropPosition(
      makeEvent(168, 110),
      dragNodeProps,
      { eventKey: '0-0-0' },
      indent,
      startMousePosition,
      allowDrop,
      flattenedNodes,
      keyEntities,
      ['0-0'],
      'rtl',
    );
    // ltr：horizontalMouseOffset = 100-110 = -10 → rawLevel = (-10-12)/24 ≈ -0.9
    // rtl：+10 → rawLevel = (10-12)/24 ≈ -0.08（两者 dropLevelOffset 均为 0，dropPosition 同为 1）
    expect(ltr.dropPosition).toBe(1);
    expect(rtl.dropPosition).toBe(1);
  });
});
