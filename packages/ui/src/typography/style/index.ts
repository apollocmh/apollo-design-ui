/**
 * Typography 的样式生成。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/style/index.js`（`genTypographyStyle`）与
 * `es/typography/style/mixins.js`（`getTitleStyles` / `getLinkStyles` / `getResetStyles` /
 * `getEditableStyles` / `getCopyableStyles` / `getEllipsisStyles`），加上
 * `components/style/index.tsx` 的 `operationUnit` / `genFocusOutline`。
 *
 * ── 选择器结构来自 antd 的**真实产物**，不是推演的 ──────────────────────────────
 *
 * 用 `@ant-design/cssinjs` 的 `extractStyle` 渲染 antd 6.6.4 的
 * `Typography / Text / Title / Paragraph / Link`（`prefixCls: 'apollo'`、`hashed: false`、
 * `theme.cssVar` 默认开启）并提取 CSS，得到的就是下面这份。本文件逐条对齐它。
 *
 * 产物里有三处**容易写错**的地方，都是实测出来的，不是风格问题：
 *
 * 1. `div&, p` 里的 `p` 是**普通键**（后代），不是 `&` 复合：
 *    ```css
 *    div.apollo-typography,.apollo-typography p{margin-bottom:1em;}
 *    ```
 *    写成 `p.apollo-typography` 会让 `<p class="apollo-typography">`（`Paragraph`
 *    传 `component="p"`）命中，而 antd 那里**不命中** —— 这是选择器语义差异。
 * 2. 标题的 `h1&` 是复合、`h1` 是后代、`div&-h1` 又是复合：
 *    ```css
 *    h1.apollo-typography,div.apollo-typography-h1,div.apollo-typography-h1>textarea,.apollo-typography h1
 *    ```
 *    四条选择器各自负责一种渲染路径（原生 `h1` 根 / `div` 根 + `-h1` 类 / 该 `div`
 *    里的编辑态 `textarea` / 内容里裸写的 `h1`）。少写一条就少一条路径的样式。
 * 3. `&${componentCls}-link${componentCls}-secondary` 展开成
 *    `.apollo-typography.apollo-typography-link.apollo-typography-secondary`
 *    —— `link` 与 `secondary` 是**同一个元素上的两个类**，不是后代。
 *
 * ── 与 antd 产物的四处**有意**差异 ──────────────────────────────────────────────
 *
 * 1. **没有 CSS-in-JS 的 hash 包裹层**（`.css-var-_R_0_` / `:where(.css-dev-only-...)`），
 *    差异 D5。
 * 2. **Component Token 内联**：antd 的产物在末尾多一条
 *    `.css-var-_R_0_.apollo-typography{--apollo-typography-title-margin-top:1.2em;
 *    --apollo-typography-title-margin-bottom:0.5em;}`，组件 CSS 引用
 *    `var(--apollo-typography-title-margin-bottom)`。我们的零运行时管线**没有**
 *    「Component Token → CSS 变量」这一段（见 `style/token.ts` 的说明），
 *    所以直接内联 `0.5em` / `1.2em`。渲染结果相同，差异 D7 家族。
 * 3. **没有 `genCommonStyle` 与 `getResetStyles` 那两段**（见下面 §「跳过了什么」）。
 * 4. **多两段零运行时补偿**：标题/段落上边距归零（`getHeadingMarginReset`）与
 *    操作按钮的字体继承（`getActionButtonFontReset`）—— 都是为了补 `BASE_CSS`
 *    尚未覆盖的 antd 全局 reset。两段都只命中组件自己的类名，不外溢。
 *
 * ── 跳过了什么，为什么 ────────────────────────────────────────────────────────
 *
 * `genStyleHooks` 除了组件自己的样式，还会注入三段**与组件无关的公共样式**：
 *
 * | 段 | antd 产物 | 处置 |
 * |---|---|---|
 * | `genCommonStyle` 的 `box-sizing` 部分 | `.apollo-typography::before,::after` 与 2 条 `[class^=]` 后代规则 | **跳过** |
 * | `genCommonStyle` 的字体部分 | `.apollo-typography{font-family;font-size}` | **保留** |
 * | `getResetStyles` 的 `genLinkStyle` | 7 条**全局** `a{...}` 规则（出现两次） | **跳过** |
 *
 * ⚠️ 这里**没有**「`getResetStyles` 的 `genIconStyle`」这一行 —— 早期版本写过，
 *    是**错的**：antd 6.6.4 的 `es/typography/style/mixins.js` 的 `getResetStyles`
 *    里没有任何图标相关规则（grep `anticon` 在 `es/typography/` 下零命中）。
 *    `.anticon` 的基础样式来自**两个别处**：
 *      1. `@ant-design/icons` 的 `useInsertStyles`（图标挂载时运行时注入 `<style>`）；
 *      2. `antd/es/theme/util/useResetIconStyle`（`ConfigProvider` 调 `genIconStyle`）。
 *    我们的对应物是 `@apollo-design/icons` 的 `getIconStyle(iconPrefixCls)`（D15：
 *    只导出、不注入），**而它目前没有任何地方消费** ⇒ 图标没有基础样式
 *    （`display:inline` 而非 `inline-flex`、没有 `vertical-align:-0.125em`）。
 *    首个暴露它的组件就是 Typography 的 `copyable`：复制按钮比 antd 矮 1px、
 *    图标下移。缺口登记在 README §7（属于 foundation 层的接线缺口，不在本组件文件内）。
 *
 * 为什么字体那一条**保留**（与 `divider` / `empty` / `spin` 的做法不同）：
 *
 *   Typography 是**字体驱动**的组件 —— 它的全部视觉就是文字的字体、字号、行高。
 *   antd 把 `font-family` / `font-size` 显式写在 `.ant-typography` 根上；
 *   我们的 `BASE_CSS` 只在 `html` / `body` 上声明，组件靠**继承**拿到同一个值。
 *   两者的**计算值**相同，但「继承」意味着一旦组件被放进任何改了字体/字号的上下文
 *   （`<h1>` 里的 `Text`、`font-size:12px` 的卡片里），两侧就会分叉。
 *   Divider / Empty / Spin 的文字都只是零星标签，风险可忽略；Typography 不行。
 *
 *   所以这里逐字保留 antd 的 `.apollo-typography{font-family;font-size}`。
 *   `box-sizing` 那三条仍然跳过：`BASE_CSS` 的 `*{box-sizing:border-box}` 是它们的超集。
 *   （`divider` / `empty` / `spin` 连字体那一条也跳过了 —— 那是它们的既有取舍，
 *   不是本组件要跟随的约定。）
 *
 * 全局 `a{...}` 跳过的理由：
 *
 *   antd 是「每个组件都往全局注入一份 `a` 样式」，我们按需引入单组件
 *   CSS 的模型下这是**意外的全局副作用**。`Link` 自己的
 *   `.apollo-typography.apollo-typography-link{...}`（特异性 0,2,0）本来就压过
 *   `a{...}`（0,0,1），所以 `Link` 的渲染不受影响。差异登记在 README §7。
 *
 * ── 这个函数没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**视觉**正确（L6 的逐像素比对负责）。
 *   - 没证明变量名存在。`var(--apollo-*)` 写错不会报错、只会静默失效 ——
 *     由 `tests/build/run.mjs` 的 B7 校验。
 *   - 没证明与 antd 的**选择器文本**逐字相同（例如 cssinjs 会把 `.apollo-typography div +h1`
 *     里的空格规范化）。证明的是**同一条规则命中的元素集合与声明相同**。
 */

