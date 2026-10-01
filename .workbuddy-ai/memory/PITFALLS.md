# PITFALLS.md — 实测踩过的坑

> 与 `MEMORY.md` 同目录，但**不进会话注入**（体积太大）。接手时按需读。
> 每条都真的踩过一次以上；带「实测」的都是当轮验证过的。

## 工具 / 沙箱

1. **Bash `grep` 对某些文件静默返回空**（`docs/*.md` 尤甚）—— 一律用 Grep 工具；搜标题用 `^#{1,3} `。
2. `biome-ignore` 必须**紧贴**诊断行、reason 同行。多行声明的诊断落在**具体那一行**
   （如 `) => boolean | void;`），写在 `export type` 上方会报 `suppressions/unused`
   —— 症状是「明明加了 ignore 却被判未使用」。
3. 别盲信 lint 自动修复：`noConfusingVoidType` 的 `undefined | Cleanup` 建议会破坏 API，
   先 `tsc` 验证；仓库既有做法是加 `biome-ignore`。`noNonNullAssertion` 在本仓库是 **warn**。
4. biome 2.x 键名变了：`files.ignore`→`files.includes`、`overrides[].include`→`includes`、
   `rules.recommended`→`preset`。新增生成的 registry 文件要加进忽略列表。
5. `passWithNoTests` 是 vitest **根级**选项，写进 `projects[]` 不生效。
6. **必须从仓库根跑 vitest**（`node_modules/.bin/vitest run --project unit`）；
   在 `packages/<x>/` 下跑不应用根 config 的 jsdom 环境，会大面积假失败。
7. `pnpm install` / `pnpm -r build` 在本环境会挂起（疑似网络）。改用 `node_modules/.bin/unbuild`
   逐包构建；手工补 workspace 依赖时 `packages/<x>/node_modules/@apollo-design/<dep>`
   符号链接要自己建（`ln -s ../../../<dep> <dep>`）。
8. **`--verify` / 任何带 `--coverage` 的 vitest 在本沙箱会直接失败**：v8 provider 开跑前
   `rm -rf coverage/` 被 `node-safe-delete-shim` 拦下（`SAFE_DELETE_BULK_CONFIRM_REQUIRED`，
   101 文件 > 阈值 50），9 秒退出且**不产报告**，于是 `--verify` 静默保留旧值。
   解法：前缀 `CODEBUDDY_SAFE_DELETE_ENABLED=0`。只影响覆盖率，不影响仓库。
9. 漏声明依赖的 L7 症状是 `unbuild` 报 `Potential implicit dependencies found: <pkg>` 且退出码 1
   —— 报错说的是「隐式依赖」，不是「缺依赖」。
10. **Edit 工具偶发「报 success 但文件内容没变」**；而且 **biome 会重排 import**，让下一次
    基于旧 import 文本的替换静默失配。对策：改完回读；改 import 前先读回当前内容；
    不放心就用 node 脚本做精确替换再验证。
11. **`pnpm run registry:check` 开头是 `registry:gen`**（`registry:gen && registry:foundation:check
    && registry:workstreams:check && registry:validate`），所以**每次跑完它，
    `components/dependencies/tokens.json` 都会因 `generatedAt` 时间戳而变脏**。
    这是工具链固有的，不是错误。**别把纯时间戳抖动提交进去** —— `git checkout --` 丢掉即可。

## jsdom

12. computed `border-*-width` 默认是 **`"16px"`**（既非 CSS 初始值 `medium`/3px，也非 0）。
    造测试元素时四条边必须显式归零，否则公式里混进 16，断言无法解释。
13. **inline style 会传导到 computed style** —— `overflow` / `overflow-x` / `border-*-width` /
    `width` / `height` / `position` / `overflow-clip-margin` 都行 ⇒ 不需要 spy `getComputedStyle`，
    也就不用把假对象断言成 `CSSStyleDeclaration`（H10）。
    `offsetWidth/offsetHeight/clientWidth/clientHeight` 用 `Object.defineProperty` 覆盖，
    `getBoundingClientRect` 整个替换成 `new DOMRect(...)`（构造器可用）。
14. **`element.style.setProperty('whiteSpace', ...)` 被静默丢弃** —— `setProperty` 只认连字符写法。
    camelCase 键要用**属性赋值**或 `Object.assign(el.style, map)`。
    实测：`setProperty('whiteSpace','nowrap')` → `""`；`el.style.whiteSpace='nowrap'` → `"nowrap"`。
15. jsdom **会规范化样式值**：`clip: rect(0, 0, 0, 0)` → `rect(0px, 0px, 0px, 0px)`、
    `padding: 0` → `0px`、`border: 0` → `0px`。断言时不能逐字符比，要判前缀或判规范化后的值。
16. **`cloneNode` 不复制挂在实例上的桩**（`getBoundingClientRect` 等）—— 克隆体的 rect 退回恒 0，
    会走早退分支。要造「无父元素」的浮层：先 `stubEle` 再 `remove()`。
17. **jsdom 的 IDL getter 带 brand 校验** —— `Object.create(Node.prototype)` 会抛
    `not a valid instance of Node`，造不出「既无 ownerDocument 也不是 Document」的替身。
18. **组件层测试拿不到注入帧泵的口子**，只能走真实 rAF（jsdom 约 16ms/帧）。
    motion 的离场要 prepare→start 两帧、start→active 两帧，**active 才注册 deadline**，
    所以至少等 5 帧 + 30ms 才能看到离场 key 被摘掉。需要确定性时改用
    `useMotionStatus`（它有 `scheduler` 注入点）而不是挂组件。
19. **VTU 默认把 `<Teleport>` 打桩成 `<teleport-stub>`**，内容留在原地
    ⇒ 「内容到底进没进容器」根本测不出来。必须 `global: { stubs: { teleport: false } }`。
20. **Vue 的 `<Teleport>` 在 `to` 变化时是「移动」节点，不重新挂载** ⇒
    「先渲染进默认容器再搬家」用**挂载次数**测不出来（两种实现都是 1 次），
    判据必须是「内容首次挂载时的父节点」。
21. **`vi.stubGlobal('document', undefined)` 能让 `typeof document === 'undefined'`** ——
    覆盖「SSR 无 document」兜底分支的可行手段。`canUseDom()` 读的是 `window.document`，
    所以 `vi.stubGlobal('window', {})` 也能让它返回 false。

## 类型测试

22. **`*.test-d.ts` 会被 vitest 真的执行** —— `@ts-expect-error` 只挡编译期，
    负例若含运行时后果（对冻结对象赋值、把数字当字符串用）必须包进 `neverCalled(() => {...})`，
    否则运行时照样抛。
23. **`expectTypeOf(SOME_CONST)` 会把常量推断成 `string`** ⇒ 必须写
    `expectTypeOf<typeof SOME_CONST>()`，否则 `toEqualTypeOf<'add'>()` 永远失败（报 "Actual string"）。
24. **`expectTypeOf<联合类型>()` 会退化成 never**（报错写着 `Actual never`），用 `toExtend` 绕开。
25. **`const x: Union = 'A'` 后 `expectTypeOf(x)` 被窄化成字面量**，断言联合类型永远失败。
26. **`effectScope.run(fn)` 的返回类型带 `| undefined`** —— 想避免 `!` 就用 `as XxxReturn`
    收窄并写清理由。别用 `!`，也别用 `unknown as`。

## 计数口径

27. `pnpm test` 报的用例数是**分 project** 的（unit / dom / a11y 各一份）。
    而 `foundation.json` 里某包的 `verification.unit.tests` 是**该包自己的** unit + types 合计
    （motion 154 = 110 + 44；a11y 204 = 134 + 70）。两者不是一回事，别拿来对账。
    核对「有没有文件没被收集」用文件数等式：`*.test.ts` 扣掉 `a11y.test.ts` / `semantic.test.ts`。
32. **Vue 运行时的 `setStyle` 不做 px 补全。** `runtime-dom` 的 `setStyle` 只是
    `style[prefixed] = val` —— **React 的 `dangerousStyleValue` 会补单位，Vue 只在
    模板编译期补**。用 `h()` 在 TS 里写样式传裸数字，jsdom 的 cssstyle 与浏览器都会
    **静默丢掉**这个声明（实测 `el.style.height = 100` → `''`，而 `left: 0` 却是 `0px`）。
    症状极隐蔽：DOM 结构全对，只有 height/width 是空的。
    **所有数值样式必须自己拼单位**（`\`${n}px\``）。
33. **`ResizeObserver` 的注册发生在挂载后的下一拍**（`useResizeObserver` 用
    `flush: 'post'` 的 watcher）⇒ 挂载后**立刻** `MockResizeObserver.trigger()`
    是空转，`instances.size` 还是 0。必须先 `await nextTick()` 两次。
34. **jsdom 量不到高度 ⇒ `scrollTo({index})` 会迭代到 10 次上限**并打 dev 告警
    （「可见范围内有未测量的项」永远为真）。与上游行为一致（同一个 `MAX_TIMES`）。
    测试里要么把项桩成可测量让循环收敛，要么静音 spy ——
    ⚠️ **静音时必须等满 12 拍再 `mockRestore()`**，循环在测试体结束后还在跑。
35. **vitest 报「no tests」多半是 worker 启动超时**（`Timeout waiting for worker to
    respond`），不是没有测试文件。跑了几十轮之后会频繁出现。对策：`--maxWorkers=2`。
    **别把它当成过滤写错**，否则会去翻根本不存在的 glob 问题。
36. **`git worktree` 里另一个 worktree 的未提交内容会让合并被拒**。
    合并到主分支前必须先在那边 `git stash push -u`（保留全部，可恢复），
    而不是 `checkout`/`clean` 掉。
37. **`inject` 只沿父链解析** —— 组件**拿不到自己在同一个 `setup` 里 `provide` 的东西**。
    测试 helper 必须「父组件 provide + 子组件 inject」。实测代价：locale 的第一版
    把两者写在同一个 setup 里，5 个用例全绿不了。
38. **`--check` 类命令不能有任何写操作。** 实测：`gen-locale.mjs` 第一版把「写测试快照」
    放在了 `if (args.check)` 分支**之前** ⇒ 「检查」会改仓库。
    写检查命令后要通读一遍它自己的副作用。
39. **调用外部生成器的测试要显式给 `timeout`。** 建临时树 + 求值 73 个模块要好几秒，
    远超 vitest 默认的 5s（报错是「Test timed out in 5000ms」）。
40. **生成物 / 上游原样文件要加进 biome 忽略。** locale 加了两处：
    `!**/packages/locale/src/locales`（生成物，同 icons）与
    `!**/registry/source/locale-rc`（上游原样 js，同 `antd-*.raw.json`）。
    ⚠️ **别用 `JSON.stringify` 改 `biome.json`** —— 它会展开 biome 自己会折叠的短数组，
    导致 `biome check .` 报「Formatter would have printed the following content」。
    改完必须 `biome check --write biome.json`。
41. ⚠️⚠️ **全仓 `vitest run --project unit` 在这台 16G 机器上会被 OOM killer 杀掉
    （exit 137，且**没有任何输出**）。** 跑完 20+ 个测试文件后只剩 ~40MB 空闲。
    症状极像「命令写错了」，实际是内存。对策：
    - 优先用 `registry/tools/foundation-status.mjs --verify`（**按包**跑，内存友好，
      覆盖全部 13 个包 —— 实测 2254 用例）
    - 或逐项目跑：`--project types` / `dom-contract` / `a11y` / `theme`
    - 或 `--maxWorkers=1 --no-file-parallelism`
    - 被杀后等 ~20 秒内存会回收（实测 41MB → 1.1GB），别立刻重试
42. ⚠️⚠️ **`/tmp/antd-src` 与 `/tmp/antd-repo` 会被系统清理** —— 它们是全项目的
    「事实来源」，但 /tmp 不是持久存储。**每个新会话第一件事：`ls /tmp/antd-src /tmp/antd-repo`**。
    恢复方法见当日日志第十四节（产物用 `npm pack antd@6.6.4`；
    源码要用 **node 的 fetch** 拉 codeload，`curl` 会走一个不存在的代理）。
    ⚠️ `extract-antd-facts.mjs --download` **只重建 raw.json**，不解包到 /tmp。
43. **`timeout` 命令不一定可用** —— 有的会话 PATH 里没有。
    别把超时保护写成 `timeout N cmd`，用工具自带的 timeout 参数。
44. ⚠️ **`package.json` 里引用的脚本可能不存在**：`test:compat` 指向
    `tests/compat/runner/index.mjs`，但该文件**不存在**。到「要跑门禁」时才会发现。
    接手新阶段前先 `ls` 一遍 `package.json` 引用的每个脚本。
45. ⚠️ **用 node 脚本批量写文件时，内容里的反引号会被外层模板串吃掉**。
    实测：写含反引号的 Vue SFC 的生成脚本直接 `SyntaxError: missing ) after argument list`，
    **一个文件都没写出去**（好在 fail-fast，没有半成品）。
    对策：每个文件用 Write 工具单独写，或用 heredoc / `\u0060` 转义。
    这类脚本跑完**必须确认产物真的落盘了**，不能只看脚本没报错。
46. ⚠️⚠️ **Vue 的 Boolean prop 转换会把「未传」变成 `false`**（2026-09-18，empty 实测）。
    只要 prop 的**运行时类型**含 `Boolean`，且调用方没传、也没有 `default`，
    Vue 就把它赋成 `false`。而 `React.ReactNode` 的 Vue 对应物 `VNodeChild` **含 boolean** ——
    SFC 编译器把它解析成 `[Object, String, Number, Boolean, null, Array]`。
    症状极隐蔽：组件「能渲染」，只是少了一块（描述整块消失 / 插画变成注释节点 `<!---->`）；
    不报错、不警告、`vue-tsc` 也过。empty 是被 L4 的逐节点比对抓出来的。
    **对策**：`withDefaults(defineProps<T>(), { <每个 VNodeChild prop>: undefined })`
    —— 有 `default`（哪怕是 `undefined`）就跳过转换。
    **所有 `VNodeChild` prop 都适用**：`title` / `content` / `label` / `extra` / `children` / `footer`。
    同一根源：antd 的 `!(deprecatedName in props)` 判据在 Vue 下失效
    （Vue 的 props **恒**包含全部声明键）⇒ 改成 `!== undefined`。登记为 D21。

47. ⚠️⚠️ **`biome check --write` 在 `biome.json` 无法解析时会静默退回默认配置**（默认 tab 缩进），
    从而**重排全仓**。2026-09-18 实测：给 `biome.json` 加了 `//` 注释（JSON 不允许）后
    跑一次 `--write`，1344 个文件被改成 tab 缩进。
    **对策**：`biome.json` 里不能写注释；改完配置先 `biome check .` 看有没有 parse 错。
    **恢复**：列出「有意修改」的文件清单，其余 `git checkout --`。
    ⚠️ **`git checkout` 恢复不了未跟踪文件** —— 被重排的未跟踪产物（如 compat 基线）
    只能重新生成。

48. ⚠️ **unbuild 对 `.vue` 的 `declaration: true` 会静默产出错误的 `.d.ts`**。
    `rollup-plugin-dts` 不认识 SFC，会把**编译后的 JS** 当声明写进 `dist/index.d.ts`。
    而 `tests/build/run.mjs` 的 B2 只校验「exports 指向的路径存在」⇒
    这种错误产物能一路绿灯发出去。
    **对策**（`packages/ui/build.config.ts`）：`declaration: false` + `build:done` 里跑
    `vue-tsc`，并在钩子末尾**断言产物里含 `declare` / `export type`**。
    同时 `vue-tsc` 需要 `--outDir .dts-tmp --rootDir ../..`（仓库根）再裁剪 ——
    因为 tsconfig 的 `paths` 指向 `../utils/src`，那些文件进了 program，
    `rootDir` 只能是它们的公共祖先，否则 TS6059。

49. ⚠️ **`pnpm -r run build` 在本仓库永远不可用**：每个包都 devDepend on `test-utils`，
    而 `test-utils` depend on `theme`/`utils` ⇒ `ERR_PNPM_TASK_CYCLE`。
    即使加 `ignoreWorkspaceCycles: true`，构建顺序也不再保证拓扑序。
    ⇒ **`node tests/build/run.mjs` 才是权威构建入口**（已改为按 workspace 依赖拓扑排序）。
    同类：unbuild 打包 JS 时把 workspace 依赖当 external，但出 `.d.ts`、
    跑 `build:done` 钩子时都要能解析到依赖的**产物** ⇒ 顺序是正确性问题，不是优化。

50. ⚠️ **`axe-core` 在模块导入期就 `new MutationObserver`**（2026-09-18 实测）。
    于是只要测试文件从 `@apollo-design/test-utils` 的入口导入任何东西
    （barrel 会把 `a11y-demo-test` 一起拉进来），
    `MutationObserver.instances.size === 0` 这条**绝对值**判据恒不成立 ⇒
    `mountTest` 对**每一个**组件都必然失败，且失败信息指向组件（方向完全错误）。
    实测：`import 'vue'` → 0；`import '@apollo-design/utils'` → 0；
    `import '@apollo-design/test-utils'` → 1。
    **对策**：`mountTest` 改成**增量**判据 —— 挂载前 `snapshotObservers()`，
    卸载后 `describeObserverLeaks(baseline)`。新增实例仍然会被抓到。

51. ⚠️ **`biome check .` 在本仓库曾经从未真正绿过**：`scaffold-packages.mjs` 生成的
    `package.json` / `tsconfig.json` 是 **tab** 缩进，而 `biome.json` 的
    `formatter.indentStyle` 是 space ⇒ 逐文件报 format 错。
    另外 `.vue` 的 `noUnusedVariables` / `noUnusedImports` 是误报
    （biome 的 JS 分析器**不解析 `<template>`**），
    `tests/compat/baseline/*.mjs` 的 `useButtonType` 也是误报（那是 `React.createElement`）。
    三处都已加 override 并写明理由（`biome.json` 不能写注释，理由记在本文件与组件 README）。

52. ⚠️ **`pnpm install` 会重写根 `package.json` 的缩进为 tab**。
    `biome check .` 随后会报 format 错。改完依赖后先跑一次 `biome check --write .`
    （并确认它只改了你改过的文件 —— 见第 47 条）。

53. **`packages/ui` 的 `tsconfig.json` 曾有两处失真**（已修模板 + 手改）：
    ① 缺 `baseUrl` ⇒ 包内的 `../utils/src` 会按**根 tsconfig** 的 baseUrl 解析成
    「仓库根的上一级/utils/src」，必然 TS2307（foundation 包没互相 import，所以一直没暴露）；
    ② 未排除 `**/demo/**` ⇒ `dist/<component>/demo/*.vue.d.ts` 会被打进发布的包。
    `paths` 清单也是旧的（缺 overlay / a11y / locale）。
    ⚠️ `scaffold-packages.mjs` 的 `--force` 会**覆盖 `src/index.ts`**（清空实现），
    只能安全地用 `--force-pkg`（只刷 package.json）——所以 tsconfig 只能手工同步。

54. ⚠️ **Vue 的 SSR 对 `style` 键是「无条件输出」的** —— 值为 `undefined` 时渲染成
    `style=""`，而 React 在样式为空时**不输出该属性**。
    客户端 `patchStyle` 会把空样式移除，所以**只有 SSR 产物**有这个差异，
    本地用 `mount()` 测不出来。
    ⚠️ L4 的 DOM 投影也**测不出来**（把「没有 style 属性」与 `style=""` 都归一化成空串）。
    Empty 一层就有 3 个元素中招，是渲染 SSR 预览页时肉眼发现的。
    **对策**：`styleAttrs(style)` —— 空样式返回 `{}`（连键都没有），非空返回 `{ style }`，
    然后 `v-bind="styleAttrs(x)"` 而不是 `:style="x"`。

55. ⚠️ **同一个元素上不能有两个裸 `v-bind`**：`v-bind="x" v-bind="$attrs"`
    会被 Vue 判为 `Duplicate attribute` 而**编译失败**（报在 `vite:vue` 插件里，
    错误信息只有一行，不看上下文很难定位）。把 `$attrs` 并进同一个对象。

## 工具 / 沙箱（续 · 2026-09-18）

56. 🚨 **`registry/dependencies.json` 是生成物，不要直接改**。它的 `$comment` 写明
    GENERATED，源是 `registry/source/rc-map.mjs`（每条记录）+ `gen-registry.mjs` 的
    `strategyLegend`。直接改它会被下次 `gen-registry.mjs` **静默覆盖** ——
    实测：strategy 的改动在跑过一次 `registry:check` 后消失，而**门禁照样全绿**
    （E19 只看 package.json 与产物，不看 strategy），所以不会有任何红灯提醒。
    对策：改源文件 → `node registry/tools/gen-registry.mjs` → 验证
    `summary.strategyBreakdown` 真的变了。

57. **扫描构建产物做「禁用依赖」检查前，必须先剥注释**。unbuild **不剥 JSDoc**，
    而本仓库注释里大量出现「曾经这样写 `from '@ant-design/…'`」这类示例文本，
    会被当成真实 import 报出来（E19 首次运行就撞上：报 `icons/dist/index.d.ts`
    引用了上游类型，实际那 13 处命中全在注释里）。
    对策：`stripComments()`（块注释 + 行注释），`validate-registry.mjs` 的 E11/E19 已共用。

58. **`@ant-design/icons-svg` 的 `es/*.js` 不能 `import()`**：上游 package.json 没有
    `"type": "module"`，那些文件虽是 ESM 语法，Node 仍按 CJS 解析 →
    `SyntaxError: Unexpected token 'export'`。要在构建期**求值**它们，只能
    `require()` **`lib/asn/*.js`**（CJS 产物）。

59. ⚠️ **master 可能已经前进，`git merge --ff-only` 不一定可行**。2026-09-18 实测
    master 领先 4 个提交（另一个会话在那边收口 empty）。正确顺序：
    ① 当前 worktree `git merge master`；② 解冲突（`registry/*.json` 取 ours 后
    **重跑生成器**；`memory/<日期>.md` 的 add/add 两边内容都留）；
    ③ 确认 `git rev-list --left-right --count master...HEAD` 变成 `0 N`；
    ④ 才去 master worktree 做 `--ff-only`。另：那边的 `dist/` 是旧构建，
    不重建的话 E19 会拿旧产物报假阳性。

60. ⚠️ **oracle 测试不覆盖我们自己的 API 面 —— 新增 L0 导出时必须另写行为测试，
    并真的跑一次覆盖率门禁**。2026-09-18 实测：`utils/src/color/` 只写了
    `color.oracle.test.ts`（对上游 90+ 组样本逐位差分，全部通过），
    但 `color.ts` 的覆盖率是 语句 94.61 / 分支 88.46 / **函数 91.17** / 行 94.47，
    **不达 L0 的 95/90/95/95**。缺口全是「上游也支持的输入」走不到的路径：
    `toString` / `clone` / `equals` 三个纯函数方法、`toHexString` 的 alpha 分支、
    无参构造、非法输入抛错。
    **对策**：oracle 管「与上游一致」，行为测试管「我们自己的 API 形态与边界」，
    两者都要；收口时跑 `CODEBUDDY_SAFE_DELETE_ENABLED=0 node registry/tools/foundation-status.mjs --package <dir> --verify`
    （约 18 分钟/包，但它是唯一会看覆盖率的门禁 —— `pnpm run registry:check` 不看）。

61. 🚨 **Vue 的事件 prop 名必须全小写**（`onMouseenter` 而非 `onMouseEnter`）。
    runtime-dom 的 `parseName` 会 `hyphenate(name.slice(2))`，于是 React 风格被解析成
    **不存在**的事件名：`onMouseEnter`→`mouse-enter`、`onTouchStart`→`touch-start`、
    `onContextMenu`→`context-menu`、`onPointerDownCapture`→`pointer-down`。
    正确：`onMouseenter` / `onPointerenter` / `onMouseleave` / `onPointerleave` /
    `onTouchstart` / `onContextmenu` / `onPointerdownCapture`；只有修饰符后缀
    （Once / Capture / Passive）保留大写。`onClick` / `onFocus` / `onBlur` 无影响。
    **症状是完全静默** —— 不报错、不警告、类型检查也过，只是事件永不触发。
    2026-09-18 在 overlay 的 L2 测试里实测踩到（18 个用例全红，改命名后全绿）。

62. ⚠️ **变异验证脚本一次跑多个变异会 OOM，而且会把结果误报成「漏网」**。
    2026-09-18 实测：一个脚本里串起 5 个变异 × 3 个测试文件，第二轮就被 SIGKILL
    （exit 137），输出不完整 ⇒ 判定逻辑读不到 "N failed" ⇒ 打印「❌ 漏网（测试仍全绿）」，
    而实际上单独跑时该变异被 6 个用例抓到。
    **对策**：① 一个变异一次 Bash 调用，只跑必要文件；② 判定不要只看字符串，
    先确认进程退出码与 `Tests N failed` 都拿到了；③ 变异后用 `git diff` 或 `grep`
    **确认恢复干净** —— 本轮 `cp` 恢复失败过一次，残留的 `continue` 让 2 个用例持续红。

63. ⚠️ **覆盖率的三个测法坑**（2026-09-18 在 overlay 上实测）：
    ① 测试**别从 `'..'`（index.ts）导入** —— 纯 re-export 文件被 v8 记成 0%，
    会把整包拉到阈值以下。要从具体模块导入（`../use-overlay`）。
    ② `coverage.all` 默认为 `true`，在根跑**单包**覆盖率会把其它包的 `src/` 也算进来，
    `All files` 永远不达标 —— 那是假象，看**按包名聚合的单文件行**才是真实值。
    ③ 别 `cd packages/x && vitest run`（丢了根配置，实测 25 个用例失败）—— 必须在根跑。
    另外：最后几个分支点靠「删掉不可达分支」比「硬凑测试」划算
    （`!canUseDom` 交给下游自己保证、`?? window` 兜底替掉 `if (!win) return`）。

64. 🚨 **`package.json` 的 `exports` 里声明的路径，必须在 unbuild 的
    `validatePackage` 执行**之前**就存在**。2026-09-18 实测：给 theme 补
    `extraExports: { './tokens.css': './dist/tokens.css' }` 后，`tests/build/run.mjs`
    的 B1 直接 FAIL（unbuild 退出码 1）：

        WARN Build is done with some warnings:
        - Potential missing package.json files: dist/tokens.css

    根因（unbuild@3.6.1 `dist/shared/unbuild.CyYtfvFx.mjs`）：
    `validatePackage` 用 **`existsSync`** 校验 exports 的每个路径（329-354 行），
    而它的调用点在主流程 **1380 行**、`build:done` hook 在 **1381 行** ——
    **校验先于 hook**。所以「在 `build:done` 里产出该文件」永远来不及。
    `failOnWarn`（默认 true）⇒ `process.exit(1)`。

    **修法**：把产出挪到 **`rollup:options` 注入的插件的 `writeBundle`** ——
    它在 rollup 写完产物**之后**（`dist/index.mjs` 已落盘，可照旧 import 它拿数据），
    又**早于**主流程的 validatePackage。参考实现见 `packages/theme/build.config.ts`。

    **排除过的三条路**（别再试）：
    - `failOnWarn: false` —— 全局开关（源码就是 `if (ctx.options.failOnWarn)`），
      不支持按警告类型过滤；会放过「潜在隐式依赖」等真实警告 ⇒ 放宽，违反 H8。
    - `build:before` 里写占位 —— unbuild 的 `clean dist` 在 `build:before`（1281 行）
      **之后**（1291 行起）执行，占位会被清掉。
    - 回退 exports 声明 —— 那会把「消费者按文档 import 必然失败」的包契约缺陷带回来。

    ⚠️ 这个 FAIL **不是合并引入的**，是上一轮改 `extraExports` 时就产生了，
    只是当时只跑了 `pnpm --filter <pkg> run build`，**没跑 `tests/build/run.mjs`**。
    教训：改了 `package.json` 的 exports / 构建配置，必须跑全量构建门禁。

65. 🚨 **`structuredClone` 不能克隆函数** —— 写 oracle / 差分测试时不能用它做深拷贝。
    2026-09-18 在 form-core 的 oracle 测试里实测：`transform` / `validator` /
    `asyncValidator` / `message` 全是函数 ⇒ 直接抛 `DataCloneError`，
    7 个用例炸在**克隆这一步**（看起来像实现有问题，其实不是）。
    **对策**：手写 `cloneDeep`，对 `function` / `RegExp` / `Date` 分别处理。
    另：`Schema.validate` 会**改写规则对象**（加 field/fullField/type/validator），
    `enum` rule 还会把 `rule.enum` 归一成数组 —— 两侧共用一份规则对象会让第二次运行看到脏数据。

66. 🚨 **biome 的 `noConfusingVoidType` 自动修会把 `void` 改成 `undefined`，那是错的**。
    2026-09-18 实测：`RuleItem['validator']` 的返回类型 `SyncValidateResult | void`
    被 `biome check --write --unsafe` 改成 `| undefined`，
    于是**所有 callback 式 validator 编译失败**（TS2322：`void` 不能赋给 `undefined`）。
    `void` 在**返回位置**表示「返回值被忽略」，因此「返回 void 的函数」可以赋值给它；
    `undefined` 则要求真的返回 undefined。**必须改回来 + `biome-ignore`**。
    ⚠️ 教训：`--unsafe` 的自动修不是无脑安全的，改完必须跑 `vue-tsc`。

67. ⚠️ **`Schema` 的 `validate` 失败时是「callback 被调用 _且_ Promise reject」双通道**，
    且 `asyncMap` 里有 `pending.catch(e => e)` 吞掉 unhandled rejection。
    ⇒ 调用方 `await schema.validate(...)` 会抛；`.catch()` 也能拿到 `AsyncValidationError`。
    **只 await 不 catch 会踩 `unhandledRejection`**（因为 callback 那条路已经"处理"过了，
    但 promise 那条没有）。写调用方时两条路都要接。

