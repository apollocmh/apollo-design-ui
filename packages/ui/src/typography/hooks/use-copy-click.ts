/**
 * `useCopyClick` —— `copyable` 的点击逻辑。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/hooks/useCopyClick.js`（**逐条对齐**）。
 *
 * ```
 * setCopyLoading(true)
 * text = isFunction(copyConfig.text) ? await copyConfig.text() : copyConfig.text
 * await copy(text || toList(children, {skipEmpty:true}).join('') || '')
 * setCopyLoading(false)
 * setCopied(true, true)      ← 立即
 * setCopied(false, {ms:3000})← 3 秒后
 * copyConfig.onCopy?.(e)
 * ```
 *
 * ── 三处必须保留的细节 ────────────────────────────────────────────────────────
 *
 *   1. **`setCopied(true, true)` 与 `setCopied(false, {ms:3000})` 是连着调的两句**。
 *      `useDelayState` 的语义是「新调度替换旧调度」，所以第二句会**取消**第一句的
 *      待执行更新；`true` 因为走的是立即分支已经写进去了，于是最终效果是
 *      「立刻变已复制，3 秒后自动复原」。少写第一句的 `true` 会变成「3 秒后才变」。
 *   2. **`copy(...)` 的返回值被忽略**。剪贴板写入失败**不算失败**：上游照样进入
 *      「已复制」状态并触发 `onCopy`。这不是 bug —— `execCopy` 在 jsdom 里恒为
 *      `false`，若据此报错，SSR / 测试环境会全红。
 *   3. **`e?.preventDefault()` + `e?.stopPropagation()`**。少了 `stopPropagation`，
 *      按钮的点击会冒泡到 `Base` 根元素，在 `triggerType: ['text']` 下会**同时**
 *      触发编辑态。
 *
 * ── 与 antd 的一处平台差异（PLATFORM）──────────────────────────────────────────
 *
 * antd 用 `useEvent` 包一层拿「永远是最新引用的稳定函数」。Vue 里没有这个需要：
 * 本函数返回的 `onClick` 每次渲染重建，但它只通过 `h()` 传给按钮，不参与任何
 * 依赖比较。语义等价。
 *
 * ── 这个模块没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明真的写进了系统剪贴板（jsdom 没有 `navigator.clipboard`）。见 `_util/copy.ts`。
 */

import { isFunction, toList, useDelayState } from '@apollo-design/utils';
import { type MaybeRefOrGetter, type Ref, ref, toValue, type VNodeChild } from 'vue';

import copy from '../_util/copy';
import type { CopyConfig } from '../interface';

export interface UseCopyClickOptions {
  /** 已合并的复制配置。 */
  copyConfig: MaybeRefOrGetter<CopyConfig>;
  /** 默认插槽内容。`copyable.text` 未给时用它拼兜底文本。 */
  children: MaybeRefOrGetter<VNodeChild>;
}

export interface UseCopyClickResult {
  /** 是否处于「已复制」态（3 秒后自动复原）。 */
  copied: Ref<boolean>;
  /** 剪贴板写入进行中。 */
  copyLoading: Ref<boolean>;
  /** 点击处理器。 */
  onClick: (e?: MouseEvent) => Promise<void>;
}

export function useCopyClick(options: UseCopyClickOptions): UseCopyClickResult {
  const [copied, setCopied] = useDelayState(false);
  const copyLoading = ref(false);

  const onClick = async (e?: MouseEvent): Promise<void> => {
    e?.preventDefault();
    e?.stopPropagation();

    const config = toValue(options.copyConfig);

    copyLoading.value = true;
    try {
      const text = isFunction(config.text) ? await config.text() : config.text;
      await copy(
        text || toList(toValue(options.children), { skipEmpty: true }).join('') || '',
        config.format ? { format: config.format } : undefined,
      );
      copyLoading.value = false;

      setCopied(true, true);
      // 触发提示更新：3 秒后复原（这一句会替换掉上一句的待执行更新）
      setCopied(false, { ms: 3000 });

      config.onCopy?.(e);
    } catch (error) {
      copyLoading.value = false;
      throw error;
    }
  };

  return { copied, copyLoading, onClick };
}