import { token2CSSVar } from '@apollo-design/theme';

import {
  KBD_BACKGROUND,
  MARK_BACKGROUND,
  RESET_BORDER_COLOR,
  RESET_BORDER_RADIUS,
  RESET_FILL_BACKGROUND,
  TITLE_MARGIN_BOTTOM,
  TITLE_MARGIN_TOP,
} from './token';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** `选择器{声明}`。声明串自己带结尾分号。 */
const rule = (selector: string, decls: string): string => `${selector}{${decls}}`;

/**
 * `genTypographyStyle` 的标题段（antd `getTitleStyles`）。
 *
 * 五级标题的 `fontSize` / `lineHeight` 来自别名 token（`fontSizeHeading{n}` /
 * `lineHeightHeading{n}`，后者在 `packages/theme/src/css-var.ts` 的 `UNITLESS` 里，
 * 所以变量值不带 `px`）；`color` / `fontWeight` / `marginBottom` 三级共用。
 */
function getTitleStyles(cls: string): string[] {
  const out: string[] = [];
  for (const level of [1, 2, 3, 4, 5] as const) {
    out.push(
      rule(
        // ⚠️ 四条选择器，顺序与 antd 产物一致（见文件头第 2 条）
        `h${level}${cls},div${cls}-h${level},div${cls}-h${level}>textarea,${cls} h${level}`,
        `${[
          `margin-bottom:${TITLE_MARGIN_BOTTOM}`,
          `color:${v('colorTextHeading')}`,
          `font-weight:${v('fontWeightStrong')}`,
          `font-size:${v(`fontSizeHeading${level}`)}`,
          `line-height:${v(`lineHeightHeading${level}`)}`,
        ].join(';')};`,
      ),
    );
  }
  return out;
}

