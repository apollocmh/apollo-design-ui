/**
 * `useKeyRecords` —— rc-menu `hooks/useKeyRecords.js` 的 Vue 版。
 *
 * key ↔ 路径 的双向登记表（键盘导航与 open 级联关闭的查找基础）。
 * 路径串用 `__RC_UTIL_PATH_SPLIT__` 连接（rc 逐字保留 —— 序列化格式是
 * 映射表的 key，不能换）。
 */
import { type Ref, ref } from 'vue';

const PATH_SPLIT = '__RC_UTIL_PATH_SPLIT__';

const getPathStr = (keyPath: string[]): string => keyPath.join(PATH_SPLIT);
const getPathKeys = (keyPathStr: string): string[] => keyPathStr.split(PATH_SPLIT);

/** rc 的 OVERFLOW_KEY（overflowed 折叠子菜单的保留 key）。 */
export const OVERFLOW_KEY = 'rc-menu-more';

export interface KeyRecords {
  registerPath: (key: string, keyPath: string[]) => void;
  unregisterPath: (key: string, keyPath: string[]) => void;
  refreshOverflowKeys: (keys: string[]) => void;
  isSubPathKey: (pathKeys: string[], eventKey: string) => boolean;
  getKeyPath: (eventKey: string, includeOverflow?: boolean) => string[];
  getKeys: () => string[];
  getSubPathKeys: (key: string) => Set<string>;
  /** Vue 化补充：key2path 的只读视图（测试用）。 */
  key2path: Ref<Map<string, string>>;
}

export function useKeyRecords(): KeyRecords {
  const key2path = ref(new Map<string, string>());
  const path2key = ref(new Map<string, string>());
  const overflowKeys = ref<string[]>([]);

  const registerPath = (key: string, keyPath: string[]): void => {
    const connectedPath = getPathStr(keyPath);
    const nextPath2key = new Map(path2key.value);
    nextPath2key.set(connectedPath, key);
    path2key.value = nextPath2key;
    const nextKey2path = new Map(key2path.value);
    nextKey2path.set(key, connectedPath);
    key2path.value = nextKey2path;
  };

  const unregisterPath = (key: string, keyPath: string[]): void => {
    const connectedPath = getPathStr(keyPath);
    const nextPath2key = new Map(path2key.value);
    nextPath2key.delete(connectedPath);
    path2key.value = nextPath2key;
    const nextKey2path = new Map(key2path.value);
    nextKey2path.delete(key);
    key2path.value = nextKey2path;
  };

  const refreshOverflowKeys = (keys: string[]): void => {
    overflowKeys.value = keys;
  };

  const getKeyPath = (eventKey: string, includeOverflow?: boolean): string[] => {
    const fullPath = key2path.value.get(eventKey) || '';
    const keys = getPathKeys(fullPath);
    if (includeOverflow && overflowKeys.value.includes(keys[0] ?? '')) {
      keys.unshift(OVERFLOW_KEY);
    }
    return keys;
  };

  const isSubPathKey = (pathKeys: string[], eventKey: string): boolean =>
    pathKeys
      .filter((item) => item !== undefined)
      .some((pathKey) => {
        const pathKeyList = getKeyPath(pathKey, true);
        return pathKeyList.includes(eventKey);
      });

  const getKeys = (): string[] => {
    const keys = [...key2path.value.keys()];
    if (overflowKeys.value.length) {
      keys.push(OVERFLOW_KEY);
    }
    return keys;
  };

  const getSubPathKeys = (key: string): Set<string> => {
    const connectedPath = `${key2path.value.get(key)}${PATH_SPLIT}`;
    const pathKeys = new Set<string>();
    for (const pathKey of path2key.value.keys()) {
      if (pathKey.startsWith(connectedPath)) {
        pathKeys.add(path2key.value.get(pathKey) ?? '');
      }
    }
    return pathKeys;
  };

  return {
    registerPath,
    unregisterPath,
    refreshOverflowKeys,
    isSubPathKey,
    getKeyPath,
    getKeys,
    getSubPathKeys,
    key2path,
  };
}
