/**
 * Avatar 的样式生成（G4 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/avatar/style/index.js`（237 行）。选择器结构
 * **从真实产物提取**，不是推演 —— 可复现命令：
 *
 * ```sh
 * node tests/visual/debug/extract-avatar-css.mjs > /tmp/avatar-antd.css
 * ```
 *
 * 产物共 **24 条** `ant-avatar` 规则；本文件产出 **19 条**，差掉的 5 条是：
 * `resetComponent` 的 4 条 `box-sizing` 块（`BASE_CSS` 已覆盖，`badge` / `card` 范式）
 * 与 1 个 `.css-var-*` 声明块（其 12 条声明由 `genTokenDecls` 内联进根规则）。
 *
 * ── 从产物里抄下来的四处**非显然**结构 ────────────────────────────────────────
 *
 * 1. **`avatarSizeStyle` 是「一个工厂、三处复用」**（base / `-lg` / `-sm`）⇒ 它产出的
 *    `-square` / `-icon` 规则是**复合选择器**（`.{p}.{p}-square`），不是后代选择器。
 *    搞反会让「方形」作用到所有子孙。
 * 2. **两条规则用的是 `antCls` / `iconCls`，不是 `componentCls`**：
 *    `.{p} .{p}-image-img`（`.apollo-image-img`）与 `.{p}.{p}-icon > .apollo-icon`
 *    ⇒ D15 家族（`.anticon` → `.apollo-icon`）。
 * 3. **`-group` 的第三条是「子选择器 + `:not()`」**：`.{p}-group > *:not(:first-child)`
 *    —— 少一个 `>` 语义就变了（会作用到孙子）。
 * 4. **`resetComponent` 在产物里被 scoped 到 `.ant-avatar-css-var`**（cssVar 模式的产物形态；
 *    非 cssVar 时是 `.ant-avatar`）。本仓按 `card` / `breadcrumb` 的既有范式
 *    **合并进根规则**（`BASE_CSS` 已覆盖 box-sizing）。
 *
 * ── 2 个 `mergeToken` 派生的落点 ───────────────────────────────────────────────
 *
 * `avatarBg` / `avatarColor` 在上游是 `mergeToken` 派生（用户不可覆盖），产物里直接展开成
 * **全局** token 引用 ⇒ 本文件写 `var(--apollo-color-text-placeholder)` /
 * `var(--apollo-color-text-light-solid)`（详见 `style/token.ts`）。
 *
 * ── 这个函数证明什么 / 不证明什么 ────────────────────────────────────────────
 *
 * 证明：19 条规则的**选择器结构与声明顺序**与产物逐条对应；12 个 Component Token 的
 * 变量名与**构建期解析值**一致（`genTokenDecls`）。
 *
 * 不证明：视觉正确（L6 逐像素负责）；变量名存在于 `tokens.css`
 * （`test:build` 的 B7 校验）；`--apollo-*` 全局 token 的取值（theme 包负责）。
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';
import { type ComponentToken, prepareComponentToken } from './token';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

let tokenCache: ComponentToken | null = null;

function avatarTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken()) as ComponentToken;
  }
  return tokenCache;
}

/** 数字带 `px`、字符串原样 —— 与 cssinjs 的 `unit()` 同义。 */
const unit = (value: number | string): string =>
  typeof value === 'number' ? `${value}px` : String(value);

