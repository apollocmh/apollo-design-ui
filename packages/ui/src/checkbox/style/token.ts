/**
 * Checkbox 的 Component Token —— **0 个**。
 *
 * 契约来源：antd 6.6.4 的 `es/checkbox/style/index.js` 的 `genStyleHooks('Checkbox', …)`
 * **没有传 `prepareComponentToken`**（第二个参数直接是样式函数）—— 即 Checkbox
 * 没有任何 Component Token，样式全部消费 alias token（`controlInteractiveSize`、
 * `colorPrimary`、`colorBorder` 等）。
 *
 * 所以本文件只是**显式记录这个契约**（watermark 的「无样式表」同理）：
 * - 不产出 `--apollo-checkbox-*` 变量（B7 无需校验）；
 * - 用户想改尺寸走 ConfigProvider 的全局 token（`controlInteractiveSize`）。
 */

/** Checkbox 无 Component Token —— 类型为空对象，防止误加。 */
export type ComponentToken = Record<string, never>;
