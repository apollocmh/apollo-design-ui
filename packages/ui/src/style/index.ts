/**
 * 组件样式的汇总清单与静态 CSS 生成。
 *
 * ── 为什么这里要有一份「清单」 ────────────────────────────────────────────────
 *
 * 零运行时架构下没有运行时样式注入，CSS 必须在**构建期**落成静态文件。
 * 构建钩子（`packages/ui/build.config.ts`）需要一个「有哪些组件、各自的样式怎么生成」的
 * 真源 —— 那就是本文件。它被打包进 `dist/index.mjs`，钩子从产物里 import 它来生成 CSS
 * （与 `packages/theme/build.config.ts` 从 `dist/index.mjs` 取 `getCSSVarDeclarations`
 * 同一套路：顺带验证了「产物能被真实 import」）。
 *
 * ── 为什么同时为 `apollo` 与 `ant` 生成 ──────────────────────────────────────
 *
 * 裁决 `prefix-cls-default` = A 承诺「默认 `apollo`，允许 ConfigProvider 覆盖为 `ant`」。
 * 但零运行时下 CSS 是构建期产物：只生成 `apollo` 的话，用户把 prefixCls 改成 `ant`
 * 会得到一堆没有样式的类名 —— 那条承诺就是空的。
 *
 * 所以 `STATIC_PREFIX_CLS` 里的每个前缀都会生成一份。代价是 CSS 体积翻倍
 * （单个组件的 CSS 只有几百字节，可接受），换来的是「迁移时把 prefixCls 设成 `ant`
 * 就能复用 antd 的覆盖样式」这条真实可用的路径。
 *
 * **自定义前缀（如 `my-app`）不生成** —— 那种情况请调用 `genComponentCss(name, prefixCls)`
 * 自行产出并引入。这是零运行时的固有代价，登记在 `COMPONENT-RULES.md` 的 R9 讨论里。
 *
 * ── 加一个新组件时要做什么 ──────────────────────────────────────────────────
 *
 * 往 `COMPONENT_STYLES` 里加一行。就这一行 —— 构建钩子、`dist/index.css`、
 * `budget.json` 的体积校验全部自动跟上。
 */

import { getIconStyle } from '@apollo-design/icons';
import { genAffixStyle } from '../affix/style';
import { genAlertStyle } from '../alert/style';
import { genAppStyle } from '../app/style';
import { genBackTopStyle } from '../back-top/style';
import { genBadgeStyle } from '../badge/style';
import { genBorderBeamStyle } from '../border-beam/style';
import { genButtonStyle } from '../button/style';
import { genCarouselStyle } from '../carousel/style';
import { genCheckboxStyle } from '../checkbox/style';
import { genCollapseStyle } from '../collapse/style';
import { genDescriptionsStyle } from '../descriptions/style';
import { genDividerStyle } from '../divider/style';
import { genDropdownStyle } from '../dropdown/style';
import { genEmptyStyle } from '../empty/style';
import { genFlexStyle } from '../flex/style';
import { genGridStyle } from '../grid/style';
import { genInputStyle } from '../input/style';
import { genInputNumberStyle } from '../input-number/style';
import { genLayoutStyle, genSiderStyle } from '../layout/style';
import { genListyStyle } from '../listy/style';
import { genMenuStyle } from '../menu/style';
import { genPopoverStyle } from '../popover/style';
import { genQrCodeStyle } from '../qr-code/style';
import { genRadioStyle } from '../radio/style';
import { genResultStyle } from '../result/style';
import { genSkeletonStyle } from '../skeleton/style';
import { genSpaceStyle } from '../space/style';
import { genSpinStyle } from '../spin/style';
import { genSplitterStyle } from '../splitter/style';
import { genStatisticStyle } from '../statistic/style';
import { genSwitchStyle } from '../switch/style';
import { genTagStyle } from '../tag/style';
import { genTooltipStyle } from '../tooltip/style';
import { genTypographyStyle } from '../typography/style';
import { genUploadStyle } from '../upload/style';

/**
 * 静态 CSS 覆盖的前缀。
 *
 * 顺序即产物顺序：第一个是默认前缀（`prefix-cls-default` 裁决的 `apollo`）。
 * 新增前缀只要加进这个数组 —— 它同时决定 `dist/<component>/style.css` 的内容。
 */
export const STATIC_PREFIX_CLS = ['apollo', 'ant'] as const;

