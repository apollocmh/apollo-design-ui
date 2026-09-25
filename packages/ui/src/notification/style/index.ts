/**
 * Notification 的样式生成（G4 产物落点）。
 *
 * 契约来源：antd 6.6.4 的 es/notification/style/index.js。
 * 选择器结构必须从 antd 真实产物提取（@ant-design/cssinjs extractStyle），**不要推演**。
 *
 * 易错点（divider/affix 实测）：
 *   - cssinjs 的 `&` 是复合选择器、普通键是后代选择器，搞反会让样式串形态
 *   - 内联 style 的数字必须转 px 字符串 —— Vue patchStyle 不做转换，裸数字被静默丢弃
 *   - 每个 var(--apollo-*) 必须在 theme 的 tokens.css 有声明（test:build B7 校验）
 *   - 无字面视觉值（H9）；cssinjs 的 hash 包裹层不复制（差异 D5）
 */
// TODO(G4): 实现 genNotificationStyle(prefixCls: string): string 并在 index.ts 导出