/**
 * `genTypographyStyle` 的 reset 段（antd `getResetStyles`）。
 *
 * 这一段给**内容里的原生标签**上样式：`code` / `kbd` / `mark` / `u` / `s` / `strong` /
 * 列表 / `pre` / `blockquote` / `table`。它是 Typography 作为「富文本容器」的核心 ——
 * 用户在插槽里写的 HTML 靠它拿到 antd 的外观。
 *
 * ⚠️ 五个字面量（半透明灰底/灰边、`mark` 的 `#ffe58f`、`border-radius:3px`）来自
 *    `style/token.ts`，那里逐条记了出处与「为什么不能用别名变量替代」。
 */
function getResetStyles(cls: string): string[] {
  /** 后代选择器。`'u, ins'` 这类逗号列表要逐项加前缀。 */
  const d = (sel: string): string =>
    sel
      .split(',')
      .map((s) => `${cls} ${s.trim()}`)
      .join(',');
  const codeBorder = `${v('lineWidth')} ${v('lineType')} ${RESET_BORDER_COLOR}`;

  return [
    rule(
      d('code'),
      `margin:0 0.2em;padding-inline:0.4em;padding-block:0.2em 0.1em;font-size:85%;` +
        `font-family:${v('fontFamilyCode')};background:${RESET_FILL_BACKGROUND};` +
        `border:${codeBorder};border-radius:${RESET_BORDER_RADIUS}px;`,
    ),
    rule(
      d('kbd'),
      `margin:0 0.2em;padding-inline:0.4em;padding-block:0.15em 0.1em;font-size:90%;` +
        `font-family:${v('fontFamilyCode')};background:${KBD_BACKGROUND};` +
        `border:${codeBorder};border-bottom-width:2px;border-radius:${RESET_BORDER_RADIUS}px;`,
    ),
    // antd 在这一行留了 `// FIXME hardcode in v4`，我们如实照搬取值。
    rule(d('mark'), `padding:0;background-color:${MARK_BACKGROUND};`),
    rule(d('u, ins'), 'text-decoration:underline;text-decoration-skip-ink:auto;'),
    rule(d('s, del'), 'text-decoration:line-through;'),
    rule(d('strong'), `font-weight:${v('fontWeightStrong')};`),
    rule(d('ul, ol'), 'margin-inline:0;margin-block:0 1em;padding:0;'),
    rule(
      d('ul li, ol li'),
      'margin-inline:20px 0;margin-block:0;padding-inline:4px 0;padding-block:0;',
    ),
    rule(d('ul'), 'list-style-type:circle;'),
    rule(d('ul ul'), 'list-style-type:disc;'),
    rule(d('ol'), 'list-style-type:decimal;'),
    rule(d('pre, blockquote'), 'margin:1em 0;'),
    rule(
      d('pre'),
      `padding:0.4em 0.6em;white-space:pre-wrap;word-wrap:break-word;` +
        `background:${RESET_FILL_BACKGROUND};border:${codeBorder};` +
        `border-radius:${RESET_BORDER_RADIUS}px;font-family:${v('fontFamilyCode')};`,
    ),
    // 兼容 marked：`pre` 里的 `code` 不能再带自己的底色与边框。
    rule(
      d('pre code'),
      'display:inline;margin:0;padding:0;font-size:inherit;font-family:inherit;background:transparent;border:0;',
    ),
    rule(
      d('blockquote'),
      `padding-inline:0.6em 0;padding-block:0;` +
        `border-inline-start:4px solid ${RESET_BORDER_COLOR};opacity:0.85;`,
    ),
    // table：跟随 Table 组件的默认外观
    rule(
      d('table'),
      'width:100%;text-align:start;border-collapse:separate;border-spacing:0;margin-block:1em;',
    ),
    rule(
      d('table th, table td'),
      `padding:${v('padding')};overflow-wrap:break-word;` +
        `border-bottom:${v('lineWidth')} ${v('lineType')} ${v('colorSplit')};`,
    ),
    rule(
      d('table thead>tr:first-child>th:first-child'),
      `border-start-start-radius:${v('borderRadiusLG')};`,
    ),
    rule(
      d('table thead>tr:first-child>th:last-child'),
      `border-start-end-radius:${v('borderRadiusLG')};`,
    ),
    rule(
      d('table thead>tr>th'),
      `text-align:start;position:relative;color:${v('colorTextHeading')};` +
        `font-weight:${v('fontWeightStrong')};background-color:${v('colorFillAlter')};` +
        `transition:background-color ${v('motionDurationMid')} ease;`,
    ),
    rule(
      d('table thead>tr>th:not(:last-child)::before'),
      `position:absolute;top:50%;inset-inline-end:0;width:1px;height:1.6em;` +
        `background-color:${v('colorSplit')};transform:translateY(-50%);content:"";`,
    ),
    rule(
      d('table tbody>tr >th, table tbody>tr >td'),
      `transition:background-color ${v('motionDurationMid')} ease;`,
    ),
    rule(
      d('table tbody>tr:hover>th, table tbody>tr:hover>td'),
      `background-color:${v('colorFillAlter')};`,
    ),
  ];
}

