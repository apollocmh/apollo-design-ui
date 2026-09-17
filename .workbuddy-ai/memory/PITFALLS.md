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
