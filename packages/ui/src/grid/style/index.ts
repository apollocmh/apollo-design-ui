/**
 * Grid 的样式生成（Row + Col）。
 *
 * 契约来源：antd 6.6.4 的 `es/grid/style/index.js`（genGridRowStyle / genGridColStyle /
 * genLoopGridColumnsStyle / genGridMediaStyle）。
 *
 * ── 与 antd 的结构对应 ────────────────────────────────────────────────────────
 *
 * - antd 用两个 genStyleHooks（'Grid' 注册两次：Row 用 genGridRowStyle、
 *   Col 用 genGridColStyle + 24 栏循环 + 媒体查询）。零运行时架构下只有一个
 *   静态入口 `genGridStyle(rootPrefixCls)`，内部同时产出 `.{root}-row` 与
 *   `.{root}-col` 两套规则 —— COMPONENT_STYLES 的一个条目对应一个组件目录。
 * - `rootPrefixCls` 是**根前缀**（`apollo`），行/列类名在其上加 `-row`/`-col`
 *   段（与 getPrefixCls('row') / getPrefixCls('col') 的结果一致）。
 *
 * ── 与 antd 的有意差异 ────────────────────────────────────────────────────────
 *
 * 1. antd 的 `-{i}` 规则里有 `[gridVarName('display')]: 'block'` + `display: var(...)`
 *    的 Form 覆盖变量机制；本文件落地时 antd 侧还没有生产者，当时简化为直接
 *    `display: block`。**2026-09-29 Form 收口时已按 antd 逐字接线**
 *    （`--{root}-grid-display:block` + `display:block` + `display:var(...)`，
 *    Form 的 `-item-control` 把它改写成 flex）。
 * 2. 响应式 flex 的变量名：antd `--ant-col-{size}-flex`（genCssVar 生成），
 *    我们 `--{rootPrefixCls}-col-{size}-flex`（Col.vue 内联消费，命名同构）。
 */

/** 栅格列数。antd 的 `gridColumns: 24`（mergeToken 派生常量，非 token）。 */
const GRID_COLUMNS = 24;

/** Row 规则（antd 的 genGridRowStyle 逐条）。 */
function genGridRowStyle(cls: string): string[] {
  return [
    `${cls}{`,
    // genCommonStyle（genStyleHooks 注入）：字体必须组件级提供 —— 继承字号
    // 在 React 基线页是 16px（浏览器默认），antd 靠这条把文字钉回 14px
    //（2026-09-22 badge 全局字号实验后回归 grid 时实测抓出）。
    `  font-family:var(--apollo-font-family);`,
    `  font-size:var(--apollo-font-size);`,
    `  display:flex;`,
    `  flex-flow:row wrap;`,
    `  min-width:0;`,
    `}`,
    `${cls}::before,${cls}::after{`,
    `  display:flex;`,
    `}`,
    `${cls}-no-wrap{`,
    `  flex-wrap:nowrap;`,
    `}`,
    // The origin of the X-axis
    `${cls}-start{`,
    `  justify-content:flex-start;`,
    `}`,
    `${cls}-center{`,
    `  justify-content:center;`,
    `}`,
    // The opposite of the X-axis
    `${cls}-end{`,
    `  justify-content:flex-end;`,
    `}`,
    `${cls}-space-between{`,
    `  justify-content:space-between;`,
    `}`,
    `${cls}-space-around{`,
    `  justify-content:space-around;`,
    `}`,
    `${cls}-space-evenly{`,
    `  justify-content:space-evenly;`,
    `}`,
    // Align at the top
    `${cls}-top{`,
    `  align-items:flex-start;`,
    `}`,
    `${cls}-middle{`,
    `  align-items:center;`,
    `}`,
    `${cls}-bottom{`,
    `  align-items:flex-end;`,
    `}`,
    // ⚠️ antd 6.6.4 没有 `-stretch` 规则（align 枚举里有 stretch，但样式表无对应类）—— 逐字对齐。
  ];
}

/** Col 基础规则（antd 的 genGridColStyle 逐条）。 */
function genGridColStyle(cls: string): string[] {
  return [
    `${cls}{`,
    // genCommonStyle 同上（font-family/font-size）
    `  font-family:var(--apollo-font-family);`,
    `  font-size:var(--apollo-font-size);`,
    `  position:relative;`,
    `  max-width:100%;`,
    `  min-height:1px;`,
    `}`,
  ];
}

/**
 * 24 栏循环（antd 的 genLoopGridColumnsStyle 逐条，i = 24…0）。
 *
 * @param cls          列类名前缀（`.{root}-col`）
 * @param sizeCls      尺寸段：''（基础）或 '-sm' 等
 * @param rootPrefix   根前缀（响应式 flex 的 CSS 变量命名用）
 */
