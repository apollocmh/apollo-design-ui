
## 项目约定（2026-09-21 用户指示）

- **GitHub 同步**：远程 origin = https://github.com/apollocmh/apollo-design-ui.git（私有）。
  **每完成一个阶段（组件收口 / 基建落地）都必须 `git -c http.proxy=http://127.0.0.1:7890 push origin HEAD:master` 同步到 GitHub。**
- 推送凭据：GitHub OAuth token 存在 macOS 钥匙串（git credential-osxkeychain，用户名 apollocmh，2026-09-21 设备码授权，scope=repo）；远程走 HTTPS 不用 SSH。
- **网络**：本机到 GitHub 的批量传输（release CDN / git fetch）直连会挂起，必须走用户代理 `http://127.0.0.1:7890`；小 API 请求（api.github.com）直连可用。
- GitHub MCP 连接器（apollocmh）：可读公开仓库，但**无建仓权限**（403）且**看不到新建私有仓库**（404，授权范围未含）——建仓/私有仓库操作需用户手动或走 git 凭据。
- 本机工具：gh CLI 2.101.0 在 `~/.local/bin/gh`（brew 已坏：portable-ruby 下载挂起，未修）；known_hosts 已更新为 GitHub 轮换后的新主机密钥（备份 ~/.ssh/known_hosts.bak-20260921）。
- **pnpm 不在 PATH**（2026-09-23）：只有 corepack（`corepack pnpm` = 12.4.2）；且 `verify:full` 内部再调 `pnpm` ⇒ 直接跑会在内层 127。对策：shim `/tmp/pnpm-shim/pnpm`（exec corepack pnpm），`PATH=/tmp/pnpm-shim:$PATH pnpm run verify:full`。

## 经典错误沉淀机制（2026-09-22 用户指示）

- **每个 Gate 收口时**，把本次踩的经典错误追加到 `docs/COMPONENT-CHECKLIST.md` 的「六、经典错误沉淀」（最近的在顶部），含：坑、哪一层测试抓到的、对策。
- badge 会话已沉淀 14 条（flex/grid 期教训 + badge 期 CSS 提取管线）。

## 项目进度快照与防重复清单（2026-09-22 layout 收口后；权威来源是 registry，本节是索引）

- **进度**：foundation 12/13 completed（picker 收口中）；组件 **27/72**
  （empty, config-provider, button, space, flex, grid, divider, typography, alert,
  skeleton, spin, result, tag, badge, watermark, border-beam, statistic, affix,
  back-top, layout, checkbox, radio, switch, carousel, descriptions, listy, splitter）。registry:check 18 检查全绿。
  ⚠️ 全仓 `update:*` 缺口（PITFALLS 162）：C11 要求 v-model 与语义事件同时发出，
  但只有 radio / switch 实现了 ⇒ 其余 20 个组件上 `v-model:xxx` 不生效，待统一补齐。
- **蓝图**：ROADMAP.md §11 已改为「进度快照 + 已完成清单（防重复）+ 已知遗留
  （不要再排查）+ 下一步」—— 后续每完成一批组件就刷新 §11.1 的一行数字即可，
  不要重写整节。
- **已知遗留（看到红灯先对照，不要重复排查）**：
  1. typography semantic 视觉 3 张（antd `ellipsis.expandable:'collapsible'`
     展开按钮未复刻）—— 实现 expandable 后消除；
  2. icons 全量比对用例已放宽到 120s（不是回归）；
  3. vitest.setup 已启用 `enableAutoUnmount(afterEach)`（修全量跑偶发
     unhandled error）；
  4. theme baseline 已把 `borderRadiusCircle` 白名单化（spin 的有意扩展）。
- **demo 替换约定**：依赖未落地组件（Menu/Breadcrumb/Modal/Drawer/Form 等）的
  demo，用等价原生结构替换并在 demo 文件头 + README §2 登记；组件落地后换回。
- **收口必查清单**：七层测试 + registry validate 18 检查 + verify:full +
  `next-task.mjs` 确认进度 + COMPONENT-CHECKLIST §六 沉淀 + push。

## 主 checkout 同步（2026-09-22 用户确认后执行）

- 用户主 checkout 在 `/Users/nanren/Code/apollo-design-ui`（分支 master）；此前停在
  0b59f8d（grid 时代）且有 142 个 staged 同步残留（无独有内容）。
- 已执行：备份 `scripts/verify-changed.mjs` 到 /tmp → `reset --hard origin/master`
  + `git clean -fd` → HEAD=a8b735e、工作树干净；`merge workbuddy/master-13b518e4`
  显示 Already up to date（workbuddy 分支与 master 本就同源）。
- **约定**：WorkBuddy worktree 的分支（workbuddy/master-13b518e4）经
  `push origin HEAD:master` 直推远程 master；主 checkout 只需定期
  `git pull` 同步，不要再在两边并行改代码。
