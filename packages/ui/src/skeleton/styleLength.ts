/**
 * React `dangerousStyleValue` 的数值长度补全规则（**只保留我们需要的部分**）。
 *
 * ── 为什么必须有这个模块 ──────────────────────────────────────────────────────
 *
 * antd 在好几处把**数字**直接写进内联样式（`Skeleton.Element` 的
 * `{ width: size, height: size, lineHeight: `${size}px` }`、`Title` 的 `width`、
 * `Paragraph` 每行的 `width`）。React 在序列化时会替它补单位：
 *
 * ```
 * dangerousStyleValue(name, value):
 *   value === 0 || isUnitless(name)  →  '' + value          // 0 → "0"，lineHeight 是 unitless
 *   typeof value === 'number'        →  value + 'px'        // 100 → "100px"
 *   其余（字符串 / NaN / null / ''）  →  '' + value
 * ```
 *
 * **Vue 不补**（PITFALLS 第 32 条）：`runtime-dom` 的 `setStyle` 只是
 * `style[prefixed] = val`，`style.width = 100` 会被 cssstyle / 浏览器**静默丢弃**。
 * SSR 侧的 `stringifyStyle` 更直接 —— `width:100` 原样写进 HTML，而 React 写的是
 * `width:100px`。两种形态都会被 L4 的 `normalizeStyle` 当成**真差异**报出来。
 *
 * 所以数值长度必须由组件自己落成字符串，规则与 React **逐字一致**：
 *
 * | 输入 | React 输出 | 本模块输出 |
 * |---|---|---|
 * | `100` | `100px` | `100px` |
 * | `0` | `0` | `0` |
 * | `'50%'` | `50%` | `50%` |
 * | `'2em'` | `2em` | `2em` |
 * | `undefined` / `null` | **整条声明不输出** | `undefined` |
 * | `''` | **整条声明不输出** | `undefined` |
 *
 * 最后两行是实测结论（`renderToStaticMarkup`）：React 对「值为空串」的声明
 * **不输出**，而不是输出 `width:;`。`styleAttrs()` 只看 `undefined`，
 * 所以空串必须在**这里**就折成 `undefined`。
 *
 * ⚠️ 它**不**处理 `NaN`：React 输出 `NaNpx`（并打一条 dev 警告），我们照做
 *    —— 刻意不做「更合理」的兜底，否则两侧行为分叉。
 *
 * ⚠️ 它**不**负责 `unitless` 属性（`lineHeight` / `opacity` / `flex`…）。
 *    antd 在这些地方自己拼了 `px`（`lineHeight: `${size}px``），我们逐字跟随。
 *    把 unitless 表也搬过来等于实现一条上游没走的路径。
 *
 * ⚠️ 用户通过 `styles` 传进来的**数字**值**不会**经过这里 —— 与 divider 同一条
 *    平台差异（`mergedStyles` 原样落到 DOM）。要断言数值样式请传字符串。
 */

/**
 * 把 `number | string` 落成 CSS 长度字符串。空值折成 `undefined`（整条声明不输出）。
 *
 * @example
 * ```ts
 * toCssLength(100);      // '100px'
 * toCssLength(0);        // '0'
 * toCssLength('38%');    // '38%'
 * toCssLength(undefined); // undefined
 * ```
 */
export function toCssLength(value: number | string | undefined | null): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'number') return value;
  return value === 0 ? '0' : `${value}px`;
}
