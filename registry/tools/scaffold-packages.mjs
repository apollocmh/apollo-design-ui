#!/usr/bin/env node
/**
 * scaffold-packages.mjs
 *
 * 生成 packages/ 下 11 个包的骨架（package.json + README.md + tsconfig.json）。
 *
 * 为什么用脚本而不是手写：
 *   1. 依赖声明必须与 ARCHITECTURE.md §3 的分层规则严格一致。
 *      手写 11 个 package.json 很容易出现"悄悄多了一个依赖"，而 .npmrc 的 hoist=false
 *      会让这个错误在构建时才暴露。脚本把规则固化下来。
 *   2. 每个包的 README 必须声明它的「职责边界 / 公开 API / 依赖约束 / 不做什么」。
 *      用模板生成可以保证这些字段不遗漏。
 *
 * 用法：
 *   node registry/tools/scaffold-packages.mjs             # 生成缺失的文件，不覆盖已存在的
 *   node registry/tools/scaffold-packages.mjs --force           # 强制覆盖（会覆盖 src/index.ts，慎用）
 *   node registry/tools/scaffold-packages.mjs --force-pkg       # 只强制覆盖 package.json
 *   node registry/tools/scaffold-packages.mjs --force-readme    # 只强制覆盖 README.md
 *
 * 为什么要有 --force-readme：
 *   README 里的「依赖表」是 `deps` / `devDeps` 的投影。依赖一改（例如把某个包从
 *   dependencies 移到 devDependencies），README 就失真了 —— 而它是**默认不覆盖**的，
 *   只能靠人记得手工同步。加这个开关，让「改模板 → 回写 README」变成一条命令。
 *
 * 为什么要有 --force-pkg：
 *   包契约（exports / files / scripts）改了之后需要回写到全部已存在的包，但 --force 会连带
 *   覆盖 src/index.ts，把已完成的实现清空。package.json 是纯模板产物、不含手工内容，
 *   可以安全地单独强制刷新。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const force = process.argv.includes('--force');
const forcePkg = force || process.argv.includes('--force-pkg');
const forceReadme = force || process.argv.includes('--force-readme');

/**
 * ui 的 CSS 子路径导出（裁决 `ui-style-output` = A：每组件一份 CSS + 汇总 index.css）。
 *
 * 判据是 `registry/components.json` 里该组件的 `styleStatus === 'done'` —— 那是
 * 「样式产物真的存在」的机器可读记录。不读文件系统是因为构建产物可能已被 `rm -rf dist`
 * 清掉，那会让 exports 随着一次清理而缩水；而 progress 字段不会。
 * 两者不一致时由 `tests/build/run.mjs` 的 B2 报错，而不是静默。
 *
 * ⚠️ 必须在模块顶层声明：PACKAGES 在模块求值时就调用它，函数声明虽提升，
 *    但声明在 `if (isMain)` 块里就出不了那个块。
 */
function uiStyleExports() {
  const file = path.join(ROOT, 'registry/components.json');
  if (!fs.existsSync(file)) return {};
  const components = JSON.parse(fs.readFileSync(file, 'utf8')).components ?? [];
  const out = { './style.css': './dist/index.css' };
  for (const c of components) {
    if (c.styleStatus !== 'done') continue;
    out[`./${c.name}/style.css`] = `./dist/${c.name}/style.css`;
  }
  return out;
}

/**
 * 包定义。
 * layer 决定它可以依赖哪些层（ARCHITECTURE.md §3.1 R1）。
 * deps / peerDeps 中的 `@apollo-design/*` 必须是同层或更低层 —— 脚本会校验。
 */
