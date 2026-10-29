# Theme 基础包完整整改（2026-10-29）

本轮覆盖整个 `@apollo-design/theme`，没有以已知四个 Provider 注入问题限定范围。初始来源提交 `fc395a13d4c99d59aadda930290fce2833c52ef1`，进入本批次的 `ea36bd64` 与此前 Theme 文件逐 SHA 未变。先完整盘点并保存红灯，随后获授权成组实施。规范来源为 AGENTS、ARCHITECTURE、COMPONENT-RULES、COMPATIBILITY、TESTING、WORKFLOW；历史 Oracle/Registry 不替代公共契约。

## 完整清单与范围

初始包内 32 个跟踪文件全部盘点：19 个运行源码、6 个运行测试文件、1 个静态类型测试、1 个历史基准、README、build 配置、package metadata 与两份 tsconfig。新增回归覆盖输入、context/Provider、scope 所有权；所有公开导出详列于 [包 README](../../packages/theme/README.md)。

| 单元 | 全部核对项 | 本轮结论 |
| --- | --- | --- |
| 运行公开导出 34 | formatToken；9 个 CSS 导出；algorithms/getDesignToken/三算法；3 个 Seed/预设色导出；10 个共享派生函数；6 个 Vue 导出 | 不改真实导出名/数量，声明、传递、消费均纳入 |
| 类型公开导出 22 | Seed/Map/Alias/Global、各颜色/字号/尺寸/高度/样式/通用 Map、预设色模板字面量、MappingAlgorithm、ThemeConfig、ComponentTokenMap、DerivativeTokenWithOverride、TransformResult、CSSVarScope、ThemeContext | 逐接口字段/交叉类型核对；Known Alias 与无效 prefix 字段修正，保持可写 Ref |
| Seed/算法/纯工具 | default/dark/compact 与非空组合顺序；空数组；Seed/Map/Alias override；输入隔离；palette、字体、控制高度、尺寸、半径、颜色混合 | [] 和 undefined 修复；常规原取值保留；无新增非法数域/颜色解析能力 |
| CSS 转换/静态输出 | 默认/空/自定义 prefix，命名一致性、单位/ignore/preserve、boolean、扩展键、selector | 原型键修复；静态与动态变量一致，boolean 不伪装标量 |
| CSS scope | apply/旧键释放/keys 副本/remove 幂等/重用；独立 target/prefix；同名多 owner；原 inline/important；外部写；一次性调用 | 成组实现可释放所有权，一次性写入保持加法语义且不泄漏永久 owner |
| context/hooks | config 整值/深写、token 计算、最近注入、显式空源、可选 sourceActive、无 Provider fallback、app/SSR 隔离、旧自定义 context | 深 Ref、appContext WeakMap、惰性默认，原可选 metadata 兼容 |
| ThemeProvider 界面 | theme/injectCssVar/target 三 Props；default 槽/条件槽；无 emits/model/expose；attrs；受控更新/本地写；SSR/水合/启停/卸载重挂 | renderless 与显式 attrs 边界；mounted 写 DOM；props 拷贝；动态 scope 与业务身份保持 |
| 提供链/调用者 | ConfigProvider theme 继承/inherit=false/来源；Alias writers、JS 数据/默认计算、Tree 行高、Portal、Docs 暗色示例 | Theme 影响消费者纳入根回归；CP 可写 config、Tree 与 locale 大组分别归对应 owner，不冒领收口 |
| build/docs/tests | 根 JS/声明、tokens.css/package.json、CSS sideEffects、utils/peer Vue、dev Oracle、四套静态 CSS、README/指南/现有全部 tests | 错误导出名/上游强制同构/单文件产物注释修正；没有构建 dist 或宣称全库/发布通过 |