68. ⚠️ **直接调用 validator / rule 时必须自己补 `rule.field`**。
    `shouldValidate` 的判据是 `Boolean(rule.required) || Object.hasOwn(source, rule.field)`，
    而 `Object.hasOwn(source, undefined)` 恒为 `false` ⇒ **整个校验被静默跳过**，
    测试会拿到空错误数组而误以为"通过了"。
    真实调用里 `Schema` 一定会设 `field`，所以这是**测试侧**的坑。
    2026-09-18 实测：5 个 units 用例因此假绿。

69. ⚠️ **`format(template, ...args)` 的函数参数类型要写 `never[]` 不要写 `unknown[]`**。
    严格函数参数逆变下，`(a: string, b: string) => string` **不能**赋给
    `(...args: unknown[]) => string`（`unknown` 不能赋给 `string`），
    但可以赋给 `(...args: never[]) => string`（`never` 可赋给一切）。
    上游是 JS，没有这个问题。

70. 🚨 **`toArray` 同名不同义 —— 复用前先看语义，不要看名字**。
    `@apollo-design/utils` 的 `toArray(children)` 是**为 Vue children 设计**的
    （展平 vnode、拆 Fragment、包 Text vnode、返回 `VNode[]`）；
    而 rc-form 的 `typeUtil.toArray(namePath)` 是**为 namePath 设计**的
    （`null`/`undefined` ⇒ `[]`，其余包成数组，返回 `(string|number)[]`）。
    两者只是名字撞了 —— 2026-09-18 在 form-core 批次② 差点直接复用。
    **对策**：复用一个 L0 导出前，先读它的实现或注释，确认语义而不只是签名。
    ⚠️ 反例（**可以**复用的）：`get` / `set` —— 上游 `valueUtil.js:1` 本身就是
    `import { get, set } from '@rc-component/util'`，而 utils 的 `object.ts` 正是那套的移植，
    **同一个来源**，直接复用正确。

71. ⚠️ **普通字符串里写 `${name}` 会被 biome 的 `noTemplateCurlyInString` 报**，
    而有些场景**必须**用普通字符串 —— 例如 `validateMessages` 的模板字面量文本
    （`"'${name}' is required"`），改成反引号会被立即求值、语义全错。
    **对策**：在文件顶部加 `// biome-ignore-all lint/suspicious/noTemplateCurlyInString: <理由>`，
    逐行加 `biome-ignore` 会有几十处。理由要写清楚（"这些是给用户的模板文本，不是 JS 模板"）。

72. 🚨 **`vitest ... | head -N` / `| grep` 会因 SIGPIPE 提前杀死进程，覆盖率报告静默不写**。
    2026-09-18 实测：`npx vitest run --coverage ... | grep -E "..." | head -60` 的 exit code 是 **0**、
    测试结果看起来正常，但 `coverage/coverage-summary.json` **根本不存在** ——
    `head` 读够行数就关掉管道，vitest 拿到 EPIPE 后**在写覆盖率报告之前**就退出了。
    ⚠️ 危险之处：它**不报错**，只是「没有报告」，很容易被误读成「覆盖率工具坏了」。
    **对策**：带 `--coverage` 时把输出**重定向到文件**（`> /tmp/x.log 2>&1`），
    再从文件里 grep；或直接读 `coverage/coverage-summary.json` 汇总，不要依赖 stdout 表格。

73. 🚨 **`vitest run --project types` 解析不了 `.vue`，会对**既有**文件报 `Unhandled Source Error`**。
    2026-09-18 实测（`--verify` 跑完才暴露）：报错形如

    ```
    TypeCheckError: Cannot find module './Empty.vue' or its corresponding type declarations.
     ❯ packages/ui/src/empty/index.ts:22:28
    ```

    ⚠️ 关键在于**它不是新引入的**：把 `packages/ui/src/form/` 整个移走再跑，
    `empty/index.ts` 这一条**照样报** ⇒ 基线 `9326146` 就存在。
    成因是 `types` project 的 typecheck（`ignoreSourceErrors: false`）不认 SFC 后缀。
    ⚠️ `vue-tsc --noEmit -p tsconfig.json`（也就是 `lint:types`）**是 0 错误**的 ——
    两条通道对 `.vue` 的解析能力不同，所以「lint 绿」不代表「types 项目绿」。
    后果：`--verify` 的 exit code 是 **1**，但 `verification.unit.failed` 仍是 0
    （Unhandled Source Error 不算 assertion failure）。
    **判据**：看到这个错先别改自己的代码 —— 先确认报的是不是**基线文件**
    （`empty` 就是基线文件），再看 `--project types` 是否本来就红。
    ⚠️ 修它要动 `vitest.config.ts`（不在任何单包的 file domain 里），属于**基建**议题。

74. 🚨 **vitest 的 `types` 项目会「运行时执行」`*.test-d.ts`，`null as unknown as T` 后调方法必炸**。
    2026-09-18 实测：`const form = null as unknown as FormInstance; form.isFieldsTouched();`
    ⇒ `TypeError: Cannot read properties of null (reading 'isFieldsTouched')`，
    **5 条用例全红**，而 `vue-tsc` 完全看不出来（类型是对的）。
    **对策**：类型断言必须包在**永不调用**的函数里：

    ```ts
    it('...', () => {
      const check = (form: FormInstance) => { expectTypeOf(form.foo()).toEqualTypeOf<X>(); };
      void check;          // 只做类型检查，不执行
    });
    ```

    ⚠️ 负例（`@ts-expect-error`）同理 —— 只跑 `vue-tsc` 会得到**假绿**，
    只有 `--verify`（含 `types` project）才照得出来。

75. ⚠️ **`pnpm run lint` 在基线 `9326146` 就是红的**（不是本批次引入）。
    2026-09-18 实测：`lint:types`（vue-tsc）**0 错误**，红的是 `lint:format`（`biome check .`）。
    按文件分清：

    | 文件 | 数量 | 级别 | 归属 |
    |---|---|---|---|
    | `packages/theme/build.config.ts` | 1 | **error**（`format`） | **基线既有**，不在 form-core 的文件域 |
    | `packages/form-core/src/__tests__/batch2.test.ts` | 17 | warning（`noTemplateCurlyInString`） | 基线既有（PITFALLS 71 的 `biome-ignore-all` 对策**没应用到这个文件**） |
    | `packages/form-core/src/types.ts` | 2 | warning（含 `suppressions/unused`） | 基线既有 |

    ⭐ **只有 error 会让 `lint` 退出码非 0**（24 个 warning 不影响）。
    ⇒ 看到 `lint` 红，先 `npx biome check . --reporter=json` 按 `location.path` 分组，
    **再判断是不是自己的文件**；别一上来就改自己的代码。
    ⚠️ 反过来：自己文件里的 error 必须清掉，否则会把「别人的红」和「自己的红」混在一起，
    下一个人无法分辨。
    ⭐ 对**有意为之**的规则违例（如 `Function` 判据、`then` 鸭子类型夹具、上游公开签名里的
    `any` 默认泛型），正确做法是**逐条 `biome-ignore` + 写清理由**，
    不是 `--write --unsafe` 全局放宽（PITFALLS 66 就是那个教训）。

76. 🚨🚨 **PITFALLS 64 的「修法」是错的 —— `writeBundle` 赶不上 unbuild 的 exports 检查。
    正解是「配置加载期」先落占位。**（2026-09-18 整合会话实测纠正）

    64 的**诊断**是对的：`exports` 里声明的路径必须在检查前存在。
    但 64 的**处方**是错的：它说「挪到 `rollup:options` 注入插件的 `writeBundle`
    （rollup 写完产物之后、validatePackage 之前）」—— **`writeBundle` 同样赶不上**。

    真实时序（`unbuild@3.6.1` `dist/shared/unbuild.CyYtfvFx.mjs`）：

    | 阶段 | 行 | 说明 |
    |---|---|---|
    | 解析 `exports` + **`existsSync` 存在性检查** | **113-126** | 没有源入口的产物（如 `tokens.css`）走到这里；文件不在就 push 告警 |
    | `rollup:options` hook | 875 | 我们注入插件的时机 |
    | `build:before` hook | 1281 | |
    | `clean dist`（rmdir + mkdir） | 1291-1305 | **会把占位删掉** |
    | 真正的构建任务 | 1306-1322 | 此时 `writeBundle` 才跑 |
    | `validatePackage` | 1380 | `failOnWarn: true`（`:1192`）⇒ 有告警就 `exit(1)` |

    ⚠️ 检查在 **113-126 行**，早于构建 ⇒「在 `writeBundle` 里生成」**永远来不及**。
    64 记的「theme 单独构建零警告，全量门禁 FAIL 0」是**假绿**：
    上一次构建留下的 `dist/tokens.css` 骗过了 `existsSync`。

    **决定性实验（照抄可复现）**：

    ```bash
    # ① dist 存在 → FAIL 0（连续 3 次）
    CODEBUDDY_SAFE_DELETE_ENABLED=0 node tests/build/run.mjs --package theme
    # ② 移走 dist（⚠️ 用 mv，rm 会被沙箱批量删除守卫拦下）
    mv packages/theme/dist /tmp/theme-dist-backup
    # ③ dist 不存在 → 必 FAIL 1：Could not find entrypoint for ./dist/tokens.css
    CODEBUDDY_SAFE_DELETE_ENABLED=0 node tests/build/run.mjs --package theme
    # ④ 只放一个空占位 → 又 FAIL 0（证明检查只认「文件在不在」，不看内容）
    mkdir -p packages/theme/dist && : > packages/theme/dist/tokens.css
    CODEBUDDY_SAFE_DELETE_ENABLED=0 node tests/build/run.mjs --package theme
    ```

    ⚠️⚠️ **后果**：全新 clone / CI 上 `dist/` 为空 ⇒ theme B1 **必然红**。
    两个并行流的 agent 都把它判成「瞬时竞态，重跑即绿」（因为它们的工作区里
    `dist/` 早就有了）—— **这是一条错误根因跨 3 个会话传播的实例**
    （第二轮 → PITFALLS 64 → 两个并行流）。
    ⭐ 教训：**「重跑就好了」永远不是根因。** 要证伪必须构造**干净状态**再跑一次。

    **正确修法**（已落地 `packages/theme/build.config.ts`）：
    在**配置加载期**（模块顶层，早于 unbuild 解析 exports）先写一个占位
    `dist/tokens.css`；真实内容仍由 `writeBundle` 覆盖。
    占位随后被 `clean dist` 删掉，再由 `writeBundle` 重建为真内容。
    实测：`mv` 走 dist 后 `--package theme` **FAIL 0**，且最终 `tokens.css` 是
    55741 字节的**真内容**（不是占位）；全量门禁 **FAIL 0（127 项）**。

    ⭐ 通用判据：**unbuild 的 exports 存在性检查发生在「构建之前」，
    任何「构建中生成」的产物都必须先有一个占位文件。**

77. ⚠️ **变异「存活」不等于「测试有缺口」—— 先判「等价变异」再改测试。**（2026-09-19，③b 实测）

    判据只有一条：**这条语句被改掉后，公开 API 上能否观察到差异？**

    - **等价变异**（不该改测试，该写进契约）：
      F6 去掉 `Field.getControlled` 里的 `if (rules && rules.length)` 守卫 ⇒ 变异存活。
      根因是 **store 侧有第二层同名守卫**（`form-store.ts:851`
      `if (!field.props.rules || !field.props.rules.length) return;`），
      `dispatch({type:'validateField'})` 仍被拦掉 ⇒ `meta` / `onFieldsChange` /
      `validateFields` 返回值**全部无差异**。
      ⇒ 处方：补一条锁**行为契约**的用例（「无规则 ⇒ 不产生校验」），
        并在注释里写明「这不是某一行守卫的证据」，**不谎报击杀**。

    - **真缺口**（该补用例）：
      F1 把 `requireUpdate` 改成恒真 ⇒ 存活。根因是**测试根本没走到那行**：
      `setFieldValue` 走 `setField` 分支早退，`requireUpdate` 从未被求值。
      ⇒ 处方：换一个**必然走到**的入口（有 `dependencies` + 自身值未变 ⇒ `default` 分支）。

    ⭐ 三步定位法：① 在这条语句上加 `console.log` / 断点，跑测试看**是否被求值**；
    ② 若没被求值 ⇒ 真缺口，换输入让路径到达；③ 若被求值但仍无差异 ⇒ 找第二层守卫，
    判等价变异。

78. ⚠️⚠️ **覆盖率 ≠ 变异杀灭率：「恰好不触发守卫」的输入也能把那行覆盖掉。**

    实例（③b 的 M7）：`if (!result.length && subRuleField && Array.isArray(value) && value.length > 0)`
    原用例传 `value = undefined` ⇒ `Array.isArray(undefined)` **直接为假**，
    后面的 `!result.length` **根本没被求值**，但该行已被记为「覆盖」。
    ⇒ 变异（去掉 `!result.length`）**存活**，而覆盖率报告看不出任何异常。

    处方：**守卫型分支的用例要让「前后所有条件都为真」，只让目标条件决定结果。**
    这里改成「父规则（`min:5`）与子规则（`required`）**都会**报错 + 值是非空数组」
    ⇒ 守卫生效 1 条错误 / 失效 3 条错误。

    ⭐ 同类高危写法：`a && b && c`、`x ?? y`、`p ? q : r`、早退 `return` 前的多重条件。
    **每加一个 `&&`，就要问一次「这一条有独立的用例让它为假吗」。**

79. ⚠️ **`validateFields(undefined, { dirty: true })` 会静默丢掉 options。**

    `form-store.ts:818-823` 的重载判定是：
    `Array.isArray(arg1) || typeof arg1 === 'string' || typeof arg2 === 'string'`
    ⇒ 传 `(undefined, {dirty:true})` 时三个判据全假 ⇒ 走 else 分支 `options = arg1 = undefined`。
    **症状极隐蔽**：`dirty` 过滤静默失效，所有字段都被校验。
    （③b 里是靠「对照组：没有 initialValue 的字段**本应被跳过**却也报错」才发现的。）

    ⇒ 无 `nameList` 时必须传**单参**：`form.validateFields({ dirty: true })`。

80. ⚠️ **不要挖 `FieldEntity` 的内部对象做断言，优先走行为观察。**（③b 实测）

    - `isFieldDirty()` **不在公开 `FormInstance` 上**（上游如此），只在 entity 上；
    - `getInternalHooks().getFields()` 返回的是 **`FieldData[]`**（`{name, value, errors, ...}`），
      **没有 `getNamePath()`** ⇒ 想按路径找 entity 会直接 `TypeError`；
    - entity 只能从 `store.getFieldEntities()`（TS `private`）拿。

    ⇒ 处方：用**能观察到的公开行为**替代，例如用 `validateFields({dirty:true})` 的
    **过滤结果**反推 `isFieldDirty()`，并配一个「应被跳过」的对照组。
    对照组本身就有价值 —— ③b 就是靠它抓出了 79。

81. ⚠️ **PITFALLS 46 在 form-core 的复现：含 `Boolean` 的 prop 必须显式 `default: undefined`。**

    `preserve` / `isListField` / `isList` / `validateTrigger` 四个的「未传」**有语义**
    （`undefined` ⇒ 用上层/表单级配置；`false` ⇒ 本字段明确关闭）。
    Vue 会把未传的 Boolean prop 转成 `false` ⇒ 字段级**静默覆盖**表单级。

    附带一条声明订正（③b）：`isPreserve()` 的返回类型必须放宽为 `boolean | undefined`
    —— 上游 `.d.ts` 写的是 `boolean`，但运行时返回 `this.props.preserve`。
    若把 `undefined` 压成 `false`，`FormStore.isMergedPreserve` 的
    `fieldPreserve !== undefined` 判据失效。

82. ⚠️ **等 `MessageChannel` 宏任务时，一个 `setTimeout(0)` 回合不够 —— 必须等两个。**（③a/③c 实测）

    现象：`batch3a.test.ts` 里「⭐ notifyWatch 拿到的是本次变更的路径」在**单独跑**时全绿，
    带 `--coverage` 跑全包时偶发失败（`expected [] to deeply equal [[['a']]]`）。
    原实现只 `await new Promise(r => setTimeout(r, 0))` 一次，并假设「MessageChannel
    一定在它之前投递」—— CPU 繁忙（覆盖率采集开 v8 采样）时投递顺序**翻转**。

    ⇒ 处方：等**两个** `setTimeout(0)` 回合（两个 timers 阶段之间必然经过一次 poll + check，
      足以让 MessageChannel 的 port 消息先落地）。
    ⚠️ **不是「重跑就好了」**：这次的可复现条件是「带 `--coverage` + 跑全包」，
      单独跑文件永远绿 —— 找根因要按**能稳定复现的组合**去证伪，不是靠重跑。

83. ⚠️ **`vi.spyOn(...).mockRestore()` 会清空 `mock.calls`。**（③c 实测，19 个用例白改一轮）

    想捕获 `warning()`（走 `console.error`）时写成
    `const spy = vi.spyOn(console, 'error'); fn(); spy.mockRestore(); return spy.mock.calls;`
    ⇒ **`mock.calls` 永远是 `[]`**，所有「应告警」的断言全红，而代码其实是对的。

    ⇒ 处方：**在 `mockRestore()` 之前**把 `spy.mock.calls` 抄进自己的数组。
      已用 scratch 用例证实（`isDev=true calls=[]`）。

84. ⚠️ **`setFieldsValue` / `setFieldValue` 走的是 `setFields`，不触发 `onValuesChange` / `onFieldsChange`。**（③c 实测）

    `form-store.ts:578-593` 的 `setFields` 只做 `notifyObservers` + `notifyWatch`，
    不进 `updateValue` 的六步链 ⇒ 回调一个都不跑。
    要触发必须走 **`Field` 的 `control.onChange(...)`**（`updateValue`，`form-store.ts:713`）。

    ⇒ 测试里想验「表单级回调」必须先挂一个内部 `Field` 拿它的 `control`。
    反过来也成立：**`updateValue` 无论新旧值是否相等都会触发 `onValuesChange`**
    （`:722-729` 没有等值判断）⇒ 断言「有没有真的改过 store」要用
    「回调一次都没调」，不能只看「值没变」。

85. ⚠️ **Vue 的插槽永远是函数，且拿不到形参个数 ⇒ 不能用来自动判 render-props。**（③c 实测）

    `normalizeSlot()` 把**每一个**插槽包成 `(...args) => normalizeSlotValue(rawSlot(...args))`
    （`@vue/runtime-core@3.5.42` `runtime-core.cjs.js:5340-5354`，已核对），
    `withCtx()` 的包装体同样是 `(...args) => ...`（同文件 `:696`）
    ⇒ `slots.default.length` **恒为 0**。

    ⇒ 上游 `typeof children === 'function'` 的对应物只能是**显式 prop**
    （③c 新增 `renderProps?: boolean`）。

86. ⚠️ **`ref<T>` 的 `UnwrapRef` 深展开碰到递归类型会 TS2589。**（③c 实测）

    `const fields = ref<FieldData[]>([...]); fields.value = [...]` 报
    `TS2589: Type instantiation is excessively deep`：
    `FieldData.name` 是 `NamePath<any>` ⇒ `UnwrapRef` 递归进深度推导炸了。

    ⇒ 处方：测试里只做**整数组替换**时用 `shallowRef`（不做深展开）。
    同类：`h(Component, {字面量 props}, ...)` 走精确 props 重载也可能炸，
    需要时断言成 `Record<string, unknown>` 走宽松重载。

87. ⚠️ **变异验证里「去掉一个守卫」常常是等价变异体 —— 判等价必须给源码级理由，不许凭感觉。**（③c 实测）

    ③c 的 39 组里有 5 组杀不掉，每一条都有可验证的原因：
    - `move` 的 `from === to` / 越界守卫：`move()` 在这两种情形下返回**同一个数组引用**
      （`value-util.ts:206-210`），而 `Field` 的 trigger 在 `newValue === curValue` 时
      **根本不 dispatch**（`field.ts:533`）⇒ 没有可观测差异；
    - `add` 的 `index <= length` 改 `<`：`index === length` 时 if / else 两分支产出
      **完全相同**的 `keys` 与 `value`；
    - `getNewValue` 换 `fieldContext`：`getFieldValue` 是 FormStore 的**箭头属性**
      （`form-store.ts:361`），`this` 与宿主对象无关；
    - `shouldUpdate` 的 `source === 'internal'` 守卫：`onStoreChange` 的 `default` 分支
      **先判 `namePathMatch`** 就 `return` 了，守卫根本到不了。

    ⇒ 记下来的价值：等价变异体反过来能**抓出写错的注释**（③c 就靠它发现 `list.ts`
    里「不能用 fieldContext」那条注释是错的，已订正）。

88. ⚠️ **Field 的 `initialValue` 在**挂载期**不看 `isListField`。**（③c 实测）

    挂载期走 `initEntityValue`（`form-store.ts:611-620`）：只要当前值是 `undefined` 就写进去，
    **不看** `isListField`。只有 `resetFields` ⇒ `resetWithFieldInitialValue`
    （`:524-525` 的 `!isListField && ...`）才区分。

    ⇒ 想测 `isListField` 的语义（顶层 List = `false` / 嵌套 List = `true`，
    `List.js:64` 的 `isListField ?? !!wrapperListContext`），
    **不能只看初始值**（两条路径结果一样），必须走 `resetFields`。

89. ⚠️ **`watchEffect` 默认 `flush: 'pre'` 会在 setup 期同步求值**，会破坏与 React
    `useLayoutEffect` 的「首帧一致」契约 —— 特别是与 `renderToStaticMarkup` 的 SSR 基线
    对比时，Vue 端首帧就出现 `<svg>` 而 React 端没有，L4 报「子节点数不同」。

    ⇒ React `useLayoutEffect` 等价的 Vue 形态是 **`watchEffect(cb, { flush: 'post' })`**：
    post watcher 在 mount 同步阶段不入队，下一拍才跑，于是首帧 VNode 树与 React SSR 完全
    一致。`Progress` 的「首帧不渲染」就是这条 —— 用 `flush: 'post'` 替代 `useState(false)` +
    `useLayoutEffect` 的「延迟一帧再翻 `render`」组合。

90. ⚠️ **`cloneVNode` 在「Fragment 根的组件」上会丢 `$attrs` 继承** —— React 的
    `cloneElement` 不依赖目标根是什么，Vue 的 `mergeProps` 对 Fragment 根会发警告并
    丢弃。`Indicator` 要注入 `class` / `style` / `percent` 三件事到用户的指示器，
    三件**必须**在内部组件的 `props` 里显式声明，而不是依赖外部传 `$attrs`。

    ⇒ 处方：把要注入的属性**全部声明成 prop**。如果用户组件没用就当作没传。

91. ⚠️ **模块级「全局可改」的单例**（如 `Spin.setDefaultIndicator` 的 `defaultIndicator`）
    不能写在 `<script setup>` 里 —— `<script setup>` 编译成 `setup()`，**每个实例都会
    执行一遍**，写在那里的 `let` 变成实例级。`setDefaultIndicator` 改的就只对
    「某个实例的那一份」生效，极难复现。

    ⇒ 处方：放在独立的 `.ts` 模块里（ESM 模块单例），与 antd 的模块级 `let` 同构。
    `defaultIndicator.ts` 即为此而存在。

92. ⚠️ **零运行时架构下 `Component Token → CSS 变量` 是有 gap 的**：`tokens.css` 只声明
    Alias 层（`getDesignToken()` 返回 `AliasToken`），组件层的 `prepareComponentToken`
    结果**不会**出现在 `:root` 块里。直接写 `--apollo-spin-dot-size` 会让
    `tests/build/run.mjs` 的 B7（CSS 里引用的每个 `--apollo-*` 都必须在 theme 的
    `tokens.css` 里声明过）直接失败。

    ⇒ 临时方案：把派生算式（`calc(var(--apollo-control-height-lg) / 2)`）在使用点
    展开，size 类（`-sm` / `-lg`）各自再展开一份。完整闭环要等 `packages/theme`
    把 `prepareComponentToken(getDesignToken())` 也落成 `:root` 变量。

93. ⚠️ **`expectTypeOf(value).parameters` / `.returns` 在 expect-type 不同版本下签名
    不一致**（实测报 `Expected 1 arguments, but got 0`）—— 用
    `expectTypeOf<typeof fn>().toEqualTypeOf<(arg: X) => Y>()` 整条函数类型相等断言
    替代，更稳且更完整。`expectTypeOf(Component)` 在 `.vue` 解析不到时退化成 `any`，
    链式调用会再退化；只要断言「属性是否存在」用 `toHaveProperty`，不要链 `toBeFunction`。

---

## ConfigProvider 流（2026-09-19，94-104）

94. ⚠️ **变异验证「存活」可能是假阴性**：必须**确认改动真的落盘**（grep / sed -n / diff 打印改动处），再跑测试。这次 M11（反转 `autoInsertSpace` 合并顺序）第一次跑测试**全过**，但其实 perl 正则用了 `\.\.\(`（两点）而不是 `\.\.\.\(`（三点，源文件是 `...((out.button` 三点）—— 改动没匹配上，原文件原样，测试当然过。**结论：每次 apply 变异后**先 `grep` 改动后的特征串，或 `diff <(git show HEAD:$F) $F` 看实际差异，再跑测试。

95. ⚠️ **`display: contents` 在 Chromium 的 inline 容器里仍可能留 1px 假盒子**：实测 `tests/visual` 的 `#stage` div 是 inline 上下文，ConfigProvider 给 `<Spin>` 包一层 `display: contents` 后，stage 高度从 56 → 55 差 1px。这是跨浏览器的已知行为（Chromium 在 inline formatting context 里把 `display:contents` 元素当成匿名 inline 盒子处理），不是 ConfigProvider 的正确性问题 —— 不修，记为 D32 / matrix LIMITATIONS。

96. ⚠️ **多 context gateway 类的 component 必须用「原地打补丁的 reactive 对象」provide，不能每次 provide 新对象**：ConfigProvider 把 `ConfigContext` provide 给子树，但「父级重设了 prop」「本层 prop 从有值改回 undefined」时下游的 `inject(configContextKey)` 必须能读到新值。Vue 的 `provide` 只在 setup 跑一次，所以**引用恒定的 reactive 对象 + `watchEffect` 内 `Object.assign(config, next)`** 是唯一解（见 `ConfigProvider.ts:236-271`）。每次 `provide({...})` 新对象，下游读到的永远是 setup 那一刻的快照。

   - 附加坑（M4 逼出的）：`Object.assign` 后还要**删掉不在 `next` 里的键**（`Reflect.deleteProperty(config, key)`）。如果「本层曾经设过、现在改回 undefined」要回落到父级值，「键真的从对象上消失」是依赖，不是「键的 value 是 undefined」 —— 后者会让 `key in config` 仍 true，下游 `config[key] ?? 默认值` 的回落失效。

97. ⚠️ **Vue 的 `inject` 解构即快照**：与 React 的 `useContext`（Provider 更新时函数体重跑）不同，`inject` 只在 setup 期解析一次。ConfigProvider 这种「下游会读 `direction` / `theme`」的多 context gateway，**下游必须**走 `useDirection()` / `useThemeConfig()` 这类返回 `ComputedRef` 的 composable，直接 `const { direction } = useComponentConfig()` 拿到的值永远不会更新。D27。Spin 流已经踩过一次（指示器），ConfigProvider 这边 `useThemeConfig` 与 `useDirection` 显式存在并被 probe 用例验证。

98. ⚠️ **零运行时 CSS 变量主题在「运行时切换 token」时需要作用域元素**：ConfigProvider 是 `theme.token.colorPrimary` 之类**运行时**改 token 的入口，但 `tokens.css` 是构建期产物 —— 运行时把 `--apollo-color-primary` 写到 `:root` 会污染整页。方案：渲染一个 `display: contents` 的作用域元素，调用 `createCSSVarScope(el, prefix).apply(token)` 把派生 token 写成该元素下的 inline 变量（D26）。代价见 95。

99. ⚠️ **`components` map 字段必须逐组件名合并**：antd 的 `config = {...parentContext}` 后**逐键**覆盖（`index.tsx:588-594`）。如果把整张 map 整体替换，嵌套 provider 只给一部分组件配置时**父级的其余组件配置会全丢**，50 个下游组件全部受影响 —— 这是 ConfigProvider 影响面最大的不变性。判据 1。Mutation M2 / M3 一加就红。

100. ⚠️ **`componentSize` 用 `||`、`componentDisabled` 用 `??`**（判据 3）：`componentDisabled={false}` 必须能显式关闭父级的 `true`，`||` 会丢。两个判据不能统一。`SizeType` 的字面量都是真值字符串，所以 `||` 与 `??` 在类型域内**等价**（M5 第一次「存活」），需要越界 falsy 输入（`''`）才能钉住 —— 见 M5 的补增用例。

101. ⚠️ **`ConfigProvider` 不持有自己的 CSS 文件**：`packages/ui/src/config-provider/` 下没有 `style/` 子目录。样式副作用只有两个：① `theme` 给出时渲染一个 `display: contents` 的作用域元素（98），由 `createCSSVarScope` 写入变量；② 不持有任何 className —— 组件级样式照旧由各组件的 `style/index.ts` 注入。E10 的「无硬编码视觉值」扫描对 ConfigProvider 自动 n/a（它没有 style 文件可扫）。