/**
 * `operationUnit`（antd `components/style/index.tsx`）的展开。
 *
 * `Link` 与四个操作按钮（`expand` / `collapse` / `edit` / `copy`）共用这一组声明 ——
 * antd 自己在这一段留了注释说「这里用了 link 色，但它其实是操作单元，应该用
 * colorPrimary；而且 Typography 拿它生成 link 样式本不该这么做」，我们照搬取值。
 *
 * `userSelect` 由调用方给（`Link` 是 `text`、操作按钮是 `none`）。
 */
function operationUnit(userSelect: 'text' | 'none'): string {
  return (
    `color:${v('colorLink')};text-decoration:${v('linkDecoration')};outline:none;cursor:pointer;` +
    `transition:all ${v('motionDurationSlow')};border:0;padding:0;background:none;` +
    `user-select:${userSelect};`
  );
}

/** `genFocusOutline`：`:focus-visible` 的焦点环。 */
const focusOutline = (): string =>
  `outline:${v('lineWidthFocus')} solid ${v('colorPrimaryBorder')};` +
  `outline-offset:1px;transition:outline-offset 0s,outline 0s;`;

/**
 * `operationUnit` 的四个交互态。`&` 由调用方拼在选择器里。
 *
 * ⚠️⚠️ `sel` 允许是**逗号分隔的选择器列表**（操作区传进来的就是
 * `.apollo-typography-expand,.apollo-typography-collapse,.apollo-typography-edit,.apollo-typography-copy`），
 * 而 `a,b:hover` 这种写法在 CSS 里是**两个独立选择器**：`a` 是无条件的、只有 `b` 带状态。
 * 直接拼 `${sel}:hover` 会让前三个按钮**无条件**拿到 `:hover` / `:focus` / `:active`
 * 的声明 —— 表现是按钮永远显示 `colorLinkActive`、并且带一圈 `:focus-visible` 的焦点环。
 *
 * 2026-09-20 由 L6 抓到：`typography/ellipsis__light__*` 与 `typography/semantic__light__*`
 * 的 diff 图里，展开按钮周围是一圈红色矩形（焦点环），按钮文字颜色
 * `rgb(9,88,217)`（= `colorLinkActive`）而 antd 是 `rgb(22,119,255)`（= `colorLink`）。
 *
 * 所以伪类必须**逐个**加到列表里的每一个选择器上 —— 这正是 cssinjs 里 `&:hover`
 * 的展开语义（`&` = 整个父选择器列表，展开后每条都带 `:hover`）。
 */
function operationUnitStates(sel: string): string[] {
  /** 给列表里的**每一个**选择器都加上伪类。 */
  const each = (pseudo: string): string =>
    sel
      .split(',')
      .map((one) => `${one.trim()}${pseudo}`)
      .join(',');

  return [
    rule(each(':focus-visible'), focusOutline()),
    rule(each(':hover'), `color:${v('colorLinkHover')};text-decoration:${v('linkHoverDecoration')};`),
    rule(each(':focus'), `color:${v('colorLinkHover')};text-decoration:${v('linkFocusDecoration')};`),
    rule(
      each(':active'),
      `color:${v('colorLinkActive')};text-decoration:${v('linkHoverDecoration')};`,
    ),
  ];
}

/**
 * `getLinkStyles`（antd `style/mixins.ts`）。
 *
 * 只作用于 `component === 'a'` 的渲染路径：`Link` 组件，或 `Text` 传
 * `component="a"`。`[disabled]` 与 `-disabled` 两个分支都要有 —— 前者是原生
 * `<a disabled>`，后者是 antd 的类名禁用态。
 */
