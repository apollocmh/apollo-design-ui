# Input 当前主题尺寸链盘点与修复

范围：`INPUT-SIZING-20261029`，盘点基准 `2ef3206961be6511048a7bddec34d8b724adebf2`；
同轮 Space 修复后的源码基准为 `2f47f423a8c229a4f763593c4cda0f401ed06731`。
本单元覆盖当前字体/padding、19 个既有 Token、尺寸继承、显式覆盖与 TextArea 量测。
不以本轮结论代表全 Input 行为审计或全库验收。公共变更和 small 的明确取舍见
[迁移说明](../migrations/input-sizing-contracts.md)。

## 修改前完整盘点与红灯

实施前已盘清 Input、affix、Password、Search、TextArea 裸/clear/count/autoSize、
legacy addons、Group、OTP 的 size、Provider、实际根与控制节点；逐一追踪 19 个字段的
声明→传递→消费→实际行为。详细计划保存在 `/tmp/apollo-input-sizing-plan.md`。
全部当前失效接口与关键缺陷纳入本轮；未发现新业务字段需要扩张公共 API。

发布包红灯以冻结的 `/tmp/apollo-css-visual-3214ee10` 原生 ESM 和真实 CSS 运行，
不构建包或夹具。32 阶段、每阶段 10 类场景，163 条断言为 98 失败、65 正常，
0 浏览器错误/警告，所有读者退出，源码与产物 SHA 不变。原始 147 条、83 红/64 正常
及最终 163 条均保留于 `/tmp/apollo-input-sizing-review/red-initial-*`、`red-*`。

首次仓库复现命令：

```sh
pnpm exec vitest run --project unit packages/ui/src/input/__tests__/sizing.test.ts --maxWorkers=2
```

实际 16 条为 15 失败、1 正常，日志为 `/tmp/apollo-input-sizing-review/repo-red.log`。
复现覆盖当前 Alias、全 19 个组件字段、Provider style、Group/OTP size；
真实浏览器另确认无效阴影、affix 间距及 autoSize 裁切。
原生 style 的对象/字符串/数组、stylesheet 私有变量和合法阴影是保留的正常对照。

## 完整清单收口

| 链路 | 当前实现与保留契约 | 证据 |
|---|---|---|
| 字体与非负 padding | 静态 CSS 消费当前 Alias；显式组件字体参与默认 padding，不设固定 Input 高度 | 四算法×三尺寸×三视口，实际字体、行高与自然几何 |
| 19 个既有 Token | 所属 composable 传当前 Alias 和显式字段；零值/长度字符串、替换/清除有效 | 全字段声明与动态仓库回归；实际字号、padding、间距、背景和状态绘制 |
| inputAffixPadding | 补齐第 19 个既有字段的静态声明，前后缀 margin 实际消费 | 实际 prefix/suffix margin，不只检查变量存在 |
| Provider 与覆盖 | Input/TextArea/Password 接通 context.style；主题数据最低优先 | Provider、semantic、原生对象/字符串/数组、stylesheet 正对照 |
| 来源身份 | 根据共享sourceActive的显式false判定无源，不根据config空键退出；缺metadata的旧式提供者仍按显式源消费 | 空TP/factory/旧context默认重置，穿无theme CP的最近空源；无源CSS-only继承、来源启用/清除与身份保留 |
| 逻辑根与内部节点 | plain/affix/group 外根声明默认，明确内部节点继承；`:where` 保持单类权重 | wrapper 变量可消费；首轮发现并修正权重回归，原 stylesheet 断言保留 |
| Group | size 传给 SpaceCompact；不再用后代 CSS 压过显式子 size | Input、Button 和 Select 的真实消费与局部优先 |
| OTP | local→Compact→Provider；根和格子一致，专用横 padding 保留 | Provider/Compact 冲突、显式 size 与 NoCompactStyle |
| Search | 按钮自然 stretch，不注入自有 min-height，调用者 height/min-height 按 CSS 生效 | 四算法×三尺寸×默认/自定义按钮，显式18/60px与调用者最小高度；默认仍自然齐平 |
| TextArea | 大号行高不再被基础规则盖掉，rows/最小高度不变 | 裸/affix 的实际当前 line-height；单行 Input 表不套给 TextArea |
| autoSize | 复用实际量测属性签名；post-flush、原生祖先观察及排版结束事件，迁移重绑，无轮询 | 同宽字体/padding、class/style/变量、CSS过渡、无关变化去重、多实例、关闭/重开、卸载重挂与清理 |
| 值、事件与身份 | 不增 model/emit/ref，保留输入草稿、focus/selection | 受控/非受控/IME/Search/Password/OTP 原回归，新增主题更新身份与 SSR 水合 |
| Demo/API/迁移 | 更新既有 component-token Demo，双语说明覆盖层级和自然行盒 | 真实 Demo 切换与草稿保留；全部 24 个 Input Demo 严格类型检查 |