const PACKAGES = [
  {
    dir: 'utils',
    name: '@apollo-design/utils',
    layer: 'L0',
    purpose: '通用工具集。全库的地基，被全部 72 个组件依赖。',
    replaces: [
      '@rc-component/util',
      '@rc-component/resize-observer',
      '@rc-component/mutate-observer',
      '@rc-component/overflow（检测部分）',
      'throttle-debounce',
    ],
    deps: {},
    peerDeps: { vue: 'catalog:' },
    publicApi: [
      '类型判断：isNumber / isString / isFunction / isPlainObject / isThenable / isPrimitive / isNonNullable / isRenderable / isVNode / isEmptyVNode / isFragmentVNode / isElementVNode / isComponentVNode / isWindow / isDocument / isHTMLElement / isTransitionEvent',
      '警告体系：warning / note / warningOnce / noteOnce / preMessage / resetWarned（dev-only + 去重）',
      '开发期告警：devUseWarning(component)（组件名前缀 + deprecated 聚合 + strict 开关）',
      'DOM：canUseDom / contains / isVisible / isStyleSupport / getScroll / getElement / isDOM',
      '调度：raf / cancelRaf / throttleByAnimationFrame / throttle / debounce',
      'ref 工具：fillRef / composeRef / useComposeRef / supportRef / supportNodeRef / getNodeRef',
      '属性工具：pickAttrs / toNativeEventName（React 合成事件名 → DOM 事件名）',
      '对象工具：omit / mergeProps / isEqual / get / set / merge / mergeWith',
      '子节点工具：toArray（展平 slot / 数组 / Fragment）',
      '键盘：KeyCode',
      '焦点：getFocusNodeList / triggerFocus / lockFocus / useLockFocus',
      '观察器：useResizeObserver / useMutationObserver / useOverflow（单例复用）',
      'composable：useControlledValue / useDelayState / useUpdateEffect / useId / useSafeState',
      '其他：toList / capitalize',
      // 颜色纯数学层：theme 与 icons 共用，依据 ARCHITECTURE.md §3.1 R2 的例外条款
      // （utils 是 L0 公共底座）。只放算法，不放色值数据（R3）。
      '颜色：Color / generatePalette（10 阶色板）—— 由 color.oracle.test.ts 对上游差分验证',
    ],
    // 上游颜色包的**唯一**合法位置：差分验证的 Oracle（R7）。
    devDeps: {
      '@ant-design/colors': 'catalog:',
      '@ant-design/fast-color': 'catalog:',
    },
    notDo: [
      // ⚠️ 措辞要精确：「不含视觉语义」指的是不含**设计值**（色值 / 圆角 / 尺寸 / 阴影 / 字号），
      //    不是「不能出现 color 这个词」。颜色**算法**（把色值当输入、不内置任何色值）
      //    是 R2 例外条款允许的 —— theme 与 icons 共用它。判据由
      //    `__tests__/barrel.test.ts` 的源码扫描执行（查色值字面量，不查名字）。
      '不含任何设计值：无圆角 / 尺寸 / 阴影 / 字号的字面值，也不含任何色值字面量（R3）',
      '不产出任何 CSS',
      '不依赖 @apollo-design/* 的任何其他包（L0 是最底层）',
      '不提供 render/unmount —— 含 Vue 渲染器耦合，归 packages/ui/src/_internal',
      'src/color/ 只放算法（R3 由 barrel.test.ts 的色值字面量扫描强制）；预设色板归 theme',
    ],
    contracts: [
      'warning 的输出格式必须与 antd 一致（含组件名前缀），因为测试会断言 warning',
      'pickAttrs 的白名单逐字复刻，且必须做 React 事件名 → DOM 事件名的转换（见 docs/foundation/rc-util-contract.md §6.1）',
      'isEqual 的共享引用 quirk 必须保留（见同文档 §6.2）',
      'raf 的 cancel 对已完成的 id 必须幂等且不抛错',
      'useResizeObserver 必须支持批量监听同一元素（单例 observer 复用）',
      '任何 dev-only 代码不得裸写 process.env.NODE_ENV（见同文档 §6.4）',
    ],
    risk: 'high',
    phase2Order: 1,
  },
  {
    dir: 'theme',
    name: '@apollo-design/theme',
    layer: 'L0',
    purpose:
      'Token Runtime：Seed → Map → Alias → Component 的完整派生链，以及 Token → CSS 变量的注入。',
    replaces: [
      '@ant-design/cssinjs（Token 计算部分）',
      '@ant-design/cssinjs-utils',
      'antd 的 components/theme/',
    ],
    // 颜色数学来自 utils（R2 例外条款），本包只保留**色值数据**。
    deps: { '@apollo-design/utils': 'workspace:*' },
    // 上游颜色包只剩两个用途：① 生成 `src/generated/preset-palettes.ts` 的构建期数据源
    // ② 差分验证的 Oracle。两者都不进入用户依赖树（R7）。
    devDeps: {
      '@ant-design/colors': 'catalog:',
      '@ant-design/fast-color': 'catalog:',
    },
    peerDeps: { vue: 'catalog:' },
    // 2026-09-18 补：`dist/tokens.css` 是零运行时架构下**所有组件样式的前置依赖**
    // （`ui/src/index.ts`、`ui/src/style/index.ts`、各组件文档都写着「先引入它」），
    // 但 exports 里原本没声明 —— 消费者照文档写会解析失败。
    // 命名与 ui 的 `./style.css` 同构：**不含 dist 前缀**。
    //
    // ⚠️ 声明必须指向构建后真实存在的路径（见 packageJson() 里的契约注释）。
    //    tokens.css 由 `packages/theme/build.config.ts` 的 hook 产出，非 unbuild 默认产物，
    //    所以这里不能只靠「unbuild 会生成 dist/」来推断。
    extraExports: {
      './tokens.css': './dist/tokens.css',
    },
    publicApi: [
      '类型：SeedToken / MapToken / AliasToken / ComponentTokenMap / MappingAlgorithm / ThemeConfig',
      '算法：defaultAlgorithm / darkAlgorithm / compactAlgorithm',
      '派生：genColorMapToken / genSizeMapToken / genFontMapToken / genRadius / genControlHeight',
      '运行时：useToken() / useTheme() / ThemeProvider',
      '注入：createCSSVarScope() / applyCSSVar() / tokenToCSSVarName()',
      '纯函数：getDesignToken(config) —— 无 DOM 环境可用',
      '常量：presetColors（13 色 × 10 阶）',
    ],
    notDo: [
      '不做 CSS-in-JS（零运行时，见 ADR 0001）',
      '不产出组件的具体样式（那是 ui 的职责）',
      '不依赖任何组件',
      // ⚠️ 措辞要准确：本包**没有** src/generated/ —— 预设色板不是固化数据，
      //    而是由 utils 的 generatePalette 现算（实测 13 个预设色与上游
      //    presetPalettes 逐位相同，所以固化成数据是多余的）。
      //    曾误写成「构建期固化到 src/generated/ 的数据」，与实现不符。
      '运行时不读 @ant-design/colors —— 色板由 @apollo-design/utils 的 generatePalette 计算（R7）',
    ],
    contracts: [
      'Token 名称必须与 antd 完全一致（Seed 34 / Map 140 / Alias 82 own / Component 70 组）',
      'CSS 变量命名与 antd 的 cssVar 命名同构，仅前缀不同（apollo vs ant）',
      'getDesignToken 的输出必须与 antd 的同名 API 逐字段一致',
      '三个算法必须可组合（algorithm: [darkAlgorithm, compactAlgorithm]）',
    ],
    risk: 'high',
    phase2Order: 2,
  },
  {
    dir: 'icons',
    name: '@apollo-design/icons',
    layer: 'L0',
    purpose: 'Vue 图标组件集。以 @ant-design/icons-svg 为数据源生成，保证与 antd 图标像素一致。',
    replaces: ['@ant-design/icons'],
    deps: {
      // 告警复用 utils 的 `warningOnce`，而不是在 icons 内再写一份。
      // 依据：utils 的 warning 契约文档明确写着「测试会断言告警文本，前缀格式/去重范围
      // 有偏差会让告警一致性测试假通过」—— 复制一份等于把这条契约分叉。
      // L0 → L0 同层依赖，走 R2 的 utils 例外条款（utils 不依赖 icons，无环）。
      '@apollo-design/utils': 'workspace:*',
    },
    // 上游图标包的唯一合法位置：**构建期数据源**（R7）。
    // gen-icons.mjs 从它求值出 848 份定义，固化成 src/icons/*.ts 的字面量随包发布；
    // 运行时的 @apollo-design/icons 不含任何对它的 import。
    devDeps: {
      '@ant-design/icons-svg': 'catalog:',
      // 钉住 `DEFAULT_TWOTONE_COLOR`（= 上游 `blue.primary`）的 Oracle。
      '@ant-design/colors': 'catalog:',
    },
    peerDeps: { vue: 'catalog:' },
    publicApi: [
      '全部图标组件（PascalCase 命名，与 @ant-design/icons 一致）',
      '基础组件：Icon / createIcon / IconProvider',
      '工具：setTwoToneColor / getTwoToneColor / createFromIconfontCN',
      '样式：getIconStyle(iconPrefixCls) —— 供 ui 的静态样式层消费',
    ],
    notDo: [
      // ⚠️ 措辞要点：是「从 icons-svg 生成」，不是「依赖 icons-svg」。
      // 前者是构建期行为，后者是运行时依赖（R7 禁止）。
      '不手写 SVG path（必须由 gen-icons.mjs 从 @ant-design/icons-svg **固化**成字面量）',
      '运行时不 import @ant-design/icons-svg —— 图标数据已随包发布（R7）',
      '不做运行时 <style> 注入（图标基础样式由 getIconStyle 交给 ui 的零运行时样式层）',
    ],
    contracts: [
      '图标名与 @ant-design/icons 完全一致（Outlined / Filled / TwoTone 三种主题）',
      '图标尺寸继承 font-size，颜色继承 currentColor',
      'TwoTone 图标支持双色定制；非 TwoTone 图标忽略 twoToneColor（与 antd 一致）',
      'DOM 契约以 tests/compat/baselines/icons.dom.json（机械 oracle）为准',
    ],
    risk: 'low',
    phase2Order: 3,
    coverageNote:
      '**覆盖率豁免**：本包是**生成物**（848 个图标来自 `@ant-design/icons-svg`），对生成代码要求行覆盖率没有意义 —— `vitest.config.ts` 的 `coverage.thresholds` 档位里**不含** `icons`（与 `locale` 同规，依据 `ARCHITECTURE.md` §7）。\n' +
      '行为测试的落点在 9 个手写文件（`render` / `create-icon` / `icon` / `icon-font` / `two-tone-color` / `context` / `class-names` / `style` / `index`）上。',
    buildNote:
      '848 个图标组件由 `registry/tools/gen-icons.mjs` 从 `@ant-design/icons-svg` 生成到 `src/icons/`，**该目录是生成物、不入 review**（与 locale 的 `src/generated/` 同规）。\n\n' +
      '```bash\n' +
      'node registry/tools/gen-icons.mjs          # 生成/刷新\n' +
      'node registry/tools/gen-icons.mjs --check  # 只比对，不写入（门禁用）\n' +
      '```\n\n' +
      '要改图标行为，改 `src/create-icon.ts` / `src/render.ts`，**不要改 `src/icons/` 下的任何文件** —— 下次生成会被覆盖。',
  },
  {
    dir: 'motion',
    name: '@apollo-design/motion',
    layer: 'L1',
    purpose: 'CSSMotion 等价物：声明式 CSS 过渡/动画控制。替代 @rc-component/motion。',
    replaces: ['@rc-component/motion'],
    deps: { '@apollo-design/utils': 'workspace:*' },
    peerDeps: { vue: 'catalog:' },
    publicApi: [
      'CSSMotion 组件',
      'MotionProvider / motion 全局开关',
      '语义预设：collapseMotion / fadeMotion / slideMotion / zoomMotion / moveMotion',
      'composable：useMotion()',
    ],
    notDo: ['不依赖 portal / trigger', '不定义具体组件的动效参数（那是 ui 的职责）'],
    contracts: [
      '必须支持 motionAppear / motionEnter / motionLeave / motionDeadline / motionLeaveImmediately',
      '必须支持多元素 stagger（如 Collapse 的逐项展开）',
      '必须在 prefers-reduced-motion 下自动禁用动画',
      '卸载时必须清理所有 timer 与事件监听（有测试断言不泄漏）',
    ],
    risk: 'high',
    phase2Order: 6,
    poc: 'AR2 —— 必须先做 PoC 验证 collapse/slide/zoom/fade/move 五类语义',
  },
  {
    dir: 'portal',
    name: '@apollo-design/portal',
    layer: 'L1',
    purpose:
      '基于 Vue Teleport 的挂载与层级管理。替代 @rc-component/portal 及 rc-dialog 的挂载部分。',
    replaces: ['@rc-component/portal', '@rc-component/dialog（挂载部分）'],
    deps: { '@apollo-design/utils': 'workspace:*' },
    peerDeps: { vue: 'catalog:' },
    publicApi: [
      'Portal 组件（Teleport 封装，支持 SSR 安全延迟挂载）',
      '容器管理：getContainer / createContainer / destroyContainer',
      '层级：useZIndex / ZIndexContext / getNextZIndex',
      'ContextIsolator（切断 provider 传递）',
    ],
    notDo: [
      '不实现浮层定位（那是 @apollo-design/position 的职责）',
      '不实现焦点陷阱（实现在 @apollo-design/utils，由 @apollo-design/a11y 再导出）',
      '不实现触发时机与显隐延迟（那是 @apollo-design/overlay 的职责）',
    ],
    contracts: [
      'SSR 下首屏不挂载，hydration 完成后挂载（避免 hydration mismatch）',
      'getPopupContainer 的解析优先级与 antd 一致',
      'z-index 递增规则与 antd 一致（弹窗类与浮层类分开计数）',
      '同一容器内多个浮层的堆叠顺序与打开顺序一致',
    ],
    risk: 'medium',
    phase2Order: 7,
  },
  {
    dir: 'position',
    name: '@apollo-design/position',
    layer: 'L1',
    purpose:
      '浮层定位几何。替代 @rc-component/trigger 与 rc-tooltip 的定位部分。**只做几何与尺寸测量**，触发时机与生命周期在 @apollo-design/overlay。',
    replaces: ['@rc-component/trigger（定位部分）', '@rc-component/tooltip（定位部分）'],
    deps: { '@apollo-design/utils': 'workspace:*' },
    peerDeps: { vue: 'catalog:' },
    publicApi: [
      'placements：12 个方位（topLeft / top / topRight / bottomLeft / ...）',
      '对齐计算：getAlignResult / getAlignOffset / getArrowOffset',
      '边界处理：flip（翻转）/ shift（收缩）/ 滚动容器跟随（含祖先滚动链）',
      '坐标解析：getPopupContainer / getDocument / 可视区与滚动区计算',
      'usePosition —— 把上述能力接到响应式目标与浮层元素上',
    ],
    notDo: [
      '不实现触发时机与显隐延迟（那是 @apollo-design/overlay）',
      '不实现挂载与 z-index（那是 @apollo-design/portal）',
      '不实现任何视觉样式与 DOM 结构（只输出坐标数字）',
    ],
    contracts: [
      '★ 定位结果必须与 antd 像素级一致（这是 AR1，本项目最大风险点）',
      '纯几何部分必须可用无 DOM 的单测验证（坐标进 → 坐标出），只有尺寸测量需要 jsdom',
      '必须支持翻转（flip）与自适应（shift）',
      '箭头位置在 12 个方位下都正确',
    ],
    risk: 'high',
    phase2Order: 5,
    poc: 'AR1 —— 必须先做 PoC：topLeft/topRight/center/bottomLeft/bottomRight + 翻转 + 箭头，与 antd 参考截图逐像素比对',
  },
  {
    dir: 'a11y',
    name: '@apollo-design/a11y',
    layer: 'L1',
    purpose:
      '运行时无障碍原语。antd 把焦点管理、roving tabindex、live region 等散落在各组件与 rc 包里，本项目把它们收敛为可复用的原语。',
    replaces: ['antd 内联 a11y 逻辑（本项目新增能力：antd 没有对应的独立包）'],
    deps: { '@apollo-design/utils': 'workspace:*' },
    peerDeps: { vue: 'catalog:' },
    publicApi: [
      // ⚠️ 焦点陷阱**实现在 utils**（L0），本包只再导出 —— 见 docs/foundation/a11y-contract.md §1.1。
      //    反向搬运会构成 L0 → L1 的跨层依赖。
      'lockFocus / useLockFocus / getFocusNodeList / triggerFocus / resetFocusLock —— 焦点陷阱（再导出自 utils）',
      'useFocusRestore —— 关闭后焦点恢复（Modal / Drawer / Image.Preview）',
      'useRovingFocus + nextRovingIndex / moveRovingIndex / getRovingOffset / getRovingTabIndex —— roving tabindex 与方向键导航（Menu / Tabs / Radio.Group / Toolbar）',
      'useActiveDescendant + getListboxId / getOptionId —— aria-activedescendant 的 id 方案（Select / Tree / Listbox 类）',
      'useLiveRegion / announce / announceValues / formatLiveRegionText —— 屏幕阅读器播报（message / notification / upload / transfer）',
      'useTypeahead + pushTypeaheadChar / findTypeaheadIndex / isTypeaheadKey —— 键盘字符快速定位（Select / Tree / Menu）',
    ],
    notDo: [
      '不做视觉样式（本包零 CSS；唯一例外是隐藏 live region 的内联样式，它是可达性语义的一部分）',
      '不做 axe 扫描（那是 @apollo-design/test-utils 的 a11yDemoTest）',
      '不重复实现 useId（在 utils）',
      '不重写焦点陷阱（已在 utils，本包只再导出）',
      '不渲染组件（列表 / 菜单 / 浮层的 DOM 结构属 ui 层）',
    ],
    contracts: [
      '所有原语必须可在 jsdom 中用键盘事件断言（不需要真实浏览器）',
      '焦点恢复必须回到触发元素（Modal/Drawer 关闭后）',
      'live region 必须复用同一个 DOM 节点，避免播报丢失',
    ],
    risk: 'medium',
    phase2Order: 8,
  },
  {
    dir: 'virtual-list',
    name: '@apollo-design/virtual-list',
    layer: 'L1',
    purpose: '虚拟滚动。替代 @rc-component/virtual-list。',
    replaces: ['@rc-component/virtual-list'],
    deps: { '@apollo-design/utils': 'workspace:*' },
    peerDeps: { vue: 'catalog:' },
    publicApi: [
      // ⚠️ 上游叫 `List`；改名 `VirtualList` 是为了不与 antd 的 List 组件（数据列表）混淆。
      'VirtualList 组件（虚拟列表）—— 含 nativeElement / scrollTo / getScrollInfo 三个实例成员',
      '纯算法：computeRange / isInVirtual / shouldUseVirtual / keepInRange / keepInHorizontalRange / computeScrollTarget / normalizeScrollArg / resolveScrollOffset / createSizeGetter / createCacheMap / findListDiffIndex',
      'useHeights() —— 动态高度收集（微任务合并 + 可作废）',
      '定高模式与动态高度模式（缺 itemHeight 即退化为真实滚动）',
    ],
    notDo: [
      '不含任何视觉语义（行高/间距由消费方传入）',
      '不做自绘滚动条 —— 上游 ScrollBar 里写死了 borderRadius: 99 与 rgba(0, 0, 0, 0.5)，属视觉语义；改用原生滚动',
      '不做滚轮 / 触摸拦截 —— 上游拦截是因为 overflowY: hidden 让原生滚动失效，原生滚动不需要',
      '不做 useScrollTo / useVirtualList 组合式 —— scrollTo 的迭代被抽成纯函数 computeScrollTarget，Vue 侧循环在组件内',
    ],
    contracts: [
      '支持定高与动态高度两种模式',
      '支持横向虚拟滚动',
      "scrollTo 的 align 只有 'top' / 'bottom'（缺省 = auto：只在目标不在视口内时才滚）—— 上游 1.5.1 如此，**没有** start/center/end",
      '必须能同时服务 Select（下拉选项）/ Tree（树节点）/ Table（虚拟表格）三种形态',
    ],
    risk: 'high',
    phase2Order: 9,
    note: 'Phase 2 只需确定接口契约，实现可延后到 Select 开发前',
  },
  {
    dir: 'overlay',
    name: '@apollo-design/overlay',
    layer: 'L2',
    purpose:
      '锚定浮层的生命周期编排。替代 @rc-component/trigger 的触发时机与生命周期部分。**定位几何在 @apollo-design/position，挂载在 @apollo-design/portal** —— 本包只编排「何时开、何时关、谁在上层」。',
    replaces: ['@rc-component/trigger（生命周期部分）'],
    deps: {
      '@apollo-design/utils': 'workspace:*',
      '@apollo-design/portal': 'workspace:*',
      '@apollo-design/position': 'workspace:*',
      '@apollo-design/a11y': 'workspace:*',
    },
    peerDeps: { vue: 'catalog:' },
    publicApi: [
      'useOverlay —— 开合状态机（受控 / 非受控双模式）',
      '触发动作：hover / click / focus / contextMenu（与 antd 的 action 语义一致）',
      '延迟：mouseEnterDelay / mouseLeaveDelay / focusDelay / blurDelay',
      '关闭：外部点击（clickToHide，含 contextMenu）/ Esc / 失焦，及各自的关闭钩子',
      // 2026-09-18 修正：原文写「堆叠：与 portal 的 z-index 协调，后开的浮层在上层」——
      // 两处都错。① z-index 数值由 portal 的 computeZIndex 负责（本包不做）；
      // ② antd 的 z-index 是「组件类型偏移 + 嵌套上下文累加」，**不是** LIFO 栈，
      //    且最外层浮层根本不设 z-index（靠 DOM 顺序决定层叠）。
      // 本包唯一的「栈」是 Esc 栈（按开启顺序的 LIFO）。依据见
      // docs/foundation/overlay-contract.md §3.13 与 portal-contract.md §3.4。
      '层级：只做 Esc 栈（按开启顺序的 LIFO，仅栈顶响应）；z-index 数值归 portal',
    ],
    notDo: [
      '不实现定位几何（那是 @apollo-design/position）',
      '不实现挂载与容器（那是 @apollo-design/portal）',
      '不实现焦点陷阱本体（@apollo-design/a11y 再导出自 @apollo-design/utils）',
      '不产出任何视觉样式 —— 浮层长什么样是组件层的事',
    ],
    contracts: [
      '四种触发动作的开启/关闭时机必须与 antd 逐项一致（含边界：hover 到浮层上时不清空计时）',
      '受控（open）与非受控（defaultOpen）语义与 antd 一致',
      'Esc 关闭必须冒泡到最上层一个浮层，且只关闭它',
      '外部点击判定必须排除浮层自身与其 portal 容器内的节点',
    ],
    risk: 'high',
    phase2Order: 11,
  },
  {
    dir: 'locale',
    name: '@apollo-design/locale',
    layer: 'L2',
    purpose:
      '国际化数据包：73 个语言包 + Locale 类型 + 各组件 locale 分片。**由脚本从 antd 的 locale 源生成**（与 icons 同一套路），不手工维护。',
    replaces: ['antd/locale/*'],
    // ⚠️ 本包**零依赖**：语言包是纯数据，不需要 dayjs（那是 date-picker 组件的依赖）。
    //    这也是仓库里唯一一个 dependsOn 为空的 foundation 包。
    deps: {},
    // 但 useLocale / LocaleProvider 要 vue（inject / provide / defineComponent）—— R6 必须声明
    peerDeps: { vue: 'catalog:' },
    publicApi: [
      'Locale 类型（与 antd 的 Locale 结构逐字段一致，含 17 个分片键）',
      '73 个语言包：zh_CN / en_US / ja_JP / ...（导出名保留 antd 的下划线原名，便于只改包名迁移）',
      '各组件 locale 分片：DatePicker / Pagination / Table / Form / Upload / ...',
      'useLocale(name, defaultLocale?) —— 取某组件的 locale（**浅合并，context 侧赢**）',
      'LocaleProvider（已废弃）+ ANT_MARK —— 上游用它做「官方导出」校验',
      'changeConfirmLocale / getConfirmLocale —— Modal confirm 的模块级 locale 栈',
    ],
    notDo: [
      '不做运行时语言切换（那是 ConfigProvider 的 locale prop）',
      '不含任何组件实现',
      '不手工编辑生成产物 —— 改源头或改生成脚本',
      '不做子路径入口（antd 的 `antd/locale/zh_CN`）—— 本仓库裁决 A 是单文件产物，只能具名导入',
    ],
    contracts: [
      'Locale 类型的字段名与 antd 完全一致（用户迁移时 locale 对象可直接沿用）',
      '生成管线必须可重跑且幂等',
      '至少 zh_CN 与 en_US 必须完整覆盖全部组件分片',
    ],
    risk: 'low',
    phase2Order: 10,
    buildNote:
      '本包由 `registry/tools/gen-locale.mjs` 从 antd 6.6.4 的 **ESM 产物**（`es/locale/*.js`）求值后生成到 `src/locales/`。生成目录不入 review（同 icons）。rc 的 locale 数据固化在 `registry/source/locale-rc/`（带 provenance + sha256）。',
  },
  {
    dir: 'form-core',
    name: '@apollo-design/form-core',
    layer: 'L2',
    purpose:
      '表单状态机 + 字段校验引擎。替代 @rc-component/form 与 @rc-component/async-validator。',
    replaces: ['@rc-component/form', '@rc-component/async-validator'],
    deps: { '@apollo-design/utils': 'workspace:*' },
    peerDeps: { vue: 'catalog:' },
    // ⭐ 测试 Oracle（2026-09-18 加）：校验引擎是**纯 JS**（无 React 耦合），
    //    可以直接拿上游逐位差分 —— 比读源码强得多，与 position/motion 同档。
    //    只在 devDependencies（R7：任何发布包的 dependencies 出现上游包 = E19 失败）。
    //    见 docs/foundation/form-core-contract.md §9 第 1 条。
    devDeps: { '@rc-component/async-validator': 'catalog:' },
    publicApi: [
      'useForm() → [form]',
      'FormStore：字段注册/注销、依赖联动、异步校验、错误状态管理',
      'FieldContext / FormContext（供被 Form 包裹的输入组件消费）',
      '校验器：内置 rules（required / type / pattern / min / max / len / whitespace / enum / ...）',
      '自定义 validator / transform / validateMessages',
    ],
    notDo: ['不产出任何 UI（不含 Form.Item 的布局与样式）'],
    contracts: [
      'validateFields 的 Promise resolve/reject 内容与 antd 一致',
      '异步校验必须处理竞态：旧结果不得覆盖新结果',
      '字段依赖联动（dependencies / shouldUpdate）语义与 antd 一致',
      // 这里必须用模板字面量 + 转义的 \${ —— antd 的 validateMessages 占位符字面量就是 `${label}` 形式，
      // 写成普通字符串会被 biome 的 noTemplateCurlyInString 判为「疑似想写模板却漏了反引号」。
      `validateMessages 模板的占位符（\${label} / \${min} 等）与 antd 一致`,
      'Form.List 的增删移语义与 antd 一致',
    ],
    risk: 'high',
    phase2Order: 12,
    note: 'Phase 2 只需确定接口契约，实现可延后到 Form 开发前',
  },
  {
    dir: 'picker',
    name: '@apollo-design/picker',
    layer: 'L2',
    purpose: '日期/时间面板引擎。替代 @rc-component/picker。',
    replaces: ['@rc-component/picker'],
    deps: { '@apollo-design/utils': 'workspace:*' },
    peerDeps: { vue: 'catalog:', dayjs: 'catalog:' },
    publicApi: [
      'Picker 基础组件（面板渲染 + 选择状态机）',
      '面板：DatePanel / WeekPanel / MonthPanel / QuarterPanel / YearPanel / TimePanel',
      'RangePicker 状态机',
      'locale 适配层（与 @apollo-design/ui/locale 对接）',
    ],
    notDo: ['不实现输入框（那是 ui 的 DatePicker 与 Input）', '不重新实现日期数学（复用 dayjs）'],
    contracts: [
      '面板切换（日/周/月/季/年）的交互与 antd 一致',
      '区间选择的边界行为（起止互换、hover 预览、二次点击）与 antd 一致',
      '键盘导航（方向键 / PageUp / PageDown / Home / End）与 antd 一致',
      'disabledDate / disabledTime / showTime 的语义与 antd 一致',
    ],
    risk: 'high',
    phase2Order: 13,
    note: 'Phase 2 只需确定接口契约，实现可延后到 DatePicker 开发前',
  },
  {
    dir: 'test-utils',
    name: '@apollo-design/test-utils',
    layer: '测试',
    private: true,
    purpose: '共享测试契约。复刻 antd 的 tests/shared/ 并新增本项目特有的契约。',
    replaces: ['antd 的 tests/shared/*'],
    deps: {
      // ⚠️ 2026-09-17 补两个 foundation 依赖。两者都**不是**可选的：
      //    · theme —— `themeTest` 直接复用 `ThemeProvider` / `getDesignToken` /
      //      三个 algorithm，与「不重写 theme 的判定」是同一条 T2 原则。
      //    · utils —— `resetWarned` / `resetDevWarned` 直接复用 utils 的实现。
      //    漏声明的后果：`node tests/build/run.mjs` 的 B1 会以
      //    「Potential implicit dependencies found」让 unbuild 退出码 1 失败
      //    （unbuild 把未声明的 workspace 包当成「要被内联打包」的目标）。
      //    这构成 utils/theme → test-utils 的 workspace 依赖环（test-utils 同时被
      //    所有包 devDepend），ARCHITECTURE.md §3 已明文许可。
      '@apollo-design/theme': 'workspace:*',
      '@apollo-design/utils': 'workspace:*',
      '@vue/test-utils': 'catalog:',
      'axe-core': 'catalog:',
      vitest: 'catalog:',
    },
    peerDeps: { vue: 'catalog:' },
    publicApi: [
      'mountTest —— 渲染/更新/卸载不报错，无内存泄漏警告',
      'demoTest —— 遍历组件全部 demo，渲染无报错无 warning',
      'a11yDemoTest —— 遍历全部 demo 跑 axe，要求 0 violation',
      'focusTest —— 焦点获取/丢失/归还',
      'rtlTest —— 镜像布局无异常',
      'rootPropsTest —— rootClassName / rootStyle / prefixCls 契约',
      'domContractTest —— 与 React 基线比对结构化 DOM 契约（本项目新增）',
      'themeTest —— light/dark/compact/token-override 四态渲染（本项目新增）',
      'resetWarned / waitFrames / flushAll',
    ],
    notDo: ['不包含任何具体组件的测试用例'],
    contracts: [
      'domContractTest 的归一化必须对称（见 tests/compat/README.md §4）',
      'a11yDemoTest 不允许 disableRules 来通过',
      '所有等待必须是确定性的（禁止真实 sleep）',
    ],
    risk: 'medium',
    phase2Order: 4,
  },
  {
    dir: 'ui',
    name: '@apollo-design/ui',
    layer: 'L3',
    purpose: '组件库本体：72 个组件 + locale + 全局样式 + ConfigProvider。',
    replaces: ['antd（除上述 foundation 包承接的部分）'],
    deps: {
      '@apollo-design/utils': 'workspace:*',
      '@apollo-design/theme': 'workspace:*',
      '@apollo-design/icons': 'workspace:*',
      '@apollo-design/motion': 'workspace:*',
      '@apollo-design/portal': 'workspace:*',
      '@apollo-design/position': 'workspace:*',
      '@apollo-design/overlay': 'workspace:*',
      '@apollo-design/a11y': 'workspace:*',
      '@apollo-design/virtual-list': 'workspace:*',
      '@apollo-design/form-core': 'workspace:*',
      '@apollo-design/picker': 'workspace:*',
      '@apollo-design/locale': 'workspace:*',
      dayjs: 'catalog:',
      'scroll-into-view-if-needed': 'catalog:',
    },
    peerDeps: { vue: 'catalog:' },
    // 裁决 `ui-style-output` = A：每组件一份 CSS + 汇总 index.css。
    // 由 uiStyleExports() 从 components.json 推导，不手写。
    extraExports: uiStyleExports(),
    publicApi: [
      '72 个组件（见 registry/components.json）',
      'ConfigProvider —— Token / 主题 / locale / size / disabled / prefixCls 的统一入口',
      'locale —— 73 个语言包',
      '静态方法：message / notification / Modal.confirm',
      'composable：useApp / useMessage / useNotification / useModal / useForm / useToken / useBreakpoint',
      '样式产物：dist/index.css（汇总）+ dist/<component>/style.css（按需）',
      'genComponentStyles(prefixCls) —— 静态样式生成器（自定义 prefixCls 时使用）',
    ],
    notDo: [
      '不重复实现 foundation 包已覆盖的能力（ARCHITECTURE.md R5）',
      '不含任何 React 代码',
      '不含 CSS-in-JS 运行时',
    ],
    contracts: [
      '组件间不得互相 import 组件目录；共享 context 与工具必须放在 src/_internal/（见 ARCHITECTURE.md §8.4）',
      '组件样式不得硬编码视觉值（validate-registry E10）',
      '构建产物不得含 React 痕迹（validate-registry E11）',
    ],
    risk: 'high',
    phase2Order: 14,
  },
];

