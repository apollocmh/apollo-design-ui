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

## 六、经典错误沉淀（持续追加 —— 每 Gate 收口时回顾；最近在顶部）

### 2026-09-23（descriptions 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 58 | **缓存 es 源码 ≠ 实际渲染产物**：`/tmp/antd-src` 的 `descriptions/style` 写 `labelColor`（=colorTextTertiary 0.45），但 antd 实际渲染的 bordered label 是 `colorTextSecondary`（0.65）——tarball 与安装版本核对一致，属上游自身的源码/产物漂移 | L6（bordered 三张的 label 文字被像素比对揪红）+ 浏览器 computed style 定位（读 cssinjs 实际规则） | **产物 > 源码**（§5 优先级：`registry/*.json` 与「固定版本产物」高于读源码的印象）；凡样式对拍出颜色/数值分歧，先抓两侧 computed style 再改；判据修正登记 COMPATIBILITY（UPSTREAM） |
| 59 | **VTU 不接受 `{ default: undefined }` 槽位**（`Invalid slot received`） | L1（首批 15 例全挂） | mount 的 slots 只在有内容时传：`slots ? { props, slots } : { props }` |
| 60 | **通用 dev 告警走 console.error，deprecated 告警走 console.warn**（utils 的 warning/note 两通道） | L1（exceed 告警断言落空） | 断言前先查 `packages/utils/src/warning.ts` 的输出通道；`@rc-component/util` 的 `isReactRenderable` 等 shims 在 utils 里有对应物 |
| 61 | **`keyof (A \| B)` = 交集**：语义槽 prop 类型含函数式变体后，`keyof Props['classNames']` 是 never | L3（expectTypeOf actual never） | 对 keyof 断言用语义接口本体（`DescriptionsSemanticClassNames`），不要用 Props 的联合字段 |

### 2026-09-23（carousel 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 52 | **CSS 字符串里的键必须 kebab-case**：`zIndex:999` 拼进 style 字符串后 CSSOM 解析静默丢弃（`z-index` 才合法）⇒ 箭头/淡入淡出层级消失 | L4（z-index 在契约里） | styleToString 统一 `.replace(/[A-Z]/g,…)` kebab 化；trackStyle 的 `webkitTransform` / `msTransform` 特判 `-webkit-` / `-ms-` |
| 53 | **Vue 的字符串 style 是整段 cssText，不是「值」**：`style: px(listHeight)` 产出 `"168px"` 是无效声明，被静默丢弃 ⇒ vertical 的 list 高度约束失效（L6 size-mismatch 905 vs 272） | L6（尺寸不一致，人工分类） | 字符串 style 必须写完整声明：`` style: `height:${px(v)}` ``；值形态只属于对象 style（React 语义不同） |
| 54 | **px() 双重后缀**：`` `top:${px(x)}px` `` → `2.34pxpx` 非法 ⇒ `::after` 几何整块消失（箭头不可见） | L6（diff 集中在箭头）+ 产物 grep（`pxpx` 一眼定位） | px() 返回值不再拼 px；写完样式立刻 grep 产物验证 |
| 55 | **双精度 1 ulp**：`16 * (1/Math.SQRT2)` 与 `16 / Math.SQRT2` 可能不同 —— antd 用 `.div(Math.SQRT2)` | L7（断言字符串可能失配） | 对齐 antd 的算术形态：一律**除法**；`arrowLength` 常量注释写明 |
| 56 | **L4 管线在 jsdom 挂载，样式过 CSSOM**：hex 颜色 → `rgb()`、`left:0` → `0px`（React SSR 是原始字符串）⇒ 颜色差异是管线噪声不是实现差异 | L4（19 例首轮全挂） | fixture 的用户内容样式**只留几何属性**；组件自有内联定位的 `left:0` 走 allow（reason + COMPATIBILITY 登记），断言 `toEqual([...allowed])` 恰好匹配 |
| 57 | **默认值判据是 antd 的解构，不是 slick 的 defaultProps**：dots（slick false → antd **true**）、arrows（slick true → antd **false**）、waitForAnimate（slick true → antd **false**）—— 三处全反 | L1（dots 默认缺失 / arrows 多渲染） | 写默认值前先读 `es/carousel/index.js` 的解构行，slick defaults 只作透传面判据 |