/**
 * Component Token 的声明块（**12** 个字段，构建期解析值）。
 *
 * ⚠️ 顺序与产物的 css-var 块一致（`container-size` → `container-size-lg` →
 * `container-size-sm` → `text-font-size` → `text-font-size-lg` → `text-font-size-sm`
 * → `icon-font-size` → `icon-font-size-lg` → `icon-font-size-sm` → `group-space`
 * → `group-overlapping` → `group-border-color`）。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const p = rootPrefixCls;
  const t = avatarTokenValues();
  return [
    `  --${p}-avatar-container-size:${unit(t.containerSize)};`,
    `  --${p}-avatar-container-size-lg:${unit(t.containerSizeLG)};`,
    `  --${p}-avatar-container-size-sm:${unit(t.containerSizeSM)};`,
    `  --${p}-avatar-text-font-size:${unit(t.textFontSize)};`,
    `  --${p}-avatar-text-font-size-lg:${unit(t.textFontSizeLG)};`,
    `  --${p}-avatar-text-font-size-sm:${unit(t.textFontSizeSM)};`,
    `  --${p}-avatar-icon-font-size:${unit(t.iconFontSize)};`,
    `  --${p}-avatar-icon-font-size-lg:${unit(t.iconFontSizeLG)};`,
    `  --${p}-avatar-icon-font-size-sm:${unit(t.iconFontSizeSM)};`,
    `  --${p}-avatar-group-space:${unit(t.groupSpace)};`,
    `  --${p}-avatar-group-overlapping:${unit(t.groupOverlapping)};`,
    `  --${p}-avatar-group-border-color:${unit(t.groupBorderColor)};`,
  ];
}

export function genAvatarStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  const cls = `.${p}-avatar`;
  const icon = `.${p}-icon`;
  const group = `${cls}-group`;

  /** Component Token 的变量引用（`--{p}-avatar-*`）。 */
  const tv = (name: string): string => `var(--${p}-avatar-${name})`;

  /**
   * 尺寸工厂（上游 `avatarSizeStyle` 的**外层**部分）。**三处复用**：base / `-lg` / `-sm`。
   * 产出的 4 条声明在三个尺寸下形状完全相同，只有取值不同。
   */
  const sizeStyle = (size: string, fontSize: string): string[] => [
    `  width:${size};`,
    `  height:${size};`,
    `  border-radius:50%;`,
    `  font-size:${fontSize};`,
  ];

  /**
   * 尺寸工厂的**嵌套部分**（上游 `&{componentCls}-square` / `&{componentCls}-icon`）。
   *
   * ⚠️ 是**复合选择器**（`&` 拼接），不是后代 —— 即 `.{p}-avatar.{p}-avatar-square`
   *    与 `.{p}-avatar-lg.{p}-avatar-square`。`selector` 由调用方给（base 是 `cls`，
   *    `-lg` / `-sm` 是 `${cls}-lg` / `${cls}-sm`）。
   */
  const sizeVariants = (selector: string, radius: string, iconFontSize: string): string[] => [
    `${selector}.${p}-avatar-square{`,
    `  border-radius:${radius};`,
    `}`,
    `${selector}.${p}-avatar-icon{`,
    `  font-size:${iconFontSize};`,
    `}`,
    `${selector}.${p}-avatar-icon >${icon}{`,
    `  margin:0;`,
    `}`,
  ];

  return [
    // ---- 根：cssinjs 包裹层 + resetComponent 展开（box-sizing 块不产出）+ genBaseStyle ----
    `${cls}{`,
    // 🚨 **Component Token 的声明块必须内联在根规则里**（anchor / breadcrumb / card 同一写法）。
    //    漏了它 = 12 个 `--apollo-avatar-*` **全部未声明** ⇒ `width:var(...)` /
    //    `background:var(...)` 静默失效（未定义 var 不是回退默认值，而是
    //    invalid at computed-value time）⇒ 头像全部塌成 0×0，而
    //    `lint:types` / L1 / L3 / L5 全绿。两道防线：L6 像素差 + `theme.test.ts`
    //    的「声明 ↔ 引用」双向检查。
    ...genTokenDecls(p),
    `  box-sizing:border-box;`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${v('colorTextLightSolid')};`,
    `  font-size:${tv('text-font-size')};`,
    `  line-height:${v('lineHeight')};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    `  position:relative;`,
    `  display:inline-flex;`,
    `  justify-content:center;`,
    `  align-items:center;`,
    `  overflow:hidden;`,
    `  white-space:nowrap;`,
    `  text-align:center;`,
    `  vertical-align:middle;`,
    `  background:${v('colorTextPlaceholder')};`,
    `  border:${v('lineWidth')} ${v('lineType')} transparent;`,
    ...sizeStyle(tv('container-size'), tv('text-font-size')),
    `}`,

    // ---- 图片态（`-image` 去掉背景）----
    `${cls}-image{`,
    `  background:transparent;`,
    `}`,
    // ⚠️ 用的是 **antCls**（`.apollo-image-img`），不是 componentCls
    `${cls} .${p}-image-img{`,
    `  display:block;`,
    `}`,

    // ---- base 的两条尺寸附属（复合选择器）----
    ...sizeVariants(cls, v('borderRadius'), tv('icon-font-size')),

    // ---- size=large ----
    `${cls}-lg{`,
    ...sizeStyle(tv('container-size-lg'), tv('text-font-size-lg')),
    `}`,
    ...sizeVariants(`${cls}-lg`, v('borderRadiusLG'), tv('icon-font-size-lg')),

    // ---- size=small ----
    `${cls}-sm{`,
    ...sizeStyle(tv('container-size-sm'), tv('text-font-size-sm')),
    `}`,
    ...sizeVariants(`${cls}-sm`, v('borderRadiusSM'), tv('icon-font-size-sm')),

    // ---- 图片本身 ----
    `${cls} >img{`,
    `  display:block;`,
    `  width:100%;`,
    `  height:100%;`,
    `  object-fit:cover;`,
    `}`,

    // ---- Avatar.Group ----
    `${group}{`,
    `  display:inline-flex;`,
    `}`,
    `${group} ${cls}{`,
    `  border-color:${tv('group-border-color')};`,
    `}`,
    // ⚠️ 子选择器 + `:not()`（少一个 `>` 会作用到孙子）
    `${group} >*:not(:first-child){`,
    `  margin-inline-start:${tv('group-overlapping')};`,
    `}`,
    // 溢出 Popover 里「+N」与隐藏头像之间的间距
    `${group}-popover ${cls}+${cls}{`,
    `  margin-inline-start:${tv('group-space')};`,
    `}`,
  ].join('\n');
}