/** 一个组件的样式入口。 */
export interface ComponentStyleEntry {
  /** 组件目录名（`packages/ui/src/<name>/`），也是 CSS 产物的目录名。 */
  name: string;
  /** 纯函数：类名前缀 → CSS 文本。 */
  gen: (prefixCls: string) => string;
}

/**
 * 组件样式清单。
 *
 * 只列**已经落地样式**的组件。没列的组件不会产出 CSS，`package.json` 的 exports
 * 也不会声明对应的子路径（见 `scaffold-packages.mjs` 的 `uiStyleExports`）。
 */
export const COMPONENT_STYLES: readonly ComponentStyleEntry[] = [
  { name: 'affix', gen: genAffixStyle },
  { name: 'layout', gen: genLayoutStyle },
  { name: 'layout-sider', gen: genSiderStyle },
  { name: 'radio', gen: genRadioStyle },
  { name: 'alert', gen: genAlertStyle },
  { name: 'button', gen: genButtonStyle },
  { name: 'collapse', gen: genCollapseStyle },
  { name: 'carousel', gen: genCarouselStyle },
  { name: 'checkbox', gen: genCheckboxStyle },
  { name: 'descriptions', gen: genDescriptionsStyle },
  { name: 'listy', gen: genListyStyle },
  { name: 'qrcode', gen: genQrCodeStyle },
  { name: 'splitter', gen: genSplitterStyle },
  { name: 'divider', gen: genDividerStyle },
  { name: 'empty', gen: genEmptyStyle },
  { name: 'flex', gen: genFlexStyle },
  { name: 'badge', gen: genBadgeStyle },
  { name: 'back-top', gen: genBackTopStyle },
  { name: 'border-beam', gen: genBorderBeamStyle },
  { name: 'tag', gen: genTagStyle },
  { name: 'result', gen: genResultStyle },
  { name: 'statistic', gen: genStatisticStyle },
  { name: 'grid', gen: genGridStyle },
  { name: 'skeleton', gen: genSkeletonStyle },
  { name: 'space', gen: genSpaceStyle },
  { name: 'spin', gen: genSpinStyle },
  { name: 'switch', gen: genSwitchStyle },
  { name: 'typography', gen: genTypographyStyle },
  { name: 'input-number', gen: genInputNumberStyle },
  { name: 'input', gen: genInputStyle },
  { name: 'upload', gen: genUploadStyle },
  { name: 'tooltip', gen: genTooltipStyle },
  { name: 'popover', gen: genPopoverStyle },
  { name: 'menu', gen: genMenuStyle },
  { name: 'dropdown', gen: genDropdownStyle },
  { name: 'app', gen: genAppStyle },
];

/** 生成单个组件在**指定前缀**下的 CSS。自定义 prefixCls 的用户用这个。 */
export function genComponentCss(name: string, prefixCls: string): string {
  const entry = COMPONENT_STYLES.find((item) => item.name === name);
  if (!entry) {
    throw new Error(
      `[apollo: style] 未知组件 "${name}"。已知：${COMPONENT_STYLES.map((i) => i.name).join(', ')}`,
    );
  }
  return entry.gen(prefixCls);
}

/**
 * 全局基础样式 —— antd `dist/reset.css` 的**完整对齐版**。
 *
 * ── 为什么必须是「完整」而不是「最小」──────────────────────────────────────────
 *
 * ⚠️ L6 的 React 基线页（`tests/visual/render/react-main.jsx:8`）加载的是
 *    **`import 'antd/dist/reset.css'`（整份）**。像素级比对的对手带着这份 reset，
 *    所以我们这边只要少一条，那条规则覆盖的元素就会有**残余差异**。
 *    「最小版」从原理上就无法逐像素对齐 —— 它只能覆盖到当时那个组件碰巧用到的元素。
 *
 * 2026-09-18 的第一版只覆盖了 box-sizing / font-family / body 基础 reset，
 * 注释里也如实写着「完整的全局 reset 按 antd 的范围补齐 —— 记入未决」。
 * **2026-09-21 补齐**：skeleton 的 L6 只有 9/24，失败项全是 `size-mismatch` 且我方偏高，
 * 根因就是 `<h3 class="-title">` 与 `<ul class="-paragraph">` 拿到了浏览器默认的
 * `margin-block-end: 1em`（antd reset 把它设成 `0.5em` / `1em`，但**设过**就不同了）。
 *
 * ── 来源与忠实度 ──────────────────────────────────────────────────────────────
 *
 * 逐条抄自 `/tmp/antd-src/package/dist/reset.css`（antd 6.6.4，共 49 条规则）。
 * **只做两处有意的省略**：
 *   1. `html{line-height:1.15}` / `-ms-*` / `-webkit-tap-highlight-color` —— 这些是
 *      normalize.css 的历史包袱，且**我们的 `html` 字体走 Token**（见下），
 *      加进去会与 `--apollo-font-family` 打架。
 *   2. `html,body{width:100%;height:100%}` —— 视觉页两侧都是 `body` 直接承载内容，
 *      这条不产生像素差异；且它会改变消费方应用的布局语义（不该由组件库强加）。
 *
 * ⚠️ `input,button,select,optgroup,textarea{...font-family:inherit}` 这一条**必须加** ——
 *    typography 之前用 `getActionButtonFontReset` 在组件内补偿的就是它。
 *    加了之后那段补偿变成**冗余但无害**（同值），可以后续清理。
 *
 * ⚠️ 这一段同时嵌进「汇总 CSS」与「每个组件 CSS」—— 不然只引单个组件 CSS（如
 *    `@apollo-design/ui/skeleton/style.css`）也会退回 Times。
 */
