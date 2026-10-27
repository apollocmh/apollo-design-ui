import { getCurrentInstance, onMounted, onScopeDispose, onUpdated, shallowRef, watch } from 'vue';
import type { ContainerLike } from './container';

export function isNode(value: unknown): value is Node {
  return (
    !!value &&
    typeof value === 'object' &&
    'nodeType' in value &&
    typeof value.nodeType === 'number' &&
    'getRootNode' in value &&
    typeof value.getRootNode === 'function'
  );
}

/** Teleport effects belong to its target document; inline effects use its source anchor. */
export function usePortalDocument(
  getContainer: () => ContainerLike | false | null,
  inline: () => boolean,
  active: () => boolean,
) {
  const instance = getCurrentInstance();
  const doc = shallowRef<Document | null>(null);
  let observedDocument: Document | null = null;
  let observedRoots: Node[] = [];
  let observer: MutationObserver | undefined;
  let disposed = false;
  const refresh = () => {
    if (disposed) return;
    const container = getContainer();
    const anchor: unknown = instance?.subTree?.el;
    const node = inline() ? (isNode(anchor) ? anchor : null) : container || null;
    const next = node?.ownerDocument ?? null;
    const roots: Node[] = next ? [next] : [];
    let root = node?.getRootNode();
    while (root && root !== next) {
      roots.push(root);
      root = 'host' in root && isNode(root.host) ? root.host.getRootNode() : undefined;
    }
    doc.value = next;
    if (!active()) {
      observer?.disconnect();
      observedDocument = null;
      observedRoots = [];
      return;
    }
    if (
      next === observedDocument &&
      roots.length === observedRoots.length &&
      roots.every((root, index) => root === observedRoots[index])
    )
      return;
    observer?.disconnect();
    observedDocument = next;
    observedRoots = roots;
    const view = next?.defaultView;
    if (!next || !view) return;
    observer = new view.MutationObserver(refresh);
    for (const root of roots) observer.observe(root, { childList: true, subtree: true });
  };
  watch([getContainer, inline, active], refresh, { immediate: true, flush: 'post' });
  onMounted(refresh);
  onUpdated(refresh);
  onScopeDispose(() => {
    disposed = true;
    observer?.disconnect();
  });
  return doc;
}