function getLinkStyles(cls: string): string[] {
  const sel = `${cls}.${cls.slice(1)}-link`;
  return [
    rule(sel, operationUnit('text')),
    ...operationUnitStates(sel),
    rule(
      `${sel}[disabled],${sel}.${cls.slice(1)}-disabled`,
      `color:${v('colorTextDisabled')};cursor:not-allowed;`,
    ),
    rule(
      `${sel}[disabled]:active,${sel}.${cls.slice(1)}-disabled:active,` +
        `${sel}[disabled]:hover,${sel}.${cls.slice(1)}-disabled:hover`,
      `color:${v('colorTextDisabled')};`,
    ),
    rule(`${sel}[disabled]:active,${sel}.${cls.slice(1)}-disabled:active`, 'pointer-events:none;'),
    rule(
      `${sel}[disabled]:active .${cls.slice(1)}-actions,` +
        `${sel}.${cls.slice(1)}-disabled:active .${cls.slice(1)}-actions`,
      'pointer-events:auto;',
    ),
  ];
}

/**
 * `getEditableStyles`（antd `style/mixins.ts`）。
 *
 * 四处 `token.calc(...)` 在 antd 的 cssVar 产物里正好落成 `calc(var(--apollo-*) ...)`：
 *
 * | antd | 产物 | 语义 |
 * |---|---|---|
 * | `calc(paddingSM).mul(-1)` | `calc(var(--apollo-padding-sm) * -1)` | 左移一个 paddingSM |
 * | `calc(paddingSM).div(-2).add(1)` | `calc(var(--apollo-padding-sm) / -2 + 1px)` | 上移半个 paddingSM 再下移 1px |
 * | `calc(paddingSM).div(2).sub(2)` | `calc(var(--apollo-padding-sm) / 2 - 2px)` | 半个 paddingSM 再减 2px |
 * | `calc(marginXS).add(2)` | `calc(var(--apollo-margin-xs) + 2px)` | marginXS + 2px |
 *
 * 逐字照搬 —— 我们不需要 `token.calc()`，因为零运行时下这些值本来就是 CSS 变量，
 * 浏览器算 `calc()` 比构建期算死更贴主题。
 */
function getEditableStyles(cls: string): string[] {
  const content = `${cls}-edit-content`;
  return [
    rule(content, 'position:relative;'),
    rule(
      `div${content}`,
      `inset-inline-start:calc(${v('paddingSM')} * -1);` +
        `inset-block-start:calc(${v('paddingSM')} / -2 + 1px);` +
        `margin-bottom:calc(${v('paddingSM')} / 2 - 2px);`,
    ),
    rule(
      `${content} ${content}-confirm`,
      `position:absolute;inset-inline-end:calc(${v('marginXS')} + 2px);` +
        `inset-block-end:${v('marginXS')};color:${v('colorIcon')};` +
        `font-weight:normal;font-size:${v('fontSize')};font-style:normal;pointer-events:none;`,
    ),
    // ⚠️ 选择器把 `-edit-content` 类写两遍来抬高特异性：Input 自己有一条
    //    `textarea.apollo-input{line-height:...}`，与下面这条同为 (0,1,1)，
    //    而 Input 的样式在 Typography 之后注入 —— 不抬特异性的话继承不到
    //    `line-height`，编辑态就不是所见即所得。这是 antd 的原注释，照搬。
    rule(
      `${content}.${content.slice(1)} textarea`,
      'margin:0!important;font-size:inherit;line-height:inherit;font-family:inherit;' +
        'font-weight:inherit;-moz-transition:none;height:1em;',
    ),
  ];
}

/** `getCopyableStyles`（antd `style/mixins.ts`）。 */
function getCopyableStyles(cls: string): string[] {
  return [
    rule(
      `${cls} ${cls}-copy-success,${cls} ${cls}-copy-success:hover,${cls} ${cls}-copy-success:focus`,
      `color:${v('colorSuccess')};`,
    ),
    rule(`${cls} ${cls}-copy-icon-only`, 'margin-inline-start:0;'),
  ];
}

/**
 * `getEllipsisStyles`（antd `style/mixins.ts`）。
 *
 * ⚠️ 这一段的四个选择器**不是同一种嵌套**：
 *
 *   - `a&-ellipsis, span&-ellipsis` → `a.apollo-typography-ellipsis`（复合，限 `a` / `span`）
 *   - `&-ellipsis-single-line` → `.apollo-typography-ellipsis-single-line`（**顶级**，不限标签）
 *   - `a&, span&`（嵌在上一条里） → `a.apollo-typography-ellipsis-single-line`
 *   - `> code` → `.apollo-typography-ellipsis-single-line >code`（**子**元素，不是后代）
 *
 * `-webkit-line-clamp:3` 是 antd 写死的占位值；真正的行数由组件算出的
 * `WebkitLineClamp` 内联样式覆盖（见 `Base.vue`）。
 *
 * `getEllipsisStyles` 在 antd 里**不接收 token** —— 整段是纯静态的，所以这里也不接。
 */
