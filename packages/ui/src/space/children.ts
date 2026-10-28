import { isEmptyVNode, toArray } from '@apollo-design/utils';
import { Fragment, isVNode, type VNode, type VNodeChild } from 'vue';

export interface SpaceChild {
  node: VNode;
  key: symbol;
}

interface Identity {
  key: symbol;
  keyed: Map<PropertyKey, Identity>;
  positional: Map<number, Identity>;
}

const identity = (): Identity => ({
  key: Symbol('space-child'),
  keyed: new Map(),
  positional: new Map(),
});

/** Preserve Vue key scopes while flattening fragments; retain only the current identity tree. */
export function createSpaceChildren(keepEmpty = false): (children: VNodeChild) => SpaceChild[] {
  const root = identity();
  return (children) => {
    const result: SpaceChild[] = [];
    const collect = (content: VNodeChild, parent: Identity): void => {
      const nextKeyed = new Map<PropertyKey, Identity>();
      const nextPositional = new Map<number, Identity>();
      const list = Array.isArray(content) ? content : [content];
      list.forEach((child, index) => {
        const key = isVNode(child) ? child.key : null;
        const branch =
          key !== null
            ? (parent.keyed.get(key) ?? identity())
            : (parent.positional.get(index) ?? identity());
        if (key !== null) nextKeyed.set(key, branch);
        else nextPositional.set(index, branch);
        if (Array.isArray(child)) collect(child, branch);
        else if (isVNode(child) && child.type === Fragment) {
          const nested = child.children;
          if (Array.isArray(nested) || typeof nested === 'string' || nested === null)
            collect(nested, branch);
        } else {
          for (const node of toArray(child, { keepEmpty })) {
            if (keepEmpty || !isEmptyVNode(node)) result.push({ node, key: branch.key });
          }
        }
      });
      parent.keyed = nextKeyed;
      parent.positional = nextPositional;
    };
    collect(children, root);
    return result;
  };
}
