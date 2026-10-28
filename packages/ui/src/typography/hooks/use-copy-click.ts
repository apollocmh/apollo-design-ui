/** Clipboard timing originally referenced antd6.6.4 useCopyClick.
 * Vue owns one in-flight request and reports only successful writes. */
import { isFunction, useDelayState } from '@apollo-design/utils';
import {
  type MaybeRefOrGetter,
  onScopeDispose,
  type Ref,
  ref,
  toValue,
  type VNodeChild,
} from 'vue';
import copy from '../_util/copy';
import { plainText, toNodeList } from '../_util/nodes';
import type { CopyConfig } from '../interface';

export interface UseCopyClickOptions {
  copyConfig: MaybeRefOrGetter<CopyConfig>;
  children: MaybeRefOrGetter<VNodeChild>;
}
export interface UseCopyClickResult {
  copied: Ref<boolean>;
  copyLoading: Ref<boolean>;
  onClick: (event?: MouseEvent) => Promise<void>;
}
export function useCopyClick(options: UseCopyClickOptions): UseCopyClickResult {
  const [copied, setCopied] = useDelayState(false);
  const copyLoading = ref(false);
  let active = true;
  onScopeDispose(() => {
    active = false;
  });
  const onClick = async (event?: MouseEvent): Promise<void> => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!active || copyLoading.value) return;
    const config = toValue(options.copyConfig);
    const fallback = plainText(toNodeList(toValue(options.children)));
    copyLoading.value = true;
    try {
      const text = isFunction(config.text) ? await config.text() : config.text;
      const success = await copy(
        text ?? fallback,
        config.format ? { format: config.format } : undefined,
      );
      if (!active || !success) return;
      setCopied(true, true);
      setCopied(false, { ms: 3000 });
      config.onCopy?.(event);
    } finally {
      if (active) copyLoading.value = false;
    }
  };
  return { copied, copyLoading, onClick };
}
