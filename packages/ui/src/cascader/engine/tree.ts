/**
 * Cascader 依赖的两棵「树算法」—— `@rc-component/tree` 的 Vue 版移植。
 *
 * ── 为什么在这里，而不是独立包 ──────────────────────────────────────────────
 *
 * `foundation.json` 的开放决策 `early-extract-table-core-tree-core` 结论是
 * **A：不提前抽取独立包，等第二个消费者出现**。Cascader（多选的勾选传导）是第一个
 * 消费者，所以算法先落在 `cascader/engine/`；将来 Tree 组件需要时再按
 * `ActionButton` 那套做法提升到 `_internal/`（原位置留垫片）。
 *
 * ── 两个算法 ────────────────────────────────────────────────────────────────
 *
 * 1. `convertDataToEntities(dataNodes, config)` —— 把嵌套 options 摊成扁平实体表，
 *    并补出 `parent` / `children`（实体层面）与 `level` / `pos` / `nodes`（路径）。
 * 2. `conductCheck(keyList, checked, keyEntities)` —— 勾选传导：
 *    - `checked === true`（fill）：父选中 ⇒ 向下补全所有子；子全选 ⇒ 向上补父；
 *      部分选中 ⇒ 父记 halfChecked。
 *    - `checked === { checked: false, halfCheckedKeys }`（clean）：反向清理。
 *
 * 契约来源：`@rc-component/tree@1.x` 的 `es/utils/treeUtil.js`（convertDataToEntities /
 * traverseDataNodes）与 `es/utils/conductUtil.js`（conductCheck / fill+clean）。
 * 行为逐条对齐，**不复制源码**。
 */

/** 树节点实体。 */
export interface DataEntity {
  /** 原始节点。 */
  node: Record<string, unknown>;
  /** 从根到当前节点的原始节点链（Cascader 用它拼 pathKey）。 */
  nodes: Record<string, unknown>[];
  /** 在同级中的下标。 */
  index: number;
  /** 节点 key（`getKey(key, pos)`：key 缺失时回退 pos）。 */
  key: string;
  /** 位置串（形如 `0-1-2`）。 */
  pos: string;
  /** 层级（根为 0）。 */
  level: number;
  /** 父实体（根为 undefined）。 */
  parent?: DataEntity;
  /** 子实体列表（构造期填充）。 */
  children?: DataEntity[];
}

export interface Wrapper {
  posEntities: Record<string, DataEntity>;
  keyEntities: Record<string, DataEntity>;
  [key: string]: unknown;
}

export interface ConvertConfig {
  /** 用自定义字段解析（Cascader 传 `{ key: value字段, children }`）。 */
  fieldNames?: { key?: string; children?: string };
  /** 包装器扩展（Cascader 用它挂 `pathKeyEntities`）。 */
  initWrapper?: (wrapper: Wrapper) => Wrapper | undefined;
  /** 每个实体构造后的钩子（Cascader 用它把 key 覆写成 pathKey）。 */
  processEntity?: (entity: DataEntity, wrapper: Wrapper) => void;
  /** 全部处理完的钩子。 */
  onProcessFinished?: (wrapper: Wrapper) => void;
}

const DEFAULT_FIELD_NAMES = { key: 'key', children: 'children' };

function getPosition(level: string | number, index: number): string {
  return `${level}-${index}`;
}

function getKey(key: unknown, pos: string): string {
  return key !== null && key !== undefined ? String(key) : pos;
}

/**
 * 遍历嵌套数据（广度优先按层级展开，与上游同序）。
 *
 * ⚠️ 上游 `traverseDataNodes` 的 `nodes` 是**路径链**（根→当前），不是 children ——
 *    Cascader 的 `pathKey = nodes.map(v => v[value]).join(VALUE_SPLIT)` 依赖它。
 */
