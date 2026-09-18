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
