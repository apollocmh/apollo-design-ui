/**
 * Switcher 图标决策树（antd `utils/iconUtil.js` 的 Vue 移植）。
 *
 * 分支顺序与上游逐字对齐：
 *   loading → switcherLoadingIcon（VNode）→ LoadingOutlined
 *   叶子：无 showLine → null；showLine.showLeafIcon 定制（vnode|fn）→ 定制；
 *         showLeafIcon === false → `-switcher-leaf-line` span；默认 FileOutlined
 *   可展开：switcherIcon（fn|vnode）定制 → clone 合并类名；
 *         showLine → expanded ? MinusSquareOutlined : PlusSquareOutlined；
 *         默认 CaretDownFilled
 */

import {
  CaretDownFilled,
  FileOutlined,
  LoadingOutlined,
  MinusSquareOutlined,
  PlusSquareOutlined,
} from '@apollo-design/icons';
import { cloneVNode, h, isVNode, type VNodeChild } from 'vue';
import { clsx } from '../../notification/engine/util';
import type { TreeNodeRenderInfo, TreeProps } from '../interface';

type ShowLine = TreeProps['showLine'];
type SwitcherIcon = TreeProps['switcherIcon'];
type LoadingIcon = TreeProps['switcherLoadingIcon'];

/** rc `cloneElement(switcher, { className: clsx(old, new) })` 的 Vue 等价（class 合并语义）。 */
function mergeIconClass(icon: VNodeChild, cls: string): VNodeChild {
  if (isVNode(icon)) {
    const oldClass = (icon.props as { class?: string } | null | undefined)?.class;
    return cloneVNode(icon, { class: clsx(oldClass, cls) });
  }
  return icon;
}

export default function renderSwitcherIcon(props: {
  prefixCls: string;
  switcherIcon?: SwitcherIcon;
  switcherLoadingIcon?: LoadingIcon;
  treeNodeProps: Pick<TreeNodeRenderInfo, 'isLeaf' | 'expanded' | 'loading'>;
  showLine?: ShowLine;
}): VNodeChild {
  const { prefixCls, switcherIcon, treeNodeProps, showLine, switcherLoadingIcon } = props;
  const { isLeaf, expanded, loading } = treeNodeProps;

  if (loading) {
    if (isVNode(switcherLoadingIcon)) {
      return switcherLoadingIcon;
    }
    return h(LoadingOutlined, { class: `${prefixCls}-switcher-loading-icon` });
  }

  const showLeafIcon =
    typeof showLine === 'object' && showLine !== null ? showLine.showLeafIcon : undefined;

  if (isLeaf) {
    if (!showLine) {
      return null;
    }
    if (typeof showLeafIcon !== 'boolean' && showLeafIcon) {
      const leafCls = `${prefixCls}-switcher-line-custom-icon`;
      const leafIcon =
        typeof showLeafIcon === 'function' ? showLeafIcon(treeNodeProps) : showLeafIcon;
      return mergeIconClass(leafIcon, leafCls);
    }
    return showLeafIcon
      ? h(FileOutlined, { class: `${prefixCls}-switcher-line-icon` })
      : h('span', { class: `${prefixCls}-switcher-leaf-line` });
  }

  const switcherCls = `${prefixCls}-switcher-icon`;
  const switcher = typeof switcherIcon === 'function' ? switcherIcon(treeNodeProps) : switcherIcon;

  if (isVNode(switcher)) {
    return mergeIconClass(
      switcher,
      clsx(showLine ? `${prefixCls}-switcher-line-icon` : switcherCls),
    );
  }
  if (switcher !== undefined && switcher !== null && switcher !== false) {
    return switcher as VNodeChild;
  }
  if (showLine) {
    return expanded
      ? h(MinusSquareOutlined, { class: `${prefixCls}-switcher-line-icon` })
      : h(PlusSquareOutlined, { class: `${prefixCls}-switcher-line-icon` });
  }
  return h(CaretDownFilled, { class: switcherCls });
}