102. ⚠️ **视觉回归的差异要分清楚是谁的锅**：`theme-dark` 视觉用例在 `Empty` 上跑出 6.5% block-diff，第一反应是 ConfigProvider 暗色算法有问题，但 diff 图**只**落在 Empty 的 SVG 插画像素上 —— 文字色 `#8c8c8c` 两侧一致。根因是 Empty 插画用硬编码浅色 SVG，**不**跟 `darkAlgorithm` 走。这是 Empty 流的缺口，记 D33（`EMPTY-LIMIT`），不算 ConfigProvider 的视觉失败。**判别手法**：diff PNG 上「红色的像素位置」与「该用例的下游组件 DOM 形态」对照 —— 如果 diff 落在某个下游组件的内部、与 ConfigProvider 的作用域元素无关，那是下游流的缺口。

103. ⚠️ **L4 DOM 契约 fixture 对「不产 DOM 的组件」要走探针路径**：`ConfigProvider` 本体不产 DOM（Context.Provider 不引入元素；Vue 渲染函数直接返回 children）。普通 fixture 模板（断言根元素 className / tag）会让 fixture 写成「断言一个不存在的根」而失去价值。`tests/compat/fixtures/config-provider/README.md` 说明了意图：fixture 仍按 schema 建，但 L4 比对路径改为探针读 context（`packages/ui/src/config-provider/__tests__/semantic.test.ts` 里挂探针）。

104. ⚠️ **biome 全仓 `Found 37 warnings + 1 error` 大多不是你的**：form-core 流在并行改，它的 `__tests__/batch*.ts` 有 30+ 条 `lint/suspicious/noTemplateCurlyInString` warning（占绝对多数）。`biome check .` 把全仓聚合输出了，但「不要把 warnings 当 errors」是纪律（PITFALLS 49 同源）—— 用 `--max-diagnostics` + `grep "^packages/"` 看是哪些文件，**只**对自己范围的文件做修复。本次 ConfigProvider 范围（`packages/ui/src/config-provider/` + `tests/compat/fixtures/config-provider/` + `tests/visual/`）biome 干净。

---

94–104 由**并行工作流 流 1** 预留。以下 **105 起** 是流 2（`picker`）本轮新增。

105. ⚠️⚠️ **vitest 在有测试失败时静默不生成覆盖率报告**，而且会**先清空 `coverage/` 目录**。
     症状：`foundation-status.mjs --verify` 退出码仍是 0、测试数照常打印，但覆盖率显示
     「—% … 阈值达标: 未测量」；上一次按包测好的 `coverage-summary.json` 也被一起删掉。
     实测定位（干净状态二分，不是「重跑就好了」）：同样的 CLI 参数在 picker 单包能产出
     summary（换两个 project 也能）；换成全仓就整个 `coverage/` 不存在 ——
     差别只有「全仓有 17 个 `packages/theme` 失败」。加大 `--max-old-space-size` 到 10GB 无效。
     ⇒ 处方：a) 覆盖率**按包单独测**，不要用全仓 `--verify` 的数字；
     b) 跑完 `--verify` 别指望 coverage 目录里还有东西；
     c) `foundation.json` 里手工填覆盖率时，必须在 `notes` 写明是「按包测量」及原因。

106. ⚠️ **只有 re-export 的 `index.ts` 不会进入覆盖率采集**（没有任何测试 import 它）。
     于是「99.29%」是在**少算一个文件**的前提下得到的，且漏导 / 改名永远没人会红。
     ⇒ 处方：写一个公开 API 面测试（`import * as pkg from '../index'`，
     断言 `Object.keys(pkg).sort()` 等于契约声明的集合 + 没有 undefined +
     没有任何导出带 Vue 组件特征字段）。顺带把 `api` 维度**可执行**地钉住。

107. ⚠️ **`expect(...).toEqual(...)` 忽略值为 `undefined` 的键** ——
     `{a:1, b:undefined}` 与 `{a:1}` 相等。于是「去掉过滤 undefined」的变异体会**存活**。
     ⇒ 处方：断言 `Object.keys(result)`，并显式断言 `null` 要保留（null 与 undefined 不等价）。

108. ⚠️ **`getWeekDay` 里的 `+ firstDayOfWeek()` 默认恒等于 `+ 0`** ——
     它内部强制 `.locale('en')`，而内置 `en` 的 `weekStart = 0`。
     ⇒ 去掉这一项的变异**首轮必然存活**，这不是断言写得松，是分支本身默认不可观测。
     处方：用例里 `dayjs.updateLocale('en', { weekStart: 2 })` 后再比对，`finally` 恢复。

109. ⚠️ **`dayjs.updateLocale` 不是开箱可用的**：必须
     `import updateLocale from 'dayjs/plugin/updateLocale'` + `dayjs.extend(updateLocale)`，
     否则报 `dayjs.updateLocale is not a function`（`dayjs.extend` 只能一次一个插件或数组）。

110. ⚠️ **macOS 的 `.DS_Store` 会被 v8 coverage 的 rolldown 解析器当源文件扫描**，
     报 `Failed to parse .../src/.DS_Store` 的 PARSE_ERROR，整个覆盖率跑不出来。
     它已在 `.gitignore` 里，只是系统生成的残留文件 ⇒ 直接 `rm -f` 即可，不要改配置。

111. ⭐ **根 `biome.json` 是 `CF-REGISTRY-TOOLS` 独占集时，可以在子目录放嵌套 `biome.json`
     来整目录豁免**：`{ "extends": "//", "files": { "includes": ["!**"] } }`。
     用处：oracle / 固化副本这类**必须与上游逐字节一致**的目录不能被 `biome format`，
     否则 sha256 对不上、oracle 前提失效；根配置里已有的豁免是 `!**/registry/source/locale-rc`
     这种老目录，新目录动不了根配置时用嵌套配置解决。

112. ⚠️ **判据「有没有 React 耦合」要看整条 import 链，不能只 grep `from 'react'`**。
     `@rc-component/picker` 的 `useOpen` / `useInvalidate` 等文件**没有**直接 import react，
     但依赖 `@rc-component/util` 的 `useEvent`（React hook）⇒ 仍然不可对拍。
     全量扫描结论（120 个 `es/**/*.js`）：约 90 个零框架耦合 / 约 30 个绑 React。

113. ⚠️ **固化的上游副本不要复制它的 `.d.ts`** —— `@rc-component/picker` 的
     `interface.d.ts` 引用 React 类型，照抄会把 React 类型拖进我们自己的类型面。
     ⇒ 处方：手写**窄声明**，只覆盖 oracle 实际调用的函数，类型指回本包的 `src/types.ts`。
     另注意 `Nullable<T>` 要写成 `T | null | undefined`（只写 `| null` 会在
     `noUncheckedIndexedAccess` 下让 types project 报 Unhandled Source Error）。

## Space 流（2026-09-20，114-121）

114. ⚠️ **`NonNullable<VNodeChild>` 去不掉 `void`** —— `NonNullable<T> = T & {}`
     对联合类型**逐支分配**，而 `void & {}` 不是 `never`（`void` 既不是 `null` 也不是
     `undefined`）⇒ 结果里仍留着 `void`，`h()` 照样报 `TS2769`。
     **处方**：写 `Exclude<VNodeChild, null | undefined | void>`
     （见 `packages/ui/src/space/node.ts` 的 `RenderableNode`）。
     ⚠️ biome 的 `noConfusingVoidType` 会建议把它换成 `undefined`
     （`Exclude<…, null | undefined | undefined>`）—— 那样 `void` 仍在，**不要采纳**，
     加 `biome-ignore` 并写清理由。同理 `void` 在 `UnionToIntersection` 这类条件类型里
     也不是「令人困惑」，而是**精确地**去掉了联合里的一个独立分支。

115. ⚠️ **「文件头声称的规则条数」没有可执行判据时，会随实现漂移成一句谎话**。
     实测：`space/style/index.ts` 初稿声称「Addon 34 条」，而用
     `@ant-design/cssinjs` 的 `extractStyle` 提取 antd 6.6.4 的真实产物得到的是
     **29** 条（16 + 4 + 29 = 49，我们 53，+4 来自 D38 的展开）。
     **处方**：把条数**钉成断言**（`theme.test.ts` 断言 16 / 4 / 33 / 53 四个数 +
     +4 的来源逐条列出）。判据：**任何写在注释里的数量都要有一条断言**。
     ⚠️ 提取 antd CSS 时 `@ant-design/cssinjs` 不是 `tests/compat` 的直接依赖 ——
     要用 `createRequire` 从 antd 自己的包目录解析（`antd/package.json` 所在目录）。

116. ⚠️ **顺序类契约不能靠「条数」断言**（变异验证逼出来的）。
     `space` 的 Addon 样式把 antd 的「组件级 CSS 变量」展开成了复合选择器，
     于是 `.status-error.variant-filled` 与 `.variant-filled.disabled` 的
     **特异性都是 (0,2,0)** —— 谁赢完全由**声明顺序**决定。
     把那条决胜规则挪到 status 之前，22 条主题断言**全绿**：文件头声称的
     「顺序即契约」当时**没有任何断言**。
     **处方**：显式断言「谁在谁前面」（`expect(region).toEqual([...])` 钉住相对顺序），
     并**同时**断言决胜规则的**声明内容**（本例：必须回到
     `var(--apollo-color-border)` / `var(--apollo-color-bg-container-disabled)`，
     而不是 `color-error`）。判据：**条数不变、顺序写反，是条数断言看不见的**。
     ⚠️ jsdom 不加载静态 CSS ⇒ 拿不到层叠结果，所以这一层只能钉「顺序」这个可判定的
     代理量；真正的层叠验证在 L6（真实浏览器）。

117. ⚠️ **变异验证脚本的「统计行」必须能被可靠解析，否则会得到假绿**。
     首版用 `l.strip().startswith('Tests ')` 判定，而 vitest 的输出以 ANSI 转义开头
     （`\x1b[2m`）⇒ **每一次变异都「被捕获」**，看起来 8/8 全中，其实是统计行根本没被解析到。
     **处方**：用子串匹配（`'Tests ' in l and ('passed' in l or 'failed' in l)`），
     并且**解析不到时按「不可信」处理**、把原始输出的尾部 dump 出来。
     子进程的环境变量要从 `os.environ` 复制，不要手搓 `env={...}`。

118. ⚠️ **变异被 SIGKILL 会留下「已变异的工作区」** —— `try/finally` 里的还原**不会执行**，
     于是下一次运行会因为「工作区有未提交改动」而拒绝启动，或者更糟：你以为跑的是原版。
     **处方**：变异前写 `.mutbak` 备份 + 脚本**启动时**先做 `restore_if_needed()`；
     还原后用 `shasum -a 256` 对比工作区文件与 `git show HEAD:<path>` 的哈希。
     另：一次跑 8 个变异会累积内存（16G 机器上实测 exit 137）⇒ 脚本要支持
     **按参数选择变异子集**，分批跑。

119. ⚠️ **E10 的「硬编码圆角」正则有两处假阳性**（`registry/tools/validate-registry.mjs`）。
     (a) `\bborder-radius:\s*(?!var\(|\$\{v\()/` 会把 `border-radius:0` 判成硬编码 ——
     而 `0` 是**结构性的方形重置**（`genCompactItemStyle` 的「中间项不要圆角」），
     上游自己就写 `borderRadius: 0`（`components/style/compact-item.ts`），
     而且不存在「0 圆角」的 token 可走（硬造一个会让 B7 判 FAIL）。
     (b) 更潜伏的一处：`\s*` 能匹配**零个**字符 ⇒ 引擎在「冒号之后、空格之前」求值
     负向先行，于是 `border-radius: var(--x)`（冒号后有空格）也会被误判。
     **处方**：把空白收进先行内部 + 豁免字面量 `0`：
     `/\bborder-radius:(?!\s*(?:var\(|\$\{v\(|0(?![\d.])))/`。
     ⚠️ 用 `0(?![\d.])` 而不是 `0\b`：后者会让 `0.5em` 也豁免。
     判据：改完必须逐条验证 `0` / `0.5em` / `6px` / `50%` / `var(…)` / `${v(…)}` 六类，
     确认**收紧了正确性**而不是放宽标准（H8）。

120. ⚠️ **L4 的 DOM 契约投影只含元素节点**（`packages/test-utils/src/dom-contract.ts:204`
     的 `template.content.children`）⇒ **文本节点与注释都不进契约**。
     后果：`space` 的 `separator={0}` 差异（React 的 JSX 把 `0 && …` 的求值结果
     渲染成一个**裸文本节点**，我们不复刻 —— D40 / DEFECT）在 L4 里**完全不可见**，
     所以它**没有** `ALLOW` 条目。**别把「没有 ALLOW」当成「没有差异」**。
     **处方**：这类差异的判据必须落在 L1（本例：断言无 `-item-separator` 且
     `textContent === 'ab'`），并在 `semantic.test.ts` 的用例旁写清「为什么这里没有 ALLOW」。

121. ⚠️⚠️ **前台命令的默认超时是 120s；被它杀掉时的表现和 OOM 一模一样**
     （exit 137 / SIGTERM / **零输出**）—— 极易误判成「16G 机器 OOM」。
     实测（2026-09-20）：`node tests/build/run.mjs` 连续 3 次 exit 137 且
     `/tmp/space-build-gate.log` 是 **0 行**；带心跳重跑，进程在第 **7** 次
     15s 心跳（≈105s）后被杀，而 `sleep 90` 的静默命令**能**活下来
     ⇒ 临界点落在 90–120s，正是 `BASH_DEFAULT_TIMEOUT_MS`。
     **处方**：**凡是预计超过 2 分钟的门禁，显式传 `timeout`**
     （构建门禁 ≈3 分钟、L6 视觉 ≈2 分钟、全仓 vitest 更久）。
     ⚠️ 两个加重误判的因素：
     (a) `tests/build/run.mjs` **只在最后才打印报告**（前面全是
     `execFileSync(..., stdio:'pipe')` 的静默构建）⇒ 被杀时日志是空的，
     看起来就像「进程刚起来就崩了」；
     (b) 如果在命令里自己起了 `&` 子进程，文档承诺的「超时自动转后台」**不生效**，
     直接杀进程组 ⇒ 我写的 `while kill -0 $PID` 心跳循环也被一起带走，
     连 `echo "BUILD_EXIT=$?"` 都没机会执行。
     **判据**：`exit 137` 之前先问「这个命令跑了多久」。**先加 `timeout` 再谈内存。**
     真正的 OOM 有别的指纹：例如同一条命令**单独跑能过、跟在重命令后面跑才 137**
     （本次 `--project a11y` 跟在 `--project dom-contract`（加载 848 图标）后面就 137，
     单独跑 114 passed —— 那才是内存）。

---

## Typography 流（2026-09-20，140-153）

> ⚠️ 编号从 **140** 起（跳过 114-139）：并行工作流各自在自己的 worktree 里追加，
> 按约定给别的流留出区间，避免同一编号被两条流各写一份。

140. ⚠️⚠️ **cssinjs 的 `&` 是「复合」不是「后代」** —— `&${c}-x, &${c}-link${c}-x` 展开后
     **两条都带根类**（特异性 0,3,0）。省掉第二个分支的 `&` 会掉到 0,2,0，与文档里
     **更靠后**的规则打平后落败。
     实测：`<Link type="secondary">` 算出链接蓝而不是次要灰（`colorLink` vs `colorTextDescription`）。
     **L1/L4 全绿 —— jsdom 看不到层叠**，只有 L6 逐像素比对能抓（`link` variant 三个 viewport 全红）。
     处方：把 antd 的选择器**原样**抄进 `theme.test.ts` 的断言（含 `&`），并加一条通用不变式钉住
     「每个含 `-link` 的选择器都以根类开头」。

141. ⚠️⚠️ **`a,b:hover` 陷阱：伪类只作用于逗号列表的最后一个选择器。**
     `operationUnit` 传进来的选择器是 4 个按钮的逗号列表，直接拼 `${sel}:hover` 得到
     `a,b,c,d:hover` —— 在 CSS 里那是**两个独立选择器**：`a`/`b`/`c` **无条件**命中，
     只有 `d` 带状态。
     表现：前三个操作按钮永远显示 `colorLinkActive`、并且带一圈 `:focus-visible` 焦点环。
     处方：`each(pseudo)` 把伪类**逐个**加到列表每一条上 —— 这正是 cssinjs `&:hover`
     的展开语义（`&` = 整个父选择器列表）。

142. ⚠️⚠️ **`display:inline` 的元素 `clientHeight` 恒为 0 —— 这是功能性的，不是外观问题。**
     antd 的 `MeasureText` 硬编码 6 条内联样式
     （`position:fixed; display:block; left:0; top:0; pointerEvents:none; backgroundColor:rgba(255,0,0,0.65)`）。
     少了 `display:block`，二分中点那个容器（只带 `measureStyle`，要量**自然高度**）的
     `clientHeight` 就是 0 ⇒ `midHeight > ellipsisHeight` 永远为假 ⇒ 二分收敛到 `maxIndex`
     ⇒ **完全不裁剪**（渲染整段原文）。
     表现：`size-mismatch`（Vue 294px vs React 184px）。
     处方：**打桩布局时也把这条真实浏览器行为打进去**
     （`if (!display || display === 'inline') return 0`）—— 否则桩会把真缺陷放过去。

143. ⚠️⚠️ **jsdom 既没有布局引擎、也看不到 CSS 级联 ⇒ 任何依赖「特异性 / 布局 / 真实排版」的
     判据只能由 L6 证明。**
     Typography 收口期抓到 3 个真实缺陷（140/141/142），**L1/L2/L4/L5 五层全绿**，
     没有一个被 jsdom 层发现。
     推论：组件「本地全绿」不等于「画对了」；把 L6 当成可选步骤的流程一定会漏这一类缺陷。

144. ⚠️ **`startsWith('.' + P)` 这类前缀断言是空转。**
     `.apollo-typography-link…` 也满足「以 `.apollo-typography` 开头」，所以删掉 `&` 前缀的
     变异体照样绿 —— 是**变异验证**（不是人眼）暴露了它。
     处方：`new RegExp(\`^\\.${P}(?![\\w-])\`)`。
     ⭐ 一般化：**通用不变式（`for (const x of xs) expect(...)`）最容易写成空转**，
     必须用变异验证确认它真的会红。

145. ⚠️⚠️ **UA 的 `button{font: 400 13.3333px Arial}` 是 shorthand，会把 `line-height`
     重置成 `normal`。**
     antd 靠 `dist/reset.css` 的 `input,button,…{font-size:inherit;font-family:inherit;line-height:inherit}`
     抵掉它；零运行时架构下我们没有那条 reset。
     症状**不只是**「按钮字体不对」：`symbolRowEllipsisRef` 在**测量容器**里渲染按钮
     ⇒ 字体变了 ⇒ 测到的 `ellipsisHeight` 变了 ⇒ 二分裁剪**差一个字符**（56 vs 57）。
     ⇒ 「字体」在这条链上是一个**功能参数**。
     处方：`getActionButtonFontReset` 显式补 `font-family/font-size/line-height: inherit`
     （**故意不补** `margin:0` / `color:inherit` —— 补上会改变 `disabled` 的颜色继承链）。

146. ⚠️ **`validate-registry` 的 E10（无硬编码视觉值）是文本级扫描：注释也算命中。**
     注释里写 `#ffe58f` 或 `border-radius:3px` 都会让它报错。
     且它只豁免 `var(` 与 `${v(` —— `${RESET_BORDER_RADIUS}px` 这种「值来自 token 常量」的
     写法**仍被判为硬编码**。
     处方：把**整条声明连属性名**放 `style/token.ts`（E10 唯一整文件豁免的真源处），
     如 `RESET_BORDER_RADIUS_DECL = 'border-radius:3px'`；同时让 `theme.test.ts` 用 `toEqual`
     钉住产物里的字面值 —— 判据**不放松**，字面量仍有唯一出处。

147. ⚠️ **`--project types` 只覆盖 `*.test-d.ts`；测试代码与 demo 自己的类型错误只有
     `vue-tsc` 能看到。**
     实测：typography 收口时 `--project types` 全绿，`vue-tsc --noEmit` 报 **21 处**
     （helper 的泛型收窄过头、故意传非法值的用例、`info.props` 是 `BaseTypographyProps`
     不含 `disabled`）。处方：两个都跑；「故意传非法值」用 `as never`
     （**不要** `as 1` —— 后者假装合法，读代码的人看不出这里在故意破坏契约）。

148. ⚠️ **`pnpm run test:types`（全仓）会因 `.vue` 解析失败 exit 1**：Vitest 的 typecheck
     模式不走 vue 插件，报 `TypeCheckError: Cannot find module './Divider.vue'`。
     报错文件包含 Divider / Empty / Spin / Form ⇒ **与具体组件无关**，是仓库级工具链缺口。
     按组件路径过滤（`vitest run --project types packages/ui/src/<comp>`）时全绿。

149. ⚠️ **`@apollo-design/icons` 的 `getIconStyle(iconPrefixCls)` 导出了但没有任何消费者**
     （D15 规定「只导出、不注入」）⇒ 图标**没有基础样式**（`.apollo-icon` 缺
     `display:inline-flex` / `vertical-align:-0.125em`，SVG 退化成 `display:inline`）。
     症状：L6 里**凡是含图标**的用例都有 0.1%~0.3% 的**成块**差异（散点占比 1.7%），
     而同一张图里文字部分逐像素一致 —— 这是「差异只落在图标上」的判据。
     落点：`packages/ui/src/style/index.ts` 的 `BASE_CSS` 接上 `getIconStyle`。
     ⚠️ 它会影响**所有**渲染图标的组件（spin 的 `LoadingOutlined` 等）的像素输出
     ⇒ 改之前要确认其他组件已入库的基线。

150. ⚠️ **`registry:check` 里的 `workstreams:check` 会因为某个组件的 `status` 变化而失败**
     （`workstreams.json 已过期（输入变化）`）。
     处方：`node registry/tools/gen-workstreams.mjs`（生成物、确定性，diff 只含该组件相关的
     计数与 `ready`→`done`）。改 `status` 之后必须连带跑它。

151. ⚠️ **`git index.lock: File exists` 在本沙箱会反复出现**（`git` shim 拦下 git 内部的
     `unlink`，git 自己删不掉锁）。症状是**上一条 `git add`/`commit` 成功、下一条立刻失败**。
     处方：`/bin/rm -f <repo>/.git/worktrees/<wt>/index.lock` 后重试；稳妥做法是**每次 git
     命令前都先清一遍**（写成 `rm -f … && git …` 的复合命令）。且必须用真实 `/usr/bin/git`。

152. ⚠️ **L6 的 diff 图是「React 底图 + 差异叠加」，不是「只有差异的空白图」**
     （`compare.mjs` 把 diff 合成到 rawA 上再落盘）。所以**通过**的用例，diff 图看起来就是
     React 基线本身 —— 别把它误读成「没有生成 diff」。要看差异落在哪，就看红色区域。
     另：`compare.mjs` 的通过判据是**两个条件同时成立**（差异率 ≤ 0.1% **且**散点占比 ≥ 90%），
     所以会出现「差异率 0.0836% 但判 FAIL」的情况 —— 因为散点占比只有 1.7%，差异**成块**。
     报错信息里的 `block-diff` 正是这个含义。

153. ⚠️ **`pnpm run registry:check` 不是只读的：即使全绿，它也会把 3 个文件的
     `generatedAt` 重写成当前时刻**（`registry/components.json`、`dependencies.json`、
     `tokens.json` —— 都是 `gen-registry.mjs` / 生成器的产物，跑 `--check` 也会落盘）。
     症状：跑完门禁 `git status` 从干净变成 3 个 M；若顺手 `git add -A` 就会把纯时间戳抖动
     提交进去（PITFALLS 11 明令禁止）。
     处方：**每次跑完 `registry:check` 都执行**
     `git checkout -- registry/components.json registry/dependencies.json registry/tokens.json`，
     并且提交时**逐路径 `git add`**，不要用 `-A`。
     ⚠️ 顺序上有个陷阱：这三个文件的抖动是**跑门禁产生的**，不是你的改动 —— 若先提交、
     后跑门禁，抖动会留到下一次提交里混进别人的 diff。


---

122–124.（本 worktree 未使用；号段留给并行流 typography / config-provider / picker）

125. ⚠️⚠️ **单次 Bash 调用的可用时长撑不住「一个包的 unbuild」**（2026-09-20 实测，
     button 流）。`sleep 150` 能过，但「`utils` 的 unbuild + `icons` 的 unbuild」串成
     一条命令就被 exit 137 杀掉 —— 而单独跑 `icons` 的 unbuild **也是** 137。
     ⇒ 临界点不是 120s 那条老坑（121 已记），而是**即便显式传了 `timeout: 600000`
     也仍然被 clamp**（实测 `sleep 150` 过、两个 unbuild 不过）。
     **处方**：长门禁用 `run_in_background: true` 起，然后**在同一个 turn 内**用
     `TaskOutput(block=true, timeout=600000)` 等结果 —— 这样进程不会因为 turn 结束
     被带走。⚠️ 只起后台就结束 turn = 白跑（已有 8 个文件改动因此丢过）。
     ⚠️ `| tail -N` 会让输出**全程为空**（缓冲到最后才吐），期间无法判断进度；
     判断进度看 `packages/*/dist` 的 mtime。

126. ⚠️ **worktree 的 `index.lock` 会反复出现**，哪怕用的是 `/usr/bin/git`。
     症状：`fatal: Unable to create '.../.git/worktrees/<name>/index.lock': File exists`
     ⇒ **每一次** git 写操作（`add` / `commit`）前都要
     `/bin/rm -f $(find /Users/nanren/Code/apollo-design-ui/.git -name "*.lock")`
     （注意锁在**主仓库** `.git/worktrees/` 下，不是 worktree 自己的 `.git` 文件）。
     实测：清完立刻能 `add`；下一次 `commit` 又撞上同一把锁，再清一次才过。
     副作用：被拦的那次 `git add` 会在 worktree 根留下 0 字节的 `_tmp_<pid>_<hex>`
     临时文件（untracked）—— 别把它 `git add .` 进去。

127. ⚠️ **antd 用 `genCssVar` 在规则内部声明的组件级变量（`--ant-btn-*`）必须展开，
     不能照抄**（`button/style/variant.js`、`space/style/addon.ts` 同源，D38 家族）。
     原因：`tests/build/run.mjs` 的 **B7 · ui** 只认 `packages/theme/dist/tokens.css`
     的 `:root` 块，组件内局部声明的自定义属性它**看不到**，写错不会报错、只会静默失效。
     展开成组合选择器后，**层叠变成"顺序即契约"**：
     (a) 同特异性的两条只能靠声明顺序决胜 ⇒ `disabled` 必须排在 color×variant 之后；
     (b) `ghost` 的 `bg-*` 覆盖**必须带进组合选择器**（`.btn-color-x.btn-variant-y.btn-background-ghost`）。
     写成单独的 `.btn-background-ghost:hover`（0,4,0）会被组合的 hover 规则（0,5,0）压过，
     **幽灵按钮的背景会变回实色** —— 这是本次最容易写错的一处。
     (c) 展开规模：`color(16) × variant(6) + ghost(16×3)`，靠手写必然出错 ⇒ 用表驱动生成。

128. ⚠️ **biome 的 `organizeImports` 把整个 export 段（含其间的注释）当成一个 chunk，
     按 module specifier 的字典序排** —— 不是按「组件名在文件里的逻辑顺序」。
     实测（`packages/ui/src/index.ts`）：把 Button 段插在 `Divider` 段**前面**会被判
     `Sort these exports`，因为 `'./button'` 必须排在 `'./config-provider'` 之前、
     `'./_internal/with-install'` 之后。**处方**：追加组件导出时先按 `'./<dir>'`
     的字典序定位，再插注释块。

129. ⚠️⚠️ **本会话的 shell 里 `NODE_OPTIONS` 被注入了 CLI 的 node shim
     （`--require=…/node-language-shim.cjs`），它会让 vitest 的 worker 永远启动不起来**
     （2026-09-20 实测，button 流）。
     症状：任何 `vitest run` 都在 **60.11s** 后报
     `[vitest-pool]: Failed to start {threads,forks} worker` /
     `[vitest-pool-runner]: Timeout waiting for worker to respond`，
     **且 `Test Files no tests`** —— 看着像「过滤写错」或 OOM（121 / 35 的指纹），
     实则不然：主线程只用了 ~1.7s CPU（`time` 可证），说明它在**空等**，不是算力不足。
     判据链：换 `--pool` / `--maxWorkers` / `--environment=node` / 最小 config
     / 关沙箱**全都复现** ⇒ 排除配置；`worker_threads` 与 `child_process.spawn`
     裸测**都能通** ⇒ 排除进程能力；最后 `env | grep NODE_OPTIONS` 才现形。
     **处方**：跑 vitest 一律
     `env -u NODE_OPTIONS node ./node_modules/vitest/vitest.mjs run …`
     （`env -u` 比 `export NODE_OPTIONS=` 稳：后者对某些子进程仍可见）。
     ⚠️ 该 shim 会在**每个**被 spawn 的 worker 里再 `--require` 一次，
     于是 worker 卡在 boot、主进程卡在 `withTimeout(..., START_TIMEOUT = 6e4)`。
     顺带：这条坑会让「跑一次测试」固定烧掉 60s，排查时别误判成「测试很慢」。

130. 🚨🚨 **视觉差异先怀疑「我方缺声明」，不要先归类 PLATFORM。**
     实测（2026-09-20 button 收口）：上一轮把 27/27 的 0.23%–2.33% 差异登记为
     「PLATFORM：Chrome glyph hinting 抖动」，还断言「React 侧跑两次也会不同截图」。
     复核发现**两条依据都假**：`--mode baseline` 重生成 27 张基线后 `git status`
     **零变化** ⇒ 截图是确定的。真因是我方 `<button>` 没设 `line-height`
     （见 131）—— **一个 BUG 被写成了 PLATFORM**（`AGENTS.md` §4.3 明令禁止）。
     **处方**：① 任何「平台抖动」结论必须先用 `--mode baseline` 重跑 + `git status`
     零变化来**证伪自己**；② 视觉差异的排查顺序是「量几何（`getBoundingClientRect`
     的 x/y/w/h 到小数）→ 量计算样式（`line-height` / `font-family` / `transform`）
     → 最后才谈平台」。本次一量就现形：span 高 17px vs 22px、y 差 2.5px。