只读清单及原始指纹位于 `/tmp/apollo-theme-foundation-audit/scope.md`、`review.md`、`api-checklist.json`、`inventory-classified.json`。盘点时全库有 322 个直接导入/提及文件，UI 运行位置中 103 个直接运行导入、37 个仅类型、5 个仅提及；103 中包括静态 style/default 计算，不等于 103 个活跃 Provider writer。其余位置包括测试/工具、Demo/Docs、开发 test-utils 与注释。385 个源码文件含字面变量、170 条资料/metadata/历史证据另有分类索引，不把字符串命中当作行为证据。并发新增消费者由根最终同源回归补齐，初始清单不是冻结主树。

## 必修项与裁决

1. Provider 在 setup 冻结 injectCssVar/target/prefix；SSR 无 document 抛错，给 DOM target 也会在服务端写 382 个变量。改为 mounted 中立即建立、后续 post flush 的响应式 watch，清理前一 scope，prefix 读取当前有效 config。
2. 同 target 多 scope 卸载会删除另一活跃 Provider 的变量，原 inline/priority 被丢弃。改为按元素/变量的弱引用 owner 表，最近 apply 可见；释放只撤本 owner。普通外部写入与一次性明确交权边界单列迁移。
3. fallback 模块单例使不同 SSR apps 共享可写数据。旧 shared fallback 测试与实例隔离要求矛盾，根保留原显式来源用例，改为同 app 多 reader 共享并新增跨 app/并发隔离；显式 provide 仍可有意跨 app 共享。
4. 工厂 shallowRef 令 `config.value.token.fontSize` 深写无响应；Provider 直接持有 props 对象还可能反向变异输入。改深 Ref，并对 Provider 输入的 token、components 各组件记录、algorithm 数组复制；外部 props 更新重新克隆生效。
5. [] 缺 489 字段且产生 3 个非有限值；undefined override 产必填字段 undefined/NaNpx。[] 默认派生，undefined 在 Seed 与 Alias 覆盖入口忽略。原 purity 上游断言有明确改判及替代覆盖，不删除原基准/放宽默认值对照。
6. Known Alias 错误值可借 Seed+泛索引签名通过类型，返回类型却声明正确字段。改为 Partial<AliasToken & Record<…>>，直接 formatToken 同一约束；未知扩展与省略保留。
7. PRESERVE/IGNORE/UNITLESS 原型命中使 constructor 等合法扩展无变量；refs 的普通对象 setter 还会丢 __proto__。规则表 own-key 检查、标量收窄及 refs 的安全 own 属性构造统一修复。
8. renderless Provider attrs 无宿主却触发继承警告，槽类型也泛收运行时不消费的名称。明确 inheritAttrs=false 与 default VNodeChild 槽，无新增 wrapper/事件/model/expose。
9. `ThemeConfig.prefixCls` 原承诺改 ant，实际只在 CP 传递、无 DOM/CSS 消费。初步“保留 metadata”的建议经完整链路评审被取代：开发期直接删除死接口，DOM 使用 CP 顶层 prefixCls，变量使用 cssVarPrefix；由 Theme/CP owners 同组记录迁移。
10. CP 的 config 声明可写却提供 readonly computed 为联名根因，归 CP owner。Theme 保持现有可写 Ref，不把类型改 readonly 掩盖失败。CP 完整结构/语言链另组验收；本里程碑只接删除无效 prefix 搬运所需最小关联修改。

Ref 容器重绑、直接修改计算 Token/默认导出对象未被承诺为更新路径；本轮不冻结这些旧类型。合法具体颜色与正常数值有意义输入保留；blue 空串完整链路会提前抛解析错误，不能把后面的静态条件分支宣称为已复现缺 Hover。0/极小/负/非有限字号无新增归一化政策，边界在 README/迁移中明确。Tree 的 canonical Token/虚拟估算关联由根同组定界，不为此擅改 useThemeConfig 无 Provider 返回 undefined 的契约。

## 实际源验证与剩余门禁

