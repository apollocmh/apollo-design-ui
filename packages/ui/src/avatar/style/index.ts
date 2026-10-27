/** Static Avatar CSS and twelve default Token declarations. Selector foundations
 * reference Ant Design 6.6.4; current Vue ownership and accessibility are Apollo contracts. */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';
import { type ComponentToken, prepareComponentToken } from './token';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

let tokenCache: ComponentToken | null = null;

function avatarTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken());
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
  const sizeVariants = (selector: string, radiusToken: string, iconFontSize: string): string[] => [
    `${selector}.${p}-avatar-square{`,
    // ⚠️ 这里**内联** `v(...)` 而不是先算成变量再插值：E10 的静态扫描认的豁免形态是
    //    源码里出现 `${v(`。先算成 `const radius = v('borderRadius')` 再插值
    //    `${radius}` 会被判成「硬编码圆角」—— 那是**假阳性**（产物是
    //    `border-radius:var(--apollo-border-radius)`），但与其放宽规则，
    //    不如让源码形态与**已登记**的豁免形式一致。产物逐字节不变。
    `  border-radius:${v(radiusToken)};`,
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
    `  color:${v('colorText')};`,
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

    `${cls}-string{flex:none;max-width:none;}`,
    `${cls}-image-content{display:inline-flex;width:100%;height:100%;align-items:center;justify-content:center;}`,
    `${cls}-image-content >img{width:100%;height:100%;object-fit:cover;}`,
    `${cls}-icon-content{display:inline-flex;align-items:center;justify-content:center;}`,
    `${group}-overflow{display:inline-flex;padding:0;border:0;background:transparent;font:inherit;border-radius:50%;vertical-align:middle;cursor:pointer;}`,
    `${group}-overflow:focus-visible{outline:${v('controlOutlineWidth')} solid ${v('colorPrimary')};outline-offset:2px;}`,

    // ---- 图片态（`-image` 去掉背景）----
    `${cls}-image{`,
    `  background:transparent;`,
    `}`,
    // ⚠️ 用的是 **antCls**（`.apollo-image-img`），不是 componentCls
    `${cls} .${p}-image-img{`,
    `  display:block;`,
    `}`,

    // ---- base 的两条尺寸附属（复合选择器）----
    ...sizeVariants(cls, 'borderRadius', tv('icon-font-size')),

    // ---- size=large ----
    `${cls}-lg{`,
    ...sizeStyle(tv('container-size-lg'), tv('text-font-size-lg')),
    `}`,
    ...sizeVariants(`${cls}-lg`, 'borderRadiusLG', tv('icon-font-size-lg')),

    // ---- size=small ----
    `${cls}-sm{`,
    ...sizeStyle(tv('container-size-sm'), tv('text-font-size-sm')),
    `}`,
    ...sizeVariants(`${cls}-sm`, 'borderRadiusSM', tv('icon-font-size-sm')),

    // ---- 图片本身 ----
    `${cls} >img{`,
    `  display:block;`,
    `  width:100%;`,
    `  height:100%;`,
    `  object-fit:cover;`,
    `}`,

    // ---- Avatar.Group ----
    `${group}{`,
    ...genTokenDecls(p),
    `  --${p}-avatar-current-group-overlapping:${tv('group-overlapping')};`,
    `  --${p}-avatar-current-group-border-color:${tv('group-border-color')};`,
    `  display:inline-flex;`,
    `}`,
    `${group} ${cls}{`,
    `  border-color:var(--${p}-avatar-current-group-border-color);`,
    `}`,
    // ⚠️ 子选择器 + `:not()`（少一个 `>` 会作用到孙子）
    `${group} >*:not(:first-child){`,
    `  margin-inline-start:var(--${p}-avatar-current-group-overlapping);`,
    `}`,
    // 溢出 Popover 里「+N」与隐藏头像之间的间距
    `${group}-popover{`,
    ...genTokenDecls(p),
    `  --${p}-avatar-current-group-space:${tv('group-space')};`,
    `}`,
    `${group}-popover ${cls}+${cls}{`,
    `  margin-inline-start:var(--${p}-avatar-current-group-space);`,
    `}`,
  ].join('\n');
}