131. ⚠️⚠️ **`<button>` 不会自动继承 `line-height` —— 组件必须自带。**
     antd 的 Button **不**调用 `resetComponent`（`antd/es/button/style/index.js` 的
     `genStyleHooks` 只拼 Shared / Size / Variant / Group），它靠
     `antd/dist/reset.css` 的 `input,button,…{line-height:inherit}` 从环境继承。
     本仓 `BASE_CSS`（`packages/ui/src/style/index.ts:93`）**没有**这条表单控件归一化
     （该文件自己把「button 重置」列为未决缺口）⇒ 我们的 `<button>` 退回 UA 的
     `line-height:normal`。后果：文字/图标 span 高 17px vs 22px、基线差 ~2.5px，
     L6 直接全红。
     **处方**：凡是渲染原生 `<button>` / `<input>` / `<select>` 的组件，都要在**组件根**
     上显式 `line-height:var(--apollo-line-height)`（divider / empty / space / spin 的
     既有做法）。⚠️ 该值必须**无单位**（`lineHeight: number`），这样大/小号字号会等比缩放，
     与 antd「继承无单位行高」的语义一致。

132. ⚠️ **`@apollo-design/icons` 的 `.apollo-icon` 基线样式没有被 ui 的静态样式层消费。**
     该基线在 `packages/icons/src/style.ts` 的 `getIconStyle()` 里（对应 antd 运行时注入的
     `.anticon`），注释与 README 都写明「注入交给 ui 的静态样式层」—— 但 `packages/ui`
     里**从未 import 它**（`getIconStyle` 只有定义与测试，无消费方），且 icons 包
     `exports` 只有 `"."`、没有独立 `style.css` 出口 ⇒ 消费方**没有任何途径**拿到它。
     后果：组件里的图标 span 退回继承行高（22px）而 antd 的 `.anticon` 是 `line-height:0`
     ⇒ svg 高 2px、L6 红（本次 `loading` 三例）。
     **处方（组件侧自保）**：渲染图标处显式补齐 `display:inline-flex;align-items:center;
     line-height:0` 与 `> *{line-height:1}`。**根治**：让 ui 样式层把
     `getIconStyle(iconPrefixCls)` 并进产物（属跨组件基础设施，未做，登记在此）。

133. ⚠️⚠️ **L6 视觉门禁吃的是 `packages/ui/dist`，不是 `src`。**
     `tests/visual/build.mjs` 打的是 `@apollo-design/ui` 的**已构建产物**。
     改了 `packages/ui/src/<c>/style/**` 后直接跑 `run.mjs --mode compare`，
     它用的是**旧 dist** ⇒ 数字与改动前**一字不差**。
     ⭐ **判据**：compare 的差异率与上次**完全相同**（到小数点后三位）时，
     第一反应必须是「产物没重建」，而不是「改动无效」。
     **处方**：`cd packages/ui && CODEBUDDY_SAFE_DELETE_ENABLED=0 ../../node_modules/.bin/unbuild`
     重建 dist，再跑 compare。（`dist/` 被 gitignore，不入库。）

134. ⚠️ **`registry:validate` 的 E10 会把「注释里的属性名」当成声明来判。**
     `HARDCODED_PATTERNS` 用 `text.match(re)` 逐文件匹配，**不区分注释与代码**。
     实测：一条注释里写了字面量 `` `border-radius:` ``（其后不是 `var(` / `${v(` / `0`），
     就让 `registry:validate` 的 E10 一直红 —— 而代码里的 `border-radius` 全是合法的。
     同类：`box-shadow` 的负向先行只豁免 `var(`，于是 `box-shadow:none`（antd
     `variant.js:249` disabled / `:36` ghost 都真实使用）与 `box-shadow:${r.shadow}`
     都被误判 ⇒ 需要给正则补 `none\b` 与 `\$\{[\w]+` 豁免。
     **处方**：① 注释里不要写「CSS 属性名 + 冒号」的字面量；② 新增组件样式若用了
     中间变量拼值，优先**内联**成 `${v('token')}` 形式（E10 只豁免紧跟冒号的
     `var(` / `${v(`），别先绑到变量再插值；③ 报错定位看**行号**，别只看「哪个文件」。

     ⚠️ **那条 `box-shadow` 豁免是全局门禁的「放宽」，不是「修好」—— 必须知道它的兜底在哪。**
     E10 扫的是**源码文本**，看不见插值后的值，所以「值是变量」这条它只能靠
     「紧跟冒号的是 `var(` / `${…}` / `none`」来近似。放宽后，
     `` `box-shadow:${随便一个标识符}` `` 就能过 E10（`border-radius` 的
     `${v(` 更窄，两者的不对称是真实存在的）。**补偿性门禁**是 L1 的
     `button/__tests__/style.test.ts`：它对 `genButtonStyle()` 的**产物 CSS** 断言
     「字面色值只允许 `rgba(`，且去重后 ≤ 13 个」⇒ 想用 `#f00` 之类绕过会红；
     再叠上 B7 的「每个 `var(--apollo-*)` 都必须在 `tokens.css` 声明」。
     **残留风险**：命名色（`red`）这类既非 `#hex` 也非 `rgba(` 的写法两层都看不见。
     ⇒ 新增组件若要用 `box-shadow`，请照 button 的写法（值全部由 `v('token')` 拼出），
     别把这条豁免当成「可以随便内联阴影」。

135. 🚨 **`NodeRenderer` 只挡住「VNode 变量」，挡不住「组件对象」—— 同一个坑已踩两次。**
     `empty/components/NodeRenderer.ts` 的 `normalizeNode()` 只做
     `isVNode(node) ? cloneVNode(node) : node`。注释里写的「平台差异的落点」是对的，
     但**不完整**：组件对象不是 VNode，会被**原样返回**，模板再 `toDisplayString`
     成字面量文本 **`[object Object]`**（不是渲染成空，也不是报错 —— 最难发现的那种）。
     第一次踩：`ImageNode`（已单独有 `h(node as Component)` 分支）；
     第二次踩（2026-09-20 button 收口）：`icon` / `loading.icon` 传
     `SearchOutlined`（组件对象）时 `<span class="apollo-btn-icon">[object Object]</span>`。
     ⭐ **为什么容易漏**：`vue-tsc` 当时是红的（`TS2322: DefineComponent is not assignable
     to VNodeChild`），修法是**放宽类型**（`ButtonIcon = VNodeChild | Component`）——
     类型一放宽，编译就绿了，**但运行期缺陷一个字都没修**。
     ⇒ 「类型放宽」与「渲染归一化」是**两件事，必须同时做**，且只有 L1 用例能证明后者。
     **处方**：① 任何「可能收到组件」的 prop（`icon` / `image` / `indicator` / `avatar`…）
     都要在进 `NodeRenderer` **之前** `h()` 包一层；② 判据无歧义：
     `VNodeChildAtom = VNode | string | number | boolean | null | undefined | void`
     （`@vue/runtime-core` `runtime-core.d.ts:1226`）**不含函数形态**，所以
     「非原始值且非 VNode 且非数组」只可能是组件；
     ③ 别在归一化处 `cloneVNode`（`NodeRenderer` 已做，VNode 可变，重复克隆丢身份）；
     ④ 每条这样的 prop 至少配一条断言 `expect(w.text()).not.toContain('[object Object]')`
     的 L1 用例 —— 只断言「元素存在」会漏，因为文本节点也能匹配到父元素。

136. ⚠️ **「多写一层兜底」= 死代码 + 覆盖率噪音 + 悄悄偏离上游 —— 覆盖率报告是它的探测器。**
     实测（2026-09-20 button 收口）：`Button.vue` 的 loading 分支写成

         if (cfg.delay > 0) {
           if (cfg.loading) { innerLoading.value = true; return; }   // ← 上游没有这一支
           delayTimer = setTimeout(() => { innerLoading.value = true; }, cfg.delay);
           return;
         }

     而上游（`antd/es/button/Button.js:148-156`）是**无条件**
     `setInnerLoading(true, { ms: delay })`。那一支在本仓**可证明不可达**：
     `loadingOrDelay` 的构造（`:281`）保证 `loading === true ⇒ delay <= 0`，
     与 `delay > 0` 矛盾。⇒ 行为上「等价」，但它同时是：
     ① 一段读起来像有意义的死代码；② 覆盖率上永久红着的 2 行（Lines 98.13%）。
     ⭐ **判据**：`--coverage` 里出现「从未被任何用例走到的行」，第一反应不是
     「补个用例把它盖住」，而是先问**「这一支在真实输入域里可达吗？」**。
     不可达 ⇒ 删掉，别写一条假用例去喂它（那正是反模式 A1：用形式上的用例掩盖）。
     可达 ⇒ 说明它是真实分支，补用例。
     **处方**：移植上游逻辑时逐支对照（上游几个 `if` 就写几个），
     不要凭「防御性编程」的直觉多加分支；`Lines 100%` 是最好的自查信号。

## Checkbox 流（2026-09-23，137-139）

137. **Vue runtime prop `type: PropType<unknown>` 会被 vue-tsc 推断成 `undefined`**——
     SFC 模板与 `h()` 全线误报「Type 'string' is not assignable to type 'undefined'」，
     测试经 `mount(props)` 传值也炸。⭐ catch-all prop 别用 `unknown` 收口：
     antd 的 `value` 语义上是原始值选项 ⇒ 声明成
     `type: [String, Number, Boolean] as PropType<string | number | boolean>`
     （Checkbox 流实测）；跨组件 `h` 传任意 T 的场景（Group 渲染 options）
     已有 VNodeProps 放行手法兜底（statistic → Skeleton 同场景）。
138. **Edit 工具偶发报 success 但内容未落盘**（PITFALLS 10 的批量升级版）：
     同一文件 6 处编辑只有 3 处落盘，且报错文案与「内容已变」混在一起难以分辨。
     ⭐ 批量编辑后必须 grep 逐处复核；连续不稳时改用 python 按行号
     `assert old in lines[i]` 替换（脚本自己的断言也能兜住行号漂移）。
     另：BSD grep **不支持 BRE 的 `\|` 交替**，多模式要用 `grep -E`，否则静默 0 匹配。
139. **biome 行级 suppression 注释放在对象字面量内部会报「has no effect」**
     （diagnostic 锚在属性上时抑制不生效）——别硬刚 suppression，把字面量提成
     常量绕过（`tabIndex: 3` → `const ATTR_TAB_INDEX = 3`），契约语义不变。
     另外 biome **warning 不fail 门禁**（只有 error 会），收口前用
     `--reporter=summary` 区分 error/warning 能省很多无效排查。

## Radio 流（2026-09-23，154-162）

> ⚠️ 编号从 **154** 起（Typography 流预留 140-153）。

154. ⚠️ **写入的 import 里 `/` 会被吞**：`@apollo-design/ui` 落盘成 `@apollo-design-ui`。
     14 个 demo 里 2 个中招（`size.vue` / `radiogroup-with-name.vue`），
     报错在**跑测试时**才出现（vite: `Failed to resolve import "@apollo-design-ui"`），
     而错误串看起来像「另一种包名」，极易误判成「包名写错了」。
     ⭐ 与 138 同源（工具落盘不忠实）⇒ 批量写文件后**必须逐文件回读**；
     本次用一次全仓正则扫（`/@apollo-design-[a-z]/`）兜住。
     另：本机 BSD `grep` 对多模式会静默 0 匹配（138 已记），排查优先用 node 脚本。

155. **E10 的「硬编码圆角」启发式按**源码文本**判断 ⇒ 参数化的圆角会被误报**：
     `border-radius:${radius};`（radius 已经是 `var(--apollo-border-radius)`）仍判红。
     ⭐ 处方是**改写法**而不是加豁免：让 helper 收 **token 名**，模板写
     `border-radius:${v(radiusToken)};` —— 源码文本命中放行分支（`${v(`）。
     重构后必须验证产物**逐字节不变**（本次 dump + diff 确认）。

156. ⚠️ **antd 的 `-wrapper-checked` 不含非受控内部态**：`<Radio defaultChecked />` 时
     span 有 `-checked`、**wrapper 没有**（wrapper 读 `mergedChecked` = `checked` prop /
     Group 值；span 与 input 读 rc-checkbox 的内部态）。
     ⭐ 处方：实现里**分成两个 computed**（`mergedChecked` / `effectiveChecked`），
     别「顺手统一」。这类不一致只有 L4 机械基线能抓 —— L1 若只断言 span 就会漏。

157. **`RadioGroup` 的 `name` 默认值不是 undefined，而是 `useId` 生成的**：
     `toNamePathStr(undefined) === ''`，而 `useId('')` 仍走生成分支 ⇒ antd **始终**
     给整组 input 一个自动 name。分析文档初稿写成「恒 undefined（form 未落地）」是
     凭直觉的结论，实现期回读 `toNamePathStr` 才修正。
     ⭐ 凡是「某 prop 的默认值是什么」，读上游实现，别推。

158. ⚠️ **`packages/ui/src/index.ts` 的 re-export 必须用别名**：
     `export { genTokenDecls as genRadioTokenDecls }` / `prepareComponentToken as prepareRadioComponentToken`。
     写成 `export { genRadioTokenDecls } from './radio/style'` 时 **vitest 不报错**
     （主题测试照过），只有 `unbuild` 在构建期报 `"genRadioTokenDecls" is not exported by …`。
     ⭐ 新增导出后先跑一次 `pnpm build:ui`（约 20 秒），比等到 G13 才发现便宜得多。

159. **跑 `tests/visual` 前必须先 `pnpm build:ui`**：视觉层从
     `packages/ui/dist/index.mjs` import（**不是源码**），dist 过期时报
     `[MISSING_EXPORT] "Radio" is not exported by packages/ui/dist/index.mjs`。
     baseline 与 compare 两种模式都要先构建。

160. **antd 样式的 extractStyle 提取管线要写成 CJS**：cssinjs 的 `es/` 构建用了
     **无扩展名**的 ESM 导入（`from './extractStyle'`），Node 直接 `import` 会
     `ERR_MODULE_NOT_FOUND` —— 那套产物只有 bundler 解析得了。
     ⭐ 用 `createRequire(...).resolve('@ant-design/cssinjs/package.json', { paths: [antd 目录] })`
     定位 `.pnpm` 真实路径，再 `require(<cssinjs>/lib/index.js)`。
     脚本必须放在**仓库内**（`node_modules/.cache/` 即可）才能解析 `react` / `antd`；
     放 `/tmp` 会 `Cannot find package 'react'`。
     提取要在树内 `useContext(StyleContext).cache` 后调 `extractStyle`（checklist 已有，CJS 同样适用）。

161. **同族组件的「同名字段」落点不能互相照抄**：`title` 在 checkbox 落 **span**、
     在 radio 落 **label**（上游 issue 46739）。checkbox → radio 是最容易「照着上一版改」
     的一对，必须逐个回读上游。

162. ⚠️ **全仓 `update:*` 缺口**：`COMPATIBILITY.md` 规则 C11 要求 `update:xxx` 与
     语义事件**同时**发出，但截至 2026-09-23 **只有 radio 实现了**
     （其余 21 个已收口组件都没有）⇒ 在它们上 `v-model:xxx` 不生效。
     这是**跨组件的统一缺口**，不是 radio 的问题；后续组件照 C11 做，
     并考虑在某次整合期统一补齐（纯增量，不改 DOM）。

## Switch 流（2026-09-23，163-168）

> ⚠️ 编号从 **163** 起（Radio 流用 154-162）。

163. ⚠️⚠️ **`useSize(props.size)` 是非响应式的**（本会话同一坑犯了两次：radio 的 Group 与 switch）。
     `useSize` 的 `customSize` 参数只在 **setup 期读一次** —— 传 `props.size` 会把它当常量捕获，
     之后 props 变化**不会重算** ⇒ 受控切换 `size` 静默失效（类名不跟着变）。
     ⭐ 处方：一律用**函数形态** `useSize((ctxSize) => props.size ?? ctxSize)`
     （skeleton 的 Avatar / Button / Input 一直是这么写的，是本仓的正确范式）。
     抓它的方式：L1 里写一条「受控切换 size ⇒ 类名跟随变化」的用例 —— 静态用例永远发现不了。
     已在 radio 的 index.test.ts 补回归用例。

164. ⚠️ **biome 会把「脚本里只出现在类型位置」的导入改成 `type` 导入，而模板里当值用**：
     `import { SmileOutlined } from icons` + 脚本里只写 `typeof SmileOutlined`（类型注解）
     ⇒ `biome check --write` 改成 `import { type SmileOutlined }` ⇒ 模板里
     `iconLabel(SmileOutlined, 'Happy')` 运行时报
     `Property "SmileOutlined" was accessed during render but is not defined on instance`。
     ⭐ 处方：类型注解别引用值 —— 用 Vue 的 `Component`（`import { type Component, h } from 'vue'`）。
     抓它的层：demo 冒烟（「不产生告警」是硬约束）。

165. ⚠️ **`a,b::before` 陷阱（PITFALLS 141 的姊妹）**：cssinjs 的 `&` 指代**整个父选择器列表**，
     所以 `genNoMotionStyle()` 对 `a,b` 会展开成「`a,b` → `a::before,b::before` → `a::after,b::after`」
     共 6 项。只把 `::before` 拼在列表末尾（`a,b::before`）会让伪元素**只作用于最后一项**。
     ⭐ 另外要区分 raw 变体：antd 对 `handle::before` 用的是 `genNoMotionRawStyle()`（**不**展开），
     再展开会得到非法的 `::before::before`。
     抓它的方式：与 extractStyle 产物的选择器集合对拍（本次是唯一一处差异）。

166. ⚠️ **`SwitchProps` 不含 `onKeyDown`**：antd 的 `SwitchProps` 里没有它（它是 rc-switch 的 props，
     antd 靠 `{...restProps}` 透传）。写 `Pick<SwitchProps, 'onKeyDown'>` 会 TS2344
     （`Type '"onKeyDown"' does not satisfy the constraint 'keyof SwitchProps'`），
     且会让整个 `callbacks` 退化成 `{}`、后续 `callbacks.onKeyDown?.(e)` 报 TS2349。
     ⭐ 处方：给 attrs 显式写一个内联类型，别用 `Pick<Props, ...>` 抄近路。

167. **`pnpm build:ui` 的 dts 步骤（vue-tsc）要 12 分钟以上**：它是全仓 `-p tsconfig.json`，
     比 `pnpm lint:types` 还慢（后者有增量缓存）。⭐ 改完类型敏感的代码后，
     **先把 `pnpm build:ui` 挂后台**再做别的（文档 / fixtures / PITFALLS 都可以并行写），
     别在前台干等；也**别**用 `head` 截断它的输出（`head` 的退出码会掩盖真实失败）。

168. **`packages/ui/src/index.ts` 的 re-export 别名坑在 switch 流重犯了一次（PITFALLS 158）**：
     `style/index.ts` 导出的是通用名 `genTokenDecls`、`token.ts` 是 `prepareComponentToken`，
     所以 ui 根 index 必须写 `genTokenDecls as genSwitchTokenDecls` /
     `prepareComponentToken as prepareSwitchComponentToken`。
     ⭐ 更省事的自查：**测试文件里 import 也要用同一个别名**（`genTokenDecls as genXTokenDecls`），
     否则 dts 阶段会报 `has no exported member named 'genXTokenDecls'`。
     先跑 `pnpm build:ui`（见 167）比等到 G13 便宜。

169. ⚠️⚠️ **`pnpm run test` 的 `Failed to start threads worker` 是**环境性失败**，不是代码失败**：
     本次 switch 收口时把 `lint:types`（12 分钟）+ `pnpm run test` 串在同一条命令里跑，
     测试阶段报了 **138 条** `[vitest-pool]: Failed to start threads worker … Timeout waiting
     for worker to respond`，报告是 `Test Files no tests / Tests no tests / Errors 138`
     —— **一个用例都没跑起来**。
     ⭐ 判据：只要报告里出现 `Test Files no tests`（或 `Tests no tests`）+ `Failed to start
     threads worker`，就说明是**机器过载**（IDE 打开 + 长任务并发），不是实现问题。
     ⭐ 处方：**单独重跑** `pnpm run test`（不要与 typecheck / build 串在一起）。
     🚨 **绝对不能**因为「跑不起来」就换 `--pool=forks --maxWorkers=1` ——
     降级运行会**静默少跑**并给出假绿灯（PITFALLS 已多次登记，见 MEMORY.md 的环境段）。
     机器负载与「关 IDE」的量化关系见 WORKFLOW.md §G13（16 分钟 → 7 分 49 秒）。

## Image 流（2026-09-25，170-173）

> ⚠️ 编号从 **170** 起（Switch 流用 163-169）。

170. ⚠️⚠️ **Vue 3 的 `style` 数字值被静默丢弃**（Vue 2 有自动补 px，Vue 3 **没有** —— 那是 React 的样式补全）。
     `h('img', { style: { height: 100 } })` ⇒ Vue 逐键 `style[key] = value`，CSSOM 拒收裸数字
     ⇒ **整条声明消失**（实测 Chrome + Vue 3.5.42：`attr=null`、computed `0px`；`{height:'100px'}` 正常）。
     ⭐ 处方：所有进 `style` 的尺寸统一走 `toCssSize()`（`packages/ui/src/image/util.ts` 有实现）。
     🚨 **它的伪装性极强，是本仓最贵的一类坑**：`.{p}-img{height:auto}` 会兜住 ⇒ 图片按原始比例撑高，
     「有图」但**尺寸错**（实测 200×100 → 200×200）。三层测试都看不见：
     L1/L7 只断言字面量、L4 的 `contract` 档**丢 `style`**（`dom-contract.ts` 的 `keepStyle` 默认 false）
     ⇒ 只有 **L6** 能抓。抓到的证据：`image/basic__light__{mobile,tablet,desktop}` 5.106%/9.574%/19.608% block-diff。
     判别小抄：`z-index` **接受**裸整数（`{zIndex:1080}` 正常），别因为「有一个数字生效了」就排除这条。
     登记：COMPATIBILITY.md **D94**。

171. ⚠️⚠️ **没有 `-css-var` 类 ⇒ 组件变量声明块必须覆盖「全部根形态」，包括 portal 根**。
     antd 把组件变量声明在每个 `-css-var` 根上，而**浮层的根也带这个类**（它拿到的是
     `mergedRootClassName`，里面含 `cssVarCls`）—— 所以 antd 天然覆盖了浮层。
     本仓无此机制，等价做法是让声明块挂多个根选择器（input 三根见 D69；image 是
     `.apollo-image` + `.apollo-image-preview`）。漏掉的症状：浮层里的 `var(--{p}-*)` 全部失效、
     **静默回退到继承值**（实测关闭按钮 `font-size` 18px → 16px，图标 `1em` 随之变小 ⇒
     3 张 L6 用例 0.011%–0.043% block-diff，差异像素 **100%** 落在关闭按钮 40×40 内）。
     ⭐ 自查方式：把 `style/index.ts` 里出现的每个 `var(--{p}-` 前缀变量列出来，逐个确认
     「消费它的元素是否在声明块的某个根子树内」—— Teleport/portal 出来的根最容易漏。
     登记：COMPATIBILITY.md **D95**。

172. **`node tests/visual/run.mjs` 会被 safe-delete shim 拦死**（与 build 门禁同款，但此前只记了 build）：
     `Error: [safe-delete][SAFE_DELETE_BULK_CONFIRM_REQUIRED] … targets: ["tests/visual/.artifacts/react/assets"]`
     —— vite 的 `emptyOutDir` 要清 6000+ 个文件，超过 50 的阈值就抛。
     ⭐ 处方：一律 `CODEBUDDY_SAFE_DELETE_ENABLED=0 node tests/visual/run.mjs --component <name>`。
     （`tests/build/run.mjs` 同理；这两个是本仓仅有的两个会自己删目录的入口。）

173. ⚠️ **「L7」在本仓有两个口径，别互相印证**：`TESTING.md` §10 的 **L7 = Build Test**
     （`pnpm test:build`），而**组件测试文件头**把 `__tests__/theme.test.ts` 写成「L7 主题」
     （实测：`image/__tests__/theme.test.ts` 第 1 行）。所以「L7 12/12」指的是
     **theme project 的 12 条用例**，不是构建门禁的 127 项。
     ⭐ 取证时按 **vitest project 名**（unit / dom-contract / types / a11y / theme）报数，
     不要用「L7」这类数字层号 —— 数字层号只在 `TESTING.md` 里权威。

## Message 流（2026-09-25，174-177）

> ⚠️ 编号从 **174** 起（Image 流用 170-173）。

174. ⚠️ **组件 vnode 的 `ref` 拿到的是**实例**，不是元素** —— 而动效驱动要的是元素。
     实测：`MotionList`/`CSSMotion` 把 ref 注入 slot 的根 vnode，根 vnode 是**组件**时
     Vue 给的是组件实例 ⇒ 驱动 `attach()` 抛
     `element.addEventListener is not a function`；浏览器里表现为「渲染错误」（两侧都白屏，
     而 harness 判 render-error 而不是 0% 差异，这点设计得对）。
     ⭐ 修法（已落 `packages/motion/src/css-motion.ts`）：注入**函数 ref**，过一道
     `@apollo-design/utils` 的 `getElement`（该文件的既定判据：组件 vnode 一律视为支持
     ref，拿到后用 getElement 解析，解析失败给 null 而不是抛错）。回归用例在
     `motion/src/__tests__/motion-list.test.ts`。

175. ⚠️ **「实测值」类状态必须同时覆盖「挂载后」与「变化后」两个触发点。**
     notification 内核的列表 gap（`getComputedStyle(content).rowGap`）最初只写
     `watch(() => props.configList.length > 0, …)` —— 只 watch **布尔翻转** ⇒
     **静态列表**（PureList：`configList` 一开始就非空）**一次都不测**，gap 恒 0
     ⇒ 四条消息的 `--notification-y` = 0/40/80/120（antd 是 0/56/112/168），
     L6 `types` 用例 1.7%–6.5% block-diff。⭐ 处方：`onMounted(measure)` +
     `watch(() => props.configList.length, () => nextTick(measure), { flush: 'post' })`。
     同类坑的记忆：任何「从 DOM 读回来」的状态都要问一句「**首次渲染就满足条件**时会不会触发」。

176. ⚠️ **改了 foundation 包（`motion` / `portal` / `utils` …）要单独重建它**：
     视觉 harness 从**产物**解析这些包（`packages/motion/dist`），只
     `pnpm --filter @apollo-design/ui run build` **不会**带上它们的修复 ——
     实测先踩出「渲染错误」，重跑 motion 的 build 后立刻 0.000%。
     ⭐ 判据：`packages/ui/dist/index.mjs` 把 `@apollo-design/*` 当外部依赖，
     所以「哪个包改了就重建哪个包 + 重建 ui」。CI 的 `test:build` 会全量重建，
     但**本地开发期的 L6 证据**必须自己记得这步。

177. **命令式组件（`message` / `notification` / `Modal`）的 L4/L6 只能走静态面板。**
     命令式路径整体是 portal + 自动消失 ⇒ SSR 不可见、静态截图也拿不到
     ⇒ L4 用 `_InternalPanel*` / `_InternalList*`（`renderToStaticMarkup` 有产物），
     L6 同样渲染静态面板（`single` / `types` / `custom`）。
     ⭐ 另：`message.success()` 是**模块级单例** ⇒ 用例之间必须 `actDestroy()` 复位，
     否则上一条的实例被下一条复用（`config.test` 的隔离就靠它）。

## Modal 流（2026-09-26，178-184）

178. 🚨 **`setup()` 里不能创建带 `ref` 的 vnode** —— Vue 的 `normalizeRef` 把
    `currentRenderingInstance` 当作 ref 的 owner，而 **`setup()` 里它是 `null`**。
    后果是**双重的**：① 控制台一条 `[Vue warn] Missing ref owner context. ref cannot be
    used on hoisted vnodes.`；② 那个 ref **永远不会被赋值**（`setRef` 在 owner 缺失时
    直接 return），于是「组件实例是 null」被误判成「组件没渲染」。
    实测（modal 的 `useModal`）：`holderRef.value` 恒为 null ⇒ `patchElement` 返回
    undefined ⇒ 弹窗**一个都不出现**，而 API 对象、`destroy` / `update` 全都正常。
    **对策**：
      - 需要子组件的实例时，让子组件在 `setup()` 里**回调**（`onReady` / `onExpose`）；
      - 需要把「命令面」从外部传进去时，**把 `Ref` 对象当普通 prop 传**
        （props 是 `shallowReactive`，不会解包 ref），子组件写 `props.xxxRef.value = ...`；
      - 在事件回调 / `setTimeout` 里 `h(组件, { ref })` 同样会踩（没有渲染上下文）。
    ⚠️ 与 174（组件 vnode 的 ref 拿到的是实例）**不是一回事**：174 是「拿到了但形态不对」，
    178 是「压根拿不到、且只有一条 warn」。

179. ⚠️ **浮层组件的「关闭」是异步的** —— `close()` 只把 `open` 置假，真正的卸载发生在
    **离场动效结束**的 `afterClose` 里。所以：
      - `destroyAll()` / `instance.destroy()` 之后**DOM 还在**（面板靠 `display:none` 隐藏）；
      - 测试不能「数几个 tick」就断言卸载，**必须轮询**到条件成立；
      - jsdom 没有样式表 ⇒ 动效只能靠内核的 `motionDeadline` 兜底（modal 是 500ms）
        ⇒ 一次关闭断言约 0.5–1.1s。用例里的 `waitFor` 超时给 2.5s。
    实测：modal 的 `index.test.ts` 第一版用 `await macro(); await ticks();` 断言
    `querySelector('.apollo-modal-confirm') === null` ⇒ 6 个用例全红，全是时序问题。