### 2026-09-23（switch 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 46 | **`useSize(props.size)` 非响应式**（同一会话在 radio 与 switch 各犯一次）：`customSize` 只在 setup 期读一次 ⇒ 受控切换 `size` 静默失效 | L1（一条「受控切换 size」用例；静态用例永远发现不了） | 一律用**函数形态** `useSize((ctx) => props.size ?? ctx)`（skeleton 的 Avatar/Button/Input 是本仓范式）；radio 已补回归用例 |
| 47 | **biome 把「脚本里只出现在类型位置」的图标导入改成 `type` 导入**，而模板里当值用 ⇒ `Property "X" … is not defined on instance` | demo 冒烟 | 类型注解别引用值：用 `import { type Component, h } from 'vue'` |
| 48 | **`a,b::before` 陷阱**（PITFALLS 141 姊妹）：`genNoMotionStyle()` 的 `&` 指代整个选择器列表，伪元素必须**逐个展开**；且 `handle::before` 走 **raw** 变体（不展开，否则出现 `::before::before`） | 与 extractStyle 产物对拍（唯一一处差异） | 写 reduced-motion 段时先与产物对拍选择器集合 |
| 49 | **`SwitchProps` 不含 `onKeyDown`**（它是 rc-switch 的 props）⇒ `Pick<SwitchProps, 'onKeyDown'>` 报 TS2344 并让 `callbacks` 退化成 `{}` | dts 构建（`pnpm build:ui`） | attrs 显式写内联类型，别用 `Pick<Props, …>` 抄近路 |
| 50 | **`pnpm build:ui` 的 dts 步骤要 12 分钟以上**（全仓 vue-tsc，无增量） | — | 挂**后台**跑，期间并行写文档/fixtures/PITFALLS；别用 `head` 截断（退出码会掩盖失败） |
| 51 | **ui 根 `index.ts` 的 re-export 别名坑重犯**（PITFALLS 158）：`style/index.ts` 导出通用名 `genTokenDecls`、`token.ts` 是 `prepareComponentToken` ⇒ 必须 `as genXTokenDecls` / `as prepareXComponentToken`；**测试文件里的 import 同样要别名** | `pnpm build:ui` + dts | 新增导出后立刻跑一次 `pnpm build:ui` |

### 2026-09-23（radio 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 38 | **写入的 import 里 `/` 会被吞**：`@apollo-design/ui` 落盘成 `@apollo-design-ui`（14 个 demo 里 2 个中招） | demo 冒烟（vite: `Failed to resolve import "@apollo-design-ui"`） | 批量写文件后**逐文件回读**；本次用一次全仓正则扫（`/@apollo-design-[a-z]/`）兜住。⚠️ 本机 BSD `grep` 对多模式会静默 0 匹配，排查优先用 node 脚本（同 PITFALLS 138/154） |
| 39 | **E10 的「硬编码圆角」启发式按源码文本判断** ⇒ 参数化的圆角（`border-radius:${radius}`，radius 已是 `var(...)`）被误报 | registry validate E10 | 处方是**改写法**而不是加豁免：helper 收 **token 名**，模板写 `border-radius:${v(radiusToken)};`（源码文本命中 `${v(` 放行分支）。重构后验证产物**逐字节不变**（dump + diff） |
| 40 | **antd 的 `-wrapper-checked` 不含非受控内部态**：`<Radio defaultChecked />` 时 span 有 `-checked`、wrapper **没有** | L4 机械基线（`radio:default-checked`） | 实现里**分成两个 computed**（`mergedChecked` = checked prop/Group 值；`effectiveChecked` = 内部态），别「顺手统一」。L1 若只断言 span 会漏 |
| 41 | **`RadioGroup` 的 `name` 默认值是 `useId` 生成的**（`toNamePathStr(undefined) === ''` ⇒ `useId('')` 走生成分支），不是 undefined | 实现期回读上游源码 | 凡是「某 prop 的默认值是什么」读上游实现，别推（分析初稿凭直觉写成「恒 undefined」） |
| 42 | **`packages/ui/src/index.ts` 的 re-export 必须用别名**（`genTokenDecls as genRadioTokenDecls`）：写错时 **vitest 全绿**，只有 `unbuild` 报 `"X" is not exported by …` | `pnpm build:ui`（L7） | 新增导出后先跑一次 `pnpm build:ui`（约 20 秒），比等到 G13 便宜得多 |
| 43 | **`tests/visual` 从 `packages/ui/dist/index.mjs` import（不是源码）** ⇒ dist 过期时报 `[MISSING_EXPORT]` | L6 首跑 | baseline 与 compare 两种模式**都要先 `pnpm build:ui`** |
| 44 | **同族组件的「同名字段」落点不能互相照抄**：`title` 在 checkbox 落 span、在 radio 落 **label**（issue 46739） | L4 | checkbox → radio 是最容易「照上一版改」的一对，必须逐个回读上游 |
| 45 | **全仓 `update:*` 缺口**：规则 C11 要求 v-model 与语义事件同时发出，但只有 radio 实现了 ⇒ 其余 21 个组件上 `v-model:xxx` 不生效 | 实现期核对 | 后续组件照 C11 做；建议某次整合期统一补齐（纯增量、不改 DOM） |

