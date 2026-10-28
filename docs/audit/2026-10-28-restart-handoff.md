# 全库审计重启保存点 · 2026-10-28

分支 `master`。本文件同提交为重启保存点。所有并行执行者已停止编辑；继续前核对 `git status` 与实际可用代理槽位。用户取消了日期约束，要求从并发提高吞吐，完整盘点、成组修复、统一验收和证据标准保持不变。

## 已交付

Badge / Ribbon 已完整验收并上线：实现 `d3794769` / `df5e0436`，视觉冻结 `d0bf2cef`，验收 `47b98296`，回执 `6970bb2d`。Docs 工作流 `40701370080` 成功，CI Docs161与拓扑L7 151/0失败/0待定，线上32项零错误。42张新增图原始RGBA exact，关联Avatar48图一致；全库537/1422图批准，885待验收。完整交付组件主单元共13，不能用Registry历史completed替代当前审计进度。

## 已保存的并行实现

| 单元 | 提交 | 当前证据 | 尚未完成 |
| --- | --- | --- | --- |
| Overlay受控延迟 | `89afa186` | 四条复现修前3红；代表性相关482回归通过，真实菜单选择不再延迟重开 | 当前代码的发布构建/L7，不能当作整基础包重新验收 |
| Descriptions / Item | `cabc97c8` | 稳定dl/Item、原生attrs/label槽、当前Provider/十Token；119四层、Chrome62、水合10、13Demo源码类型通过 | 产物、完整Demo/Docs、正式Apollo视觉 |
| Timeline / Steps私有通道 | `48ca2313` | 原生事件、实际ref、完整标量、方向及六Token实际消费；249四层、源码浏览器17通过 | 产物、正式视觉、Docs；无标题默认间距修正须审图 |
| Breadcrumb / Item / Separator | `adec7ade` | 内容/attrs/参数/菜单按钮/当前七Token与槽；源码浏览器13/14、零页面错误；无标题菜单新增三条红灯已修复 | 共享Menu Enter导航真实红灯；产物、正式视觉、Docs |

冻结源码集成门禁：73文件964运行时、10文件122类型、根严格与Descriptions源码消费类型全部exit0；格式零错误，37既有warning/9info。两个配置类型红灯已由精确对象类型修正，无新增索引签名或强制断言。结构化结果和源码摘要见 [parallel-source-checkpoint.json](evidence/parallel-source-checkpoint.json)。各单元完整清单/红绿/边界在对应contract-audit中。

## 恢复后先做

1. 先修本轮必修的共享Menu键盘导航：Breadcrumb菜单按ArrowDown聚焦href项，Enter当前只关闭而未激活所属原生链接。保留现有真实红灯，核对MenuItem的键盘→原生点击→onClick/导航链，覆盖目标已是a/button时不双发、preventDefault、disabled及焦点。未修前不宣称Breadcrumb完成。
2. 三单元仍在统一验收，保持各自验收责任和优先级。若重启后有额外槽位，可独立开始Space/Compact与Grid/Row/Col，形成五个独立单元并发；不能把前三个标成已完成。主线程集中管理共享导出、Registry与基础层，文件所有权明确；发布验收使用冻结检出，避免混入其他任务未提交的半成品。
3. 所有dist读取任务结束后，统一构建UI。**本地UI dist仍冻结于Badge阶段，与当前源码不一致。** 现有源码浏览器通过不等于发布产物通过。
4. 执行三个公开消费脚本、发布浏览器与完整原Demo主题/交互、SSR/水合；再做清洁提交Apollo候选、逐张审阅批准和复比，保留原参考快照/图片。最后完成Docs门禁、发布及线上回执。
5. 全库所有单元结束后，对最终同一提交执行全量门禁。本保存点不代表全库完成。

## 命令与环境

```sh
export PATH=/tmp/apollo-f01-bin:/Users/nanren/.nvm/versions/node/v22.22.2/bin:$PATH
BREADCRUMB_SOURCE=1 node tests/browser/breadcrumb-contracts.mjs
```

系统默认Node22.11过旧；pnpm12使用上述兼容入口。脚本的来源开关不同：Breadcrumb使用`BREADCRUMB_SOURCE=1`，Timeline默认源码，发布检查显式`TIMELINE_SOURCE=0`。Descriptions当前contracts/hydration使用源码，发布验证另执行consumer脚本，不把两者混记。

产物准备好后执行：

```sh
pnpm --filter @apollo-design/ui run build
node tests/build/run.mjs --package ui --no-build --strict
node tests/consumer/descriptions-types.mjs
node tests/consumer/descriptions-ssr.mjs
node tests/consumer/timeline-types.mjs
node tests/consumer/breadcrumb-types.mjs
```

不要在dist读取期间重建；`tests/build/run.mjs`不加`--no-build`会隐式重建。Docs单独构建用`pnpm --filter @apollo-design/docs run build`，根`build:docs`会重建UI。

隔离Badge验收检出 `/tmp/apollo-badge-release-d0bf2cef` 及4477/4478本地预览仅为已完成发布留证，不是当前源码的新站。证据已提交，不依赖这些临时目录续作。新会话可先读此文件、各单元报告和KNOWN-ISSUES，不必重复已交付的Badge审计。