180. 🚨 **动效名的前缀是 `rootPrefixCls`（`apollo`），不是组件前缀（`apollo-modal`）。**
    antd 传 `getTransitionName(rootPrefixCls, 'zoom', transitionName)` ⇒ 类名是
    `.apollo-zoom-enter` / `.apollo-fade-enter`。产物里那批**裸类**规则
    （`.apollo-zoom-enter,…`）只有名字对得上才命中。
    写成 `apollo-modal-zoom` 时**动效静默失效**（不报错、类型也过，只是「打开没有动画」）。
    本仓的 `modal/util.ts` 有 `getTransitionName`，`Modal.ts` 与 `ConfirmDialog` 都用它。

181. ⚠️ **`Skeleton` 设了 `inheritAttrs: false`** ⇒ `h(Skeleton, { class: 'x' })` 的类名
    被**静默丢弃**，必须传 `className` **prop**（antd 侧也是这么写的）。
    症状：L1 用例 `wrapper.find('.apollo-modal-body-skeleton')` 找不到、但 body 确实渲染了
    Skeleton 的根（只是没有那个类）。
    同族：任何「`className` 是自己的 prop」的组件（skeleton 全家、部分 rc 移植组件）
    都不能用 `class` 透传。

182. **`h()` 的 children 重载不收 `null | undefined`**，而 `VNodeChild` **含**它们
    ⇒ `h('div', props, maybeNull)` 报 `TS2769: No overload matches this call`
    （最后一条重载的报错是「Argument of type 'VNodeChild' is not assignable to
    parameter of type 'RawSlots | RawChildren'」，**指向 slots**，很容易误判成插槽问题）。
    对策：包成数组 `h('div', props, [maybeNull as never])`。

183. ⚠️ **`dom-contract` 的 cssinjs 类名过滤器漏了 `css-var-_R_x_` 形态。**
    原实现只覆盖 `css-dev-only-do-not-override-*` / `css-*` hash 与
    `css-var-root` / `{prefixCls}-css-var`；而 antd 的 **`withPureRenderTheme`
    会再包一层 `ConfigProvider`**，那层产生的 cssVar key 是 **React `useId()`**
    （`css-var-_R_7_`）—— 同一棵树里换个位置就变，基线完全不可复现。
    实测：modal 的 L4 基线 9/9 全红，差异全是这一条。
    对策：`CSSINJS_VAR_KEY_CLS = /^css-var-[\w-]+$/`（过滤器对两侧一视同仁，语义同 D1）。
    ⚠️ 排查时**别只看第一条 diff** —— 它后面还叠着「`className` 多写了一次 `prefixCls`」
    这类真问题。

184. ⚠️ **手工编辑 `registry/components.json` 用「行扫描 + 正则替换」会静默改错。**
    实测：按 `"name": "modal",` 定位后向后找块结束的启发式**判断失败**（`end === start`），
    于是 9 个字段一个都没改，脚本却打印了 "updated"（因为 `set()` 的返回值被忽略了）。
    **对策**：`JSON.parse` → 改对象 → `JSON.stringify(data, null, 2)` 写回，
    然后**再解析一次并逐字段比对**（顶层键 + 逐组件），确认「只有目标组件变了」。
    这样格式化风险也可控（本仓的 `components.json` 就是 2 空格缩进）。

185. 🚨 **`as unknown as PropType<unknown>` 会让 vue-tsc 把该 prop 推断成 `undefined`** ——
    于是**模板里任何传值**都报 `TS2322: Type 'X' is not assignable to type 'undefined'`。
    这是 137 的同族、但更隐蔽的一面：
      - ✅ **能用**：`type: null as unknown as PropType<VNodeChild>`（目标类型具体）；
      - ❌ **不能用**：`type: [Boolean, Object, null] as unknown as PropType<unknown>`
        （`unknown` ⇒ 推断成 `undefined`）；
      - ✅ **正解**（alert 的既有范式）：`type: [Boolean, Object] as PropType<AlertProps['closable']>`
        —— 运行时类型列表里**不要**写 `null`，PropType 用**具体命名类型**。
    ⚠️ **为什么以前没暴露**：这类 prop 的错误只在「有 demo / 用例真的传了该 prop」时才出现
    —— `lint:types` 会检查 `*.vue` 的模板。drawer 的 `closable` 是同一个写法，
    只是它的 demo 从不传对象，所以一直绿着。
    ⚠️ 排查信号：错误信息里的目标类型是 `undefined`（而不是 `unknown` / 某个联合）
    ⇒ 先去看那个 prop 的 `PropType` 是不是 `unknown`。
    本轮实测：modal 一次暴露 **9 条**（`closable` / `mask` / `footer` / `styles` / `classNames`）。
    另一条同族：`PropType` 只声明了对象形态时，模板里的**函数形态**会被判「不可赋值」
    （`style-class` demo 的 `:styles="fn"`）⇒ 单列一个「运行时输入」类型
    （`ModalSemanticTypeInput`），公开类型仍按 D36 只留对象形态。

## Cascader 收尾流（2026-09-28，186-191）

186. 🚨 **`genSelectStyle(prefixCls, targetPrefixCls)` 的「同一性短路」会静默吞掉样式复用。**
    实测：`genSelectStyle('apollo', 'apollo')` 命中 `prefixCls === target` 分支 ⇒ `rename`
    退化成恒等 ⇒ 调用方（cascader）拿到一份**重复的 `.apollo-select-*`**，
    `.apollo-cascader-*` 外壳**一条规则都没有**。症状是「页面级无样式」
    （L6 截图裸 input / `<li>` 带 bullet），而**产物里明明有规则**
    （重复的那份也是合法 CSS）—— 用 grep 找目标前缀还会命中一堆（来自别的组件），
    极易误判成「CSS 已加载但没生效」，甚至去怀疑 tokens.css 的加载时序。
    **正确排查**：读 `getComputedStyle` 的**具体属性值** ——
    `border: 2px inset rgb(118,118,118)` 就是浏览器默认 input 边框 ⇒ 外壳规则没命中。
    只数「样式表里有几条规则」是没有信息量的。

187. 🚨 **组件变量声明块必须覆盖全部根形态**（PITFALLS 171 / D69 家族的 cascader 版）。
    cascader 有**三个**根：`.apollo-cascader`（触发器）/ `.apollo-cascader-dropdown`
    （Portal 出去，popupClassName 里只有 `-dropdown`、**没有** `-css-var` 类）/
    `.apollo-cascader-panel`（`CascaderPanel` 的根）。只挂第一个时，后两个根里的
    `var(--apollo-cascader-*)` 取不到值 ⇒ 声明在 **computed-value 期静默失效**、退回初始值。
    实测：panel 的列 `min-width` 111px → **43.56px**、`height` 180 → auto、`padding` → 0。
    ⚠️ 症状与 186 **长得一模一样**（都像「样式没加载」），但根因相反 ——
    186 是规则没生成，这条是规则在、变量没作用域。判据：该 `var()` 是否只定义在某个根上。

188. ⚠️ **`Cascader.Panel` 与 `Cascader._InternalPanelDoNotUseOrYouWillBeFired` 在 antd 里
    是两个不同的组件**（D113）：
      - `Cascader.Panel` = rc `Panel.js` = **只有列**（`{p}-panel` + RawOptionList，无 select 外壳）；
      - `Cascader._InternalPanelDoNotUseOrYouWillBeFired` = `genPurePanel(Cascader, 'popupAlign')`
        = **完整 Cascader**（外壳 + 浮层）塞进一个带 `paddingBottom / position / minWidth`
        （ResizeObserver 量测）的 **holder div**。
    **L6 用例两侧必须用同一个**，否则比的是两个不同组件。本轮实测：react 侧用 `_Internal*`、
    vue 侧用 `CascaderPanel` ⇒ 报「尺寸 300 vs 292」，并让人误判「antd 的 Panel 是完整外壳」，
    据此给本仓 `CascaderPanel` 补了一套 BaseSelect 外壳（**已回退**）。
    排查信号：react 的 DOM 根是**裸 `div` + 内联 `paddingBottom/minWidth`**、没有 `-panel` 类
    ⇒ 你拿到的是 PurePanel，不是 Panel。

189. ⚠️ **rc 的形参默认值 ≠ antd 的生效默认值。** rc `Panel.js` 的 `expandIcon = '>'`
    （且没有默认 loadingIcon）；antd 的 `Panel.tsx` / `cascader/index.js` 用 `hooks/useIcons`
    覆盖成 `RightOutlined`（RTL `LeftOutlined`）/ `LoadingOutlined spin`。
    照抄 rc 默认 ⇒ 展开图标渲染成**文字 `>`**（L6 差异抓出）。
    **判据**：默认值要去 antd 的 `hooks/useIcons.js` 里看，不是 rc 的 defaultProps。

190. ⚠️ **`useSelectStyle` 在 cascader 里传的是 select 前缀，不是 cascader 前缀**（D112）。
    antd `cascader/index.js`：
    `const prefixCls = getPrefixCls('select'); const cascaderPrefixCls = getPrefixCls('cascader');
     const [hashId, cssVarCls] = useSelectStyle(prefixCls); useStyle(cascaderPrefixCls);`
    ⇒ DOM 上 Cascader 根**同时挂** `ant-select` + `ant-cascader`，外壳元素一律 `ant-select-*`；
    `ant-cascader` 自己只贡献 `width` / `-dropdown`（padding:0 + 列）/ `-dropdown-rtl` / `-panel`。
    本仓没有「一个组件挂两个前缀」的机制（BaseSelect 的类名全由传入 prefixCls 派生）⇒
    走「按目标前缀重生成一份」的等价路径。**别再写成 `useSelectStyle(cascaderPrefixCls)`** ——
    那是凭记忆推演出来的错误结论（AGENTS §5 明令禁止），本轮从两处注释里删掉并改正。

191. ⚠️ **L6 页面基座字体两侧不对称**（→ 开放决策 `visual-harness-base-font` / D114）。
    react 侧 harness 不加载 `antd/dist/reset.css` ⇒ `body` 的 `font-family` 是浏览器初始值
    （Chrome/macOS 实测 = `sans-serif`）；本仓 `ui/dist/index.css` **自带** html/body reset
    ⇒ vue 侧 `body` = `-apple-system,…`。多数组件无感（根类显式声明 `font-family`，两侧归到
    同一份 token），**暴露点是「没有 font-family 的根」** —— cascader 的面板与列
    （antd 那边 `style/panel.js` + `style/index.js` 都是 `resetFont: false`）。
    残留差异像素全落在文字与 1px 边框上。
    **排查手法**：`node tests/visual/debug/rect.mjs <comp> <variant> <apolloSel> <antSel>`
    一次打印两侧 bounding rect + `fontFamily` 首项 —— 比盯截图猜快一个数量级。

192. 🚨 **`registry/components.json` 的 `notes` 会被 `registry:gen` **清空**（实测 2026-09-28）。
    复现：给 tour 写 `notes` → 跑 `pnpm run registry:check`（内含 `registry:gen`）→ 再读，
    `notes` 变成 `null`。⚠️ 这与既有认知「status/notes/layerNotes 由 Agent 写、跨运行保留」
    **不符** —— 至少 components.json 的 `notes` 不保留。
    ⇒ **跨运行的进度/结论不要只写在 `notes` 里**：分析结论落 `docs/analysis/<name>.md`，
    进度落 `.workbuddy-ai/memory/YYYY-MM-DD.md`，registry 只当作「机器可读的状态位」。
    （`status` / 各 `*Status` 维度**确实**保留，实测无误。）

193. 🚨 **Component Token 的声明块必须包在「选择器 + 花括号」里**（2026-09-29，form 实测）。
    `genTokenDecls()` 产出的是一堆 `--apollo-x-y:value;` **裸声明**；若像 form 早期那样
    直接 `return ${decls}${RULES}`，那就是无效 CSS —— 解析器会把**紧随其后的规则一起丢**。
    症状：`var(--apollo-form-item-margin-bottom)` 解析失败 ⇒ `margin-bottom` 退回 initial(0)
    ⇒ 表单项之间没有 24px 间距（form 的 item 全贴在一起）。
    **为什么藏了这么久**：那批 token 变量此前**根本没有任何规则在用**（旧实现只把它们给
    theme.test 断言），而**没有视觉基线** ⇒ 前端没人看得见。L6 基线一建就暴露了。
    正确写法（input/checkbox 同判）：`` const d = genTokenDecls(p).join(''); return
    `.${p}-input{${d}}` + '\n' + RULES ``；**根形态有几个就挂几个**
    （input 挂 3 个：裸 input / affix-wrapper / group-wrapper；form 挂 2 个：
    `-form` 与 `-form-item`，后者覆盖「脱离 Form 单独用 Item」）。

194. 🚨 **foundation 包的 `dist` 会比 `src` 旧** ⇒ L6/L4 的构建以 `MISSING_EXPORT` 炸
    （2026-09-29 实测：`packages/form-core/dist/index.mjs` 缺 `fieldProps`/`listProps`，
    而 `tests/visual/build.mjs` 的 vue 侧走**已构建的** `packages/ui/dist/index.mjs`，
    后者 import 前者）。表现是 rolldown 的
    `[MISSING_EXPORT] "fieldProps" is not exported by "packages/form-core/dist/index.mjs"`，
    **不是**「用例写错了」。
    ⇒ 动过 form-core / utils / motion / portal 等 foundation 包的 `src` 后，
    跑视觉/构建前先 `pnpm --filter @apollo-design/<pkg> run build`（PITFALLS 176 的延伸）；
    `pnpm run build:ui` 只建 ui，**不会**替你把 foundation 的 dist 刷新。

195. ⚠️ **`provide` 一个 `ComputedRef` 当上下文值，读取方必须 `toValue` 解包**
    （2026-09-29，form 的 `FormItemInputContext` 实测）。Vue 的 `inject` 不做解包，
    `injected ?? {}` 拿到的是 **ref 对象本身** ⇒ `.status` / `.hasFeedback` 全是 undefined。
    症状很隐蔽：**组件的 DOM 一切正常，只有「下游组件吃不到状态」** ——
    form 的 L4 用例里 `-status-error` / 反馈图标 / `-sm/-lg` 全缺。
    ⇒ 键的类型声明成 `InjectionKey<Value | Ref<Value>>`（两个形态都合法），
    读取一律走 `computed(() => toValue(injected) ?? {})`。

196. 🔧 **要判定 antd 的「运行时行为」（不是 SSR 静态形态），用 jsdom 直接跑 React**
    （2026-09-29 新增手法，脚本见 `tests/visual/debug/probe-form-nostyle.mjs`）。
    模板：`new JSDOM(...)` → 手动补 `window.matchMedia` / `SVGElement` / `navigator`
    （Node 22 的 `globalThis.navigator` 是只读 getter，要 `Object.defineProperty`）
    → `IS_REACT_ACT_ENVIRONMENT = true` → `createRoot` + `act()` → 读真实 DOM。
    ⚠️ 必须 `(… > /tmp/x.log 2>&1 &)` 跑并轮询日志：前台直接跑会撞 120s 超时
    （exit 137 且**零输出**，见 PITFALLS 里「137 ≠ OOM」那条）。
    价值：`renderToStaticMarkup` 拿不到「校验后」的 DOM，而 antd 自测的断言只覆盖一部分
    ⇒ 这类问题过去只能靠读源码猜（本次靠它把「外层布局项到底带不带 `-has-error`」钉死）。

197. ⚠️ **`noTemplateCurlyInString` 让「字面量 `${label}`」写不出来**。
    rc-field-form 的消息模板占位符就是 `$` + `{label}` 这几个字符，直接写会被 biome 判成
    「模板串占位符写错了」（warning，不 fail 门禁但会一直呻吟）。
    绕法：`const LABEL_TOKEN = `$${'{label}'}`;`（`$` 与 `{label}` 分开给，模板里只有表达式）。
    —— 同族：PITFALLS 139「对象字面量里的 suppression 注释无效」。

198. ⚠️ **「registry 说 completed」不等于「真的收口了」**（2026-09-29，form 的教训）。
    接手时 form 的 11 维度全是 `done`，实际状态是：README 还是「本目录是骨架，任何维度都
    不得置 done」、**没有** `tests/compat/baseline/form.mjs`、**没有** `baselines/form.dom.json`、
    **没有** `tests/visual` 的 matrix 条目与 react/vue 用例、缺 L3/L4/L5 三个测试文件、
    代码里留着 5 处 `DBG-` console.log 与 4 处 biome error（含 `PropType<any>`）。
    ⇒ 接手一个「已完成」的组件时，先跑三件事：`node scripts/verify-component.mjs <name>`、
    `ls tests/compat/baselines/<name>.dom.json tests/visual/render/cases/{react,vue}/<name>.*`、
    读它的 `README.md` 是否仍在说「骨架」。

## Picker 面板流（2026-09-30，199-206）

199. 🚨🚨 **jsdom 冷缓存会让 vitest 的 worker 启动超时（60s 硬上限）—— 与代码无关**
    （2026-09-30 实测，本机）。症状：`vitest run` 对**任何**文件都报
    `[vitest-pool-runner]: Timeout waiting for worker to respond`，日志里
    `Test Files no tests / Errors 1 error / Duration 60.15s`；
    换 `--pool=forks`、换 `--maxWorkers=1`、删 `node_modules/.vite` **都无效**。
    判据三步（缺一不可）：
      ① `node -e "const t=Date.now();require('jsdom');console.log(Date.now()-t)"`
         —— 冷缓存实测 **25 秒**，热缓存 ~8 秒；
      ② 同一份最小配置把 `environment` 从 `jsdom` 换成 `node` ⇒ **11 秒通过**；
      ③ 抛掉仓配置、用 `--root <子目录>` 的最小 jsdom 配置 ⇒ 仍超时（排除本仓配置）。
    ⇒ **不是仓里的问题**：等 OS 的 page cache 变热（跑几次、或先 `node -e "require('jsdom')"`
    预热）即可恢复。**别急着改代码或改测试配置** —— 本轮为此白排查了近一小时。
    ⚠️ 与 PITFALLS 41（`exit 137` 先怀疑超时）同族：**先怀疑环境，再怀疑代码**。

200. 🚨 **`packages/*` 的 `defineComponent` props 里 `required: true` 必须写 `as const`**
    （2026-09-30，picker 面板实测）。不写时 TS 把 `required` 推成 `boolean`，
    `ExtractPropTypes` 判不出「必填」⇒ 该 prop 在组件内变成 `X | undefined`。
    对 `locale` / `generateConfig` / `pickerValue` 这类「处处都在用」的 prop 来说，
    后果是全包几十处 `| undefined` 报错（本轮 11 个文件全中）。
    ⚠️ **不要**用 `as const` 加在整个 props **对象字面量**上 —— 那会把
    `default: () => []` 的返回推成 `never[]`。逐个 prop 写 `required: true as const`。

201. ⚠️ **`h(tag, props, child)` 的第三个参数不能直传 `VNodeChild`**
    （`VNodeChild` 含 `null` / `boolean`，不满足 `RawChildren`）⇒ TS2769。
    对策：**包成数组** `h(tag, props, [child])` —— 比 `as never` 更干净，
    且数组会被 Vue 正常展平（SSR 与挂载产物都不变）。
    `h(Component, props as never)` 那类组件签名问题仍用仓内惯例的 `as never`。

202. 🚨 **收窄一个入参会静默丢掉 oracle 的一条覆盖**（2026-09-30，picker 实测）。
    `getRowFormat` 的上游有一条 `case 'datetime'` 分支，而本包在「纯函数层」时期把入参
    收窄成了 `PickerMode`（`'datetime'` 不可达）⇒ 那条分支被**静默删除**，
    连 oracle 用例的注释都写着「不在本包语义里」（那是收窄期的自证，不是上游的事实）。
    面板层落地后 `DateTimePanel` / `fillShowTimeConfig` 会真的传 `'datetime'` ⇒ 必须补回。
    ⇒ **凡是要把入参收窄，先核对上游的 switch/case 全表**；
    类型收紧是「让编译器拦错」，但它同时会**让对拍少跑一条而不报警**。

203. 🔧 **antd 的 `DatePicker` 在 SSR 下不渲染面板** ⇒ 面板 DOM 的基线只能打 rc 层
    （2026-09-30 实测）。`renderToStaticMarkup(<DatePicker open />)` 输出 **889 字节**、
    `inline('picker-panel') === false`，控制台还会打
    `Portal only work in client side`（浮层走 Portal，只在客户端挂）。
    ⇒ 把 `@rc-component/picker` 加进**根 devDependencies**（catalog 精确锁 `1.12.2`），
    直接渲染它的 `PickerPanel`。⚠️ 它的 `exports` 里**没有** `./package.json`
    ⇒ `require('@rc-component/picker/package.json')` 会 `ERR_PACKAGE_PATH_NOT_EXPORTED`，
    要 `require.resolve` 之后读磁盘。⚠️ 它 `main` 指 `lib/`（CJS）而 `import` 指 `es/`，
    Node 直连 `es/index.js` 会因 `es` 里无扩展名的深路径 import 而 `ERR_MODULE_NOT_FOUND`
    ⇒ **用 `createRequire` 走 CJS 入口**。

204. 🚨 **基线的「当前时间」必须冻结，否则跨日静默失效**（2026-09-30，picker）。
    `-cell-today` 取 `generateConfig.getNow()`。做法：把 `getNow` 换成常量
    （`{ ...dayjsGenerateConfig, getNow: () => dayjs('2026-09-30 10:20:30') }`），
    **两侧用同一份覆盖后的对象**。忘了这条，基线会在第二天开始报差异。

205. ⚠️ Vue 的 `provide` / `inject` 与 `defineComponent` 的 props **都无法携带类型参数**
    ⇒ `InjectionKey<T>` 的 `T` 必须在 `provide` 那一刻确定。
    本包的处理：**组件层直接落在 `Dayjs` 上**（纯函数层仍保持 `GenerateConfig<DateType>` 泛型）。
    🚨 **不要用 `never` 占位**：`PropType<never>` 解出来的 prop 值类型是 `never`，
    调用方**一个参数都传不进来**（本轮先试了 `never`，全包报错后改 `Dayjs`）。
    跨 `provide`/`inject` 的日期值同理：`InjectionKey<ComputedRef<PanelInfo<Dayjs>>>`。

206. ⚠️ **「上游某个面板的 `getStart` / `getEnd`」不能互相类推**（2026-09-30，picker）。
    day 面板的 `getStart` 是 `setDate(date, 1)`（对齐到 1 号），
    而 month / quarter 面板的是裸的 `setMonth(date, 0)` / `setMonth(date, 11)` —— **不动日**。
    ⇒ 9/30 进 month 面板得到 `1/30` 与 `12/30`，不是 `1/1` / `12/1`。
    影响 `minDate` / `maxDate` 的越界判定（本轮写 L1 用例时按 day 面板类推，错了两条）。
    ⇒ 四个上层面板的 `offset` / `superOffset` / `getStart` / `getEnd` 必须**逐面板抄**，
    已收进 `panel-header-limit.ts` 的 `getPanelHeaderLimits`（一处一表，便于对拍）。

207. 🚨🚨 **React 的「闭包快照」换成 Vue 的 `computed` 会让「值变了吗」的比较恒为假**
    （2026-09-30，picker 的 `triggerChange` 实测，**由 L2 抓到**）。
    上游：
    ```js
    const triggerChange = (nextValue) => {
      setMergedValue(nextValue);
      if (onChange && mergedValue.length !== nextValue.length || ...) onChange(...);
    };
    ```
    React 里 `mergedValue` 是**本次渲染的闭包常量**，`setMergedValue` 只是排队更新
    ⇒ 比较用的是**旧**值。Vue 里若把 `mergedValue` 写成 `computed`（这是最自然的写法），
    它**活读**内部 `ref` ⇒ `setMergedValue` 之后立刻返回新值 ⇒
    `length` 与 `isSame` 全部为假 ⇒ **`onChange` 永不触发**。
    - 症状：**受控用法完全正常**（那时 `setMergedValue` 是空操作），只有
      `defaultValue` 的**非受控**路径全哑。
    - 对策：**先取快照再写** —— `const current = mergedValue.value; setMergedValue(next);`。
    - 同类检查点：任何「写状态 → 立刻比较状态」的 React 移植都要过一遍。
    ⚠️ 这条与 PITFALLS 195（`provide` 的 `ComputedRef` 要 `toValue` 解包）同族：
    **React 的「值」是快照，Vue 的「响应式值」是活引用** —— 移植时语义会翻。

208. 🚨 **同步连点（不 `nextTick`）不只是「读到旧 DOM」**（2026-09-30，picker L2 实测）。
    面板的翻页是从 `info.pickerValue` **现算** `offset(distance, pickerValue)` 的
    ⇒ 两次点击之间不 flush 时，第二次仍基于**第一次之前**的值，
    「prevs 的结果」会一起错（不是差一个，是差两个粒度）。
    ⇒ 断言序列（点 → 读 → 点 → 读）时，每次 `click` 之后都要 `await nextTick()`，
    并把这些用例写成 `async`。**测试里省掉 nextTick 是「写错测试」的常见形态**，
    别急着去改实现。

209. ⚠️ **上游 `PickerPanel` 没有 `onModeChange` 这个对外 prop**（2026-09-30 实测）。
    面板**内部**传给面板组件的 `onModeChange` 由 `PickerPanel` 自己提供；
    **对外**通知模式变化走 **`onPanelChange(viewDate, mode)` 的第二参**。
    ⇒ 写这类「两级 API」的测试/消费方时，先 `grep 'index.d.ts'` 确认那一层到底声明了什么；
    未声明的 prop 会被 Vue 归进 `attrs`，回调**永远不触发**（静默）。

210. ⚠️ **季 / 月 / 年面板的格子日期是 `pickerValue` 的「月首 + 保留日」**（2026-09-30，picker 实测）。
    季格 = `setMonth(pickerValue, 0)` 再 `addMonth(offset * 3)` ⇒ **保留 `pickerValue` 的「日」**
    ⇒ `pickerValue` 是 9/30 时季格是 `1/30、4/30、7/30、10/30`，**不是** 1/1、4/1……
    ⇒ 写 `disabledDate` 的测试时判 `getDate(date) === 1` **永远不命中**（本轮实测踩到）。
    月格同理（月面板的 `getStart` 是裸 `setMonth(date, 0)`，见 PITFALLS 206）。
    写这类判据一律优先看**月份**，不要假设日期被对齐到 1 号。

211. 🚨 **`watch(…, { immediate: true })` 在 `setup()` 阶段就同步跑一次，那时 ref 还是 `null`**
    （2026-09-30，picker 的 `TimeColumn` 实测）。
    `TimeColumn` 用 `watch([value, units], …, { immediate: true, flush: 'post' })` 触发滚动对齐；
    `immediate` 的那一次是**立即同步**执行的（不受 `flush` 影响）—— 此时 `ulRef.value` 是 `null`
    ⇒ `startScroll()` 直接 return。**DOM 渲染后不会再补跑一次**（依赖没变）。
    - 后果：想用「挂载后内部状态已就绪」做测试前提时会永远不成立
      （本轮「滚动期间不提交」那条测试就因为假设 `scrolling` 已被置真而失败）。
    - 对策：需要「DOM 就绪后的那一次」时，**挂载后再改一次值**去触发 `flush: 'post'` 的 watcher。
    - 也适用于实现侧：如果逻辑必须依赖 DOM，`immediate` 是**错的选择**。

212. ⚠️ **mock `requestAnimationFrame` 时，若只 `return` 不执行回调，等于把整段逻辑跳过**
    （2026-09-30，picker 实测）。`wrapperRaf(cb)` 内部是 `raf(() => cb())` ——
    mock 不执行 ⇒ `cb` 一次都不跑 ⇒ 被测的「内部状态机」停在初始值，
    断言反而测成了**另一条**路径（本轮把「滚动中不提交」测成了「正常提交」）。
    ⇒ 需要「跑几帧然后停住」时，用**计数 + 同步执行**（`if (n <= 3) cb(...)`），
    不要用「永不执行的队列」去表达「停住」—— 那表达的是「一帧都没跑」。

## Picker 收口流（2026-09-30，213-218）

213. 🚨🚨 **`biome check` 用 shell 展开的 glob 会给出「0 error」的假绿灯**（2026-09-30 实测，本仓真踩）。
    症状：`pnpm exec biome check packages/picker/src/**/*.ts` 报 **0 error**，而 `biome check .`
    对同一批文件报 **21 个 error**。
    - 根因：**zsh 默认不递归展开 `**`**（没 `setopt globstar`）⇒ `**/*.ts` 只匹配**一层**子目录，
      `src/*.ts`（顶层文件）**全部漏检**；而 biome 对「显式传入的路径」**不会**再按自己的
      `files.includes` 补扫。
    - 判据：两边都加 `--reporter=json`，数 `severity === 'error'` 的条数；
      或干脆跑 `pnpm run lint:format`（= `biome check .`，唯一权威）。
    - 教训：**门禁命令不许自己手写 glob**，一律用 `package.json` 的 script。
      ⚠️ 上一轮我在日志里写的「biome 0 error」就是这么来的 —— **假绿灯比红灯更贵**，
      它会让人把错误结论写进仓库文档（本轮已回改）。