function getEllipsisStyles(cls: string): string[] {
  const single = `${cls}-ellipsis-single-line`;
  return [
    rule(`a${cls}-ellipsis,span${cls}-ellipsis`, 'display:inline-block;max-width:100%;'),
    rule(single, 'overflow:hidden;white-space:nowrap;text-overflow:ellipsis;'),
    // https://blog.csdn.net/iefreer/article/details/50421025
    rule(`a${single},span${single}`, 'vertical-align:bottom;'),
    rule(
      `${single} >code`,
      'padding-block:0;max-width:calc(100% - 1.2em);display:inline-block;overflow:hidden;' +
        'text-overflow:ellipsis;vertical-align:bottom;box-sizing:content-box;',
    ),
    rule(
      `${cls}-ellipsis-multiple-line`,
      'display:-webkit-box;overflow:hidden;-webkit-line-clamp:3;-webkit-box-orient:vertical;',
    ),
  ];
}

/**
 * 零运行时补偿：`h1`~`h5` / `p` 的上外边距归零。
 *
 * ── 为什么需要它 ──────────────────────────────────────────────────────────────
 *
 * antd 的浏览器 reset（`antd/dist/reset.css`，L6 的 React 侧入口显式 import 它）里有：
 *
 * ```css
 * h1,h2,h3,h4,h5,h6{margin-top:0;margin-bottom:0.5em;font-weight:500;}
 * p{margin-top:0;margin-bottom:1em;}
 * ```
 *
 * 我们的对应物是 `packages/ui/src/style/index.ts` 的 `BASE_CSS`，而它**还没覆盖**
 * 这一段（`empty` 收口时已把「完整全局 reset」记为未决）。
 *
 * 缺了它，`Title` 渲染的 `<h1>` 会带上 UA 的 `margin-block-start:0.67em` ——
 * 在 `fontSizeHeading1` = 38px 下就是 **25.5px 的额外上边距**，L6 直接判 block-diff。
 * `Paragraph` 传 `component="p"` 同理（UA 的 `1em` vs antd 的 `0`）。
 *
 * ── 为什么放在组件 CSS 里而不是 BASE_CSS ──────────────────────────────────────
 *
 * `BASE_CSS` 是 4 个手写共享文件之一，改它会同时影响 `divider` / `empty` / `spin` /
 * `config-provider` 以及并行的 `space` 流的视觉基线 —— 超出本次改动的范围。
 * 所以这里对**组件自己的根元素**做等价归零：选择器是 `h1.apollo-typography` 这类
 * **复合**形式，只有同时带 `.apollo-typography` 的元素命中，不会外溢。
 *
 * ⚠️ 这是**补偿全局 reset 的缺口**，不是我们发明的视觉值。`BASE_CSS` 补齐后
 *    这一段可以删掉（删掉后渲染结果不变）。
 * ⚠️ 已知未覆盖：**内容里**裸写的 `<p>` / `<h1>`（即 `.apollo-typography p`）仍会拿到
 *    UA 的 `margin-top`。那属于用户内容、且 antd 的组件 CSS 也只给它 `margin-bottom`
 *    —— 差异登记在 README §7，L6 用例避开这条路径。
 */
function getHeadingMarginReset(cls: string): string[] {
  return [
    rule(`${[1, 2, 3, 4, 5].map((level) => `h${level}${cls}`).join(',')},p${cls}`, 'margin-top:0;'),
  ];
}

