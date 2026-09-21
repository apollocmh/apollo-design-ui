# COMPONENT-CHECKLIST.md — 组件开工/收口快速清单

> 目的：**提速**。2026-09-21 的数据：一个组件平均一天，其中大量时间耗在
> 「重新踩一个已经踩过的坑」和「手搓样板文件」上。本清单把已付过学费的坑
> 压缩成开工前 3 分钟可过完的形式；完整条目见 `.workbuddy-ai/memory/PITFALLS.md`。
>
> 配套工具（本次新增）：
> - `pnpm gen:component <name>` —— 一键生成 17 个交付物骨架（含逐 Gate 的 PLAN.md）
> - `pnpm verify:component <name>` —— 单组件 scoped 取证（开发期；收口仍以 verify:full 为准）

---

## 一、开工前（G0–G1）

- [ ] 任务来自 `node registry/tools/next-task.mjs`，**不自选**组件
- [ ] 依赖 DAG 全部 completed（`ask.mjs progress` 核对）
- [ ] 凡是要断言「某决策/约定/优先级是这样」→ **先跑 `ask`**，不凭记忆
      （2026-09-21 一天三次凭记忆翻车，三次都写进了仓库文档）
- [ ] 读 PLAN.md 的「开工避坑清单」（脚手架已生成）
- [ ] antd 产物在位：`/tmp/antd-src/package/es/<name>/`；缺则 `pnpm antd:extract`

## 二、实现中（G2–G4）—— 每条都真实翻过车

| # | 坑 | 后果 | 对策 |
|---|---|---|---|
| 1 | **内联 style 的数字必须转 px 字符串** —— Vue `patchStyle` 不做数字→px 转换（React 的 `dangerousStyleValue` 才有） | 值被 jsdom/浏览器**静默丢弃**，L6 全红且极难定位（affix L6 耗时一天的主因） | 样式输出统一走 `px()` / Token 的 `var()`，绝不裸数字 |
| 2 | **cssinjs 嵌套语义**：`&` 是复合选择器、普通键是后代 | 样式作用到所有形态（divider 的 dashed 教训） | 选择器结构从 antd `extractStyle` 真实产物提取，不推演 |
| 3 | **Boolean prop 未传 ≠ false** | 布尔语义静默失效（divider 的 `vertical`） | `withDefaults` 中显式给 `undefined`，判据用 `typeof x === 'boolean'` |
| 4 | **`var(--apollo-*)` 必须在 theme tokens.css 有声明** | 写错不报错、静默失效 | 靠 `test:build` 的 B7 兜底；变量名用 `token2CSSVar()` 生成，不手写 |
| 5 | 字面量 Component Token 与别名派生 Token 的双轨 | 用户主题覆盖失效 | 范本照抄 `divider/style/token.ts` 的注释块 |
| 6 | 漏声明依赖 → `unbuild` 报 `Potential implicit dependencies` | L7 红 | 新 import 即同步 package.json |

## 三、测试中（G5–G8）

- [ ] **vitest 必须从仓库根跑**（`node_modules/.bin/vitest run --project <p>`）；
      在 `packages/<x>/` 下跑不应用根 config，会大面积假失败
- [ ] `*.test-d.ts` 会被 vitest **真执行**：L3 负例必须包在永不调用的闭包里
- [ ] `--coverage` 在沙箱要先 `CODEBUDDY_SAFE_DELETE_ENABLED=0`，否则 9 秒静默失败假成功
- [ ] L5 a11y：axe 扫**全部** demo + 显式 role/键盘断言；
      「架构上不适用」必须写进 layerNotes——**警惕降级运行给的假绿灯**（2026-09-21 实锤过）
- [ ] 单组件快速取证用 `pnpm verify:component <name>`，别为每层跑全仓

## 四、视觉（G9）—— 最贵的环节，先看清单再动手

- [ ] **先建基线，再 compare**；基线建立失败时 compare 的红灯不可信（affix 曾被 3/15 假 compare 误导）
- [ ] demo **显式指定字体** —— 继承字体差异是平台差异，会让 L6 全红（affix 教训）
- [ ] 差异率异常时，排查顺序：实现（尤其坑 #1）→ Token → 平台差异 → 工具；
      不要在实现侧做「碰运气」的实验性修改（affix 曾回退「改量占位层」实验：0.013% → 3.68%）
- [ ] React 参考页的继承字体来自 antd cssinjs 注入的 token 栈——不要在 Vue 侧复刻

## 五、收口（G12–G14）

- [ ] 11 个维度逐个置 done + `layerNotes`（n/a 也要写依据）；**registry 是唯一被承认的进度**
- [ ] 收口跑全仓：`pnpm verify:full`；跑重型门禁前**关 IDE**（实测 16 分钟 → 7'49"）
- [ ] 开发期 typecheck 用 `pnpm typecheck:build`（改 ui：7'49" → 5'10"；无改动 20s）
- [ ] `pnpm build` 会挂起的话，用 `node_modules/.bin/unbuild` 逐包构建（PITFALLS #7）
- [ ] commit message 带 `[COMP:<name>]`，一次提交只做一件事
- [ ] 收口后跑 `node registry/tools/next-task.mjs` 看解锁了谁，**立即生成下一个骨架**：
      `pnpm gen:component <next>`