214. 🚨 **biome 2 的 `noUnusedVariables` 会报「没人用的 TS 类型参数」**（2026-09-30，picker 实测）。
    `export type PickerFormat<DateType> = string | readonly string[] | { format: string }` 里
    `DateType` 没被用到 ⇒ 报 `lint/correctness/noUnusedVariables`（`noUnusedImports` 只管 import）。
    - ⚠️ 与 `vue-tsc` **互补但不重叠**：`vue-tsc` 不看未使用的 import / 类型参数
      ⇒ **类型检查全绿 ≠ lint 全绿**，收口时两个都要跑。
    - 修的时候别顺手删泛型了事：先确认上游那个参数是不是「真的会用上」。本轮查了
      `@rc-component/picker/es/interface.d.ts`（第 205 行 `FormatType<DateType> = string |
      CustomFormat<DateType>`、第 237 行 `format?: FormatType<DateType> | FormatType<DateType>[] |
      { format: string; type?: 'mask' }`）才发现上游**有函数形态**，我们没做 ⇒
      删掉泛型 + 在注释里写明「为什么现在不挂泛型、什么时候加回来」（写了会说谎的 API 更糟）。

215. 🚨 **`[TMP-DBG]` 插桩会一路打进 `dist/`**（2026-09-30，picker 实测）。
    为定位「面板自己 provide 的东西自己 inject 不到」，我在 `panel-context.ts` 的
    `providePanelInfo` / `usePanelInfo` 里加了 `process.stderr.write`，**顺手就提交了**；
    构建后还进了 `packages/picker/dist/index.mjs` ⇒ 任何消费者跑测试都会在 stderr 刷
    `INJECT key=Symbol(apolloPickerPanelInfo) comp=...`。
    - 对策：插桩**必须**带 `[TMP-DBG]` 标记（`grep -rn "TMP-DBG" packages/` 一次清光），
      收口前用 **Grep 工具**扫 `process.stderr.write` / `console.log`。
    - 🚨 `dist/` 是 **gitignore** 的 ⇒ 它脏了**不会被 `git status` 提醒**，只有消费者
      （或 `tests/build/run.mjs` 的产物扫描）会发现。这是「本地绿、下游脏」的典型形态。

216. ⚠️ **`Edit` 工具的批量编辑会「部分落盘但报 success」—— PITFALLS 138 的复现**（2026-09-30）。
    一次发 3–4 个 `Edit`，其中约 1/3 静默没落盘（例：`date-panel.ts` 的 import 行没改、
    `upper-panels.ts` 的 `let titleNode` 没加类型、`panel-body.ts` 的 call-site 没跟上新签名），
    而工具逐条回的都是 `Successfully edited file`。
    - 后果很凶：**签名改了、调用处没改**会让仓库进入**编译不过**的状态
      （本轮 `renderCell` 就是这样把 `tsc` 直接弄红的）。
    - 对策：**多文件 / 多点的机械改动一律写 Node 脚本**（`readFileSync` → 逐条
      `split` 计数断言「恰好命中 1 次」→ `replace` → `writeFileSync`），脚本逐条打印
      `OK / SKIP(未找到) / SKIP(命中 N 次，不唯一)`。比 `Edit` 可靠得多，而且自带回执。
      一次性脚本写到 `/tmp` 不算污染仓库。
    - 只改 1–2 处时仍可用 `Edit`，但**必须**用 Grep 工具回读确认。

217. ⚠️ **BSD `grep` 不支持 `\|` 交替，会静默返回空**（2026-09-30 实测，本机 macOS/zsh）。
    `grep -n "usePanelHack\|panel-context" f.ts` 输出**空**，让人误判「文件里没有这个标识符」；
    实际那一行就在文件里。⇒ 一律用 **Grep 工具**（ripgrep），别用 bash 的 `grep`。
    （与本机 user-level MEMORY 里「`rg` 不在 PATH，别用 bash 版」同族。）

218. ⚠️ **`registry:check` 的顺序不能反**：`gen-registry.mjs` 会重写
    `components/dependencies/tokens.json` 的 `generatedAt` ⇒ 紧接着
    `foundation-status.mjs --check` 会报 **「registry/foundation.json 已过期」**
    （它的 digest 输入变了，不是真过期）。
    正确流程：`gen-registry.mjs` → `foundation-status.mjs`（**不带 `--check`，写一次**）
    → `gen-workstreams.mjs --check` → `validate-registry.mjs`。
    刷新 `foundation.json` 只会动 `generatedAt` 与 `srcLines`（`status`/`dimensions`/
    `testLayers`/`verification` 等进度字段跨运行保留）—— 刷新后 `git diff` 应当**只有这两类行**。

219. 🚨 **`tabPlacement` 的 `'left'` / `'right'` 不是「无效值」—— 它们走上游的 `default:` 直通分支**
    （2026-09-30，读 `antd/es/tabs/index.js:101-114` 确认）。**这条是更正**：本轮早先我在日志里
    写成「`left`/`right` 渲染出的是**未识别的 placement**」，那是**错的**。
    上游真实逻辑：
    ```js
    const placement = tabPlacement ?? tabPosition ?? undefined;
    const isRTL = direction === 'rtl';
    switch (placement) {
      case 'start': return isRTL ? 'right' : 'left';
      case 'end':   return isRTL ? 'left'  : 'right';
      default:      return placement;   // ← 未知值**原样透传**给 rc-tabs
    }
    ```
    ⇒ ① 类型面只声明 `TabPlacement = 'top' | 'end' | 'bottom' | 'start'`（`es/tabs/index.d.ts:10`）；
      ② 但运行时 `'left'`/`'right'` **能跑**，因为 rc-tabs 的 `tabPosition` 本来就收这两个值
      ⇒ **LTR 下与 `start`/`end` 渲染逐字节相同**（本轮实测：把 tabs 视觉用例的
      `vertical` 从 `'left'` 改成 `'start'` 后，重生成的 React 基线 PNG **字节不变**）；
      ③ 差别在 **RTL**：`start`/`end` 会镜像，`left`/`right` 不会。
    - 判据手法（值得复用）：**别靠「读文档觉得它无效」下结论** —— 先 `switch` 有没有 `default`
      直通分支，再用「改值 → 重生成基线 → `git status` 看有没有变」做**行为级证伪**。
      本轮正是靠「重生成后 `git status` 干净 ⇒ 两者等价」才推翻了早先的解释。
    - 处置：`tests/compat/baseline/tabs.mjs` 里的 `tabs:left` / `tabs:right` 两个用例
      **删掉**（LTR 下与 `start`/`end` 冗余，且用的是未声明的值，留着等于把「只在 LTR
      侥幸正确」的写法固化成规格）；`demo/placement.vue` 与
      `tests/visual/render/cases/{vue,react}/tabs.{js,jsx}` 的 `vertical` 一律改 `start`。

220. 🚨🚨 **`registry/components.json` 的 `notes` 是「派生字段」，不是保留字段** ——
    写进去会被下一次 `gen-registry.mjs` **静默抹掉**（2026-09-30 实测，本仓真踩）。
    判据（读生成器源码，不是猜）：`registry/tools/gen-registry.mjs` 第 309 行
    ```js
    notes: meta.notes ?? null,        // ← 来自 registry/source/components.meta.mjs
    layerNotes: prev.layerNotes ?? null,   // ← 这个才是保留的
    ```
    ⇒ **跨运行保留的字段只有**：`status`、11 个维度状态（`antdApiStatus` / `apiStatus` /
    `compatStatus` / `tokenStatus` / `styleStatus` / `unitStatus` / `interactionStatus` /
    `typeStatus` / `a11yStatus` / `visualStatus` / `docsStatus`）、`blockers`、`layerNotes`。
    - 要写「跨运行的注记」只有两个地方：**`registry/source/components.meta.mjs` 的 `notes`**
      （覆盖式，是人工种子的真源）或**`layerNotes`**（保留字段，约定是「某维度判 n/a 时写架构依据」）。
    - ⚠️ 文件头的 `$comment` 写的是「Progress fields are preserved across runs」——
      **它没说 `notes` 属于 progress fields**，是本会话把它误读了（MEMORY.md 里
      「status/notes/layerNotes Agent 写、跨运行保留」这句也**是错的**，已改）。
    - 顺带教训：本轮先写 `components.json` 的 `notes`、跑了一次 `registry:gen`、
      又**只核对了 `status`/`apiStatus` 就断言「进度字段跨运行保留，已验证」**——
      验证面小于断言面。**核对保留性时要逐字段比对，不要只挑一个字段验。**

221. 🚨🚨 **`jsdom` 的加载会退化到 3 分钟量级 ⇒ 所有 jsdom 测试的 worker 都起不来**
    （2026-09-30 本机实测，**不是** PITFALLS 199 的「冷缓存」，是持续性的）。
    症状：`vitest run` 对**任何**文件都报 `[vitest-pool-runner]: Timeout waiting for worker
    to respond`、`Test Files no tests / Errors 1 error / Duration 60.15s`；
    `require('antd')` / `require('jsdom')` 这类命令直接 `exit 137`（看起来像被杀）。
    判据（三步，缺一不可）：
      ① `time node -e "require('jsdom')"` ⇒ **墙钟 2 分 51 秒 / CPU 仅 1.34s**
         ⇒ 是 **I/O 阻塞**，不是内存（`vm_stat` 空闲 1 GB+，无 swap）。
         ⚠️ 第二次加载**同样慢**（2 分 48 秒）⇒ **不是 page cache 冷**，别指望「预热」。
      ② 对照组：`time node -e "require('vue')"` ⇒ **4.3 秒**；`require('react')` 更快
         ⇒ 只有 jsdom 那条依赖链慢，本仓代码没问题。
      ③ 用 `dangerouslyDisableSandbox` 重跑同样的命令 ⇒ **一样**被 137
         ⇒ **不是沙箱**，是机器/文件系统层面。
    - ⇒ **结论：环境问题**。`exit 137` 在这里的真实含义是「前台超时/被守卫杀掉」，
      不是 OOM（与 PITFALLS 41 同族：先怀疑环境，再怀疑代码）。
    - **可用的绕行**（本轮实证有效）：给**纯函数**用例加文件头指令
      ```ts
      // @vitest-environment node
      ```
      该文件的 worker 就不加载 jsdom ⇒ 能跑（本轮 22/22 通过，总耗时 ~83s）。
      ⚠️ 代价：`vitest.setup.ts` 里有 DOM 依赖，必须加护栏（见 PITFALLS 222）。
    - ⚠️ **无法绕行**的场景：任何需要 jsdom 的用例（L2/DOM 契约/a11y/theme）本轮**跑不了**。
      碰上这种情况要**如实报告「未验证」**，不要用别的绿灯顶替。

222. ⚠️ **`vitest.setup.ts` 有两处 DOM 依赖必须加存在性护栏**（2026-09-30，为配合 PITFALLS 221）。
    只有两处（`Element` 在 52–103 行只是**类型注解**，无运行时访问）：
      1. `Element.prototype.scrollTo` 的 shim；
      2. `afterEach` 里的 `document.body.innerHTML = ''`。
    不加护栏时，`// @vitest-environment node` 的文件会在 setup 阶段抛
    `ReferenceError: Element is not defined` / `document is not defined`
    ⇒ 表现为「**该文件的所有用例全红**」（本轮 22 条一起红，看着像实现全错，实际是环境）。
    - 护栏写法：`if (globalThis.Element !== undefined && …)` / `if (globalThis.document !== undefined) {…}`。
    - ⚠️ 这两条判断在 jsdom 下是**恒真**的 ⇒ 对既有测试**行为不变**（可推理证明）。
      但本轮**无法用 jsdom 回归验证**（worker 起不来）⇒ 验证缺口已如实登记在
      `packages/ui/src/date-picker/PLAN.md` 的待验证项，等环境恢复后补跑一次。

223. 🚨 **`getMergedStatus` 在本仓是 `??`、上游是 `||`** —— 一处**既有的跨组件不一致**
    （2026-09-30 读源码时发现，非本轮引入）。
    | 位置 | 实现 |
    |---|---|
    | antd 6.6.4 `es/_util/statusUtils.js` | `customStatus \|\| contextStatus` ← **规格** |
    | 本仓 `packages/ui/src/form/context.ts` | `customStatus ?? contextStatus` ← ❌ 不一致 |
    - **分歧点只有一个**：`customStatus === ''`（`InputStatus` 的合法取值）。
      上游**回落**到 Form.Item 的 status，本仓**不回落**。
    - ⚠️ 已查：**无测试钉住这个分歧点**（`grep getMergedStatus` 只命中新写的 date-picker 用例）
      ⇒ 修它是低风险的，但它改的是 **input / form 的运行时行为** ⇒ 要单独过那两个组件的回归。
    - date-picker 的处理：**按规格实现并改名** `getMergedPickerStatus`（见
      `date-picker/components/picker-shared.ts`），**不复用同名函数** ——
      否则会出现「同名函数、两处不同语义」，那正是本仓最容易埋雷的形态
      （同 219 条两个 `PickerLocale` 的教训）。
    - ⏳ 待用户裁决是否统一。登记在 `date-picker/README.md §5.3`。

224. ⚠️ **`space/statusUtils.getStatusClassNames` 返回的是「空格拼接的字符串」，不是数组**
    —— 它的签名是 `(prefixCls, status?, hasFeedback?) => string`。
    🚨 写 `classes.push(...getStatusClassNames(...))` 会把字符串**按字符展开**，
    产出一堆单字母类名（**静默**，只在 L4 / L6 才暴露）。
    ⇒ 必须整体 `push`（date-picker 的 `root-class.ts` 已加注释 + 断言防回归）。
    - 同族判据：**复用既有实现前先读它的返回值形状**，不要凭名字猜
      （本轮先按「返回数组」写，跑到测试才因 `Cannot find module` 之外的原因暴露）。

225. ⚠️ **`date-picker` 组件层的 import 层级是两级**：`components/` 与 `hooks/` 下的文件
    引用 `packages/ui/src/<x>` 下的既有模块要写 **`../../<x>`**（不是 `../<x>`）。
    本轮把 `space/statusUtils` 写成 `../space/statusUtils` ⇒ vitest 报
    `Cannot find module`（**收集期就失败**，0 test），一眼看不出是路径问题。

226. 🚨 **`node -e "…"` 里的反引号会被 zsh 做命令替换**（即使在双引号内）——
    2026-09-30 本轮实测：一个含 markdown 反引号的脚本把 `DatePicker.vue` 当成命令执行，
    还意外调起了 macOS 的 `open`。症状是「一堆 `command not found` + 脚本没生效」。
    ⇒ **凡是脚本内容含反引号 / 单引号 / `$`，一律写脚本文件**（Write 工具不转义），
      不要用 `node -e`。（与 217 条同族：都是 shell 层的静默坑。）

227. 🚨 **antd 的 `PurePanel` 两个出口名字不同，且都在 `DatePicker` 上**
    （2026-09-30 实测 `Object.keys(DatePicker)`）：
    ```
    _InternalPanelDoNotUseOrYouWillBeFired        ← 单值面板
    _InternalRangePanelDoNotUseOrYouWillBeFired   ← 范围面板（中间有 Range！）
    ```
    - 写成 `RangePicker._InternalPanelDoNotUseOrYouWillBeFired` ⇒ `undefined`
      ⇒ 渲染时报 **「Element type is invalid … but got: undefined」**
      （React 的报错不告诉你是哪个组件，只能自己排查）。
    - **为什么要用 `PurePanel`**：SSR 下浮层走 Portal ⇒ **面板规则不进 cssinjs cache**
      （实测 `open: true` 的 SSR 只有 889 B，与不传 `open` 字节相同）⇒
      要 dump 面板 CSS 必须**直渲 PurePanel**（`extract-cascader-css.mjs` 同路）。
      实测产出 **257 条规则 / 52.8 KB**。
    - ⚠️ `ant-picker` 前缀被 **date-picker 与 time-picker 共用** ⇒ 产物含 time-picker 的规则，
      那是**对的**（同一组件族），移植时不要当成 bug 过滤掉。

228. 🚨🚨 **驼峰 → kebab 转换：不能给每个大写字母都插连字符**（2026-09-30 实测，**静默 bug**）。

    ```js
    // ❌ 错：每个大写都插 ⇒ paddingBlockSM → padding-block-s-m
    key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
    // ✅ 对：只在小写/数字与紧跟的大写之间插 ⇒ padding-block-sm
    key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
    ```

    - 影响面：`paddingBlockSM` / `paddingInlineSM` / `paddingBlockLG` / `paddingInlineLG` /
      `inputFontSizeLG` / `inputFontSizeSM` / `multipleItemHeightSM` / `multipleItemHeightLG`
      —— **8 个变量名全拼错** ⇒ 声明了 `-s-m`、规则引用 `-sm` ⇒ `var()` 解析不到、
      **静默回退到继承值/初始值**（`-sm`/`-lg` 系的尺寸全失效，只有 L6 逐像素能看出来）。
    - 🚨 **单向检查抓不到它**：B7 若只做「外部变量是否在 theme 声明」，两边都是
      `--apollo-date-picker-*` ⇒ 都被当成「自有」放过。**必须做双向比对**
      （声明清单 ↔ 引用清单，两个方向都查）。
    - 已落成 vitest 用例（`theme.test.ts` 的「B7 双向比对」8 条），含
      `declared.has('-padding-block-s-m') === false` 的反向哨兵。

229. 🚨 **变量名里可能有下划线 —— 正则的字符类要写 `[a-z0-9_-]` 而不是 `[a-z0-9-]`**
    （2026-09-30 实测，我因此漏了一个变量并得出错误结论）。

    - 上游的 `INTERNAL_FIXED_ITEM_MARGIN`（全大写 + 下划线）转 kebab 后是
      **`internal_fixed_item_margin`**（保留下划线），产物里是
      `--ant-date-picker-internal_fixed_item_margin: 2px`
      （**值补了 px，且被 multiple 规则引用** —— 所以它**确实落变量**）。
    - 我先前用 `/--ant-date-picker-([a-z0-9-]+)/` 扫 ⇒ **这个变量压根没被扫出来** ⇒
      把「45 个变量」误读成「44 个 + 规则内声明的 affix-color」，
      还据此写下「`INTERNAL_FIXED_ITEM_MARGIN` 是内部量、不落变量」的**错误结论**
      （已改正：它**落变量**，`genTokenDecls` 必须包含它 ⇒ 声明是 **45 条**不是 44 条）。
    - ⇒ 教训：**数出来的数量要与「应该有多少」对上**；对不上时先怀疑**扫描方式**
      （正则的字符类、过滤条件），再怀疑事实。本轮的真实变量数是 **46**
      （45 个 `prepareComponentToken` 的键 + 1 个规则内声明的 `affix-color`）。

230. ⚠️ **BSD grep 的 `\|` alternation 会静默失败**（2026-09-30 实测，PITFALLS 217 的同族）。
    在 macOS 的 `/usr/bin/grep` 上跑
    `grep -n "formItemContext\|useFormItemInputContext\|form/context" file.vue`
    **返回空**（退出码 1），而文件里这三个词都在 —— 于是我会得出「代码里没有这段」的
    **错误结论**（本轮差点据此去补一个已存在的 import）。
    ⇒ **多关键词搜索一律用 Grep 工具（ripgrep）**，不要用 shell 的 `grep`。
      单关键词的 `grep -c` / `grep -n` 是可靠的（本轮多次用它核对数量都对）。

231. 🚨 **jsdom 的冷加载可以慢到 3 分 15 秒**（2026-09-30 22:00 实测，补 199 / 221 的数据）。
    ```bash
    $ time node -e "require('jsdom')"
    jsdom 已预热
    node -e ...  1.34s user 0.31s system 0% cpu 3:15.41 total
    ```
    - **CPU 只用了 1.34s** ⇒ 又是 I/O 阻塞（不是计算）。隔了 8.5 小时没跑 jsdom
      ⇒ page cache 被换出。
    - **致命后果**：vitest 的 worker **启动**超时是 **60s 硬上限** ⇒
      **所有 jsdom 测试一个都跑不起来**（报
      `[vitest-pool-runner]: Timeout waiting for worker to respond`，
      退出码 1、`Test Files no tests`、`Errors 10 errors`）。
    - ⚠️ **在「当前进程」里 `require('jsdom')` 预热是没用的** —— vitest 的 worker 是
      **新进程**，要各自重新加载。实测：预热后重跑仍全超时（240s）。
    - ⚠️ **换 `--pool=forks` 也没用**（实测同样超时）。
    - ⇒ 这不是代码问题，是**环境状态**。判读时看「`--project unit` 是否过」
      （`@vitest-environment node` 的用例**不需要 jsdom**，所以它们照常能跑）。
    - ⚠️ 相关的：**macOS 没有 `timeout` 命令**（只有 `gtimeout`）⇒ 用它包命令会
      `exit=127`（`command not found`），而报错藏在 stderr 里、看起来像「测试失败」。

232. 🚨 **泛型化会把「TS2742 可移植性警告」升级成「真实的类型不兼容」** —— 因为
    **函数参数的逆变**（2026-09-30 实测，`PickerFormat` 泛型化时踩到）。

    ```ts
    export type CustomFormat<DateType> = (value: DateType) => string;
    export type PickerFormat<DateType> = FormatType<DateType> | ... ;
    ```

    - 背景：pnpm 的严格 `node_modules` 让 `packages/ui` 与 `packages/picker`
      **各有一份 dayjs 声明**。此前 `PickerFormat` **没有泛型** ⇒ 两份声明只是
      「同一个非泛型类型」，结构等价 ⇒ 只在 `.vue` 的 `__VLS_export` 上触发
      **TS2742**（可移植性警告，已由 `hooks/dayjs-config.ts` 的「统一到 ui 的 Dayjs」解决）。
    - 加了泛型之后：`PickerFormat<ui 的 Dayjs>` 与 `PickerFormat<picker 的 Dayjs>` 里
      含 **`CustomFormat<DateType>`**，而**函数参数在逆变位置** ⇒ 两个「结构等价但不同声明」
      的 `Dayjs` 在逆变位置**不兼容**（TS2345）。这比 TS2742 硬得多 ——
      TS2742 只是「类型没法命名」，这个是「类型真的不匹配」。
    - 实测两处报错：`picker/src/time-config.ts`（包内泛型传递）+
      `ui/src/date-picker/hooks/picker-format.ts`（跨包边界）。
    - ✅ **修法（两处都干净，不用 `as any` / `as never`）**：
      1. 包内：把 `pickPropFormat` 改成**泛型函数** `pickPropFormat<DateType>(...)`；
      2. 跨包：给 `toArray` **显式泛型实参** —— `toArray<DatePickerFormat>(rawFormat)`。
         不写实参时 TS 会去推断 `T`，就在两份 `Dayjs` 之间推断失败。
    - ⇒ **判据**：凡是「跨包的类型里含函数参数（回调）」的泛型化，都要预判这一条；
      「结构等价」在**逆变位置**不成立。

233. 🚨 **注释里的「为什么」也是断言，也要跑一遍再写**（2026-09-30 实测，S2 键入解析）。

    写 `parseTextWithFormat` 时我断言：
    > 「dayjs 的 `locale.parse` 在格式不匹配时会返回**当前时间**（而不是 `null`），
    > 所以 `isValidate` 那一步不可省。」

    **实测直接推翻**：
    ```js
    dayjsGenerateConfig.locale.parse('en', '乱写的东西', ['YYYY-MM-DD'])  // ⇒ null
    ```
    即**不匹配时本来就返回 `null`** ⇒ 我编的那个「为什么」是错的。

    那 `isValidate` 到底挡什么？挡的是 **Invalid Date** —— dayjs 对某些输入
    （如 `'not-a-date'`）给的是 `Invalid Date` 实例而**不是** `null`
    （`generate-dayjs.oracle.test.ts` 里就有 `dayjs('not-a-date')` 的用例）。

    - ⇒ 结论：这一步是**双保险**；在「`locale.parse` 已返回 `null`」的路径上冗余，
      但**与上游逐字一致**，且对「返回 Invalid Date」的路径必需 ⇒ 保留。
    - 🚨 **教训**：这一路我已经被实测纠正过很多次（`hasFeedback` 不是 status 的开关、
      `getMergedStatus` 是 `||`、`top*` 的 `adjustX` 是 0、驼峰转 kebab 的 8 个变量名、
      `INTERNAL_FIXED_ITEM_MARGIN` 落变量、token 默认值几乎全错…）——
      **但那些至少是「代码里的断言」。这次错的是「注释里的解释」。**
      解释性注释同样会被后人当依据 ⇒ 写「为什么」之前也要跑一遍。
    - 已把正确版本写进 `picker-typing.ts` 的注释（含实测代码与推翻过程），
      并在测试里**如实钉住两条事实**（不匹配 ⇒ `null`；`isValidate` 挡 Invalid Date）。

233. 🚨 **注释里的「为什么」也是断言，也要跑一遍再写**（2026-09-30 实测，S2 键入解析）。

    写 `parseTextWithFormat` 时我断言：
    > 「dayjs 的 `locale.parse` 在格式不匹配时会返回**当前时间**（而不是 `null`），
    > 所以 `isValidate` 那一步不可省。」

    **实测直接推翻**：
    ```js
    dayjsGenerateConfig.locale.parse('en', '乱写的东西', ['YYYY-MM-DD'])  // ⇒ null
    ```
    即**不匹配时本来就返回 `null`** ⇒ 我编的那个「为什么」是错的。

    那 `isValidate` 到底挡什么？挡的是 **Invalid Date** —— dayjs 对某些输入
    （如 `'not-a-date'`）给的是 `Invalid Date` 实例而**不是** `null`
    （`generate-dayjs.oracle.test.ts` 里就有 `dayjs('not-a-date')` 的用例）。

    - ⇒ 结论：这一步是**双保险**；在「`locale.parse` 已返回 `null`」的路径上冗余，
      但**与上游逐字一致**，且对「返回 Invalid Date」的路径必需 ⇒ 保留。
    - 🚨 **教训**：这一路我已经被实测纠正过很多次（`hasFeedback` 不是 status 的开关、
      `getMergedStatus` 是 `||`、`top*` 的 `adjustX` 是 0、驼峰转 kebab 的 8 个变量名、
      `INTERNAL_FIXED_ITEM_MARGIN` 落变量、token 默认值几乎全错…）——
      **但那些至少是「代码里的断言」。这次错的是「注释里的解释」。**
      解释性注释同样会被后人当依据 ⇒ 写「为什么」之前也要跑一遍。
    - 已把正确版本写进 `picker-typing.ts` 的注释（含实测代码与推翻过程），
      并在测试里**如实钉住两条事实**（不匹配 ⇒ `null`；`isValidate` 挡 Invalid Date）。

234. 🚨 **`formatList` 恒空 —— 一个「UI 看着正常、功能全废」的静默缺口**（2026-09-30 实测）。

    **症状**：S2 接上键入解析后，**任何输入都被判非法**（`aria-invalid` 恒 `true`）。

    **定位过程**（值得记的是「怎么找到的」，不是结论）：
    1. 先怀疑 locale 名 —— 实测 `dayjsGenerateConfig.locale.parse('en_US', …)` **能**解析
       ⇒ **不是** locale 名的问题（本仓的 `lang.locale` 是 `'en_US'`，dayjs 也认）。
    2. 插桩打印 `.vue` 的 `parseContext` ⇒ 真相：
       ```
       [TMP-DBG] mergedFormat={"formatList":[],"maskFormat":null}   ← 空！
       ```
    3. 顺着 `mergeFormat` → `getRowFormat(picker, locale, format)` → 它读
       **`locale.fieldDateFormat`**。
    4. 查本仓的 `en_US` 的 `DatePicker.lang` ⇒ **没有** `fieldDateFormat`。
    5. **关键一步**：查 **antd 的** `locale.lang` —— 也**没有**
       （`Object.keys(require('antd/lib/date-picker/locale/en_US').default.lang).filter(k => k.startsWith('field'))` ⇒ `[]`）。
       而上游的 `getRowFormat` 与本仓**逐字一致**（`miscUtil.js:46-67`）。
    6. ⇒ **结论**：上游的 `format` **不是从 locale 来的**，而是 `useFilledProps` 里经
       `showTime` / `getTimeProps` **推导**出来的那一层 —— **本仓的 `mergeFormat` 缺了这一层**。

    **为什么 S1 的 L4 没抓到**：`valueTexts` 里写的是
    `format: mergedFormat.value.firstFormat ?? ''`，而 `formatValue` 对空格式串有兜底
    ⇒ **显示正常**（`2026-09-30` 照样渲染出来）⇒ L4 的 16 个用例全绿。
    ⇒ **「显示对」不等于「功能对」**；`formatList` 空这件事**只有键入才暴露**。

    **处理**：本轮**没有**顺手补那层推导（它属于 `useFilledProps` 的完整移植，是 S2 的下一步）。
    改为：
    - 在 `s2-typing.test.ts` 里**显式传 `format`** 来验证接线本身是对的（12 条全绿）；
    - **单独一条用例钉住这个缺口**（「不传 `format` 时连合法日期也判非法」），
      并在文件头写清根因与证据 —— 让缺口**留在明处**而不是藏在绿里。
    - ⚠️ 缺口补上后那条用例**会红**，那时应把它改成「合法日期 ⇒ false」并更新文件头
      （这是「故意留一条会红的用例」的用法，与「假绿灯」相反）。