/**
 * 零运行时补偿：操作按钮（expand / collapse / edit / copy）的**字体继承**。
 *
 * ── 为什么需要它 ──────────────────────────────────────────────────────────────
 *
 * 操作区渲染的是原生 `<button>`。浏览器 UA 样式表对 `<button>` 声明了
 * `font: 400 13.3333px Arial` —— 这个 **`font` 简写会把 `line-height` 重置成
 * `normal`**，于是继承链被切断：按钮既不继承 `.apollo-typography` 的 `font-size`
 * （14px），也不继承它的 `line-height`（1.5714）。
 *
 * antd 的浏览器 reset（`antd/dist/reset.css`）里有：
 *
 * ```css
 * input,button,select,optgroup,textarea{margin:0;color:inherit;font-size:inherit;
 *   font-family:inherit;line-height:inherit;}
 * ```
 *
 * 我们的对应物 `BASE_CSS` 同样**还没覆盖**这一段。缺了它的后果实测：
 *
 * | | antd | 我们（补偿前） |
 * |---|---|---|
 * | 按钮 `font-size` | `14px` | `13.3333px` |
 * | 按钮 `line-height` | `22px` | `normal`（≈15px 高） |
 *
 * 这不只是「按钮差 7px」：JS 省略号的 `ellipsisHeight` 是量出来的，测量容器里
 * **就包含这个按钮**（`symbolRowEllipsisRef` 渲染的是 `children([], true)`）。
 * 按钮矮了 7px ⇒ 量到的行高不同 ⇒ 二分收敛的位置差一个字符
 * （antd 留 56 字符，我们留 57）。2026-09-20 L6 抓到：
 * `typography/ellipsis__light__*` 与 `typography/semantic__light__*` 六个 viewport 全红。
 * 把这三条声明注入 Vue 页后，`cutLen` / `btnH` / `btnFont` / `btnLH` 与 antd **逐项相同**
 * —— 这就是本段存在的依据。
 *
 * ── 为什么放在组件 CSS 里而不是 BASE_CSS ──────────────────────────────────────
 *
 * 与 `getHeadingMarginReset` 同一条理由：`BASE_CSS` 是 4 个手写共享文件之一，
 * 改它会同时影响 `divider` / `empty` / `spin` / `config-provider` 的视觉基线
 * （`empty` 的 footer 用例专门用 `FOOTER_BUTTON_STYLE` 把按钮样式钉死来回避这个差异）
 * —— 超出本次改动的范围。所以这里只对**组件自己的**四个操作按钮做等价继承。
 *
 * ⚠️ 选择器是 `.apollo-typography-expand` 这类**组件自己的类名**，不会外溢到任何
 *    其他组件（`button` 元素选择器一条都没有）。
 * ⚠️ 这是**补偿全局 reset 的缺口**，不是我们发明的视觉值。`BASE_CSS` 补齐后
 *    这一段可以删掉（删掉后渲染结果不变）。
 * ⚠️ **故意不抄 `margin:0` 与 `color:inherit`**：antd 的那两条对我们无意义 ——
 *    按钮的 `margin-inline-start` 由操作区规则管理（`marginXXS`），`color` 由
 *    `operationUnit` 显式设为 `colorLink`（抄 `color:inherit` 只会让阅读者困惑）。
 *    只补**真正缺失**的三条字体声明。
 */
function getActionButtonFontReset(actionList: string): string[] {
  return [rule(actionList, 'font-family:inherit;font-size:inherit;line-height:inherit;')];
}

/**
 * 生成 Typography 的静态 CSS。
 *
 * @param prefixCls 类名前缀（`apollo` 或 `ant`）
 */