## 六、经典错误沉淀（持续追加 —— 每 Gate 收口时回顾；最近在顶部）

### 2026-09-22（result 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 9 | **`.apollo-icon` 基线（getIconStyle）没进 ui 全局样式层**：icon 高 86.8 vs 72（`line-height:0` 等缺失）——button 期在按钮范围内自保过一次，result 期确认是集成缺口 | L6（icon size-mismatch） | 第三次法则收口：`getIconStyle()` 接进 `BASE_CSS`（每份组件 CSS 自带）。后续组件不再各自补图标基线 |
| 10 | **ReactNode 类 prop 被写成插槽**：antd 的 `extra` 是 prop，demo 初版写成 `#extra` 插槽 → L6 里 extra 整块消失 | L6（extra 缺失）+ demo 冒烟 | 规则 C19 只把 `children` 映射为插槽；demo 评审时先查 prop 清单 |
| 11 | **antd 的 `anticon` 前缀不受组件 `prefixCls` 控制**（由 IconContext/ConfigProvider 决定）：L4 基线逐条出 `anticon vs apollo-icon` 噪音 | L4（15 条基线全是同一 diff） | 基线侧用 `ConfigProvider { prefixCls, iconPrefixCls }` 包裹对齐，把 D6 收敛到组件自身一条 |
| 12 | **机械转换 React 插画时 `createElement` 的变长子节点**：Vue `h` 只收 3 参，直接替换会 TS2554 | L1 构建期（TS2554） | 转换器必须做括号平衡解析，把第 3+ 参数折成数组（camelCase SVG 属性同步转 kebab） |

### 2026-09-22（badge 会话 —— 全量视觉回归暴露的 5 个跨组件缺陷）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 1 | **motion 包首帧 `mergedVisible:false`**：CSSMotion 首帧（含 SSR）渲染 null，到 onMounted 才补渲染 → SSR 空屏。React 的 rc-motion 首帧同步渲染 | L4（badge SSR 契约）+ B8 | 初始快照 `mergedVisible = props.visible()`；appear 动画场景走 styleReady='NONE' 首帧 null（与 rc-motion 一致）。改 motion 包必须同步更新其自测时序断言 |
| 2 | **ConfigProvider 从未 provide ThemeContext**：`useToken()` 恒返回默认浅色 token —— 纯 CSS 消费的组件看不出问题，首个「从 token 对象计算」的组件（Empty 插画色）直接暴露 | L6（theme-dark 变体） | ConfigProvider 补 `provide(ThemeContextKey, { config, token })`；新组件凡是从 token 对象算颜色/尺寸的，先写一条 dark 主题断言 |
| 3 | **「主题切换不影响插画色」的旧结论是错的**（antd empty.js 运行时 getDesignToken → getAsSolidColor，dark 下 fill=#3e3e3e）：build 期钉 hex 的 trade-off 对 6.6.4 不成立 | L6 theme-dark | 生成器改为输出 `ctx.colors.<role>` 引用，组件运行时从 useToken 合成；生成器的 ROLE_TOKENS 反查表+自检继续兜底 |
| 4 | **antd 6 的两字中文插空格是真实空格**（spaceChildren），不是 CSS letter-spacing 技巧 —— 6.6.4 同时保留 `-two-chinese-chars` 类与 first-letter CSS，但对字符串子节点类恒不出现（检测读的是变换后的 textContent，自否定） | L6（button/type 的「确定」ghost） | 实现以运行时探针（React 实测 textContent/className）为准，不猜源码语义 |
| 5 | **`v-if=false` 的插槽内容是注释 vnode（truthy）**：ScrollNumber 的「children 即 count VNode」分支被空注释劫持，整数拆位整个消失且无报错 | L1（.find 为空） | clone/取首个子节点前必须 `filter(v => v.type !== Comment)`；h(vnode) 不能当 cloneVNode 用（type 位传 VNode 会静默炸子树） |
| 6 | **genStyleHooks 会给组件根注入 genCommonStyle（font-family/font-size）**——零运行时样式漏掉它，继承字号差异在 inline 文本上变成 1-2px 的 block-diff | L6 全量回归（grid） | 每个组件的 genXxxStyle 根规则都要有 `font-family/font-size: var(--apollo-*)`（对照 antd extractStyle 产物核对） |
| 7 | **BASE_CSS 的 body font-size:14px 是平台差异源**：antd/dist/reset.css 不设 body 字号（浏览器 16px），但**必须**补 `html{line-height:1.15}`（reset.css 里有） | L6（badge 全局回归） | BASE_CSS 以「与 antd/dist/reset.css 逐条对齐」为唯一判据，历史注释里的「有意省略」要用全量回归复核 |
| 8 | **demo 文件名双写 `.vue.vue`**（生成脚本 name 已含扩展名又拼接） | demo 冒烟找不到文件 | 批量生成后 `ls` 核对文件清单再跑测试 |