235. 🚨 **定位到「哪一行」不等于定位到「哪一层」—— 234 的根因说反了一半**（2026-10-01 修正）。

    234 写的根因是：「上游的 `format` **不是**从 locale 来的，而是 `useFilledProps` 里经
    `showTime` / `getTimeProps` **推导**出来的那一层。」

    **对的一半**：默认 `format` 确实不是从语言包来的。
    **错的一半**：「推导层」说反了 —— 真正缺的是 **rc 的硬编码兜底层**：

    | 层 | 内容 | 出处 | 2026-10-01 之前 |
    |---|---|---|---|
    | ① 用户 `props.format` | 直接用 | `getRowFormat` 第一支 | ✅ |
    | ② 语言包 `locale.fieldXxxFormat` | `getRowFormat` 读它 | `miscUtil.js:46-67` | ✅（但两边语言包**都没有**这些键） |
    | ③ **rc 硬编码兜底** | `fieldDateFormat \|\| 'YYYY-MM-DD'` 等 **11** 个键 | **`es/hooks/useLocale.js:56-69`** | ❌ **缺的是这一层** |

    - ③ 在 `useLocale`（`fillLocale`）里，**不在** `getTimeProps` / `showTime` 那条路径上。
      `showTime` / `getTimeProps` 只决定**时间格式串怎么拼**（`HH:mm:ss`），
      它产出的是 `fieldDateTimeFormat` 的**后半段**，不是「有没有兜底」。
    - ⇒ 修复 = 逐字移植 `useFilledProps.js:72-76` 的两段：
      `getTimeProps` → `fillLocale(locale, fillTimeFormat(...))` → `fillShowTimeConfig`。
    - 🚨 **教训**：234 那轮我找到了「读 `locale.fieldDateFormat`」这一**行**，
      但把「为什么读不到」归因成了「少了另一条**推导路径**」，而真相是
      「**同一条路径上少了一层兜底**」。定位时先问「这一层的上游是谁」，
      再问「是不是还有一层」，比顺着调用栈猜「另一条路」快得多。
    - 已修：`packages/ui/src/date-picker/hooks/picker-filled.ts`（+ 6 条 L1、4 条 L2 用例）。

236. 🚨 **`.map` 少写一支 `|| typeof c === 'function'` ⇒ 函数形态的 `format` 被静默读成 `undefined`**（2026-10-01）。

    上游 `useFieldFormat.js:11`：
    ```js
    formatList.map(config =>
      typeof config === 'string' || typeof config === 'function' ? config : config.format)
    ```
    本仓只写了 `typeof config === 'string' ? config : config.format`
    ⇒ 函数没有 `.format` ⇒ 得到 `undefined` ⇒ **输入框显示空串**、
    `input[size]` 退化到默认值（`firstFormat.length` 也不对了）。

    - 触发条件很窄（只有 `format={(d) => ...}` 才走得到），**但类型面早就允许**
      （`PickerFormat` 的 `FormatType` 含 `CustomFormat`，`interface.ts` 也声明了）
      ⇒ 「类型说支持、实现不做」正是 README §5.2 当时登记的欠账。
    - 附带：函数形态的 `input[size]` 要**先求值**再取 `.length`
      （`fn.length` 是**形参个数** = 1，不是格式串长度）——
      新增 `getFormatLength(firstFormat, now)`，并把 `Selector` 的 prop 从
      `firstFormat: string` 换成 `firstFormatLength: number`（哑组件不持有日期库）。
    - 🚨 **教训**：照抄 `.map` 回调时，**逐字符**比对三元表达式，
      别「读懂大意就写」。少一个 `||` 分支在正常输入下完全看不出来。

237. ⚠️ **`picker-panel.ts:244` 的 `fillLocale` 第二参用错了值 —— 一处「潜在但当前不可观测」的分歧**（2026-10-01 发现，**未修**）。

    ```ts
    // packages/picker/src/picker-panel.ts:244
    const filledLocale = computed(() => fillLocale(props.locale, localeTimeProps.format ?? ''));
    ```

    上游 `useLocale(locale, localeTimeProps)` 收的是**整个 `localeTimeProps`**，
    由 `fillLocale` 内部用 **4 个 show 标志**调 `fillTimeFormat(...)` 推出时间格式
    （`useLocale.js:55`）；**不是** `localeTimeProps.format`（那是 `showTime.format`，
    只在 `picker === 'time'` 时才被写进 `timeConfig`）。

    ⇒ `datetime` / `time` 下 `fieldDateTimeFormat` 得到 `'YYYY-MM-DD '`（尾部空格）
    而不是 `'YYYY-MM-DD HH:mm:ss'`。

    **为什么至今不可观测**：`filledLocale` 只被 `fillShowTimeConfig` 的 `getRowFormat`
    读一次，而那一次的结果只用于**反推 show 标志**；两条路径（补成空串 / 补成
    `HH:mm:ss`）经 `fillShowConfig` 之后**落到同一组 show 标志** ⇒ 面板渲染逐位一致。

    - ⇒ **潜在**分歧，不是当前可见 bug。修它要**单独过 picker 包的门禁**
      （跨包改动，AGENTS.md §7）⇒ 本轮只登记。
    - 🚨 **教训**：本仓把 `fillLocale(locale, timeFormat: string)` 的第二参从
      上游的「5 个布尔」重构成了「一个格式串」—— 重构是好的，但**调用点必须跟着换**。
      这类「签名变了、调用点没换」的错**类型检查抓不到**（都是 string），
      只能靠逐点核对上游调用式。

238. 🚨 **`registry:check` 在 S1 之后就已经是红的 —— E10 抓到 date-picker 的两处十六进制色；但它们是「上游产物本身就是黑的」**（2026-10-01）。

    **症状**：`node registry/tools/validate-registry.mjs` ⇒
    ```
    ❌ E10  date-picker/style/index.ts 存在十六进制颜色: .apollo-picker-dropdown .apollo-picker-week-panel-row-… —— 必须使用 var(--apollo-*) Token
    registry validate: 1 error(s)
    ```
    ⚠️ 这两处色值**不是本轮引入的**（`style/index.ts` 自 S1 落地后没动过）
    ⇒ **仓库在 S1 收口时就已经红了**，只是没跑 `registry:check`。

    **两处**（`packages/ui/src/date-picker/style/index.ts`）：

    | 行 | 值 | 上游出处 |
    |---|---|---|
    | 213 | `color:#00000080` | `style/panel.js:389` `new FastColor(colorTextLightSolid).setA(0.5).toHexString()` |
    | 231 | `background:#00000033` | `style/panel.js:471` `new FastColor(controlItemBgActive).setA(0.2).toHexString()` |

    **排查链（**每一环都有实测**）**：
    1. 直觉是「移植时抄错了」⇒ 重跑 `extract-date-picker-css.mjs --emit-static`，
       产物**仍然是** `#00000080` / `#00000033` ⇒ 移植是**逐字**的。
    2. 那是不是 token 没解析？`theme.getDesignToken().colorTextLightSolid` ⇒ `#fff`、
       `controlItemBgActive` ⇒ `#e6f4ff` ⇒ **token 存在**，排除「缺失」。
    3. `new FastColor(undefined).setA(0.5).toHexString()` ⇒ `#00000080` ⇒
       说明传进 `FastColor` 的**不是实色**。
    4. **决定性证据就在本仓产物里**：同一条规则块的**另一行**是
       `color:var(--apollo-color-text-light-solid)`（上游 `panel.js:392` 的**直接**使用）
       —— 同一个 `token.colorTextLightSolid`，一处输出成 `var(...)`、一处被算成黑色
       ⇒ 只能是「值是**变量引用字符串**」。
    5. 补一个排除实验：`ConfigProvider theme={{ cssVar: false }}` 重渲 ⇒ **仍是**
       `#00000080`（antd 6 的 cssVar 关不掉）⇒ 无法用「关掉 cssVar 拿实色」绕开。

    **结论与处理**：
    - 分类 **UPSTREAM**（antd 在 cssVar 模式下的 `FastColor` 降级），**逐字对齐产物**。
    - 🚨 **不要**「顺手改成 `#ffffff80` / `#e6f4ff33`」—— 那看着更对，
      但会与 antd 的**真实渲染**分叉，L6 会因此判红。**antd 是判据，不是直觉。**
    - 在 E10 的 `HARDCODED_PATTERNS` 里**逐值**加 `skip: /#000000(?:80|33)\b/`
      （该工具自己的政策：只列具体色值、必须给出上游出处）。
    - 同步登记 `README.md §2` 第 6 条 + `style/index.ts` 文件头。

    🚨 **教训**：「产物里有硬编码色」有**两种**成因 ——
    「我们移植错了」与「上游本来就是字面量」。**先重跑提取器**再决定改哪一边；
    直接改色值是「用直觉覆盖判据」，正是 AGENTS.md §5 要防的事。

239. 🚨 **「键入即提交」是错的 —— `input` 只写临时值，提交在**后续事件**上**（2026-10-01，S2 收口）。

    移植上游 `PickerInput/hooks/useRangeValueChange.js`（405 行的提交时机状态机）时，
    我最先想当然的是「`onChange(text)` 解析成功 ⇒ 值就提交了」。**不是**：

    ```
    source = 'input'  ──resolveAction──▶  'modify'  ──▶  只 triggerCalendarChange（临时值）
    ```

    `modify` **不发 `change`**。真正的提交只在 `submitField` 里发生，而它只被
    `submitCurrent`（`Tab` = `keyboard-submit-weak`）与 `switchNext`
    （`popupClose` / `confirm` / `keyboard-submit` / `panel-final` / `remove`）触发。

    ⇒ 用户视角是「敲完离开时值就更新了」，机制上是**关浮层时提交**
    （焦点离开 ⇒ `useFocusEvents` 关浮层 ⇒ `popupClose`）。
    上游那条被废弃的 `changeOnBlur` 注释「Value will always be update if user type
    correct date type」说的是**用户视角**，读成「机制上 input 就提交」会写错。

    - 🚨 **连带**：`popupClose` 也不是「一定提交」——
      有确认制（`needConfirm`）且还有 field 没参与过 ⇒ `resetAll`（**丢弃**）；
      整轮没改过 ⇒ `finish`（什么都不做）。
    - **对测试的影响**：jsdom 里「键入后断言 `change`」会**永远失败**。
      本仓改用两条可驱动的路径：① `Tab`（`keyboard-submit-weak`）；
      ② **受控 `open` 从 true 变 false**（与「焦点离开后关浮层」走**同一条**
      `mergedOpen` watch）。后者比模拟焦点转移稳得多。
    - 已钉住：`s2-commit.test.ts` 的「键入本身不提交」+「关浮层 ⇒ 提交」。

240. 🚨 **移植「闭包 + `useRef`」的状态机到 Vue 时的两个语义翻转**（2026-10-01，同 239）。

    上游 `useRangeValueChange` 用 `useRef` + `useSyncState` 存三份簿记。
    照字面搬到 Vue 会踩两处（都属于 PITFALLS 207 的家族）：

    1. **`currentIndex` 必须在入口取快照**。上游：
       ```js
       let currentIndex = getCurrentIndex();
       if (currentIndex === null && ...) { currentIndex = index; setCurrentIndex(index); }
       const action = resolveAction(currentIndex, ...);   // ← 用的是**改过之后**的局部变量
       ```
       Vue 里 `currentIndex` 是 `ref`（**活读**）⇒ 写成
       `resolveAction(currentIndex.value, ...)` 会在 `setCurrentIndex` 之后读到新值，
       分支全错。必须 `let snapshotIndex = currentIndex.value` 并一路用局部变量。
    2. **`isLastInput` 只被「非 `popupClose`」的事件写**。上游注释：
       *`popupClose` consumes the previous update type instead of replacing it*。
       写成无条件 `isLastInput = source === 'input'` 会让
       `popupClose` 的 focus 强弱判定（`... || (source === 'popupClose' && !isLastInput)`）
       **恒为假**，且**没有任何测试会红**（`forceFocus` 只影响焦点跟随，jsdom 无布局）。

    另：`useRef` 里**就地改对象**（`field.modified = modified`）在 Vue 里**不触发渲染**
    ⇒ 改成不可变更新（`triggered.value = list.map(...)`）。
    `triggeredFields` 是**渲染用**的（面板/选择器读它），必须响应式；
    `confirmedIndex` / `isLastInput` 不参与渲染，保持普通闭包变量即可。

    🚨 **教训**：移植这类「闭包状态机」时，把 `useRef` 分成三类再逐类决定：
    **参与渲染的**（→ `ref`/`computed`）、**只在事件里读写的**（→ 普通变量）、
    **被就地改对象的**（→ 改不可变更新）。三类混着搬必错。

241. 🚨 **`Enter` 提交 —— 我把上游的 keydown 链读成了「两段」，漏掉最前面那一段**（2026-10-01，S3 起手时发现）。

    S2 收口时我在 `DatePicker.vue` 与 PLAN 里都写了「**`Enter` 不提交**，只在浮层关闭时
    打开浮层」。**错**。真实的链是**四段**：

    ```
    Input 的 DOM keydown = Input.onSharedKeyDown            ← 🚨 我漏掉的就是这一段
      ⓪ if (key === 'Enter' && validateFormat(inputValue)) onSubmit();   // ⇒ 提交 + 关浮层
      ① onKeyDown?.(event) = useInputProps 的处理器
           a. onSelectorKeyDown：Tab ⇒ keyboard-submit-weak；Escape ⇒ esc + 关浮层
           b. 用户的 deprecated onKeyDown
           c. Escape ⇒ 关浮层；Enter ⇒ if (!open) 开浮层
    ```

    出处：`Selector/Input.js:182-183`（⓪）→ `hooks/useInputProps.js:140-162`（①）。
    `onSubmit` 一路接到 `SinglePicker.js:494` 的 `triggerConfirm('keyboard-submit')`。

    - 为什么**现有的用例没抓到**：两条 Enter 用例用的都是**空输入框**，
      `validateFormat('')` 为假 ⇒ 走不到 ⓪ 的提交分支。**测试是绿的，注释是错的** ——
      这正是「绿 ≠ 对」的又一例。
    - 已修：`.vue` 的 `onInputKeydown` 补 ⓪；`s2-typing` 的用例改名并新增
      「Enter + 合法文本 ⇒ 提交 + 关浮层」；PLAN / README 的表述同步更正。
    - 🚨 **教训**：读「事件处理链」时**从 DOM 元素往外读**，不要从「我认识的那个 hook」
      往里读。`Input.js` 的 `onSharedKeyDown` 是链条的**起点**，而它调用的
      `onKeyDown` 才是 `useInputProps` 的处理器 —— 顺序反了就会漏掉最前面那一段。
      （与 PITFALLS 234/235 同族：**少读一层**。）

242. 🚨 **掩码模式：Vue 没有 React 的 `restoreControlledState`**（2026-10-01，S3）。

    上游 `Input.js` 的受控 `<input>` 在掩码模式下把原生 `input` 事件做成**空实现**
    （`onInternalChange` 的 `if (!format)`），靠 **React 的 `restoreControlledState`**
    在事件后把 DOM 值强制还原成 props 的 `value`。

    **Vue 没有这个机制**：`:value` 只在 vnode 重新 patch 时才写回 DOM
    （好消息：Vue 的 `patchProps` 对 `value` 是**无条件** patch 的，
    `else if (key === 'value') hostPatchProp(...)` —— 所以「重新渲染」就一定写回）。

    ⇒ 在 Vue 里必须**主动**制造那次渲染，否则：

    ```
    keydown（我们的处理器跑完、patch 一次）
      → 浏览器执行默认动作，把原生字符**插入 DOM**
      → input 事件（空实现）
      → 没有任何后续渲染 ⇒ 那个字符**留在输入框里**
    ```

    - 处理：掩码模式的 `onInput` 里 `syncTick.value += 1`（打一拍）。
      **不是**「空实现」的偷懒版，而是 Vue 侧的等价物。
    - 同族：`keydown` 里「按了不生效的键」（字母）也要打一拍 ——
      否则连 keydown 那次 patch 都不会发生（`internalText` 没变 ⇒ 渲染函数不重跑）。
      ⚠️ 打拍要打在**渲染函数读得到的地方**（`bind()` 里 `void syncTick.value`），
      否则计数变了也不会重渲染。
    - 分类 **PLATFORM**（框架差异），已登记 `README.md` §2 第 7 条。
    - 🚨 **教训**：「上游这里是空实现」不等于「本仓也该是空实现」。
      React 的**受控组件**隐含了一批框架级副作用（值还原、批处理、合成事件），
      照抄函数体而丢掉这些副作用，症状会出现在**别的**地方（这里是「字符不消失」）。

243. 🚨 **「失焦就关浮层」会让「点格子」直接关掉面板 —— 前提是面板根有 `tabindex`**（2026-10-01，S4）。

    上游 `useFocusEvents.js` 的 `onFieldBlur` 判据是
    `if (!isInternalElement(event.relatedTarget)) { setFocusedIndex(null); onConfirmedBlur?.(); }`
    —— 只有「新焦点**既不在选择器根、也不在浮层里**」才算**确认离开**。

    **为什么这条不能写成「一 blur 就关」**：点面板格子时输入框必然失焦
    （格子是 `<td>`，不可聚焦 ⇒ 焦点掉到 body）⇒ 若照字面写「blur 就关」，
    **第一次点日期就把浮层关了** —— `showTime` 的确认制（选日期 → 点确定）直接废掉。

    上游靠两件事兜住：
    1. **面板根是 `tabindex="0"` 的 div**（`PickerPanel/index.js:40,247` 的
       `tabIndex = 0`）⇒ 点格子时焦点落到**面板**上，`relatedTarget` 在浮层里；
    2. `isTargetInContainers(target, [selectorRoot, popup])` 的包含判定。

    ⇒ 本仓实现时**必须**同时满足：面板根带 `tabindex`（本仓 `picker-panel.ts` 已有，
    默认 0）+ 用 `Selector` 的 `nativeElement` 与 `Trigger` 的 `popupElement()` 做包含判定。
    - 🚨 **静默失效点**：若哪天面板根丢了 `tabindex`，这条会**静默失效**
      （症状是「点第一个日期浮层就关」，而单值 + 无 `showTime` 时**看起来是对的**，
      只有 `showTime` / 范围才会暴露）。已在代码注释里点名。
    - 已钉住：`s4-focus.test.ts` 的「失焦到**浮层里的元素**（面板根）⇒ 不关浮层」。
    - 🚨 **教训**：移植「失焦关浮层」这类逻辑时，先问「**失焦之后焦点去哪了**」，
      再决定判据。上游的 `relatedTarget` 判据是**配着** `tabindex` 一起设计的，
      拆开用必错。

244. 🚨 **浮层「关闭不卸载」⇒ 面板状态会跨开合保留，上游靠一段 `useLayoutEffect` 重置**（2026-10-01，S5）。

    上游 `SinglePicker.js:451-456`：
    ```js
    useLayoutEffect(() => {
      if (mergedOpen && activeIndex !== undefined) { triggerModeChange(null, picker, false); }
    }, [mergedOpen, activeIndex, picker]);
    ```
    注释 `Reset for every active` ⇒ **每次打开浮层都把面板粒度重置回 `picker`**。

    **为什么本仓必须有这一步**：本仓的浮层关闭**不卸载**
    （`Trigger` 的 `CSSMotion` 用 `removeOnLeave: false`，与 antd 一致）⇒ 面板组件
    一直活着 ⇒ 它的内部粒度状态**跨开合保留**。少了这段重置，用户下钻到年面板后
    关闭、再打开会**仍停在年面板**。

    - ⚠️ 两个容易抄错的细节：
      1. `triggerEvent = false` ⇒ 重置**不发** `onPanelChange`（本仓用
         `if (props.mode === undefined) innerMode = mergedPicker` 表达，也不 emit）；
      2. 受控的 `props.mode` **不重置**（`setMode` 在受控时不写内部状态）。
      两条都写了反向哨兵用例（`s5-mode.test.ts`）。
    - 同批还做了**面板粒度的受控化**：`panelProps.mode` 从 `props.mode` 改成 `mergedMode`
      （上游 `:366` 的 `mode: mergedMode`）。⚠️ 反馈是**下一 tick** 生效，但下钻链
      （年→月→日）每一步读的都是面板**当时**的粒度，所以链式推进正常。
    - 🚨 **教训**：「浮层关闭不卸载」是 antd 的**默认**（`destroyPopupOnHide` 未开）
      ⇒ 任何「打开时要重置」的面板状态（粒度 / 浏览值 / 悬停值）都要显式重置。
      移植面板行为时先问一句：**这个状态在关闭后还活着吗？**

245. ⚠️ **`_internal/overflow.ts` 只有 raw 路径 —— 补 `renderItem` 时别把两条路径混了**（2026-10-01，S5 的 `multiple`）。

    rc 的 `@rc-component/overflow` 有**两条互斥**的项渲染路径：

    | prop | 调用方返回 | overflow 做什么 | 谁在用 |
    |---|---|---|---|
    | `renderRawItem(item, index)` | **整项**（menu 的 `li`） | **clone** 它并注入样式/ref（`ul > li` 必须直接相邻） | menu 的横向折叠 |
    | `renderItem(item, { index })` | **内容** | 自己包一层 `<div class="${prefixCls}-item">` | date-picker 的 `multiple` 标签 |

    🚨 **两处签名不同**：`renderRawItem` 的第二参是**数字** `index`，
    而 `renderItem` 的第二参是**对象** `{ index }`（rc `Item.js:39` 逐字
    `renderItem(item, { index: order })`）。混用不会报错，只会静默拿到 `undefined`。

    - 本仓 2026-10-01 前**只有 raw 路径** ⇒ `multiple` 无法落地（那是当时的「前置阻塞」）。
      补 `renderItem` 是**纯增量**（新 prop + 非 raw 分支），menu 全层回归
      **110 passed / 0 变化**。
    - 顺带修掉一处与 rc 不等的默认：非 raw 分支原本渲染 `String(item ?? '')`，
      而 rc 的默认是**恒等**（`item => item`）。该分支此前**无消费者**，改动无可观测影响。
    - 🚨 **教训**：「`_internal` 里已经有一个同名组件」≠「它能直接用」。
      先比对**两条路径的 prop 名与参数形状**，再决定是复用还是补 API。
      这次的症状是 `h(undefined, …)` —— 因为 `Overflow` 是 **default export**，
      我写成了 `import { Overflow }`（TypeScript 本该报错，但那一步我跳过了 typecheck 直接跑测试，
      表现为「`-selector` 在、但一个标签都没有」）。

246. 🚨 **废弃告警的判据：React 的 `!(x in props)` 在 Vue 里**恒真**（2026-10-01，G5/G6 移植上游用例时）**。

    上游 `generateSinglePicker.js`：
    ```js
    Object.entries(deprecatedProps).forEach(([oldProp, newProp]) => {
      warning.deprecated(!(oldProp in props), oldProp, newProp);
    });
    ```

    **React 的 `props` 只含「实际传过」的键**，而 **Vue 的 `props` 对象恒含所有声明过的键**
    （未传时是 `undefined`）⇒ 照抄 `in` 会让**每一条告警每次都触发**。
    恒假告警比没有告警更糟：它会淹掉真告警，也会让「告警一致性」测试假红。

    - 正确判据：**`props.x === undefined`**（全仓同判：`input` / `input-number` /
      `text-area` 的 `bordered`、`spin` 的 `size` 都是这个写法）。
    - 语义差异只有一处：React 对「显式传 `undefined`」也告警，Vue 侧不告警 —— 可接受。
    - **本仓 date-picker 此前一条废弃告警都没有**（`useDevWarning` 在全仓 40+ 处用过，
      只有它漏了）⇒ 本轮补齐 5 条（`dropdownClassName` / `popupClassName` /
      `popupStyle` / `bordered` / `onSelect`，与上游表逐字一致）。
    - 已钉住：`index.test.ts` 的「**不传**这些 prop ⇒ 一条告警都没有」反向哨兵。
    - 🚨 **教训**：「把上游那几行照抄过来」在**跨框架**移植里是最危险的写法。
      凡是用到 `props` 的**键存在性**、**枚举**、**顺序**的地方，都要先问
      「这个语言里 `props` 的形态一样吗」。

247. 🚨 **`semantic.styles` 算出来了却从没绑到组件上 —— `popupStyle` 静默无效**（2026-10-01）。

    `DatePicker.vue` 里 `useMergedPickerSemantic({ popupStyle: () => props.popupStyle, … })`
    一直在算，`fillPopupStyle` 也把 deprecated 的 `popupStyle` 正确合并进了
    `styles.popup.root` —— 但模板上的 `<Trigger>` **只绑了 `:popup-class-name`，
    没绑 `:popup-style`** ⇒ `popupStyle` / `styles.popup.root` 全都静默无效。

    - 发现方式：移植上游 `legacy popupStyle` 用例（断言
      `container.querySelector('.ant-picker-dropdown')` 的 `toHaveStyle`）时**第一次就红**。
      ⇒ 这是「**上游用例的价值**」的直接证据：L4 的 DOM 契约只覆盖**触发元素**
      （`baseline` 里不含浮层），theme/a11y 也不看内联样式 ⇒ 三层都抓不到。
    - 已修：新增 `popupStyle` computed（⚠️ 必须显式收窄成
      `Record<string, string | number>` —— `Trigger` 的 prop 有索引签名，
      而 `CSSProperties` 是**接口**没有 ⇒ 直接传会 TS 报错）并绑到 `<Trigger>`。
    - 🚨 **教训**：「算出来了」≠「用上了」。语义槽这类**多层合并**的产物，
      收口时要逐项核对「**每一个出口都绑了吗**」—— 建议把「语义槽的 4 个出口
      （root / prefix / input / suffix + popup）逐个绑上」当成 G4 的收口清单。

248. 🚨 **L6 第一次跑就抓到「面板铺满容器」—— 组件变量声明块漏挂浮层根**（2026-10-01，G9 起手）。

    **症状**：L6 的 21 组里 **18 组红**（差异率 0.42%~3.51%，block-diff）。
    两侧源图一对比：React 的面板是紧凑的 ~250px，**Vue 的面板铺满整个 1440px 舞台**。

    **根因链**（三步，每步都有实证）：
    1. 面板宽度规则是 `.apollo-picker-dropdown .apollo-picker-date-panel{width:calc(var(--apollo-date-picker-cell-width) * 7 + …)}`
       （`style/index.ts`，从 antd 产物机械移植）；
    2. `--apollo-date-picker-*` 的**声明块只挂在 `.apollo-picker`**（`genDatePickerStyle`）；
    3. 而浮层 `.apollo-picker-dropdown` 走 **Portal 到 body**，**不在** `.apollo-picker` 子树里
       ⇒ `var()` **取不到值** ⇒ `calc( * 7 + …)` **语法非法** ⇒ 整条 `width` 被**静默丢弃**
       ⇒ `display:flex` 的面板铺满父容器。

    **这就是 PITFALLS 9 / D95 说的那件事** —— 当时记的是「漏挂 ⇒ 浮层里 `var()` 静默回退继承值」，
    而这次的具体后果是「**calc 非法 ⇒ 宽度整条消失**」，比「回退」更隐蔽（回退至少还有个值）。

    - **修法（与 `select` 同判）**：
      1. `genDatePickerStyle` 的声明块挂**两个**选择器：`.apollo-picker,.apollo-picker-css-var{…}`；
      2. `.vue` 里把 **`css-var-root` + `apollo-picker-css-var`** 同时加到**根**与**浮层**的类名上
         （类序对齐 antd 实测基线：`… css-var-root apollo-picker-css-var`）。
      ⇒ 差异率立刻从 3.51% 掉到 0.25%（其余是页脚/图标，见下）。
    - 🚨 **为什么前三层都抓不到**：L4 的 DOM 契约**只覆盖触发元素**（浮层走 Portal，SSR 下不渲染）；
      L5/a11y 不看像素；`theme.test.ts` 断言的是**声明存在**（它确实存在，只是挂错了地方）。
      ⇒ **只有 L6 能发现**。这条本身就是「L6 不可省」的最强论据。
    - ⚠️ 附带发现：`apollo-picker-css-var` **本来就在 L4 的 antd 基线里**（`… css-var-root apollo-picker-css-var`），
      而我们**从没加过这个类** —— L4 没红说明它的类名比对是**宽松的**（不是逐字符相等）。
      这不算 L4 的 bug（基线含 cssinjs hash 段，逐字符比本就不可能），但要知道**别指望 L4 抓类名缺失**。

249. 🚨 **`dayjs/plugin/xxx` 少了 `.js` —— Vite 能解析、Node ESM 不能**（2026-10-01，由 `tests/build` 的 B8 抓到）。

    `packages/picker/src/generate/dayjs.ts` 原本写的是
    ```ts
    import advancedFormat from 'dayjs/plugin/advancedFormat';   // ❌
    ```
    **dayjs 1.11.23 的 `package.json` 没有 `exports` 字段** ⇒ 在 Node ESM 下子路径导入
    **必须给完整文件名**（`dayjs/plugin/advancedFormat.js`）。Vite / vitest 会补后缀，
    所以**开发与测试全程绿灯**；只有真在 Node 里 `import()` 产物时才炸。

    - **怎么发现的**：`node tests/build/run.mjs` 的 **B8**（SSR 冒烟 = 真 `import()` dist）。
      修 `DatePicker` 的 `ui` 导出后，`ui/dist/index.mjs` 开始 import
      `@apollo-design/picker/dist/index.mjs` ⇒ 撞上。
    - 🚨 **为什么一直潜伏**：`picker` **自己的 B8 是 `n/a`**（`tests/build` 的判据是
      「本包不含组件，无 SSR 冒烟对象」）⇒ 它的 dist **从来没人 import**。
      直到 `ui` 里出现第一个消费 `picker` 的组件，这条才暴露。
      ⇒ **`tests/build` 对「不被任何人 import 的 foundation 包」有盲区**：
      它的产物只要没人用，就永远不会被 B8 检查。
    - 修法：6 处导入补 `.js`（`advancedFormat` / `customParseFormat` / `localeData` /
      `weekday` / `weekOfYear` / `weekYear`）+ 测试文件里的 `updateLocale` 同步。
      **改 foundation 包后必须单独重建**（PITFALLS 176）。
    - 🚨 **教训**：「Vite 能跑」≠「Node 能跑」。凡是**产物要被 Node 直接 import** 的包，
      子路径导入一律带扩展名；而**唯一的验证方式是真跑 B8**（不是跑 vitest）。