export function traverseDataNodes(
  dataNodes: Record<string, unknown>[],
  callback: (item: {
    node: Record<string, unknown>;
    index: number;
    pos: string;
    key: string;
    parentPos: string;
    level: number;
    nodes: Record<string, unknown>[];
  }) => void,
  config: ConvertConfig = {},
): void {
  const { key: fieldKey, children: fieldChildren } = {
    ...DEFAULT_FIELD_NAMES,
    ...(config.fieldNames ?? {}),
  };

  /**
   * @param level 本节点的 level；根调用传 **0** ⇒ 第一层节点的 level 为 0
   *              （rc-tree 的 level 从 0 起算）。⚠️ 不能用 `parentLevel + 1`
   *              的写法——虚拟根会把 -1 加成 0 再传给子，整体偏移一层。
   */
  function processNode(
    node: Record<string, unknown> | null,
    index: number,
    parent: { pos: string; level: number } | null,
    pathNodes: Record<string, unknown>[],
    level: number,
  ): void {
    const mergedParent = parent as { pos: string; level: number } | undefined;
    const children = (node ? node[fieldChildren] : dataNodes) as
      | Record<string, unknown>[]
      | undefined;
    // biome-ignore lint/style/noNonNullAssertion: node 非空时 mergedParent 必由调用方给出（pos/parentPos 都从它派生）
    const pos = node ? getPosition(mergedParent!.pos, index) : '0';
    const connectNodes = node ? [...pathNodes, node] : [];

    if (node) {
      callback({
        node,
        index,
        pos,
        key: getKey(node[fieldKey], pos),
        // biome-ignore lint/style/noNonNullAssertion: 同上 —— 这一支只在 node 非空时执行
        parentPos: mergedParent!.pos,
        level,
        nodes: connectNodes,
      });
    }

    (children ?? []).forEach((child, childIndex) => {
      processNode(child, childIndex, { pos, level }, connectNodes, level + 1);
    });
  }

  // ⚠️ 虚拟根的 level 是 **-1**：递归里 `level + 1` 后第一层节点的 level 才是 0
  //    （rc-tree 的 level 从 0 起算；传 0 会让整棵树偏移一层，conduct 的层级分组全错）
  processNode(null, 0, { pos: '0', level: -1 }, [], -1);
}

/**
 * 摊平嵌套数据为实体表。
 *
 * 与上游同构：同时产出 `posEntities` 与 `keyEntities`，`initWrapper` 可扩展包装器，
 * `processEntity` 在每个实体建好后回调（Cascader 借此把 `entity.key` 覆写成 pathKey）。
 */
export function convertDataToEntities(
  dataNodes: Record<string, unknown>[],
  config: ConvertConfig = {},
): Wrapper {
  const posEntities: Record<string, DataEntity> = {};
  const keyEntities: Record<string, DataEntity> = {};
  let wrapper: Wrapper = { posEntities, keyEntities };
  if (config.initWrapper) {
    wrapper = config.initWrapper(wrapper) ?? wrapper;
  }

  traverseDataNodes(
    dataNodes,
    (item) => {
      const { node, index, pos, key, parentPos, level, nodes } = item;
      const entity: DataEntity = { node, nodes, index, key, pos, level };
      const mergedKey = getKey(key, pos);

      posEntities[pos] = entity;
      keyEntities[mergedKey] = entity;

      entity.parent = posEntities[parentPos];
      if (entity.parent) {
        entity.parent.children = entity.parent.children || [];
        entity.parent.children.push(entity);
      }

      config.processEntity?.(entity, wrapper);
    },
    config,
  );

  config.onProcessFinished?.(wrapper);
  return wrapper;
}

// ================================ conduct ================================

export interface ConductResult {
  checkedKeys: string[];
  halfCheckedKeys: string[];
}

/** 上游 `isCheckDisabled`：`disabled` / `disableCheckbox` / `checkable === false`。 */
function isCheckDisabled(node: Record<string, unknown> | undefined): boolean {
  if (!node) return false;
  const { disabled, disableCheckbox, checkable } = node as {
    disabled?: boolean;
    disableCheckbox?: boolean;
    checkable?: boolean;
  };
  return !!(disabled || disableCheckbox) || checkable === false;
}