### 2026-09-22（layout 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 31 | **复合组件的「子组件」没从 index.ts 具名导出**：`import { Header } from './layout'` 得到 `undefined`，`h(undefined)` 只发一条 warn，L4 表现为「子节点数 0」而非「导入失败」 | L4（26 例一起红） | 复合组件除静态属性外，也要 `export const Header = LayoutHeader` 等具名别名 |
| 32 | **漏了 `resetComponent`**（`font-family` / `font-size` / `box-sizing`）：antd 的 genStyleHooks 自动带这一段，手写 CSS 时最容易漏 | L6（12 张 block-diff，文字渲染差 0.04%~0.16%） | 手写样式表时先抄提取产物**第一段**（reset），再看组件自己的规则 |
| 33 | **`useMergeSemantic` 的第三参是值不是 getter**：传 `semanticProps.value` 会让函数式语义化永远拿到首帧 props | L1（语义化函数用例） | 函数形态要随 props 变化时，直接用 `mergeClassNames` + `resolveSemantic` 包 computed |
| 34 | **L4 基线里的 `#F96` 会被 jsdom 重序列化成 `rgb(…)`**：React SSR 原样输出、Vue 侧走 jsdom style 解析 ⇒ 必然不等 | L4 | 固件颜色统一写 `rgb(1, 2, 3)` 这种「两种引擎输出一致」的形态 |
| 35 | **Vue 里 `onXxx` 回调 prop 不能声明 emits**：声明后 Vue 会把它从 attrs 摘掉，组件内 `attrs.onCollapse` 恒 undefined | L1（折叠用例静默不触发） | antd 的「props 形态回调」在 Vue 侧一律走 attrs，不写 emits |
| 36 | **类型负例不能用「函数参数类型不符」**（TS 函数参数双变，宽类型会被接受）→ `@ts-expect-error` 报「未使用的指令」 | L3 | 直接钉联合类型本身（`const bad: CollapseType = 'hover'`） |
| 37 | **E10 会遇到「antd 逐字的 alpha 白色遮罩」**（`rgba(255,255,255,0.2)`）：本仓没有带 alpha 的白色 token，换 token 会与上游分叉 | registry validate | 给 HARDCODED_PATTERNS 加 `skip` 字段（逐字豁免 + 理由），与 border-beam 的 `#fff 0 0)` 豁免同理 |

### 2026-09-22（watermark 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 24 | **jsdom 里 `MutationObserver` 是 `MockMutationObserver`**（vitest.setup.ts 主动替换，TESTING.md T5/T6）：防篡改用例"真的改 DOM"永远不触发回调，单跑还绿、全跑才红 | L1 | 用 `utils` 的 `observeMutation`（元素→回调集合的全局单例），测试从 `globalThis.MutationObserver.instances` 取实例显式 `trigger(records)` 驱动 |
| 25 | **水印元素本身不是观察目标**（它在 container 的 `subtree` 里被看到） | L1（`observerOf(target)` 抛"未找到"） | 用 container 的 observer，`record.target` 才是水印元素（`reRendering` 认 `mutation.target`） |
| 26 | **`mount(() => h(Comp))` 函数式包装下 `getCurrentComponent().exposed` 恒 undefined** | L1（ref 用例） | 断言 exposed 时必须 `mount(Comp, { props })`；只有需要 `setProps` 时才用包装（那就要放弃 exposed 断言） |
| 27 | **jsdom 的 CSS 序列化给 `url()` 加单引号** | L1（`url(data:…)` 匹配失败） | 断言写 `url('data:…')`，别按源码字符串硬比 |
| 28 | **`{...font, ...line.font}` 里 `fontSize: undefined` 会覆盖默认值 ⇒ `NaNpx`** | L1（手写第三行 font 用例才发现） | 这是 antd 同判（不是 bug）—— 不做"修复"，而是在测试里显式钉住 NaN，避免后人"顺手修好"造成与上游分叉 |
| 29 | **canvas 组件的 L4 基线只有 SSR DOM 可比**（水印 div 运行时 append） | 设计期判断 | 基线只钉根 div 的 class/style 合成；绘制参数交 L1（canvas stub）、像素交 L6（真实浏览器） |
| 30 | **视觉用例里的外链图片必然漂移**（两侧加载时序不同） | L6（设计期规避） | 图片用内联 SVG data URL（`encodeURIComponent`），与 statistic 的 Timer 同思路 |

