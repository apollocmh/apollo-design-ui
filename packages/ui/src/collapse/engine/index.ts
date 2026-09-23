/**
 * Collapse 引擎（registry `dependencies.json` 登记的 `@rc-component/collapse`
 * 替换落点，strategy=in-ui → `packages/ui/src/collapse/engine/`）。
 *
 * 契约来源：`@rc-component/collapse@1.2.0/es/Collapse.js` 的 activeKey 状态机
 * （逐行对拍）+ `hooks/useItems.js` 的 items→Panel 转换。视图部分（CSSMotion
 * 面板）在 `../Panel.ts`。
 */

import type { CollapseItemType } from '../interface';

/** activeKey 统一成 string[]（上游 getActiveKeysArray：number/string 包数组 + String 化）。 */
export function getActiveKeysArray(
  activeKey: (string | number)[] | string | number | undefined,
): string[] {
  if (Array.isArray(activeKey)) {
    return activeKey.map((key) => String(key));
  }
  if (typeof activeKey === 'number' || typeof activeKey === 'string') {
    return [String(activeKey)];
  }
  return [];
}

type CollapsibleTypeOf = 'header' | 'icon' | 'disabled' | undefined;

/** items 项 → 面板渲染信息（key string 化 + collapsible/destroyOnHidden 覆盖链 + isActive）。 */
export interface PanelViewInfo {
  key: string;
  isActive: boolean;
  collapsible: CollapsibleTypeOf;
  destroyOnHidden: boolean | undefined;
  onItemClick: (key: string) => void;
  item: CollapseItemType;
}

export function buildPanelInfos(
  items: CollapseItemType[],
  options: {
    accordion?: boolean;
    collapsible?: CollapsibleTypeOf;
    destroyOnHidden?: boolean;
    activeKeys: string[];
    /** Collapse 层的 toggle（rc 的 onItemClick）。disabled 时被 handleItemClick 拦截。 */
    onItemTrigger: (key: string) => void;
  },
): PanelViewInfo[] {
  const { accordion, collapsible, destroyOnHidden, activeKeys, onItemTrigger } = options;
  return items.map((item, index) => {
    const key = String(item.key ?? index);
    const mergeCollapsible = item.collapsible ?? collapsible;
    const mergedDestroyOnHidden = item.destroyOnHidden ?? destroyOnHidden;
    const isActive = accordion ? activeKeys[0] === key : activeKeys.indexOf(key) > -1;
    // rc useItems 的 handleItemClick：disabled ⇒ 全部吞掉（含 Collapse 层 toggle）
    const handleItemClick = (value: string): void => {
      if (mergeCollapsible === 'disabled') {
        return;
      }
      onItemTrigger(value);
      item.onItemClick?.(value);
    };
    return {
      key,
      isActive,
      collapsible: mergeCollapsible,
      destroyOnHidden: mergedDestroyOnHidden,
      onItemClick: handleItemClick,
      item,
    };
  });
}