function removeFromCheckedKeys(
  halfCheckedKeys: Set<string>,
  checkedKeys: Set<string>,
): Set<string> {
  const filtered = new Set<string>();
  halfCheckedKeys.forEach((key) => {
    if (!checkedKeys.has(key)) filtered.add(key);
  });
  return filtered;
}

/** 按层级分组（上游 `conductCheck` 的第一步）。 */
function groupByLevel(keyEntities: Record<string, DataEntity>) {
  const levelEntities = new Map<number, Set<DataEntity>>();
  let maxLevel = 0;
  Object.keys(keyEntities).forEach((key) => {
    // noUncheckedIndexedAccess：索引访问可能 undefined（key 来自 Object.keys，防御式收窄）
    const entity = keyEntities[key];
    if (!entity) return;
    const { level } = entity;
    // ⚠️ 用局部变量接住（`get(...)!` 消不掉，且 `Map.get` 的返回类型永远是 `T | undefined`）
    let levelSet = levelEntities.get(level);
    if (!levelSet) {
      levelSet = new Set();
      levelEntities.set(level, levelSet);
    }
    levelSet.add(entity);
    maxLevel = Math.max(maxLevel, level);
  });
  return { levelEntities, maxLevel };
}

/** 自底向上：父的全部（非禁用）子是否都选中 / 部分选中。 */
function conductParent(
  levelEntities: Map<number, Set<DataEntity>>,
  maxLevel: number,
  checkedKeys: Set<string>,
  halfCheckedKeys: Set<string>,
  getDisabled: (node: Record<string, unknown>) => boolean,
  onAllChecked: (parentKey: string) => void,
  onPartialChecked: (parentKey: string) => void,
): void {
  const visitedKeys = new Set<string>();
  for (let level = maxLevel; level >= 0; level -= 1) {
    const entities = levelEntities.get(level) || new Set<DataEntity>();
    entities.forEach((entity) => {
      const { node } = entity;
      const parent = entity.parent;
      if (!parent || getDisabled(node) || visitedKeys.has(parent.key)) return;
      if (getDisabled(parent.node)) {
        visitedKeys.add(parent.key);
        return;
      }
      let allChecked = true;
      let partialChecked = false;
      (parent.children || [])
        .filter((childEntity) => !getDisabled(childEntity.node))
        .forEach(({ key }) => {
          const checked = checkedKeys.has(key);
          if (allChecked && !checked) allChecked = false;
          if (!partialChecked && (checked || halfCheckedKeys.has(key))) partialChecked = true;
        });
      if (allChecked) onAllChecked(parent.key);
      if (partialChecked) onPartialChecked(parent.key);
      visitedKeys.add(parent.key);
    });
  }
}

function fillConductCheck(
  keys: Set<string>,
  levelEntities: Map<number, Set<DataEntity>>,
  maxLevel: number,
  getDisabled: (node: Record<string, unknown>) => boolean,
): ConductResult {
  const checkedKeys = new Set(keys);
  const halfCheckedKeys = new Set<string>();

  // 自顶向下：父选中 ⇒ 补子
  for (let level = 0; level <= maxLevel; level += 1) {
    const entities = levelEntities.get(level) || new Set<DataEntity>();
    entities.forEach(({ key, node, children = [] }) => {
      if (checkedKeys.has(key) && !getDisabled(node)) {
        children
          .filter((childEntity) => !getDisabled(childEntity.node))
          .forEach((childEntity) => {
            checkedKeys.add(childEntity.key);
          });
      }
    });
  }

  // 自底向上：子全选 ⇒ 补父；部分 ⇒ half
  conductParent(
    levelEntities,
    maxLevel,
    checkedKeys,
    halfCheckedKeys,
    getDisabled,
    (parentKey) => checkedKeys.add(parentKey),
    (parentKey) => halfCheckedKeys.add(parentKey),
  );

  return {
    checkedKeys: Array.from(checkedKeys),
    halfCheckedKeys: Array.from(removeFromCheckedKeys(halfCheckedKeys, checkedKeys)),
  };
}