### 2026-09-21/22（flex · grid · badge 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 1 | **样式生成器把选择器段写成属性名**（flex：`-flex-wrap-wrap` ≠ `-wrap-wrap`、`-align-items-*` ≠ `-align-*`） | **L6**（首跑 9/15，wrap 52% 差异）—— L4 只比 DOM，永远比不到 CSS 选择器 | 样式生成器的每条选择器**对照 antd 真实产物**抽查；改完先跑 L6 再收口 |
| 2 | **组件 `style` prop 没合并进根样式**（grid Row：`{...gutterStyle}` 漏了 `...props.style`） | **L6**（视觉探针量出 Row 高度丢失） | antd 的合并顺序 `offset → contextStyle → style`（style 最后覆盖）；L1 补一条「style prop 覆盖生成样式」断言 |
| 3 | **setup 期触碰 `window`**（grid useBreakpoint 在 setup 里订阅 matchMedia）→ SSR 直接崩 | **B8**（test:build 的 SSR 冒烟） | 任何浏览器 API 订阅放 `onMounted`（对齐 React `useLayoutEffect` 语义：SSR 不执行）；新增 hook 必过 B8 |
| 4 | **多导出组件 SSR 冒烟查不到导出**（grid 目录导出 Row+Col，没有 Grid） | B8 | `tests/build/run.mjs` 的 `SSR_EXPORT_ALIASES` 加别名表 |
| 5 | **CSSOM 序列化伪差异**：`calc(1rem / -2)`→`calc(-0.5rem)`、`min-width:0`→`0px`、flex 数字 unitless | L4（allow 豁免） | 先判断是不是 PLATFORM 类差异再动手——**别把伪差异当 BUG 修** |
| 6 | **响应式 prop 的 SSR 语义差**：React SSR `screens=null`（useGutter 兜底全命中）vs 我们 jsdom 真实挂载 `screens=全 false` | L4 基线设计时 | 响应式场景**不进 L4 基线**，由 L1 的 matchMedia mock 驱动覆盖；基线脚本文件头写明取舍 |
| 7 | L3 类型断言语义写反（`toMatchTypeOf` ≠ 「类型相同」） | L3 | 精确断言用 `toEqualTypeOf`；宽用例才用 `toMatchTypeOf` |
| 8 | `noUncheckedIndexedAccess`：Record 索引访问返回 `T \| undefined` | typecheck | for..of 替代索引循环；`val()` 取值函数带运行时守卫 |
| 9 | `useAttrs()` 在 computed 里调用 → biome 报错/响应式丢失 | biome | setup **顶层**解构一次 |
| 10 | `push origin master` 假同步（worktree 分支名 ≠ master） | git ls-remote 核对 | 恒用 `git push origin HEAD:master`（WORKFLOW.md §0.2） |
| 11 | cssinjs 2.x 的 `extractStyle(cache)` 需要树内 cache 实例（v1 的无参签名已废） | 提取脚本调试 30 分钟 | 树内 `React.useContext(StyleContext).cache` 再调 extractStyle；脚本存 /tmp 会丢，用完把关键产物落到 docs/analysis |
| 12 | demo 里模板占位符（`${COL_STYLE}`）忘了替换 | demo 冒烟 | 批量生成 demo 后必须复跑 demo.test |
| 13 | Vue props 恒含全部声明键：`'x' in props` 恒 true → deprecated 告警永不触发 | L1 | 判据改 `props.x !== undefined`（PLATFORM，Empty 已有范本） |
| 14 | Component Token 走 CSS 变量时：声明可放组件自身 CSS（`.apollo-badge{--apollo-badge-*:…}`），B7 认 | grid 扩展 B7 后 | 9 token 的 badge 即用此形态；派生乘除算成常量（indicatorHeight=20）登记主题覆盖失效 |

---

## 提速的真正杠杆（按收益排序）

1. **并行泳道**：`next-task.mjs --parallel` 已能给出当前全部可开工批次（15 条泳道、
   每条 2–3 并发、41 个组件可执行），但实际一直是单人串行。串行时一天 1 个组件；
   每多一条并行泳道，吞吐近似线性增加。小复杂度（S）组件适合填满并行空隙。
2. **脚手架**：省掉每组件 25–30 个样板文件的手搓与改名（估 0.5–1h/组件）。
3. **本清单 + scoped 取证**：省掉「重新踩坑」的数小时级调试与全仓门禁等待。
4. **open decisions 尽快裁决**：7 条开放决策中任何一条被 hardBlock 的组件，
   都会做到最后一步才发现「收不了口」——开工前用 `ask.mjs decisions --open` 过一遍。