### 2026-09-22（statistic 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 19 | **`h(子组件, { class: … })` 对 `inheritAttrs:false` 的子组件静默丢失**：class 走 attrs，被子组件的 pickAttrs({aria,data}) 过滤掉 → content-value 类名整段消失 | L4（类名不同 []） | 传目标组件**声明的 prop**（`className`）；跨组件 h() 前先查对方 prop 表，attrs 不会自动变成 props |
| 20 | **语义化 `classNames`/`styles` 的 Vue prop 必须声明 `[Object, Function]`**：只写 `Object` 时函数形态触发 Invalid prop 告警，themeTest 的「0 未豁免告警」直接红 | L7（themeTest） | 两态 prop 一律 `type: [Object, Function] as PropType<X>`；Timer 这类转发组件也要同步改 |
| 21 | **`h()` 的 children 传 `VNodeChild`（含 null）不匹配重载**：RawChildren 不收 null，vue-tsc 报 TS2769 | lint:types（构建期 dts） | 条件子节点包一层数组 `[x as VNodeChild]`（null 在 VNodeArrayChildren 里合法） |
| 22 | **fake timers 下 `1000/60` 间隔的末 tick 落在 advance 边界之内**：advance(1000) 后末次渲染仍是 00:30:00（React 的 act flush 语义与 Vue 调度不同） | L1（countup 差 1s） | 计时断言留余量：advance 到「越过整秒」再断言同一契约，不逐帧较劲 |
| 23 | **视觉层的 Timer 截图两侧秒级必然漂移**（React/Vue 截图时刻不同） | L6（设计期规避） | 视觉用例 format 取最粗稳定粒度（`D 天`）；秒/分行为由 L1 fake timers 钉 |

### 2026-09-22（tag 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 16 | **cloneVNode 注入的 `tabindex` 键对组件 vnode 无效**：icons 的 createIcon 对「有 onClick 且无 tabIndex prop」兜底 `tabIndex=-1`，我们传全小写 `tabindex` 只进了 attrs → 禁用态覆盖失效（close-icon 恒 -1） | L1（tabindex 断言） | 键名按 vnode 类型区分：`isComponentVNode(origin) ? 'tabIndex' : 'tabindex'`；cloneVNode 注入组件 props 前先查目标组件的 prop 命名 |
| 17 | **antd 的 closeIcon 定制是「克隆用户元素本身」而非「包 wrapper」**：replacement span 方案会多一层 DOM（L4 逐字节比对直接红） | L4（标签/子节点数不同） | closeIconRender 用 cloneVNode(origin, {...注入})——role/tabIndex/aria-label/类/事件全部注入原元素，DOM 与 antd 逐字同构 |
| 18 | **E10 硬编码校验要区分「变量声明行」与「消费行」**：Component Token 的 seed 实色（tag default-bg:#f5f5f5）在声明行是契约（antd cssVar 产物同为实色） | registry validate | validate 按行扫描：跳过注释行与 `--token:<hex>` 声明行，只抓「消费处」的硬编码 |

### 2026-09-22（back-top 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 13 | **`@media` 的 media feature 里不能用 CSS 变量**（`max-width: var(--screen-md)` 非法，浏览器整条忽略）→ 响应式断点静默失效，375px 视口没走到 screenXS 档 | L6（按钮水平错位 24px） | 断点用字面量（theme 默认值 768/480），注释登记「不随主题缩放」边界 |
| 14 | **resetComponent 是完整 reset 而非 genCommonStyle 的子集**：只补 font-family/font-size 会漏 margin/padding/color/line-height/list-style —— back-top 按钮行高 16.1 vs 22 | L6（btn lh 差异，探针量出） | 组件根对齐 antd 的 resetComponent 全套；「组件根必须有 font-family/font-size」的老口诀要升级成「对齐 resetComponent 全套」 |
| 15 | **React 基线页的 body 继承字体取决于该页组件是否带 cssinjs 的 body 注入**：BackTop 不带 → `<p>` 继承 sans-serif；badge/typography 页带 → token 栈。同一 BASE_CSS 对不同页匹配不同 | L6（个别字符字形 diff 0.155%） | 视觉用例内显式钉正文字体（不动全局 BASE_CSS）；全局裁决等更多页面证据 |

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
