/**
 * 把文本写进剪贴板。
 *
 * 契约来源：antd 6.6.4 的 `es/_util/copy.js`（**逐条对齐**）：
 *
 * ```
 * asyncCopy（navigator.clipboard） → execCopy（document.execCommand） → false
 * ```
 *
 * 三条必须保留的判据：
 *
 *   1. **优先异步 API**，失败才退回 `execCommand`。异步路径在非安全上下文
 *      （http、file://）或没有用户手势时会抛错，所以退回路径不是死代码。
 *   2. **`text/html` 格式要用 `ClipboardItem`**，且同时写 `text/html` 与 `text/plain`
 *      两份 —— 只写 html 的话纯文本目标（终端、VSCode）会粘贴出空。
 *   3. **非字符串输入返回 `false` 并告警**，不做 `String()` 转换。
 *      `copy(undefined)` 是「调用方搞错了」，静默转成 `"undefined"` 会让用户把
 *      `"undefined"` 粘到别处。
 *
 * ── 为什么放在组件目录而不是 `packages/utils` ──────────────────────────────────
 *
 * 它是 antd `_util` 里的公共工具，理应进 `packages/utils`。但本次改动的允许范围
 * 只有 `packages/ui/src/typography/**`，而**首个消费者就是本组件**。
 * 等第二个消费者出现（Upload / Table 的复制）时上移 —— 现在上移会越界改动共享包。
 * 登记在 README §7。
 *
 * ── 这个模块没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明真的写进了系统剪贴板：jsdom 没有 `navigator.clipboard`，L1/L2 只能断言
 *     「两条路径都被按顺序尝试过、失败时返回 false」（用 spy 注入假实现）。
 *     真实剪贴板行为由浏览器保证，不在本仓库的可测范围。
 */

import { warning } from '@apollo-design/utils';

/** `copy` 的选项。与 antd 的 `config` 一致。 */
export interface CopyOptions {
  format?: 'text/plain' | 'text/html';
}

/** `document.execCommand('copy')` 路径。返回是否成功。 */
function execCopy(text: string, isHtmlFormat: boolean): boolean {
  let copySuccess = false;

  const onCopy = (event: ClipboardEvent): void => {
    event.stopPropagation();
    event.preventDefault();
    event.clipboardData?.clearData();
    event.clipboardData?.setData('text/plain', text);
    if (isHtmlFormat) {
      event.clipboardData?.setData('text/html', text);
    }
    copySuccess = true;
  };

  try {
    document.addEventListener('copy', onCopy, { capture: true });
    document.execCommand('copy');
    return copySuccess;
  } catch {
    return false;
  } finally {
    document.removeEventListener('copy', onCopy, { capture: true });
  }
}

/** `navigator.clipboard` 路径。返回是否成功。 */
async function asyncCopy(text: string, isHtmlFormat: boolean): Promise<boolean> {
  try {
    if (isHtmlFormat) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([text], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ]);
    } else {
      await navigator.clipboard.writeText(text);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * 复制文本。返回是否成功。
 *
 * ⚠️ 两处环境守卫不是「防御式编程」：`navigator.clipboard` 在 SSR 与
 *    非安全上下文下**不存在**，直接读会抛 `TypeError`；
 *    `ClipboardItem` 同理（Safari 13 之前没有）。antd 用 `try/catch` 兜住，
 *    这里用显式判定 + `try/catch` —— 判定的好处是「没有 API」不会留下一条
 *    被吞掉的异常（那会让 `copyLoading` 的时序断言变得依赖实现）。
 */
export default async function copy(text: string, config?: CopyOptions): Promise<boolean> {
  if (typeof text !== 'string') {
    // 用 rc 层的 `warning` 而不是 `useDevWarning`：后者要在 `setup()` 同步阶段调用，
    // 而这里是普通函数。antd 在这一处用的也是 rc 层的 warning。
    warning(false, 'The clipboard content must be of string type');
    return false;
  }

  const isHtmlFormat = config?.format === 'text/html';

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    if (await asyncCopy(text, isHtmlFormat)) {
      return true;
    }
  }

  if (execCopy(text, isHtmlFormat)) {
    return true;
  }

  return false;
}