function genLoopGridColumnsStyle(cls: string, sizeCls: string, rootPrefix: string): string[] {
  const rules: string[] = [];
  for (let i = GRID_COLUMNS; i >= 0; i--) {
    const percent = `${(i / GRID_COLUMNS) * 100}%`;
    if (i === 0) {
      rules.push(
        `${cls}${sizeCls}-0{`,
        `  display:none;`,
        `}`,
        `${cls}-push-0{`,
        `  inset-inline-start:auto;`,
        `}`,
        `${cls}-pull-0{`,
        `  inset-inline-end:auto;`,
        `}`,
        `${cls}${sizeCls}-push-0{`,
        `  inset-inline-start:auto;`,
        `}`,
        `${cls}${sizeCls}-pull-0{`,
        `  inset-inline-end:auto;`,
        `}`,
        `${cls}${sizeCls}-offset-0{`,
        `  margin-inline-start:0;`,
        `}`,
        `${cls}${sizeCls}-order-0{`,
        `  order:0;`,
        `}`,
      );
    } else {
      // https://github.com/ant-design/ant-design/issues/44456
      // Form set display:flex on Col which will override display:block.
      // ⇒ antd 用 CSS 变量做覆盖钩子：Col 声明 `--ant-grid-display:block` 并消费它，
      //   Form 的 `-item-control` 把它改写成 flex（Form 落地后已接线，见
      //   docs/analysis/grid.md §3 的遗留项）。
      // ⚠️ 两条 display 必须都在：`display:block` 是旧浏览器兜底，语义由变量那条承担。
      rules.push(
        `${cls}${sizeCls}-${i}{`,
        `  --${rootPrefix}-grid-display:block;`,
        `  display:block;`,
        `  display:var(--${rootPrefix}-grid-display);`,
        `  flex:0 0 ${percent};`,
        `  max-width:${percent};`,
        `}`,
        `${cls}${sizeCls}-push-${i}{`,
        `  inset-inline-start:${percent};`,
        `}`,
        `${cls}${sizeCls}-pull-${i}{`,
        `  inset-inline-end:${percent};`,
        `}`,
        `${cls}${sizeCls}-offset-${i}{`,
        `  margin-inline-start:${percent};`,
        `}`,
        `${cls}${sizeCls}-order-${i}{`,
        `  order:${i};`,
        `}`,
      );
    }
  }
  // Flex CSS Var（antd：`${componentCls}${sizeCls}-flex` → `flex: var(--{root}-col-{size}-flex)`）
  // ⚠️ antd 的 var 名取 `sizeCls.replace(/-/, '')`：'' → '-flex'、'-sm' → 'sm-flex'（原样保留这个 quirk）。
  const varName = `${sizeCls.replace(/-/, '')}-flex`;
  rules.push(`${cls}${sizeCls}-flex{`, `  flex:var(--${rootPrefix}-col-${varName});`, `}`);
  return rules;
}

/** 媒体查询包装（antd 的 genGridMediaStyle；screen 值由 useToken 提供，数字补 px）。 */
function genGridMediaStyle(
  screenSize: number,
  sizeCls: string,
  cls: string,
  rootPrefix: string,
): string[] {
  const body = genLoopGridColumnsStyle(cls, sizeCls, rootPrefix);
  return [`@media (min-width: ${screenSize}px){`, ...body, `}`];
}

/**
 * 生成 Grid 的全部静态 CSS（Row + Col）。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）—— 行/列类名与 CSS 变量的命名根
 */
export function genGridStyle(rootPrefixCls: string): string {
  const rowCls = `.${rootPrefixCls}-row`;
  const colCls = `.${rootPrefixCls}-col`;

  // 响应式 flex 变量的静态默认声明（B7：引用的变量必须有声明来源）。
  // Col.vue 在存在 sizeProps.flex 时同步内联覆盖同名变量 —— 类与内联恒成对出现，
  // 静态默认值 `initial` 仅为声明完整性；缺省（未覆盖）时该 var 不被任何规则消费。
  const flexVars = ['', ...['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'].map((s) => `-${s}`)].map(
    (sizeCls) => `  --${rootPrefixCls}-col-${sizeCls.replace(/-/, '')}-flex:initial;`,
  );
  const rules: string[] = [
    `${colCls}{`,
    ...flexVars,
    `}`,
    // Row（genStyleHooks('Grid', genGridRowStyle) 不包 media）
    ...genGridRowStyle(rowCls),
    // Col 基础
    ...genGridColStyle(colCls),
    // 基础 24 栏（不包 media）+ -xs（antd：xs 不包 media，见分析 §3）
    ...genLoopGridColumnsStyle(colCls, '', rootPrefixCls),
    ...genLoopGridColumnsStyle(colCls, '-xs', rootPrefixCls),
  ];

  // sm…xxxl 包 @media (min-width: screenXMin)（antd 的 getMediaSize，xs 已删除）
  const mediaSizes: Array<[string, number]> = [
    ['sm', useTokenScreen('screenSMMin')],
    ['md', useTokenScreen('screenMDMin')],
    ['lg', useTokenScreen('screenLGMin')],
    ['xl', useTokenScreen('screenXLMin')],
    ['xxl', useTokenScreen('screenXXLMin')],
    ['xxxl', useTokenScreen('screenXXXLMin')],
  ];
  for (const [key, size] of mediaSizes) {
    rules.push(...genGridMediaStyle(size, `-${key}`, colCls, rootPrefixCls));
  }

  return rules.join('\n');
}

/**
 * 屏幕断点值。antd 的 `getMediaSize` 从 useToken() 取 —— 零运行时架构下
 * 样式是**构建/调用时**的纯函数，这里从 theme 的默认 seed 直接取值（与
 * antd 的默认 seed 逐字一致：480/576/768/992/1200/1600/1920）。
 * ⚠️ 主题覆盖 screen 断点不会改变这里输出的 media query —— antd 的
 * cssinjs 会随 token 重算。登记为已知边界（docs/analysis/grid.md §5）。
 */
function useTokenScreen(
  name:
    | 'screenSMMin'
    | 'screenMDMin'
    | 'screenLGMin'
    | 'screenXLMin'
    | 'screenXXLMin'
    | 'screenXXXLMin',
): number {
  // 与 packages/theme/src/alias.ts 的默认 seed 逐字一致（Grid 的 media query 用 Min 值）。
  const SCREENS = {
    screenSMMin: 576,
    screenMDMin: 768,
    screenLGMin: 992,
    screenXLMin: 1200,
    screenXXLMin: 1600,
    screenXXXLMin: 1920,
  } as const;
  return SCREENS[name];
}
