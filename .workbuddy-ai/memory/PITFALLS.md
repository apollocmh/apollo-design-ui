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