export function genTypographyStyle(prefixCls: string): string {
  // ⚠️ 带 `-typography` 后缀：`getPrefixCls('typography')` 在**不传** customizePrefixCls 时
  // 返回 `${defaultPrefixCls}-typography`（即 `apollo-typography`）。传了 customizePrefixCls
  // 时它**直接返回**该值（不加后缀）—— 那种情况的 CSS 请用 `genComponentCss('typography', 自定义值)`。
  const cls = `.${prefixCls}-typography`;
  /** 复合类名（`&${componentCls}-xxx` 里的 `-xxx` 部分）。 */
  const c = (suffix: string): string => `${cls}${suffix}`;
  /** 后代类名（`${componentCls}-xxx` 作为嵌套键）。 */
  const d = (suffix: string): string => `${cls} ${cls}${suffix}`;

  const actionList = [c('-expand'), c('-collapse'), c('-edit'), c('-copy')].join(',');

  return [
    // ---- genCommonStyle 的字体部分（见文件头「跳过了什么」）------------------
    // antd 这一段是 `[rootPrefixSelector]: {...resetFontStyle, ...resetStyle}`，
    // 我们只取 `resetFontStyle`（`box-sizing` 由 `BASE_CSS` 的 `*` 规则覆盖）。
    rule(c(''), `font-family:${v('fontFamily')};font-size:${v('fontSize')};`),

    // ---- 根与语义色 -------------------------------------------------------
    rule(c(''), `color:${v('colorText')};word-break:break-word;line-height:${v('lineHeight')};`),
    // ⚠️ 每个选择器都必须以 `${c('')}`（即 `&`）**开头**，一个都不能漏。
    //    antd 的嵌套键是 `` `&${componentCls}-secondary, &${componentCls}-link${componentCls}-secondary` ``，
    //    两个分支的 `&` 都展开成 `.ant-typography` —— 于是第二个分支是
    //    `.ant-typography.ant-typography-link.ant-typography-secondary`（特异性 0,3,0）。
    //    漏掉这个前缀会掉到 0,2,0，与 `getLinkStyles` 的
    //    `.ant-typography.ant-typography-link`（同为 0,2,0）打平，而后者在本函数里
    //    **排在后面** ⇒ `Link type="danger"` 会渲染成 `colorLink` 而不是 `colorErrorText`。
    //    2026-09-20 由 L6 视觉比对抓到（`typography/link__light__*` 三个 viewport 全红），
    //    修复后逐像素一致。别「顺手简化」成 `${c('-link')}...`。
    rule(
      `${c('')}${c('-secondary')},${c('')}${c('-link')}${c('-secondary')}`,
      `color:${v('colorTextDescription')};`,
    ),
    rule(
      `${c('')}${c('-success')},${c('')}${c('-link')}${c('-success')}`,
      `color:${v('colorSuccessText')};`,
    ),
    rule(
      `${c('')}${c('-warning')},${c('')}${c('-link')}${c('-warning')}`,
      `color:${v('colorWarningText')};`,
    ),
    rule(
      `${c('')}${c('-danger')},${c('')}${c('-link')}${c('-danger')}`,
      `color:${v('colorErrorText')};`,
    ),
    // ⚠️ 这两条的 `&` 指的是**上面那条规则的整个选择器列表**（cssinjs 的嵌套语义），
    //    所以每个选择器都要带上 `-danger` 与 `-link` 两个类，且都以 `${c('')}` 开头。
    //    逐字来自 antd 产物。
    rule(
      `${c('')}${c('-danger')}${c('-link')}:active,` +
        `${c('')}${c('-link')}${c('-danger')}${c('-link')}:active,` +
        `${c('')}${c('-danger')}${c('-link')}:focus,` +
        `${c('')}${c('-link')}${c('-danger')}${c('-link')}:focus`,
      `color:${v('colorErrorTextActive')};`,
    ),
    rule(
      `${c('')}${c('-danger')}${c('-link')}:hover,` +
        `${c('')}${c('-link')}${c('-danger')}${c('-link')}:hover`,
      `color:${v('colorErrorTextHover')};`,
    ),
    rule(c('-disabled'), `color:${v('colorTextDisabled')};cursor:not-allowed;user-select:none;`),
    // `div&` 是复合、`p` 是后代 —— 见文件头第 1 条。
    rule(`div${c('')},${cls} p`, 'margin-bottom:1em;'),

    // ---- 标题 -------------------------------------------------------------
    ...getTitleStyles(cls),
    // 紧跟在 Typography 之后的标题（同级兄弟）也要有上间距
    rule(
      [1, 2, 3, 4, 5].map((level) => `${c('')}+h${level}${c('')}`).join(','),
      `margin-top:${TITLE_MARGIN_TOP};`,
    ),
    // 块级元素后面紧跟标题：cssinjs 的嵌套键产生 10 × 5 = 50 条选择器
    rule(
      ['div', 'ul', 'li', 'p', 'h1', 'h2', 'h3', 'h4', 'h5']
        .flatMap((outer) => [1, 2, 3, 4, 5].map((level) => `${cls} ${outer} +h${level}`))
        .join(','),
      `margin-top:${TITLE_MARGIN_TOP};`,
    ),

    // ---- 内容里的原生标签 --------------------------------------------------
    ...getResetStyles(cls),

    // ---- Link -------------------------------------------------------------
    ...getLinkStyles(cls),

    // ---- 操作区（expand / collapse / edit / copy）--------------------------
    rule(d('-actions'), 'display:inline;'),
    rule(actionList, `${operationUnit('none')}margin-inline-start:${v('marginXXS')};`),
    ...operationUnitStates(actionList),
    // 操作区在 start 侧时改成「左侧无边距、右侧 marginXXS」；
    // `copy` 除外（它自带 `-copy-icon-only` 时已经是 0）。
    rule(
      `${d('-actions-start')} ${c('-expand')},${d('-actions-start')} ${c('-collapse')},` +
        `${d('-actions-start')} ${c('-edit')},` +
        `${d('-actions-start')} ${c('-copy')}:not(${c('-copy-icon-only')})`,
      `margin-inline-start:0;margin-inline-end:${v('marginXXS')};`,
    ),

    // ---- 编辑态 / 复制态 / 省略态 / RTL ------------------------------------
    ...getEditableStyles(cls),
    ...getCopyableStyles(cls),
    ...getEllipsisStyles(cls),
    rule(c('-rtl'), 'direction:rtl;'),

    // ---- 零运行时补偿（见 getHeadingMarginReset / getActionButtonFontReset）--
    ...getHeadingMarginReset(cls),
    ...getActionButtonFontReset(actionList),
    '',
  ].join('\n');
}