export const BASE_CSS = [
  // ---- 图标基线（2026-09-22 接入，第三次踩到）----
  // ⚠️ antd 的 `.anticon` 基线由 @ant-design/icons 在运行时注入；本仓 icons 包的
  //    getIconStyle() 只导出文本、ui 样式层此前**未消费**——button 期在按钮范围内
  //    自保、result 期（icon 高 86.8 vs 72）确认这是集成缺口，按三次法则收进全局。
  //    放在 BASE_CSS（而非 COMPONENT_STYLES）里：每份组件 CSS 都自带，单引自足。
  getIconStyle(),
  // ---- 图标基线（2026-09-22 接入，第三次踩到）----
  // ⚠️ antd 的 `.anticon` 基线由 @ant-design/icons 在运行时注入；本仓 icons 包的
  //    getIconStyle() 只导出文本、ui 样式层此前**未消费**——button 期在按钮范围内
  //    自保、result 期（icon 高 86.8 vs 72）确认这是集成缺口，按三次法则收进全局。
  //    放在 BASE_CSS（而非 COMPONENT_STYLES）里：每份组件 CSS 都自带，单引自足。
  getIconStyle(),
  // ---- box-sizing ----
  '*,*::before,*::after{box-sizing:border-box}',
  // ---- html / body ----
  // ---- html / body ----
  // ⚠️⚠️ 字体必须用 token（`var(--apollo-font-family)`），**不要改成 antd reset 的
  //    `sans-serif`**：React 基线页的**继承字体**是 antd cssinjs 注入到 body 的
  //    **token 字体栈**（不是 reset 里的 `sans-serif`）—— 实测：改成 sans-serif 后
  //    empty × 15 + config-provider/locale × 3 全部新增失败（affix 的 6 张反而过了，
  //    净负收益）。继承文本的字形以 token 字体为准。
  //    ⚠️ body 的 font-size **不能设**（2026-09-22 badge 实测修正了 affix 期的结论）：
  //    antd/dist/reset.css **不设** body 字号 —— React 基线页的继承字号是浏览器
  //    默认 16px。我们设 14px 会让 inline 元素之间的空白文本节点行高变小
  //    （badge basic 整页高 75 vs 76）。组件字号一律由组件自身 CSS 的
  //    var(--apollo-font-size) 提供，与继承字号无关。
  // ⚠️ html 行高 1.15 必须有（2026-09-22 badge 实测）：antd reset.css（modern-normalize
  //    系）设 `html{line-height:1.15}`，缺了它 inline 元素之间的空白行高走 normal，
  //    整页高差 1px（badge basic 75 vs 76）。reset 的镜像规则逐条对齐，不算 H9。
  'html,body{width:100%;height:100%;margin:0;padding:0}',
  'html{font-family:var(--apollo-font-family);line-height:1.15;-webkit-text-size-adjust:100%}',
  'body{font-family:var(--apollo-font-family)}',
  // ---- 标题与段落 ----
  'h1,h2,h3,h4,h5,h6{margin-top:0;margin-bottom:0.5em;font-weight:500}',
  'p{margin-top:0;margin-bottom:1em}',
  // ---- 列表 ----
  'ol,ul,dl{margin-top:0;margin-bottom:1em}',
  'ol ol,ul ul,ol ul,ul ol{margin-bottom:0}',
  'dt{font-weight:500}',
  'dd{margin-bottom:0.5em;margin-left:0}',
  // ---- 引用与代码 ----
  'blockquote{margin:0 0 1em}',
  'address{margin-bottom:1em;font-style:normal;line-height:inherit}',
  "pre,code,kbd,samp{font-size:1em;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,Courier,monospace}",
  'pre{margin-top:0;margin-bottom:1em;overflow:auto}',
  'figure{margin:0 0 1em}',
  // ---- 行内语义 ----
  'abbr[title],abbr[data-original-title]{-webkit-text-decoration:underline dotted;text-decoration:underline dotted;border-bottom:0;cursor:help}',
  'dfn{font-style:italic}',
  'b,strong{font-weight:bolder}',
  'small{font-size:80%}',
  'sub,sup{position:relative;font-size:75%;line-height:0;vertical-align:baseline}',
  'sub{bottom:-0.25em}',
  'sup{top:-0.5em}',
  // ---- 媒体与表格 ----
  'img{vertical-align:middle;border-style:none}',
  'table{border-collapse:collapse}',
  'caption{padding-top:0.75em;padding-bottom:0.3em;text-align:left;caption-side:bottom}',
  'hr{box-sizing:content-box;height:0;overflow:visible}',
  // ---- 表单控件归一化（`getActionButtonFontReset` 补偿的就是这一条）----
  'input,button,select,optgroup,textarea{margin:0;color:inherit;font-size:inherit;font-family:inherit;line-height:inherit}',
  'button,input{overflow:visible}',
  'button,select{text-transform:none}',
  "button,html [type='button'],[type='reset'],[type='submit']{-webkit-appearance:button}",
  "button::-moz-focus-inner,[type='button']::-moz-focus-inner,[type='reset']::-moz-focus-inner,[type='submit']::-moz-focus-inner{padding:0;border-style:none}",
  "input[type='radio'],input[type='checkbox']{box-sizing:border-box;padding:0}",
  "input[type='date'],input[type='time'],input[type='datetime-local'],input[type='month']{-webkit-appearance:listbox}",
  "input[type='text'],input[type='password'],input[type='number'],textarea{-webkit-appearance:none}",
  'textarea{overflow:auto;resize:vertical}',
  'input::-ms-clear,input::-ms-reveal{display:none}',
  // ---- 触摸与焦点 ----
  "a,area,button,[role='button'],input:not([type='range']),label,select,summary,textarea{touch-action:manipulation}",
  "[tabindex='-1']:focus{outline:none}",
].join('');