small 按已明确的自然下限处理：default/dark 为 24/32/40，compact/both 为 22/28/35。
compact 的 21px 是 nominal 目标，不能容纳当前 20px 行盒和两侧边框；保留 22px，
通用 Compact/Theme/Button 没有被修改，也没有外框高度恒等承诺。

## 源码验证

第一次 933/933 的源码冻结已被独立复核撤销：该集合只验证了已采样场景，
没有覆盖祖先样式同宽变化与显式较小按钮高度，不能据此证明这两条链路正确。
复核证据 `/tmp/apollo-input-sizing-peer/reproduce.json` 的两种 CSS 模式都确认
autoSize 保持54px而 scrollHeight=99、clientHeight=52，真实 input 后才变101px；
显式按钮18px则被自有 min-height 夹为32/40px。此前933结果与旧SHA保留为历史阶段。

补充入库红灯为 `autosize-style.test.ts` 的4条（3红/1正常）及完整浏览器969条
（14红/955正常），0浏览器错误/警告、读者退出、源码/产物指纹不变；日志位于
`/tmp/apollo-input-sizing-review/peer-repo-red.log`、`peer-browser-red-valid.log`，
浏览器原始证据为 `/tmp/apollo-input-sizing-peer-red-valid/source-all-evidence.json`。
第一次补充浏览器夹具在原生 DOM 迁移后仍用旧祖先选择器定位而超时；已改为稳定的
原生 aria-label 定位，该工具错误不计入生产缺陷红灯。仓库 MutationObserver 是显式驱动桩，
后续测试按既有桩协议派发，自动原生派发、同宽几何与迁移则由真实浏览器验证。

扩大到四算法的按钮边界后，首次修复的1024条仅剩1红：CSS字号/padding过渡结束后
仍需最终量测。先补2条仓库失败回归（其余4条正常），再接通相关控件/祖先的原生
transition/animation结束与取消事件，统一使用实际sizing签名去重；禁用/卸载同时
断开观察和事件。没有轮询、固定输入高度或新增兼容class。

1028阶段随后保留为历史，再按主任务已实现的共享来源身份补修Input consumer。
生产方只读；本任务不修改Theme/ConfigProvider。共享约定是显式factory/ThemeProvider
始终活跃（空配置也提供默认数据）、无源回落不活跃、ConfigProvider按有效合并主题动态标记，
最近有效context优先。`useInputTheme`现在仅在`sourceActive?.value === false`时退出。
不能继续用config是否有键代替来源身份。

该补修先入库红灯：sizing24条中5红/19正常；真实浏览器1069条中30红/1039正常，
0错误/警告、全部读者退出，Input与只读producer/产物SHA不变。Input和TextArea在compact
CSS-only作用域内，显式空TP、穿无theme CP的空源、最近空源、factory和旧式context
错误地显示12px/28px，应为14px/32px。无theme CP保留CSS继承原本正常，继续作为正对照，
没有被伪称为失败。证据位于`/tmp/apollo-input-sizing-sourceactive-red/source-all-evidence.json`，
仓库日志为`sourceactive-repo-red.log`。19字段、公共props和数值prepare API不变。

适用回归按实际命令分别记录，不把有交集的集合相加为全库数量：

```sh
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/input/__tests__ packages/ui/src/space/__tests__ packages/ui/src/button/__tests__ packages/ui/src/mentions/__tests__ --maxWorkers=2
pnpm exec vitest run --project unit packages/ui/src/input/__tests__/sizing.test.ts packages/ui/src/input/__tests__/autosize-style.test.ts packages/ui/src/select/__tests__ --maxWorkers=2
pnpm exec vitest run --project types packages/ui/src/input/__tests__/type.test-d.ts packages/ui/src/input/__tests__/search-otp.test-d.ts --maxWorkers=2
pnpm exec vue-tsc --project /tmp/apollo-input-sizing-review/tsconfig.strict.json --noEmit
pnpm exec vue-tsc --project /tmp/apollo-input-sizing-review/tsconfig.types.json --noEmit
```