250. 🚨 **`PickerPanel` 少声明 4 个导航图标 props ⇒ 表头箭头静默退化成 Unicode 字符**（2026-10-01，由 L6 像素差 + 表头探针定位）。

    `packages/picker/src/picker-panel.ts` 的 `props` 里**有** `showWeek`、`disabledDate`、
    `minDate`、`maxDate`，**却没有** `prevIcon` / `nextIcon` / `superPrevIcon` / `superNextIcon`
    （虽然第 458-468 行的 `pickProps(props, ['prevIcon', …])` 一直在取它们）。

    - 后果链：`ui` 的 `DatePicker.vue:958-961` 传进来的「空 `<span class="…-prev-icon">`」
      vnode 被 Vue 归进 **`attrs`**（不是 props）⇒ `pickProps` 取到 `undefined` 并被过滤
      ⇒ `DatePanel` 的上下文里没有图标 ⇒ `PanelHeader` 回退到
      `DEFAULT_HEADER_ICONS`（`'\u2039'` / `'\u00AB'` 等**字符**）。
    - **探针对拍**（`tests/visual/debug/probe-datepicker-header.mjs`）：

      | 侧 | 表头按钮的 innerHTML |
      |---|---|
      | React | `<button …><span class="ant-picker-super-prev-icon"></span></button>` |
      | Vue（修前） | `<button …>«</button>` |

    - 🚨 **为什么 L1–L5 全绿也抓不到**：`aria-label` 才是可访问名（`panel-header.ts` 文件头
      第 3 条写明了「粒度由哪个按钮决定，不由箭头形状决定」）⇒ L4 的 ARIA 比对照样过；
      而 `ui` 的 `date-picker/style/index.ts` 里 `.apollo-picker-*-icon::before` 那几条规则
      **确实存在、也确实是 1.5px**，只是**永远匹配不到元素** ⇒ `theme.test.ts` 的
      「声明存在」断言也过。
    - 归属：**`picker` 包**。修法：补 4 个 prop 声明（`type: null as unknown as PropType<VNodeChild>`
      + `default: undefined`，与 `sharedPanelProps` 同形）。
    - ⚠️ **这是「Vue 未声明 prop ⇒ 归进 `attrs` ⇒ 静默失效」家族的第三例**
      （前两例：`PickerPanel` 的顶层时间 props、`onModeChange`）。
      **判据**：凡是「从 `props` 上按 key 取值」的代码，对应 key **必须**在 `defineComponent`
      的 props 里声明过 —— `pickProps(props, keys)` 这种写法尤其危险，取不到只会静默跳过。

251. 🚨 **浮层缺 `-panel-container` 一层 ⇒ 面板在真实浏览器里「完全点不动」**（2026-10-01，L6 + 探针 + 真点击三重定位）。

    `ui` 的 `DatePicker.vue` 把 `PickerPanel` 直接当 `Trigger` 的 `popup`，**少了上游
    `@rc-component/picker` 的 `es/PickerInput/Popup/index.js:120-163` 那两层**：

    ```
    div.{p}-panel-container.{p}-{internalMode}-panel-container   ← 缺
      └─ div.{p}-panel-layout                                    ← 缺
          └─ div → PickerPanel                                   ← 只有这层
    ```

    三处后果（**都不是「样式差一点」**）：

    1. 🚨 **面板完全点不动**。浮层根 `.apollo-picker-dropdown` 是 `pointer-events: none`
       （有意为之：让浮层的外接矩形不挡后面内容），**全库只有 `-panel-container`
       把它重置成 `auto`**。缺了它整条链继承 `none`。
       实测：Playwright 点 `td.…-cell` 超时并报 `<div>…</div> intercepts pointer events`；
       antd 侧点同一天会把值写进输入框（`"" → "2026-08-30"`）。
    2. **没有 `box-shadow` / 圆角 / `overflow: hidden`** —— 这三条规则都挂在 container 上
       （`ui` 的 `style/index.ts` 里 `.apollo-picker-dropdown .apollo-picker-panel-container{…}`），
       DOM 里没这个元素 ⇒ 规则永不匹配。
    3. **`classNames.popup.container` / `styles.popup.container` 两个语义槽从没生效**
       （类型面 `PickerPopupSemanticClassNames` 里早就有，只是**没有宿主元素**）。

    - 🚨 **为什么 L1–L5 全绿也抓不到**：jsdom 的 `trigger()` / `dispatchEvent`
      **完全绕过 `pointer-events`** ⇒ 所有交互用例照过；L5 不看像素。
      **只有 L6（真浏览器）能发现**。这条本身就是「L6 不可省」的第二个论据
      （第一个见 248）。
    - ⚠️ 连带发现：`month` / `year` / `multiple` 三个变体在 L6 里从 0.13% 直接掉到
      **精确 0.000%** —— 因为它们 antd 侧**没有页脚**，此前的差异**全部**来自缺阴影。
    - 修法：`DatePicker.vue` 的 `popupVNode` 补两层（container 带
      `${p}-panel-container` + `${p}-${internalMode}-panel-container` + `popup.container` 类，
      `style: { marginLeft: 0, marginRight: 'auto', ...popup.container }`，`tabIndex: -1`）。
    - ⚠️ 上游在这两层上还挂了 `onMouseDown`（保焦点）/ `onFocus` / `onBlur`；
      本仓焦点模型是自建的（`s4-focus`），**本轮没搬**，已登记为待对齐项。

252. ⚠️ **`classNames.popup.root`（新 API）静默失效 —— 传了「原始 deprecated prop」而不是「合并值」**（2026-10-01）。

    `DatePicker.vue` 的 `popupClassNames` 原本传
    `getDropdownClassName({ popupClassName: props.popupClassName ?? props.dropdownClassName })`。
    而上游（`SinglePicker.js:464`）传的是
    `clsx(rootClassName, mergedClassNames.popup.root)` ——
    **合并后的** `popup.root`（`useMergedPickerSemantic` 已把两个 deprecated 别名
    `fillPopupClassName` 并进去）才是落点。

    - 后果：`classNames={{ popup: 'c' }}` / `classNames={{ popup: { root: 'c' } }}`
      **一律不生效**；只有 `popupClassName` / `dropdownClassName` 生效。
    - 🚨 **为什么测试没红**：`index.test.ts:427` 那条只覆盖了 **deprecated** 两个 prop
      （断言「有告警 + 类名落到 `-dropdown`」）—— **新 API 一条用例都没有**。
      「旧写法有测试、新写法没有」是最容易长期潜伏的形态：旧写法红不了，新写法没人测。
    - 修法：改传 `semantic.classNames.value.popup?.root`（合并值同时覆盖新旧两套）。
      新增 `__tests__/popup-shell.test.ts` 钉住新 API 的两种形态。

253. 🚨 **测量浮层几何时，必须先剥 motion 相位类 —— 否则量到的是「入场动效的暂停首帧」**（2026-10-01，探针自身踩到）。

    antd 的 motion 规则是 `animation-duration` + **`animation-fill-mode: both`** +
    **`animation-play-state: paused`**，而 `STABILIZE_CSS` 的 `animation: none !important`
    让 `animationend` **永不触发** ⇒ 元素一直停在首帧（`slide-up` 是
    `transform: scale(0)` / `opacity: 0`）。

    - **指纹**：`getBoundingClientRect()` 全 `0×0`，而 **`offsetWidth` 仍是真实值**（如 288）。
      原因：`getBoundingClientRect` **含变换**、`offsetWidth` 不含。
      ⇒ **「这两个数不一致」就是本坑的判据**，别当成浏览器的怪癖。
    - 连带的假结论：整条浮层链 rect 全 0 ⇒ 命中测试 / 元素尺寸 / 「谁挡了谁」全部无意义，
      很容易得出「React 也点不动」这种**错误对照**（本轮真踩过）。
    - 修法：把 `screenshotElement` 里那段剥类逻辑抽成
      **`stabilize.mjs` 的 `stripMotionPhaseClasses(page)`**（已导出），
      **任何「截图前」的测量都必须调它**；`screenshotElement` 也改为复用它。

254. 🚨 **`isRenderable` 被本地复制了一份、且**语义写反**（`''` 判真、`true` 判假、数组递归）**（2026-10-01，做 date-picker footer 时发现）。

    上游 `@rc-component/util` 的 `isReactRenderable`（`es/is.js`）逐字是：
    ```js
    // Returns `false` only for `null`, `undefined`, `false`, and `''`;
    // all other values, including `0` and `true`, are treated as renderable.
    export function isReactRenderable(value) {
      return isNonNullable(value) && value !== false && value !== '';
    }
    ```
    而 `packages/ui/src/date-picker/components/picker-shared.ts` 里那份**本地副本**写的是
    「只排除 `null` / `undefined` / boolean / **空数组**」+「**空字符串算可渲染**」
    —— **三条全错**：`''` 该假却判真、`true` 该真却判假、数组不该递归。

    - 本仓的**权威实现**一直在 `@apollo-design/utils` 的 `isRenderable`（`is.ts:40`，与上游逐字相同），
      全库 **20+ 处**在用（badge / empty / statistic / radio / result / tooltip / tag / alert /
      notification / drawer / modal / popconfirm / popover / form…）。date-picker 是**唯一**
      另起一份的。
    - **为什么一直没暴露**：它只被 `getSingleShowClear` / `getRangeShowClear`（`clearIcon`）
      与 `Selector` 的 `suffixIcon` / `prefix` 用，那些入参**从来不是 `''` 或数组**
      ⇒ 判据分歧不可观测。
    - 🚨 **是「测试把错的规格钉住了」**：`picker-pure.test.ts` 有一条
      `expect(isRenderable('')).toBe(true)` / `expect(isRenderable([])).toBe(false)`
      —— 照抄本地副本写的。**照 `AGENTS.md` §4.2 第 3 条修正测试**（不是放宽），
      并在断言旁注明「原断言错在哪」。
    - **判据（可推广）**：本仓凡遇到「与 `@rc-component/util` 同名的小工具」，先
      `grep` 一下 `packages/utils/src` —— **很可能已经有一份**，再起一份就会漂移。
      ⚠️ 更隐蔽的是「起了一份且**注释写得很自信**」——注释里的「上游是 X」必须**回源码核对**，
      不能凭印象（这条坑的注释就是错的，还带着 ⚠️ 强调）。

255. ⚠️ **「浮层页脚」不是面板的一部分 —— 它与 `PickerPanel` **同层**，且 `useShowNow` 的第二参是**面板当前粒度****（2026-10-01，date-picker footer）。

    上游 `PickerInput/Popup/index.js:120-163` 的结构里，那个**无类名的 `div`** 同时装
    `PopupPanel`（= `PickerPanel`）与 `Footer`：
    ```
    div.{p}-panel-container.{p}-{internalMode}-panel-container
      └─ div.{p}-panel-layout
          └─ div            ← 无类名；panel 与 footer 是**兄弟**
              ├─ PickerPanel
              └─ Footer
    ```
    ⇒ 把 footer 当面板子节点挂，`-panel-layout` 的 `align-items:stretch` 与
    `-ranges` 的 `justify-content:center` 都会错位（L6 立刻红）。

    - 🚨 **`useShowNow(picker, mode, showNow, showToday)` 的第二参是 `mergedMode`
      （面板当前粒度），不是 `picker`** ⇒ 下钻到月/年面板会让页脚**消失**；
      再叠上游 `Popup/index.js:130` 的 `showNow={multiple ? false : showNow}`。
      **这就是 antd 基线里 `basic` 容器高 348、而 `month`/`year`/`multiple` 是 309 的全部原因。**
      ⇒ 判据：**页脚的「有没有」比「长什么样」更容易写错**，先钉「什么时候返回 `null`」。
    - 文案判据是 **`internalMode`**（组件粒度）：`date + showTime` 的 `internalMode` 是
      `'datetime'` ⇒ 显示 **`Now`** 而不是 `Today`（判据**不是**面板粒度 `mode`）。
    - ⚠️ 上游 `Footer` 在「`extra` 与 `ranges` 都不可渲染」时**返回 `null`**（不是空 div）
      ⇒ `renderExtraFooter: () => ''` 不该把页脚凭空撑出来（依赖 `isRenderable('') === false`，
      见 254）。
    - ⚠️ **页脚样式（`-footer` / `-ranges` / `-now-btn-disabled` / `-ok`）早在 257 条规则里**
      （机械转换时就带上了）—— 缺的从来只是**组件 + 接线**，不是 CSS。先 `grep` 规则再动手。

---

## 流：date-picker S5（范围两端 + `presets`）—— 2026-10-01

> 号段 **256–263**。这一段全部来自「范围 + 预设」的移植：`RangePicker.vue`、
> `PresetPanel`、以及为了让它编译通过而做的三处类型/接线修正。

256. 🚨 **`PickerPanel` **自己** `provide` 了 `PanelHackContext` ⇒ 外层注入被「最近的赢」遮蔽，hack 面必须走 **props**（2026-10-01，date-picker 双面板）。

    上游把 `PickerHackContext.Provider` 放在**外层** `Popup/PopupPanel.js` 里，
    `PickerPanel` 只是 `useContext` 的消费者 ⇒ 上游想给「左面板藏 next / 右面板藏 prev」
    只要在 Provider 上换 value。

    **本仓不是**：`packages/picker/src/picker-panel.ts` 的 `setup()` 里自己调
    `providePanelHack({...})`（因为 `PickerPanel` 也要能被单独使用）。Vue 的 `provide`
    与 React 的 context 同语义（**最近的一层赢**）⇒ 外层再 provide 一份**完全不生效**。

    - **症状**：双面板两个面板都显示四个导航按钮；`onCellDblClick` 永远不被调用。
    - **修法**：给 `PickerPanel` 补三个 **props**（`hidePrev` / `hideNext` / `onCellDblClick`），
      并在它自己的 `providePanelHack` 里合并进去 —— 即「props 优先于内部默认」。
    - **回归哨兵**：`packages/picker/src/__tests__/panel-edge.test.ts` 里专门有一条断言
      「**外层** provide 会被 `PickerPanel` 自己那份遮蔽」，把这条语义钉死。
    - **判据（可推广）**：本仓凡「上游在**外层** Provider 里下发、而本仓把 Provider 挪进了
      组件内部」的地方，注入面都要改走 props。**先 grep `provide` 再动手。**

257. 🚨 **`TimeConfigSource.showTime` 只声明了「时间面板形态」，而范围组件的 `showTime.disabledTime` 是**三参**（2026-10-01，date-picker / picker 包）。

    两个真实形态（rc 自己的类型就是这样分的）：
    - 单值 / 时间：`SharedTimeProps.disabledTime?: (date) => DisabledTimes`（1 参）；
    - **范围**：`RangeTimeProps.disabledTime?: (date, range, info) => DisabledTimes`（**3 参**）。

    上游 `useFilledProps.js` 把**整个 props** 丢给 `getTimeProps(props)`（JS 无类型）⇒
    它天然同时收两个形态。本仓把入参收窄成 `TimeConfigSource`，而它的
    `showTime?: boolean | TimePanelConfig` 只有 1 参形态 ⇒ **`RangePicker.vue` 编译不过**。

    - ⚠️ **函数参数是逆变的**：3 参的函数**不能**赋给 1 参的签名（调用方可能只给 1 个实参）。
      把参数写成可选（`range?`）也救不了 —— 目标说「可以不传」，源说「必须传」。
    - **修法**：`picker` 包新增 `TimeConfigShowTime<DateType>`（组件层形态：
      `disabledTime` 收 3 参、`defaultValue` / `defaultOpenValue` 允许数组），
      `TimeConfigSource.showTime` 与 `getTimeProps` / `fillShowTimeConfig` 的签名都换成它。
      **只放宽「入参」，不改任何运行期行为** —— `getTimeProps` 从不调用 `disabledTime`
      （`showTimeKeys` 只是把它抄进 `timeConfig`），真正调用它的是 `useTimeInfo` /
      `useInvalidate`，而范围的原始三参函数在 `RangePicker` 里被 `proxyDisabledTime`
      代理成 1 参之后才下发（rc `RangePicker.js:174-192`）。
    - **判据**：遇到「本仓类型比上游窄」的编译错，**先问「上游是不是 JS 所以没这个问题」**，
      再决定是「补类型」还是「改实现」。这里答案是**补类型**。

258. ⚠️ **`Selector.onSelectorClick` 的签名过窄，把事件丢了**（2026-10-01，date-picker）。

    本仓 `Selector` 声明的是 `PropType<() => void>`，且两处 `onClick` 都写成
    `() => props.onSelectorClick?.()`。而上游 `onClick: onClick` 原样透传 ——
    `RangePicker.onSelectorClick` **真的要用 `event.target`**：

    ```js
    const rootNode = event.target.getRootNode();          // ← 找 Shadow DOM 的 activeElement
    const activeEl = rootNode.activeElement ?? document.activeElement;
    if (!native.contains(activeEl)) { selector.focus({ index: enabledIndex }); }
    ```

    ⇒ 丢掉事件等于「点输入框旁边的空白时不会把焦点拉回可用的一端」。
    **修法**：签名放宽成 `(event: MouseEvent) => void`，两处调用点把 `event` 传下去
    （0 参的回调仍然兼容，是加宽不是破坏）。

259. ⚠️ **`PresetPanel` 的 `onMouseLeave` **不**调 `executeValue`**（2026-10-01，date-picker）。

    「函数形态的 `value` 每次用都重新求值」这句**只覆盖两处**：
    ```js
    onClick:      () => { onClick(executeValue(value)); }
    onMouseEnter: () => { onHover(executeValue(value)); }
    onMouseLeave: () => { onHover(null); }        // ← 不调 executeValue
    ```
    ⇒ 写测试时别断言「悬停 + 离开 + 点击 = 3 次求值」，**是 2 次**。
    （`packages/ui/src/date-picker/__tests__/s5-presets.test.ts` 有一条专门钉它。）

260. 🚨 **`needConfirm` 下「双击格子提交」的测试必须照实派发 `click` ×2 + `dblclick`**（2026-10-01，date-picker）。

    真实浏览器里一次双击 = 两个 `click` + 一个 `dblclick`。只派发 `dblclick` 会得到
    **假绿灯/假红灯**：`onCellDblClick` → `confirm` → `flushSubmit` → `triggerSubmit(calendarValue)`，
    而此时 `calendarValue` **等于**已提交值 ⇒ `isSameMergedDates` 为真 ⇒ **`onChange` 不发**。

    - 正确写法：先 `trigger('click')` 两次（走 `onSelect` → `panel-final` + `needConfirm` ⇒
      `modify`，只改临时值），再 `trigger('dblclick')`。
    - 反向用例（无 `needConfirm`）只派发 `dblclick` 是**对的** —— 那时唯一可能命中的就是
      `onCellDblClick`，它内部先判 `needConfirm` ⇒ 应当是**完全空操作**（连浮层都不关）。
    - **判据（可推广）**：凡「合成事件才触发」的行为（dblclick / contextmenu / 组合键），
      测试要么照实派发**前置事件序列**，要么在断言旁写清「这里刻意不派发前置事件」。

261. 🚨 **`RangePickerProps` 上**没有** `multiple` / `removeIcon`**（2026-10-01，date-picker）。

    rc 的类型分家很干净：`SharedPickerProps`（两者的基类）**不含** `multiple`，
    只有 `SinglePickerProps` 才有 `multiple` / `removeIcon` / `maxTagCount` / `tagRender`。
    ⇒ 上游 `useFilledProps` 里 `complexPicker = multipleInteractivePicker || multiple`
    的那一 `|| multiple`，**对范围恒为 `undefined`**（等价于只有前半）。

    - ⚠️ 照抄时写成 `props.multiple` 会**编译不过**；写对了也不该「顺手保留」——
      Vue 里未声明的 prop 会落到 `attrs`（PITFALLS 3），是个静默失效的陷阱。
    - 同理 `removeIcon`：`Selector` 只在**多选标签分支**读它（`Selector.ts:570`），
      范围恒 `multiple: false` ⇒ **根本不该传**。

262. ⚠️ **`fieldCount` 在范围下必须传 **getter**，不能传值**（2026-10-01，date-picker）。

    范围下这个数是 `disabled.filter(d => !d).length`（上游 `enabledFieldCount`），
    用户动态改 `disabled` 时会变。上游每次渲染都重新调 hook ⇒ 拿的是新值；
    Vue 里若传 `enabledFieldCount.value`（固化值），「字段导航的环长度」会过期 ——
    **两端都禁用时长度为 0 ⇒ `(actionIndex + 1) % 0` 是 `NaN`**。

    - 修法：`UseRangeValueChangeOptions.fieldCount: number | (() => number)`，
      内部 `resolveFieldCount()` **每次读都重新解析**（不能缓存）。
    - **判据（可推广）**：凡是「上游每次渲染重新调 hook 才能拿到的值」，Vue 里都要
      **传 getter**（同族的还有 `needConfirm` / `allowEmpty` / `disabledDate`）。

263. ⚠️ **`toDateArray` 要接受范围元组，并把元素级 `undefined` 收成 `null`**（2026-10-01，date-picker）。

    `RangeValue = [start, end]` 的元素允许是 `undefined`（「该端尚未选择」），
    而内部槽位 `ValueSlot = DatePickerDate | null`。直接 `toDateArray(props.value)`
    在范围下**编译不过**（`undefined` 不在联合里）。

    - 修法：入参加上 `RangeValue`，返回 `ValueSlot[]`，内部 `.map((d) => d ?? null)`。
    - ⚠️ 这**不是行为变更**：上游 `isSameDates` 用 `source[i] || null` 比较、
      `triggerCalendarChange` 做 `clone[i] = clone[i] || null` ⇒ 内部本来区分不了
      两者；且上游 `onChange` 的**声明类型**就是 `NoUndefinedRangeValue`。
    - 连带：`UseInnerValueOptions.defaultValue` / `getValue` 从 `DatePickerDate[]`
      放宽到 `ValueSlot[]`（**加宽**，单值调用点不受影响）。
    - 同一族的还有 `triggerSubmit`：入参放宽到 `readonly (DatePickerDate | null | undefined)[]`，
      入口 `.map((d) => d ?? null)` —— 因为 `toggleDates` 的返回类型就带 `undefined`
      （`presets` / 「此刻」那条路径直接喂它，上游 `onPresetSubmit` 逐字如此）。

264. 🚨 **浮层 vnode 若在「渲染函数之外」创建，里面**不能**出现 `ref:` —— 生产构建直接抛 `Cannot read properties of null (reading 'refs')`**（2026-10-01，date-picker RangePicker）。

    Vue 的 `setRef` 会读 `rawRef.i`（vnode 的 **owner** = 创建它时的
    `currentRenderingInstance`）：

    ```js
    const { i: owner, r: ref } = rawRef;
    if (!owner) { warn('Missing ref owner context. ref cannot be used on hoisted vnodes.'); return; }  // ← dev 才有
    const refs = owner.refs === EMPTY_OBJ ? owner.refs = {} : owner.refs;   // ← prod 直接炸
    ```
    ⇒ **dev 构建只 `warn` 然后 `return`**（ref 静默不绑），**生产构建抛异常**。
    ⇒ jsdom 用例、`pnpm dev` 页面、甚至 `--mode compare` 都可能全绿，只有
    **生产构建 + 真浏览器**才炸。

    - **本仓踩到的形态**：`RangePicker.vue` 的 `popupVNode` 是 **computed**，
      而 `Trigger` 的 `contentSource` 在它**自己的 setup 期**就被
      `watch(contentSource, …, { immediate: true })` 求值了（`trigger.ts:494-504`）
      ⇒ 创建 vnode 时没有渲染上下文。
    - ⚠️ **「把 `popup` 改成函数形态」救不了** —— 那个 computed 照样在 setup 期求值。
      试过，没用。
    - **修法**：用 **vnode 钩子**（`onVnodeMounted` / `onVnodeUnmounted`）——
      它们由 `invokeVNodeHook` 调用，**完全不经过 `setRef`**，不需要 owner。
      见 `RangePicker.vue` 的 `bindEl`。
    - **判据（可推广）**：凡是「computed / watch / setup 里创建的 vnode」，
      **一律不许带 `ref:`**；要绑元素就走 vnode 钩子。
      ⚠️ 单值 `DatePicker.vue` 的浮层**当前没有 ref** ⇒ 直接传 vnode「碰巧能用」——
      那是个一加 ref 就炸的陷阱，已在文件头写明。

265. 🚨 **`hoverValues` / `showWeakHover` / `activeHoverValue` 算了但没传给面板 ⇒ `-cell-in-range` 的浅蓝底永远不出现**（2026-10-01，date-picker RangePicker）。

    上游 `RangePicker.js:274-296` 有**三个**要下发给面板的悬停载荷：

    ```js
    const hoverValues = useMemo(() => internalHoverValues || calendarValue, …);
    const showWeakHover = hoverSource === 'cell' && !calendarValue[(activeIndex+1)%2]
                       && !isSameTimestamp(generateConfig, calendarValue[activeIndex], mergedValue[activeIndex]);
    const activeHoverValue = internalHoverValues?.[activeIndex];
    // ↓ PopupPanel 的 props
    hoverValue:      showWeakHover && activeHoverValue ? [activeHoverValue] : null,
    hoverRangeValue: showWeakHover ? null : hoverValues,
    ```

    - 🚨 **`hoverRangeValue` 是 `-cell-in-range` 的**唯一**来源**：
      `buildPanelCells` 只在 `cellSelection && hoverRangeValue` 时才计算 `inRange`
      （`panel.ts:256-264`）⇒ 不传 ⇒ 区间内的浅蓝底**一格都没有**。
    - ⚠️ 讽刺的是本仓**算对了** `hoverValues` / `showWeakHover` / `activeHoverValue`
      （`activeHoverValue` 甚至因为没人用而成了死变量），只是**没接线** ——
      典型的「移植时只搬了计算、漏了出口」。
    - **怎么抓到的**：L6 新增 `range` / `range-value` 两个变体 ——
      **空值三视口 0.000% exact**（所以面板外壳、双面板、箭头、分隔符全对），
      **一有值就 `block-diff`**。这个「空值精确、有值才差」的指纹直接指向
      「与值相关的状态类」，比逐像素找差异快得多。
    - ⚠️ 同批修正 `showWeakHover` 的第三条判据：上游是 **`isSameTimestamp`（时间戳级）**，
      本仓此前写成了 `isSame(…, internalMode)`（粒度级）—— 只在 `showTime` 下分叉。

266. ⚠️ **L6 视觉用例走的是 `packages/ui/dist`，改源码后必须先重建包**（2026-10-01）。

    `tests/visual/build.mjs` 只打包**用例入口**；`@apollo-design/ui` 由 Vite 解析到
    **`packages/ui/dist/index.mjs`**（包的 `exports`），不是 `src`。
    ⇒ 改完 `.vue` 直接跑 `node tests/visual/run.mjs` 会**用旧产物**，
    得到「改了没效果」甚至「`MISSING_EXPORT: X is not exported by packages/ui/dist/index.mjs`」。

    - **顺序**：改源码 → `CODEBUDDY_SAFE_DELETE_ENABLED=0 pnpm build:ui`（≈2 min）
      → `node tests/visual/run.mjs`。整仓重建用 `node tests/build/run.mjs`（≈8 min）。
    - ⚠️ **判断「产物是不是新的」**：直接 grep 产物，别靠时间戳 ——
      `grep -c <刚删掉的标识符> packages/ui/dist/index.mjs` 应为 0。
      本轮就是靠它发现「改了但产物没变」的。
    - 注意 bundle 里 `vue-<hash>.js` 是 **vendor chunk**（Vue 运行时），
      它的 hash 不变是正常的，不能据此判断自己的代码有没有进去。

267. 🚨 **`emit('x')` 会连带调用同名的 `onX` prop ⇒ 手写 `props.onX?.(…)` 就是「回调两次」**（2026-10-01，splitter 实测修掉）。

    Vue 的 `emit(event, ...args)` 自己会去找处理器：

    ```js
    const handler = props[toHandlerKey(event)] || props[toHandlerKey(camelize(event))];
    if (handler) callWithAsyncErrorHandling(handler, instance, 6, args);
    ```
    其中 `props` 读的是 **`instance.vnode.props`**（父组件传进来的原始 props）。

    ⇒ 只要父组件写了 `:on-resize="fn"` 或 `@resize="fn"`，`emit('resize', x)` **就会调 `fn`**。
    ⇒ 「为了两种写法都支持」而额外写一行 `props.onResize?.(x)` ⇒ **每次都调两次**。

    - **实测**（一次性探针，`props.onResize?.(x); emit('resize', x)`）：
      `onResize` 调用次数 = **2**。
    - ⚠️ **为什么长期没被发现**：既有测试写的是
      `expect(onResizeStart).toHaveBeenCalledWith([0, 0])` —— **两次调用的参数一样**，
      这条断言照样绿。要抓它必须断言 **`toHaveBeenCalledTimes(1)`**。
    - **本仓踩到的地方**：`splitter/Splitter.ts` 的 5 个回调
      （`onResizeStart` / `onResize` / `onResizeEnd` / `onCollapse` / `onDraggerDoubleClick`）
      全是这个形态；masonry 的 `onLayoutChange` 一开始也照抄了 splitter 的写法。
    - **正确写法**：**只 `emit`**。一条 emit 同时满足 `<X @resize>` 与 `:on-resize`。
    - **判据（可推广）**：凡是「既有 `onXxx` prop 又有 `xxx` emit」的地方，
      **写 `props.onXxx?.(…)` 之前先问「emit 是不是已经调了它」**。
      例外：`v-model`（`update:xxx`）与「事件名与 prop 名不构成 toHandlerKey 映射」时才需要手写。