/** 生成单个组件在**全部静态前缀**下的 CSS（`dist/<name>/style.css` 的内容）。 */
export function genComponentStyleSheet(name: string): string {
  const entry = COMPONENT_STYLES.find((item) => item.name === name);
  if (!entry) {
    throw new Error(
      `[apollo: style] 未知组件 "${name}"。已知：${COMPONENT_STYLES.map((i) => i.name).join(', ')}`,
    );
  }
  return [
    `/*! @apollo-design/ui — ${name} 组件样式（自动生成，勿手改） */`,
    `/*! 前缀：${STATIC_PREFIX_CLS.join(' / ')} ｜ 生成方式：packages/ui/build.config.ts */`,
    '',
    BASE_CSS,
    '',
    ...STATIC_PREFIX_CLS.map((prefix) => entry.gen(prefix)),
  ].join('\n');
}

/** 组件名 → 该组件的完整 CSS。构建钩子据此写出每组件一份。 */
export function genComponentStyleMap(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of COMPONENT_STYLES) {
    out[entry.name] = genComponentStyleSheet(entry.name);
  }
  return out;
}

/** 全部组件的汇总 CSS（`dist/index.css` 的内容）。 */
export function genAllStyles(): string {
  return [
    '/*!',
    ' * @apollo-design/ui — 全部组件样式（自动生成，勿手改）',
    ` * 组件数：${COMPONENT_STYLES.length} ｜ 前缀：${STATIC_PREFIX_CLS.join(' / ')}`,
    ' * 按需引入请用 `@apollo-design/ui/<component>/style.css`，不要引本文件。',
    ' * 主题变量不在本文件里 —— 先引入 `@apollo-design/theme/tokens.css`。',
    ' */',
    '',
    BASE_CSS,
    '',
    ...COMPONENT_STYLES.flatMap((entry) => STATIC_PREFIX_CLS.map((prefix) => entry.gen(prefix))),
  ].join('\n');
}