来源补修后的定向Input集合为30/30（sizing24条、祖先样式/清理6条），
sizing+autoSize+Select集合为6文件、124/124。第一次1138关联批次与重类型进程重叠，
11项主题用例在原5000ms内超时；没有加大阈值。串行重跑为1137/1138，剩余Space
旧断言把显式空TP后的默认paddingXS=8px错误地期待为空。Root依明确来源契约修正
Space双节点默认值，并补恢复、清除和无源负控，未由本任务跨界修改Space。

Root最终统一四project关联门禁真实exit=0：`/tmp/apollo-theme-input-related-green.json`
与同名`.log`，72次文件执行、1966/1966。它包含原Input/Space/Button/Mentions
33个文件（Root新增Space覆盖后为1139条，全部通过），以及ConfigProvider、Theme Vue、
writer、Flex/Alert/Layout、Tree。不同集合有交集，不相加冒充全库门禁。

两个类型源文件最终为4次文件执行、32/32、零类型错误/未处理错误，见
`sourceactive-types.log`。此前`peer-types-final.log`与`peer-types-scoped.log`里的
Alert/Layout两项来源诊断保留为历史失败，已由各所属工作解决，没有设置ignoreSourceErrors。
Input专属严格配置直接检查两个类型源文件及其真实依赖，零诊断；全Input严格检查另包括新测试与
全部 24 个 Demo，配置与完整日志保存在 `/tmp/apollo-input-sizing-review/`。
共享 BaseInput/RcTextArea 的 Mentions 及 Compact/Button 均在关联集合中。

旧 theme 测试的 18 声明计数和固定 4/0/7 字符串与当前契约矛盾，已改为 19 个既有
字段和当前 Alias 表达式。公开 prepare 函数的数值 4/0/7、11/7/11、focus/shadow
原断言保留。默认阴影去掉重复 px，由实际 focus 绘制替代旧无效字符串预期。
未修改 DOM 参考差异、HTML/视觉基线、测试阈值或断言覆盖数量来消除失败。

真实浏览器回归为 `tests/browser/input-sizing-contracts.mjs`，源码模式禁止加载
first-party dist 模块，CSS 分别只生成一次完整样式或 Input 按需样式，不叠加旧 CSS。
两个模式最终均为169阶段、1075/1075，保留原933与1028阶段，再验证来源身份与
外compact CP→空TP→无theme CP的Input/TextArea真实消费；同时覆盖四算法的较小
显式按钮高度、调用者min-height、同宽祖先样式、原生迁移重绑、多实例、重挂与CSS过渡。
真实Demo新增祖先class切换，验证实际字体/padding、无裁切和草稿保留；四主题文字
对比度继续通过。两个模式均零浏览器错误/警告。
夹具打包和缓存只在 `/tmp`；源码/四个产物指纹逐次核对，读者在 finally 中退出。
真实 Demo 使用当前 `.vue` 消费者，截图用于本轮人工检查，不代表正式 L6 批准。
最终数字、文件指纹与结果索引见
[源码冻结证据](evidence/input-sizing-source-freeze.json)。
定向Biome为19文件、零诊断；`git diff --check`通过。验证没有运行包构建或写dist。

独立只读复核位于`/tmp/apollo-input-sizing-peer-final/review.md`、`review.json`与
`handoff.json`：原20项20/20、字体补充22/22、CSS-only/来源/卸载144/144、混合来源链
80/80，四命令及独立`verify-current`均exit=0。原交互/判定函数体逐字不变；各集合有交集。
17实现/Demo/只读producer、双版本bundle资产、4个dist及fixture/runner指纹前后相同，
0错误/警告、所有读者退出。其初版6项夹具假设错误也保留，替代覆盖有独立说明。
冻结集合为`f5c8e35479f5a94119a4e930edb1005a2f4142a33720d8c1bbd5c3d3df7c7883`，
完整描述符为`/tmp/apollo-input-sizing-sourceactive-freeze/freeze-priority.json`。

## 交付边界

已实现并验证的是本单元源码链。Registry 原记录 tokenCount=0 与实际 19 个公开字段
不一致，现已由Root据已有19字段登记并报告Registry全check通过（总量551/56）；
本任务没有编辑Registry，也没有新增Token凑数。
本工作不写 dist、不执行包构建、不改 Space/Button/Theme/共享 semantic helper。
发布 JS/声明、L7、正式 Apollo 视觉、Docs 和最终同一提交全量门禁仍由主任务统一执行；
不能据本报告宣称全库通过。工作树同时存在其他人的文档/证据修改，保持原样。