export { PACKAGES };

// ---------------------------------------------------------------------------
// main 守卫。
// 本文件可被其他工具 import 以复用 PACKAGES（如 foundation-status.mjs 需要
// dir / phase2Order / deps / poc 这些字段）。只有「直接执行」时才做分层校验与生成，
// 避免 import 产生副作用（否则任何 import 都会打印并可能 process.exit(1)）。
// ---------------------------------------------------------------------------
const isMain =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const LAYER_RANK = { L0: 0, L1: 1, L2: 2, L3: 3, 测试: 99 };
  const byName = new Map(PACKAGES.map((p) => [p.name, p]));

  // ---------------------------------------------------------------------------
  // 校验 1：依赖方向必须符合分层规则（R1 —— 只能依赖同层或更低层）
  // ---------------------------------------------------------------------------
  let violations = 0;
  for (const p of PACKAGES) {
    for (const dep of Object.keys(p.deps)) {
      if (!dep.startsWith('@apollo-design/')) continue;
      const target = byName.get(dep);
      if (!target) {
        console.error(`[scaffold] ERROR ${p.name} 依赖了未定义的包 ${dep}`);
        violations += 1;
        continue;
      }
      // R1 允许同层依赖（如 trigger(L1) → portal(L1)），只禁止依赖更高层
      if (LAYER_RANK[target.layer] > LAYER_RANK[p.layer]) {
        console.error(
          `[scaffold] ERROR 违反分层规则 R1: ${p.name}(${p.layer}) 依赖了更高层 ${dep}(${target.layer})`,
        );
        violations += 1;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 校验 2：包之间不得循环依赖（R2）
  // ---------------------------------------------------------------------------
  {
    const WHITE = 0;
    const GRAY = 1;
    const BLACK = 2;
    const color = new Map(PACKAGES.map((p) => [p.name, WHITE]));
    const stack = [];
    let cycle = null;

    function visit(name) {
      if (cycle) return;
      color.set(name, GRAY);
      stack.push(name);
      const p = byName.get(name);
      for (const dep of Object.keys(p.deps)) {
        if (!byName.has(dep)) continue;
        if (color.get(dep) === GRAY) {
          cycle = [...stack.slice(stack.indexOf(dep)), dep];
          return;
        }
        if (color.get(dep) === WHITE) visit(dep);
        if (cycle) return;
      }
      stack.pop();
      color.set(name, BLACK);
    }

    for (const p of PACKAGES) {
      if (color.get(p.name) === WHITE) visit(p.name);
      if (cycle) break;
    }

    if (cycle) {
      console.error(`[scaffold] ERROR 违反规则 R2，包之间存在循环依赖: ${cycle.join(' → ')}`);
      violations += 1;
    }
  }

  // ---------------------------------------------------------------------------
  // 校验 3：R7 —— 运行时依赖不得出现 Ant Design 生态包 / React
  //
  // 为什么在模板里就拦：package.json 由本文件拥有，只靠 validate-registry 的 E19
  // 去扫产物，等发现时代码已经写完了。这里拦的是「声明」，是更早的一层。
  //
  // 允许的三种用法都不经过 `deps`：
  //   ① 构建期数据源 → registry/tools/gen-*.mjs（它自己解析 devDeps 里的包）
  //   ② 测试 Oracle  → *.oracle.test.ts
  //   ③ 其余一律 devDeps
  // ---------------------------------------------------------------------------
  const RUNTIME_FORBIDDEN = [
    /^@ant-design\//,
    /^antd$/,
    /^react(-dom)?$/,
    /^@rc-component\//,
    /^rc-/,
  ];
  for (const p of PACKAGES) {
    for (const dep of Object.keys(p.deps)) {
      if (RUNTIME_FORBIDDEN.some((re) => re.test(dep))) {
        console.error(
          `[scaffold] ERROR 违反 R7: ${p.name} 的运行时依赖含 ${dep}。` +
            `Ant Design 生态包只能作为构建期数据源 / 测试 Oracle，声明到 devDeps 上。`,
        );
        violations += 1;
      }
    }
  }

  if (violations) {
    console.error(`[scaffold] ${violations} 个分层违规，中止`);
    process.exit(1);
  }
  console.log('[scaffold] 分层规则 R1（单向）与 R2（无环）校验通过\n');

  // ---------------------------------------------------------------------------
  // 生成
  // ---------------------------------------------------------------------------
  function writeIfNeeded(file, content, overwrite = force) {
    if (fs.existsSync(file) && !overwrite) {
      console.log(`  skip   ${path.relative(ROOT, file)}`);
      return;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    console.log(`  write  ${path.relative(ROOT, file)}`);
  }

  function packageJson(p) {
    const obj = {
      name: p.name,
      version: '0.0.0',
      description: p.purpose,
      license: 'MIT',
      type: 'module',
      ...(p.private ? { private: true } : {}),
      sideEffects: false,
      main: './dist/index.mjs',
      module: './dist/index.mjs',
      types: './dist/index.d.ts',
      // 裁决 Q9 = A：只保留 dist/ 单文件产物。
      // 曾经这里声明了 ./es/* 与 ./css/*，但 scripts.build 是裸 unbuild，只产出 dist/。
      // 结果是 exports 指向不存在的子路径，unbuild 以退出码 1 失败，pnpm -r build 全仓不可用。
      // 契约：exports 只允许声明构建后真实存在的路径。新增子路径导出必须同步改本模板与构建脚本。
      //
      // 2026-09-17 扩展（裁决 `ui-style-output` = A：每组件一份 CSS + 汇总 index.css）：
      //   ui 额外声明 `./style.css`（汇总）与 `./<component>/style.css`（按需）。
      //   子路径清单**由 components.json 推导**，判据是该组件的 `styleStatus === 'done'`
      //   —— 即「真的产出了 CSS 产物」，而不是「我们打算做」。这样 exports 永远不可能
      //   指向不存在的文件（tests/build/run.mjs 的 B2 还会再独立复核一次）。
      exports: {
        '.': {
          types: './dist/index.d.ts',
          import: './dist/index.mjs',
        },
        ...(p.extraExports ?? {}),
        './package.json': './package.json',
      },
      files: ['dist'],
      scripts: {
        // unbuild 默认 declaration: true，dist/index.d.ts 由它产出，不再单独跑 vue-tsc
        // （旧的 build:types 指向不存在的 tsconfig.build.json，属悬空脚本，已移除）。
        //
        // ⚠️ ui 是例外：它含 .vue SFC，而 unbuild 的 rollup-plugin-dts 不认识 SFC
        //    （实测会把编译后的 JS 当成 .d.ts 写出去，是**静默的错误产物**）。
        //    所以 ui 在 build.config.ts 里关掉 declaration，改由 `build:done` hook
        //    调 vue-tsc 出声明。package.json 这边无需变化。
        build: 'unbuild',
        test: 'vitest run',
        lint: 'vue-tsc --noEmit',
      },
      ...(Object.keys(p.deps).length ? { dependencies: p.deps } : {}),
      ...(Object.keys(p.peerDeps).length ? { peerDependencies: p.peerDeps } : {}),
      ...(() => {
        // test-utils 是被依赖方，不能依赖自己（否则 pnpm 报 self-reference）。
        const dev =
          p.name === '@apollo-design/test-utils'
            ? {}
            : { '@apollo-design/test-utils': 'workspace:*' };
        // devDeps：构建期数据源与测试 Oracle（R7）。它们**不会**进入用户的依赖树。
        return Object.keys(dev).length || Object.keys(p.devDeps ?? {}).length
          ? { devDependencies: { ...dev, ...(p.devDeps ?? {}) } }
          : {};
      })(),
    };
    return `${JSON.stringify(obj, null, 2)}\n`;
  }

  function readme(p) {
    const depRows = Object.entries(p.deps)
      .map(([k, v]) => `| \`${k}\` | \`${v}\` |`)
      .join('\n');
    const peerRows = Object.entries(p.peerDeps)
      .map(([k, v]) => `| \`${k}\` | \`${v}\` |`)
      .join('\n');
    // 只列本包**自己声明**的 devDeps；test-utils 是每个包都有的脚手架依赖，不进表。
    const devRows = Object.entries(p.devDeps ?? {})
      .map(([k, v]) => `| \`${k}\` | \`${v}\` |`)
      .join('\n');

    return `# ${p.name}

> **层**：${p.layer} ｜ **风险**：${p.risk} ｜ **Phase 2 实施顺序**：${p.phase2Order}
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 \`ARCHITECTURE.md\` 并记录 ADR。

---

## 职责

${p.purpose}

## 替代的 Ant Design 依赖

${p.replaces.map((r) => `- \`${r}\``).join('\n')}

## 公开 API

${p.publicApi.map((a) => `- ${a}`).join('\n')}

## 明确不做（边界）

${p.notDo.map((a) => `- ❌ ${a}`).join('\n')}

## 必须遵守的契约

${p.contracts.map((a) => `- ${a}`).join('\n')}

## 依赖

### 运行时依赖

${depRows || '（无）'}

### peer 依赖

${peerRows || '（无）'}

### 构建期 / 测试依赖（devDependencies，**不会**进入用户的依赖树）

${devRows || '（无）'}

## 依赖约束（ARCHITECTURE.md §3.1）

- **R1 单向**：只能依赖同层或更低层
- **R2 无环**：不得与其他包循环依赖
- **R3 地基纯净**（仅 L0）：不得包含任何组件视觉语义
- **R4 引擎无视觉**（仅 L2）：不得定义颜色/圆角/阴影，不得产出 CSS
- **R6 显式声明**：跨包导入必须在本文件的 \`dependencies\` 中声明（\`.npmrc\` 已设 \`hoist=false\`）
- **R7 零 Ant Design 运行时依赖**：发布包的 \`dependencies\` 不得出现任何 \`@ant-design/*\`。
  Ant Design 生态包只允许出现在三处 —— ① 构建期数据源（\`registry/tools/gen-*.mjs\`）
  ② 测试 Oracle（\`*.oracle.test.ts\`）③ \`devDependencies\`。由 \`registry:validate\` 的 **E19** 强制。

本包的依赖已通过 \`registry/tools/scaffold-packages.mjs\` 的分层校验。

${p.poc ? `## ⚠️ 必须先做 PoC\n\n${p.poc}\n\n在 PoC 通过之前，不得开始依赖本包的组件开发。\n` : ''}${p.buildNote ? `## 构建说明\n\n${p.buildNote}\n` : ''}${p.note ? `## Phase 2 范围说明\n\n${p.note}\n` : ''}
## 测试

\`\`\`bash
pnpm --filter ${p.name} test
pnpm --filter ${p.name} lint
\`\`\`

测试要求见 [\`TESTING.md\`](../../TESTING.md)。
${p.coverageNote ?? `覆盖率下限为 语句 95% / 分支 90% / 函数 95%（${p.layer} 档位，见 \`vitest.config.ts\` 的 \`coverage.thresholds\`）。`}
`;
  }

  function tsconfig(p) {
    const paths = {};
    for (const dep of Object.keys(p.deps)) {
      if (dep.startsWith('@apollo-design/')) {
        const target = byName.get(dep);
        paths[dep] = [`../${target.dir}/src`];
      }
    }
    return `${JSON.stringify(
      {
        extends: '../../tsconfig.json',
        compilerOptions: {
          rootDir: '.',
          outDir: './dist',
          noEmit: false,
          emitDeclarationOnly: true,
          // ⚠️ 必须有 baseUrl，否则下面的 `../<pkg>/src` 是错的。
          //
          // 根 tsconfig 声明了 `baseUrl: "."`（= 仓库根）。`extends` 会继承它，而相对路径
          // 按**声明它的那个文件**解析 —— 于是包内的 `../utils/src` 会被解析成
          // 「仓库根的上一级/utils/src」，即 `/Users/<user>/utils/src`，必然找不到。
          //
          // 症状很隐蔽：TS2307 只在**该包真的 import 了兄弟包**时才出现。
          // foundation 包都还没互相 import，所以这个坑一直没暴露；
          // packages/ui 第一个组件（empty）引 utils/theme/locale 时才炸出来。
          //
          // 在包内重新声明 baseUrl（相对包目录）即可让 `../<pkg>/src` 成立。
          baseUrl: '.',
          ...(Object.keys(paths).length ? { paths } : {}),
        },
        include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue'],
        // `**/demo/**` 也在排除里：demo 是给文档站用的示例，不参与类型产物
        // （它们的类型仍由根 tsconfig 的 `lint:types` 全仓检查覆盖）。
        // 不排除的话 `dist/<component>/demo/*.vue.d.ts` 会被打进发布的包里。
        exclude: [
          '**/*.test.ts',
          '**/*.test.tsx',
          '**/*.test-d.ts',
          '**/demo/**',
          'dist',
          'node_modules',
        ],
      },
      null,
      2,
    )}\n`;
  }

  console.log(`[scaffold] ${PACKAGES.length} 个包${force ? '（--force 覆盖）' : ''}\n`);
  for (const p of PACKAGES) {
    const dir = path.join(ROOT, 'packages', p.dir);
    console.log(`${p.name}  [${p.layer}]`);
    writeIfNeeded(path.join(dir, 'package.json'), packageJson(p), forcePkg);
    writeIfNeeded(path.join(dir, 'README.md'), readme(p), forceReadme);
    writeIfNeeded(path.join(dir, 'tsconfig.json'), tsconfig(p));
    writeIfNeeded(
      path.join(dir, 'src/index.ts'),
      `/**\n * ${p.name}\n *\n * ${p.purpose}\n *\n * Phase 1 仅建立骨架。实现见 ${p.phase2Order === 11 ? 'WORKFLOW.md' : `packages/${p.dir}/README.md`}。\n */\n\nexport {};\n`,
    );
    console.log();
  }
  console.log('[scaffold] 完成。');
  console.log(
    '[scaffold] 提示：运行 `pnpm install` 后，`.npmrc` 的 hoist=false 会强制校验依赖声明。',
  );
} // end if (isMain)