function cleanConductCheck(
  keys: Set<string>,
  halfKeys: Set<string>,
  levelEntities: Map<number, Set<DataEntity>>,
  maxLevel: number,
  getDisabled: (node: Record<string, unknown>) => boolean,
): ConductResult {
  const checkedKeys = new Set(keys);
  let halfCheckedKeys = new Set(halfKeys);

  // 自顶向下：未选中且非半选 ⇒ 清掉子
  for (let level = 0; level <= maxLevel; level += 1) {
    const entities = levelEntities.get(level) || new Set<DataEntity>();
    entities.forEach(({ key, node, children = [] }) => {
      if (!checkedKeys.has(key) && !halfCheckedKeys.has(key) && !getDisabled(node)) {
        children
          .filter((childEntity) => !getDisabled(childEntity.node))
          .forEach((childEntity) => {
            checkedKeys.delete(childEntity.key);
          });
      }
    });
  }

  // ⚠️ 自底向上必须**单遍**：`delete(parent.key)` 会立刻影响更高一层的判定
  //    （上游就是同一轮里先算 allChecked / partialChecked 再改 checkedKeys）。
  //    拆成两遍会让高层读到「本该删掉的父」，half 集合偏大。
  halfCheckedKeys = new Set<string>();
  const visitedKeys = new Set<string>();
  for (let level = maxLevel; level >= 0; level -= 1) {
    const entities = levelEntities.get(level) || new Set<DataEntity>();
    entities.forEach((entity) => {
      const { parent, node } = entity;
      if (getDisabled(node) || !parent || visitedKeys.has(parent.key)) return;
      if (getDisabled(parent.node)) {
        visitedKeys.add(parent.key);
        return;
      }
      let allChecked = true;
      let partialChecked = false;
      (parent.children || [])
        .filter((childEntity) => !getDisabled(childEntity.node))
        .forEach(({ key }) => {
          const isChecked = checkedKeys.has(key);
          if (allChecked && !isChecked) allChecked = false;
          if (!partialChecked && (isChecked || halfCheckedKeys.has(key))) partialChecked = true;
        });
      if (!allChecked) checkedKeys.delete(parent.key);
      if (partialChecked) halfCheckedKeys.add(parent.key);
      visitedKeys.add(parent.key);
    });
  }

  return {
    checkedKeys: Array.from(checkedKeys),
    halfCheckedKeys: Array.from(removeFromCheckedKeys(halfCheckedKeys, checkedKeys)),
  };
}

/**
 * 勾选传导。
 *
 * @param keyList 当前 key 列表
 * @param checked `true` = fill（补全）；`{ checked: false, halfCheckedKeys }` = clean（清理）
 * @param keyEntities `convertDataToEntities` 产出的 `keyEntities`
 */
export function conductCheck(
  keyList: string[],
  checked: true | { checked: false; halfCheckedKeys: string[] },
  keyEntities: Record<string, DataEntity>,
  getCheckDisabled?: (node: Record<string, unknown>) => boolean,
): ConductResult {
  const getDisabled = getCheckDisabled ?? isCheckDisabled;

  // 只处理存在的 key（上游会 warning 缺失的 key，本仓静默过滤）
  const keys = new Set(keyList.filter((key) => !!keyEntities[key]));

  const { levelEntities, maxLevel } = groupByLevel(keyEntities);

  if (checked === true) {
    return fillConductCheck(keys, levelEntities, maxLevel, getDisabled);
  }
  return cleanConductCheck(
    keys,
    new Set(checked.halfCheckedKeys),
    levelEntities,
    maxLevel,
    getDisabled,
  );
}