| 验证 | 结果/证据 |
| --- | --- |
| 改实现前旧运行测试 | 6 文件 88/88，实际 exit0；baseline-before.* |
| 完整只读探针 | 29 项 14 通过/15 失败，实际 exit1；含政策观察，不等于 15 个独立缺陷；probe-* |
| 直接实施红灯 | 新增 3 文件 18 项，16 红/2 绿，实际 exit1；implementation-red-*；Alias 错误类型负例真实 exit2 |
| Theme 全源运行回归 | 9 文件 108/108，实际 exit0；覆盖原 88 项及输入/所有权/context/Provider 回归，保留全部既有默认数值基准 |
| 类型 | 全 Theme 源码与测试 tsc --noEmit 实际 exit0；15 个类型场景、9 条有原因负例；槽宽泛定义的红灯另保留 |
| L0 scoped coverage | 19 源码文件非空采集，实际 exit0；语句 296/299=98.99%、分支 160/168=95.23%、函数 66/67=98.50%、行 281/282=99.64%；原 95/90/95 门槛未降 |
| 实际浏览器 | Node SSR + Chrome 水合/草稿/焦点选择区/启停/target/prefix/深写/props 恢复/多 owner/原 priority/重挂，17/17；browser-source.json，首方加载 SHA 前后相同 |
| 根真实 Node SSR 来源链 | 48/48，零 warning、无 DOM globals；原 40 显式来源 + 同 app 共享、顺序/并发隔离、显式跨 app 共享；根负责证据 |
| 格式 | owned Theme/browser 文件 Biome 检查，不自动改其它 owner 文件 |

临时 Vite/Vitest alias 指向首方源码，guard 禁止首方 dist。Browser 支持 Root 在冻结产物上用 published 模式复跑，自身不构建包。初次 /tmp 路径加载 0 test、浏览器启动返回值误用、fixture 缺 Vue flags、coverage 绝对 glob 空采集及负例注释被格式化移位均单独保留并修正；这些是验证配置问题，不能当作产品红灯、有效覆盖率或通过。

Theme 源码/类型/browser 验证不代表全库完整交付。根仍须在最终同一提交执行受影响消费者、严格类型、统一构建、声明/exports/CSS/体积/依赖/发布消费者、适用视觉/Docs 与全量门禁，并更新 Registry/全局规范链接；本 owner 不构建 dist、不改 Registry/指南/矩阵/PNG、不提交推送。CP locale/稳定宿主等大组不计本 Theme 里程碑完成。精确 owned 冻结 SHA、退出码和剩余边界交接文件由 `/tmp/apollo-theme-foundation-audit/freeze/` 提供。

主线程同批发布声明复核补齐原生DOM引用：`ref<HTMLDivElement | null>(null)` 直接绑定ThemeProvider.target原被类型拒绝，实际运行时早已通过`target ?? document.documentElement`接受空值。已保存实际发布SFC的TS2322红灯，声明补为HTMLElement/null/省略；不新增运行时目标能力。补source正负例、真实null目标切换/文档根恢复与SSR检查，完整回执由主线程整合。

同组原生作用域复核同时对齐SVGElement目标：CSS变量原语和Provider沿用已有DOM style操作，仅补精确目标类型。原生SVG引用、实际fill绘制、目标撤回与业务节点身份有独立覆盖；不加入新的CSS运行时。

CSS变量转换/静态声明与scope/一次性写入接受`Partial<AliasToken>`，使原本已有效的部分变量操作具有准确声明；已知字段类型保持精确。scope.apply缺失字段仅释放自己的旧写入，一次性apply保持加法语义，原有所有权与原生覆盖规则不分叉。

## 主线程同批最终源码里程碑

隔离候选109运行、16类型场景/11有原因负例、19实际发布浏览器、196相关发布消费及源/发布各48个Node SSR通过；1978关联回归、根严格类型、实际Theme/UI构建和严格L7均有独立回执。当前源码L0覆盖率98.99/95.23/98.50，门槛未降。Root补充的native nullable/HTML/SVG与稀疏变量输入只有精确声明变化，1971份已验证runtime/CSS文件逐SHA相同。详见[本阶段精确证据和剩余边界](evidence/theme-foundation-source-acceptance.json)。ConfigProvider/Tree等交叉单元、正式视觉/Docs整批验收及最终同提交全库门禁仍开放，完整组件交付保持21/72。用户要求当前已启动子任务收尾后暂停，不再启动下一批。
